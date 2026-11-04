# UniklifeOps v2 Roadmap

> Internal ops tool only. Practical power features for the core team.
> Last updated: 2026-11-04

---

> **External integrations confirmed:**
> - **myappz CRM** (`login.uniklife.ai`) — existing CRM used by the team. Holds client data, payment links, lead records. API keys available.
> - **qr.venukalyan.ai** — connected to myappz CRM. Handles attendee QR check-in and WABA (WhatsApp Business API) for payment links and broadcasts.
> - Attendee check-in, payment links, WhatsApp broadcast to clients → all handled by myappz / qr.venukalyan.ai. **Not duplicated here.**

---

## 1. Budget vs Actual (Expenses)

**What:** Set a budget per event. Track how much has been spent vs the budget. Show overspend alerts.

**Why:** Expenses are already tracked. The missing piece is a budget cap — managers need to know when they're going over.

**How to build:**
- Add `budget` column to `events` or `event_operation_plans` table
- Show budget bar on ExpensesPage: "₹45,000 spent of ₹60,000 budget (75%)"
- Overspend alert (red) when spent > budget
- Show budget vs actual in Reports page
- Optional: per-category budget breakdown

---

## 2. Vendor + WhatsApp Notification (Shortage flow)

**What:** After approving a shortage, manager selects the vendor for that item and sends a pre-filled WhatsApp message.

**Flow:**
```
Staff raises shortage
  ↓
Event manager approves
  ↓
Select vendor for that item
  ↓
WhatsApp message auto-generated with event details + qty needed
  ↓
Manager taps "Send via WhatsApp" → opens WhatsApp pre-filled
  ↓
Manager sends manually
```

**Why:** Shortages need to be actioned with suppliers. WhatsApp is how Indian vendors communicate. No API needed — just a `wa.me` deep link.

**How to build:**
- Vendor table: name, phone, category (what they supply)
- Link checklist items to default vendor
- After shortage approval → "Notify Vendor" button
- `wa.me/91XXXXXXXXXX?text=...` deep link opens WhatsApp with pre-filled message

---

## 4. Photo Attachments on Checklist Items

**What:** Staff attach a photo when marking an item as packed/done — proof of packing or dispatch.

**Why:** Accountability. Manager can verify remotely without being at the warehouse.

**How to build:**
- File upload on checklist item status update
- Store in Supabase Storage
- Thumbnail shown in EventControlCenter item row
- Tap to view full image

---

## 5. Event Templates

**What:** Save a completed event setup (checklist items, categories, tasks) as a reusable template. Apply to new events.

**Why:** Repeat events (annual galas, corporate meets) have the same checklist every time. Re-building from scratch is wasted time.

**How to build:**
- `operation_templates` table already exists in schema
- "Save as Template" button on EventControlCenter
- "Create from Template" on new plan creation
- Templates page already has a route — needs to be built out

---

## 6. Internal Notifications

**What:** Real-time in-app notifications for key events — shortage raised, task overdue, phase changed, event closing soon.

**Why:** Currently nothing notifies the right person when action is needed. Manager misses a shortage; assignee misses an overdue task. Notifications close that gap without requiring manual checking.

### Triggers

| Event | Who Gets Notified |
|-------|------------------|
| Shortage request raised | Event Manager |
| Shortage approved / rejected | Staff who raised it |
| Task assigned to someone | Assigned person |
| Task goes overdue | Assigned person + Manager |
| Operation plan phase changes | All team members on that event |
| Checklist item flagged as `issue` | Event Manager |
| Event date within 48 hours | Entire team on that event |

### UI

- Bell icon in app header with unread badge count
- Notification drawer (slide-in panel) — newest first
- Each notification: icon, message, event name, timestamp, "Mark as read"
- Mark all as read button
- Clicking notification deep-links to the relevant page

### How to Build

- New table: `notifications` — `(id, user_id, type, title, message, link, read_at, created_at)`
- DB triggers or service-layer calls create rows on key actions
- Supabase Realtime subscription on `notifications` for live badge updates (no page refresh needed)
- Bell component in `Header.tsx`
- Notification drawer component

---

## 7. Task Templates (Recurring Prep Tasks)

**What:** Pre-built sets of tasks for each program type. When a new BOSS plan is created, 20 standard prep tasks are auto-created — confirm venue, prepare kits, brief staff, check AV, etc. No manual re-entry every time.

**Why:** Every BOSS event needs the same preparation tasks. Currently the team rebuilds the task list from scratch for every edition. Task templates save time and ensure nothing is missed.

### How it Works

```
Create new Operation Plan (BOSS-22, Coimbatore)
  ↓
"Apply Task Template" → Select: BOSS Standard Prep
  ↓
20 tasks auto-created with:
  - Title, category, priority
  - Relative deadline (e.g. "7 days before event")
  - Default assignee role (not specific person)
  ↓
Manager reviews → assigns to specific people → adjusts dates
```

### How to Build

- New tables: `task_templates` — `(id, name, program, org_id)` and `task_template_items` — `(template_id, title, category, priority, days_before_event, default_role)`
- "Apply Template" button on Tasks page when plan has no tasks
- Relative deadlines: `event_date − days_before_event` = actual deadline
- One template per program (BOSS, UBM, MSGB, VK-M) + one generic

---

## 8. Merge into qr.venukalyan.ai

**What:** Migrate UniklifeOps into `qr.venukalyan.ai/admin` — single login, one platform for all tools.

**Why:** Currently two separate apps. Team needs one place for everything. UniklifeOps was always planned as standalone first, then migrate.

**How to build:**
- Share Supabase project or migrate schema into qr.venukalyan.ai DB
- Move routes under `/admin/events`, `/admin/operations` etc.
- Single auth — one login covers both QR scanning and event ops
- Keep UniklifeOps UI/components as-is, just embed under the main platform shell

---

## Priority Order

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | Internal Notifications | Medium |
| 2 | Task Templates | Medium |
| 3 | Budget vs Actual | Low |
| 4 | Vendor + WhatsApp | Medium |
| 5 | Photo Attachments | Medium |
| 6 | Event Templates *(partially done in v1)* | Medium |
| 7 | Merge into qr.venukalyan.ai | High |

## Moved to Future

| Feature | Reason |
|---------|--------|
| QR Staff Attendance | Deferred — attendee check-in handled by qr.venukalyan.ai ↔ myappz; staff QR to be revisited post-merge |
