# UniklifeOps v2 Roadmap

> Internal ops tool only. Practical power features for the core team.
> Last updated: 2026-11-02

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

## 2. QR Staff Attendance

**What:** Event-day attendance tracking via QR scan. Manager generates a unique QR per event. Staff scans on arrival → taps Check In (no login needed). Manager sees live attendance in EventControlCenter.

**Why:** Onsite staff arrive at venue and need a frictionless check-in. No app login required — just scan and tap.

**How to build:**
- QR generator per event (unique token in URL)
- Public check-in page at `/checkin/:token` — shows staff list, one-tap check-in
- `event_staff_assignments` table already exists — add `checked_in_at`, `checked_out_at` columns
- New "Attendance" tab in EventControlCenter with live status
- Integrate check-in URL with `qr.venukalyan.ai` QR infrastructure

---

## 3. Vendor + WhatsApp Notification (Shortage flow)

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

## 6. Merge into qr.venukalyan.ai

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
| 1 | Budget vs Actual | Low |
| 2 | QR Staff Attendance | Medium |
| 3 | Vendor + WhatsApp | Medium |
| 4 | Photo Attachments | Medium |
| 5 | Event Templates | Medium |
| 6 | Merge into qr.venukalyan.ai | High |
