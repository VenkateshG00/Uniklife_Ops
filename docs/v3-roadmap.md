# UniklifeOps v3 Roadmap

> Advanced & unique features. Flagship differentiators.
> Last updated: 2026-11-02

---

## 1. Venue Deployment Map ⭐

The most unique feature in UniklifeOps. No Indian event management tool has this today.

### What
A visual venue staffing tool. Upload the blueprint of the hall (PNG/PDF), place numbered pins on the map, assign staff to each pin with shifts and substitutes. When a section is done, free staff are dynamically reassigned. Export a full team briefing PDF. Share via WhatsApp.

### Why
Most event tools are list-based. This is **spatial and visual** — manager sees the whole venue and who stands where at a glance. Handles no-shows via substitutes. Handles section completion via dynamic reassignment.

---

### Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│  Layer: [Event Day ▼]  [+ New Layer]      [Export PDF]  │
├───────────────────────────┬─────────────────────────────┤
│                           │  STAFF                      │
│   VENUE BLUEPRINT         │  ┌───────────────────────┐  │
│                           │  │ 1. Ravi    — QR Gate  │  │
│      [3] VIP Entry        │  │ 2. Priya   — VIP      │  │
│                           │  │ 3. Kiran   — QR Gate  │  │
│   [1][2]        [4][5]    │  │ 4. Sam     — Hall     │  │
│   QR Gate       Parking   │  │ 5. Anbu    — Parking  │  │
│                           │  │ ● Free: 2 staff       │  │
│        [HALL]             │  └───────────────────────┘  │
│   [6] Meals  [7] Stage    │                             │
└───────────────────────────┴─────────────────────────────┘
```

---

### Full Feature List

| Feature | Description |
|---------|-------------|
| Blueprint upload | Upload PNG/PDF of venue floor plan |
| Pin placement | Drag & drop numbered pins onto the map |
| Color by role | Security = red, Ushers = blue, QR = green, VIP = gold |
| Staff assignment | Primary staff per pin |
| Substitute | Backup staff per pin — auto-notified via WhatsApp if primary absent |
| Shifts | Morning / Afternoon / Evening per pin with different staff |
| Dynamic reassignment | When section is done, staff marked "Free" → manager reassigns to new pin |
| WhatsApp notify | Staff gets WhatsApp message on assignment or reassignment |
| Guest flow arrows | Draw entry / exit / VIP route arrows on the map |
| Emergency layer | Special layer — exits, first aid, fire points, zone supervisor contacts |
| Vendor positions | Vendor pins alongside staff (water vendor, decorator, AV tech) |
| Multiple layers | Named layers: "Morning Setup", "Event Day", "Dinner", "Breakdown" |
| Briefing PDF export | Full team briefing sheet — map + staff list + shifts + emergency contacts |
| Share | Web Share API → WhatsApp, email, download |

---

### Substitute + Dynamic Reassignment Flow

```
Primary staff (Ravi) doesn't arrive at QR Gate
  ↓
Manager taps "Assign Substitute"
  ↓
Kiran (substitute for Pin 3) notified via WhatsApp
  ↓
─────────────────────────────────
QR duty ends at 2pm (all guests in)
  ↓
Manager marks Pin 3 section as "Done"
  ↓
Ravi flagged as "Free"
  ↓
Manager sees free staff list → reassigns Ravi → Pin 6 (Meals Section)
  ↓
Ravi gets WhatsApp: "QR done. Move to Meals Section — Pin 6"
  ↓
New task auto-created for Ravi in Tasks system
```

---

### Briefing PDF (auto-generated)

```
Page 1 : Venue map with all pins + colour legend
Page 2 : Full staff assignment list (name, pin, role, shift, supervisor)
Page 3 : Emergency contacts + nearest exit per zone
Page 4 : Vendor list with positions on map
```

Print 1 copy per staff member. Every person knows exactly where to be.

---

### Tech Stack

| Piece | Library / Method |
|-------|-----------------|
| Canvas annotation | Konva.js (React canvas — drag, zoom, pin placement) |
| Blueprint storage | Supabase Storage |
| Pin data | JSON in DB — `{x, y, label, staff_id, role, color, shift}` |
| Layers | Each layer = named JSON snapshot, switchable |
| Export as image | `canvas.toDataURL()` → PNG |
| Export as PDF | Canvas image + staff table side by side |
| Share | Web Share API → WhatsApp, email, download |

---

### v3 → v4 Potential
When QR Staff Attendance (v2) is live, staff scanning at the venue gate automatically marks their pin as active on the map. Manager sees arrival status per position without any manual update.

---

## Priority Order

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | Venue Deployment Map | High — Konva.js canvas + full pin system |
| + more v3 features TBD | | |
