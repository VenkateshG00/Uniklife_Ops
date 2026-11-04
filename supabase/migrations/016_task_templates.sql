-- ─────────────────────────────────────────────────────────────────
-- 016 · Task Templates
-- task_templates        — named sets per program (BOSS, UBM, MSGB, VK-M, Generic)
-- task_template_items   — task rows with relative deadline (days before event)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE task_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by       UUID REFERENCES profiles(id),
  name             TEXT NOT NULL,
  program          TEXT,                    -- BOSS | UBM | MSGB | VK-M | null = generic
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_template_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id         UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT NOT NULL DEFAULT 'logistics',
  priority            TEXT NOT NULL DEFAULT 'medium',
  default_role        TEXT,                 -- role to suggest as assignee
  days_before_event   INT,                  -- NULL = no deadline; positive = X days before event date
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX idx_task_templates_org     ON task_templates(organization_id);
CREATE INDEX idx_task_template_items_tpl ON task_template_items(template_id);

-- ── Updated_at trigger ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE task_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_template_items ENABLE ROW LEVEL SECURITY;

-- task_templates: org members can read; admins/managers can write
CREATE POLICY "org members read task_templates"
  ON task_templates FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "admins manage task_templates"
  ON task_templates FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid() AND role IN ('super_admin','event_manager')
  ));

-- task_template_items: access follows parent template
CREATE POLICY "org members read task_template_items"
  ON task_template_items FOR SELECT
  USING (template_id IN (
    SELECT id FROM task_templates WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "admins manage task_template_items"
  ON task_template_items FOR ALL
  USING (template_id IN (
    SELECT id FROM task_templates WHERE organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('super_admin','event_manager')
    )
  ));
