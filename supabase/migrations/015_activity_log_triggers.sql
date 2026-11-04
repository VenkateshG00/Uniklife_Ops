-- ─────────────────────────────────────────────────────────────────
-- 015 · Auto-populate event_activity_log via DB triggers
-- Covers: checklist item status changes, shortage requests,
--         operation plan phase advances, event closure
-- ─────────────────────────────────────────────────────────────────

-- ── Shared helper (SECURITY DEFINER so it can read profiles) ────
CREATE OR REPLACE FUNCTION _activity_log_insert(
  p_event_id    UUID,
  p_plan_id     UUID,
  p_org_id      UUID,
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_entity_name TEXT,
  p_old_value   JSONB DEFAULT NULL,
  p_new_value   JSONB DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_actor_id   UUID;
  v_actor_name TEXT;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN RETURN; END IF;   -- skip service-role / bg jobs

  SELECT COALESCE(full_name, 'Unknown')
    INTO v_actor_name
    FROM profiles WHERE id = v_actor_id;

  IF v_actor_name IS NULL THEN v_actor_name := 'Unknown'; END IF;

  INSERT INTO event_activity_log(
    event_id, operation_plan_id, organization_id,
    actor_id, actor_name,
    action, entity_type, entity_id, entity_name,
    old_value, new_value
  ) VALUES (
    p_event_id, p_plan_id, p_org_id,
    v_actor_id, v_actor_name,
    p_action, p_entity_type, p_entity_id, p_entity_name,
    p_old_value, p_new_value
  );
END;
$$;

-- ── 1. Checklist item — status changes ──────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_log_checklist_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM _activity_log_insert(
      NEW.event_id,
      NEW.operation_plan_id,
      NEW.organization_id,
      'Item ' || NEW.name || ' → ' || NEW.status,
      'checklist_item',
      NEW.id,
      NEW.name,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_checklist_status ON event_checklist_items;
CREATE TRIGGER trg_log_checklist_status
  AFTER UPDATE ON event_checklist_items
  FOR EACH ROW EXECUTE FUNCTION trg_fn_log_checklist_status();

-- ── 2. Shortage requests — raised + approved / rejected ─────────
CREATE OR REPLACE FUNCTION trg_fn_log_shortage()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item_name TEXT;
BEGIN
  SELECT COALESCE(name, 'Item') INTO v_item_name
    FROM event_checklist_items WHERE id = NEW.checklist_item_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM _activity_log_insert(
      NEW.event_id,
      NEW.operation_plan_id,
      NEW.organization_id,
      'Shortage raised for ' || COALESCE(v_item_name, 'Item') || ' (+' || NEW.additional_qty_requested || ')',
      'shortage_request',
      NEW.id,
      COALESCE(v_item_name, 'Item'),
      NULL,
      jsonb_build_object('qty', NEW.additional_qty_requested, 'priority', NEW.priority)
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM _activity_log_insert(
      NEW.event_id,
      NEW.operation_plan_id,
      NEW.organization_id,
      'Shortage ' || NEW.status || ' for ' || COALESCE(v_item_name, 'Item'),
      'shortage_request',
      NEW.id,
      COALESCE(v_item_name, 'Item'),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'approved_qty', NEW.approved_qty)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_shortage ON shortage_requests;
CREATE TRIGGER trg_log_shortage
  AFTER INSERT OR UPDATE ON shortage_requests
  FOR EACH ROW EXECUTE FUNCTION trg_fn_log_shortage();

-- ── 3. Operation plan — phase advances ──────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_log_plan_phase()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id   UUID;
  v_ev_title TEXT;
BEGIN
  IF NEW.phase IS DISTINCT FROM OLD.phase THEN
    SELECT organization_id, title INTO v_org_id, v_ev_title
      FROM events WHERE id = NEW.event_id;

    PERFORM _activity_log_insert(
      NEW.event_id,
      NEW.id,
      v_org_id,
      'Phase advanced: ' || OLD.phase || ' → ' || NEW.phase,
      'operation_plan',
      NEW.id,
      COALESCE(v_ev_title, 'Event'),
      jsonb_build_object('phase', OLD.phase),
      jsonb_build_object('phase', NEW.phase)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_plan_phase ON event_operation_plans;
CREATE TRIGGER trg_log_plan_phase
  AFTER UPDATE ON event_operation_plans
  FOR EACH ROW EXECUTE FUNCTION trg_fn_log_plan_phase();

-- ── 4. Event closure (status → completed) ───────────────────────
CREATE OR REPLACE FUNCTION trg_fn_log_event_closed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'completed' THEN
    PERFORM _activity_log_insert(
      NEW.id,
      NULL,
      NEW.organization_id,
      'Event closed and marked completed',
      'event',
      NEW.id,
      NEW.title,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_event_closed ON events;
CREATE TRIGGER trg_log_event_closed
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION trg_fn_log_event_closed();
