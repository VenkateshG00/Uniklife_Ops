# MASTER DEVELOPMENT PROMPT FOR CLAUDE
## UNIKLIFE EVENT OPERATIONS OS — REAL-TIME EVENT READINESS & MATERIAL MANAGEMENT
**Project:** UnikScan Event Management  
**Reference Website:** https://qr.venukalyan.ai/admin  
**Technology:** React + TypeScript + Supabase + Cloudflare Workers + PWA  
**Design:** Premium, modern, desktop and mobile responsive

---

## 1. YOUR ROLE

Act as a Senior SaaS Product Architect, Full-Stack Developer, Supabase Database Architect, UI/UX Designer, Security Engineer, and PWA Specialist.

I want to enhance my existing UnikScan Event Management application by introducing a complete **Event Operations, Material Checklist, Staff Assignment, and Real-Time Readiness Management System**.

My objective is to eliminate paper-based event preparation and coordination.

All event materials, equipment, logistics, staff responsibilities, food arrangements, shortages, approvals, and completion reports must be managed through the website and mobile PWA.

**IMPORTANT:**

- First inspect the existing project, repository, routes, components, database, and integrations.
- Treat my uploaded dashboard screenshot as the primary design reference.
- Do not replace, redesign unnecessarily, or break existing features.
- Preserve QR scanning, registrations, attendance, payments, staff, templates, and event management.
- Reuse existing authentication, event IDs, event data, and staff entities wherever appropriate.
- Do not invent existing APIs, database tables, or permissions.
- Do not execute destructive database operations.
- Introduce new capabilities as modular, compatible enhancements.

## 2. BUSINESS OBJECTIVE

Imagine I am conducting an event tomorrow.

Today, my office team must prepare everything required for that event.

For example:

- 200 books
- 200 pens
- 200 gifts
- 200 participant kits
- 2 projectors
- 4 microphones
- Sound system
- Stage lighting
- LED display
- Registration desk
- Water bottles
- Breakfast
- Lunch
- Dinner
- Staff identification cards
- QR scanning devices
- Branding materials

The office team prepares, packs, counts, and dispatches the items.

Tomorrow, one or two employees arrive at the event venue and use the mobile PWA to verify everything.

The Event Manager monitors progress remotely.

If 200 pens are available but another 20 are needed, the employee must be able to raise a shortage request.

The manager should instantly see:

"Event: Business Growth Workshop — Additional 20 pens required."

The manager can assign the issue, contact the responsible employee, and monitor its resolution.

Every operation must be recorded with a timestamp, staff identity, and history.

## 3. SYSTEM ARCHITECTURE

Extend the existing UnikScan application with a dedicated Event Operations module.

Proposed primary navigation:

1. Dashboard
2. Events
3. Attendees
4. Scanner
5. Payments
6. Staff
7. Event Operations — NEW
8. Inventory & Materials — NEW
9. Tasks & Assignments — NEW, if no suitable existing task module exists
10. Templates
11. Google Sheets
12. Affiliates
13. Reports
14. Settings

Do not duplicate existing modules unnecessarily.

If the existing system already contains compatible functionality, enhance or reuse it instead.

## 4. USER ROLES & ACCESS

Create a secure role-based authorization design.

### Super Admin

- Manage platform-wide settings and authorized organizations
- Control system configuration
- View platform audit logs

### Event Manager

- Create and manage assigned events
- Configure event checklists
- Add required materials
- Assign employees
- Monitor event readiness
- Review shortages
- Approve additional requirements
- Escalate delays
- View reports

### Office Preparation Staff

- View assigned event preparation requirements
- Prepare materials
- Record packed quantities
- Confirm packaging
- Record dispatch
- Upload packing photographs
- Report preparation shortages

### On-Site Event Staff

- View assigned events only
- Check items delivered to the venue
- Verify lights, equipment, stage, seating, food and logistics
- Update task status
- Upload photographic evidence
- Raise shortage or damage reports
- Add notes and expected completion times

### Procurement / Logistics Staff

- Receive material requests
- Confirm procurement status
- Record additional quantities
- Update delivery and resolution status

### Read-Only Management

- View authorized event performance and readiness
- See shortages, delays, and outstanding tasks
- Cannot modify operational records

Permissions must be enforced in backend authorization and database policies, not only through hidden interface buttons.

## 5. EVENT CREATION

When creating an event, capture:

- Event ID
- Event title
- Event category
- Start date and time
- End date and time
- Venue name
- Venue address
- Location link
- Expected attendees
- Event Manager
- Office Coordinator
- Dedicated Event Assistant
- Additional on-site staff
- Staff contact information
- Reporting/check-in time
- Setup deadline
- Materials dispatch deadline
- Budget, where applicable
- Event instructions
- Notes and attachments

Allow an event created in the existing Events module to be used directly in Event Operations.

Do not create duplicate event records.

## 6. MATERIAL REQUIREMENTS & CHECKLIST

Each event must have its own checklist.

Allow staff to add items manually or select them from reusable master templates.

Suggested material categories:

**Participant Materials**
- Books
- Pens
- Workbooks
- Gifts
- Certificates
- Registration kits
- Badges
- Lanyards

**Stage & Technical**
- Lighting
- Sound system
- Microphones
- Projectors
- LED screens
- Laptop
- Cables
- Chargers
- Extension boards
- Power backup

**Venue Setup**
- Chairs
- Tables
- Stage
- Podium
- Banners
- Direction boards
- Registration counters
- Backdrop
- Decoration

**Hospitality**
- Drinking water
- Tea and coffee
- Breakfast
- Lunch
- Snacks
- Dinner
- Catering service
- Serving arrangements

**Operations**
- Staff reporting
- QR scanners
- Internet connectivity
- Payment collection arrangements
- Security
- Housekeeping
- Photography
- Videography
- Emergency contacts

Users must also be able to define unlimited custom categories and custom checklist items.

## 7. ITEM LIFECYCLE

Do not use a single "Completed" checkbox for the entire process.

Track material progression separately.

Required lifecycle:

Required → Reserved → Prepared → Packed → Dispatched → Delivered → Venue Verified → Completed

Support:

- Not Started
- In Progress
- Blocked
- Shortage
- Damaged
- Cancelled
- Not Applicable

Maintain separate state dimensions for quantities, logistics, and verification so a completed office packing action cannot incorrectly imply that the material has arrived or been installed at the venue.

For every material, store:

- Item name
- Category
- Unit of measurement
- Required quantity
- Available/reserved quantity
- Packed quantity
- Dispatched quantity
- Received quantity
- Venue verified quantity
- Additional quantity requested
- Damaged or lost quantity
- Responsible staff
- Due time
- Current status
- Priority
- Notes
- Photo proof
- Last updated by
- Last updated timestamp

Use server-validated quantity transitions to prevent inconsistent counts.

## 8. QUANTITY SHORTAGE MANAGEMENT

This is a critical feature.

Example:

Event: Business Growth Seminar

Initial requirement:
- Pens: 200
- Books: 200
- Gifts: 200

After arrival, the employee discovers that 20 additional pens are required.

The employee selects:

"Report Shortage / Additional Requirement"

Form fields:

- Event
- Item
- Current quantity
- Additional quantity requested
- Reason
- Priority
- Needed by
- Notes
- Attachment
- Requesting employee

After submission, the Event Manager must receive an in-app alert.

Example:

"URGENT: 20 additional pens requested for tomorrow's Business Growth Seminar."

The manager can:

- Approve
- Reject with reason
- Request clarification
- Assign procurement
- Set deadline
- Mark resolved after confirmation

The approved additional quantity must update the effective event requirement without overwriting the original requirement.

Maintain an immutable request and approval history.

Prevent duplicate approvals and accidental double counting.

Shortage resolution must require confirmation that the additional material was received, not merely approval of procurement.

## 9. OFFICE PREPARATION DASHBOARD

Create a dedicated workspace titled:

"Office Preparation"

Display:

- Today's preparations
- Tomorrow's events
- Upcoming dispatches
- Materials still to pack
- Quantity shortages
- Packing deadlines
- Assigned staff
- Ready for dispatch
- Dispatched items

Each material should have an interactive checklist with quantity inputs.

Example:

Event: MSME Business Growth Workshop

Books:
Required 200 / Packed 200 / Ready

Pens:
Required 200 / Packed 180 / Remaining 20

Gifts:
Required 200 / Packed 200 / Ready

Laptop:
Required 1 / Packed 1 / Ready

Allow authorized users to submit packing confirmation and dispatch records.

Include a packing list that can be viewed or exported as a PDF for exceptional circumstances, although the primary workflow must remain paperless.

## 10. ON-SITE MOBILE PWA

Design this workspace primarily for employees operating with one hand on a mobile phone.

When an assigned employee opens the application:

1. Log in securely.
2. View assigned upcoming/today's events.
3. Select the current event.
4. Check in at the venue.
5. Open the event readiness checklist.
6. Update items individually.
7. Report shortages or problems.
8. Upload photos where necessary.
9. Record completion or expected completion time.
10. Submit final readiness confirmation.

The mobile interface should have large touch-friendly controls.

Example checklist:

LIGHTING
Status: Completed
Staff: Ramesh
Verified: 8:45 AM

SOUND SYSTEM
Status: In Progress
Expected: 9:15 AM

BOOKS
200 received / 200 required
Status: Verified

PENS
200 received / 220 now required
Status: Shortage — 20 pending

LUNCH
Status: Awaiting Caterer

Do not force employees to navigate through complex forms for routine status updates.

Support photos, short notes, quantity changes, and fast completion actions.

## 11. REAL-TIME EVENT MANAGER CONTROL CENTER

Develop a premium event readiness dashboard using the style of my reference screenshot.

The Event Manager should be able to open an event and see:

- Event title
- Venue
- Event start time
- Time remaining
- Assigned employees
- Overall readiness
- Completed activities
- Pending activities
- Blocked activities
- Critical issues
- Missing materials
- Material quantities
- Staff status
- Latest updates

Create prominent KPI cards:

- Total Checklist Items
- Completed
- In Progress
- Pending
- Blocked
- Open Shortages
- Critical Alerts
- Event Readiness %

Important: Readiness must be based on applicable requirements and their verified completion state, not merely how many checklist boxes have been clicked.

Give critical requirements appropriate visibility.

Create a real-time activity feed:

"8:40 AM — Ramesh verified 200 books."

"8:45 AM — Lighting marked complete."

"8:52 AM — 20 additional pens requested."

"9:02 AM — Manager approved shortage request."

"9:10 AM — Logistics staff assigned."

Manager must be able to filter by category, employee, priority, status, and due time.

Provide direct access to the staff member's authorized contact details for calling or messaging.

Do not claim automated phone or WhatsApp notifications are operational unless a verified integration exists.

## 12. TASK ASSIGNMENT & DELAY TRACKING

Each event must support tasks with:

- Task title
- Description
- Category
- Assigned employee
- Creator
- Priority
- Start time
- Deadline
- Actual completion time
- Status
- Notes
- Proof
- Dependency
- Escalation state

Allow multiple tasks within a single event.

For example:

Task: Verify Stage Lighting

Assigned to: Ramesh

Deadline: 8:30 AM

Current status: Pending

At 8:31 AM, the system marks the task as overdue if not completed.

The Event Manager sees it in the attention panel.

Employees can add a delay reason and revised estimate.

Managers can acknowledge the issue, reassign the task, or escalate it.

Maintain a full activity history for accountability.

## 13. FOOD & HOSPITALITY MANAGEMENT

Treat food and hospitality as a separate structured checklist category.

For each food service capture:

- Type: Breakfast / Lunch / Dinner / Snacks / Tea
- Planned serving time
- Expected headcount
- Vendor/caterer
- Ordered quantity
- Confirmed quantity
- Delivered quantity
- Serving setup status
- Quality/condition verification
- Responsible employee
- Issue notes
- Final completion

Example:

Lunch
Expected participants: 200
Meals ordered: 220
Meals received: 210
Additional required: 10

Report this as an actionable quantity gap.

## 14. INVENTORY & REUSABLE MATERIALS

Create an inventory foundation with two item types:

**Consumable**
Pens, books, gifts, water bottles, printed materials.

**Reusable**
Projectors, microphones, scanners, laptops, extension boards, displays.

Support:

- Item catalog
- SKU or internal identifier
- Storage location
- Current stock
- Reserved stock
- Available stock
- Event allocation
- Material issue/dispatch
- Material return
- Damaged items
- Lost items
- Stock adjustments
- Audit history

Use atomic, validated stock movements rather than allowing arbitrary inventory quantity edits.

Multiple upcoming events must not be allowed to reserve the same stock beyond available quantities.

For reusable equipment, track checkout and return after the event.

## 15. DASHBOARD DESIGN

Use my provided UnikScan screenshot as a structural UI reference.

Maintain:

- Dark vertical sidebar
- Clean light dashboard background
- Modern rounded cards
- Compact navigation
- Search bar
- Event selector
- KPI widgets
- Attention/alerts panel
- Activity section
- Detailed tables
- Responsive mobile layout

Apply a premium visual treatment consistent with the application.

Suggested styling:

- Deep royal blue for primary identity
- Purple for suitable accent controls
- Metallic gold for selective premium highlights
- Green for completed status
- Amber for warnings
- Red for overdue and critical issues
- Neutral gray for pending items

Use consistent status meanings and accessible contrast.

Prefer modern Lucide icons and readable Urbanist typography if available.

Do not modify the existing official logo.

The interface should look like a professional enterprise operations control center, not a generic to-do application.

## 16. SUPABASE DATABASE ARCHITECTURE

First inspect all existing Supabase schemas and migrations.

Reuse existing events, users, organizations, and staff tables if appropriate.

Propose new entities only where required:

- event_operation_plans
- event_operation_categories
- event_checklist_items
- event_material_requirements
- material_catalog
- inventory_locations
- inventory_stock_movements
- event_material_allocations
- packing_records
- dispatch_records
- receipt_records
- event_verification_records
- event_tasks
- event_staff_assignments
- material_shortage_requests
- shortage_request_actions
- event_hospitality_requirements
- event_attachments
- event_activity_log
- event_notification_outbox
- event_readiness_snapshots (optional)

Do not blindly implement this list; normalize and adapt it to the verified existing data model.

Use foreign keys, indexes, constraints, timestamps, and database transactions.

Add Row Level Security where appropriate.

Maintain tenant or organization isolation if the existing application is multi-tenant.

Ensure every mutation is attributable to an authenticated user.

Sensitive administrative operations must be performed through authorized server-side functions.

Provide safe, versioned migrations with a rollback strategy.

Do not wipe or modify historical QR registration, attendee, payment, or event data.

## 17. REAL-TIME SYNCHRONIZATION

Use Supabase Realtime to update the Event Manager dashboard when employees submit changes.

Updates should be visible without manually refreshing the browser.

Examples:

- Item completed
- Shortage submitted
- Quantity received
- Task overdue
- Employee assigned
- Issue approved
- Material verified

Use private, authorized channels.

For scale, prefer Supabase Broadcast with correct Realtime Authorization policies.

Use server timestamps and reliable persisted database records as the source of truth.

Avoid broadcasting sensitive event data to unauthorized clients.

## 18. PWA & OFFLINE SUPPORT

The app must work well on mobile devices at event venues where internet quality may be poor.

Requirements:

- Installable PWA
- Mobile-first layouts
- App manifest
- Service worker
- Secure sign-in
- Offline access to previously synced, authorized assigned checklists
- Local queue for permitted offline changes
- Clear Pending Sync indicator
- Automatic sync retry after connectivity returns
- Conflict resolution
- Duplicate submission prevention
- Last synced timestamp

Never display a locally queued offline change as server-confirmed completion.

If two employees change the same item concurrently, use version-aware updates and explicit conflict handling.

Do not cache sensitive information indefinitely.

Respect logout and access revocation.

## 19. EVENT TEMPLATES

Develop reusable operational checklist templates.

Examples:

- Business seminar
- Training workshop
- Conference
- Awards ceremony
- Corporate meeting
- Webinar with physical production
- Product launch
- Exhibition
- Coaching event

Each template includes default categories, items, quantities where appropriate, tasks, and timing offsets.

Event managers can customize templates without affecting historical events.

Support template duplication and versioning.

## 20. EVENT READINESS & FINAL APPROVAL

Before an event starts, the manager should see a readiness summary.

Example:

Event starts: 10:00 AM

Checklist completion: 92%

Critical items verified: 100%

Open shortages: 1

Overdue tasks: 0

Awaiting caterer: 1

Event status: Attention Required

The manager may finalize readiness only when mandatory checks are satisfied or an authorized exception is explicitly documented.

Implement a clear approval workflow:

- Preparation confirmed
- Venue verification completed
- Critical issues reviewed
- Manager approval
- Ready for event

Record who approved and when.

## 21. POST-EVENT OPERATIONS

After the event:

- Record material usage
- Reconcile leftover consumables
- Return reusable equipment
- Report damage and losses
- Close outstanding tasks
- Record supplier issues
- Review staff performance
- Archive event evidence
- Generate event operations report

The report should include planned versus actual quantities, shortage requests, delays, task completion, material losses, and readiness timeline.

Do not confuse event operations performance with attendee attendance or payment analytics; retain those existing modules as separate metrics.

## 22. CLOUDFLARE DEPLOYMENT

Target Cloudflare Workers with Static Assets for the React PWA.

Use Supabase PostgreSQL as the database.

Use Supabase authentication or the verified existing authentication solution.

Use appropriate secure server endpoints for privileged operations.

Do not put privileged Supabase keys or other secrets into client-side JavaScript.

Use environmental separation:

- Local development
- Staging
- Production

Use Cloudflare secrets for server credentials.

Use CI/CD and controlled database migrations.

Do not assume the current application is already deployed on Workers or that it uses React until inspection confirms it.

If the current stack differs, explain the compatibility implications and recommend the least disruptive implementation.

## 23. EXISTING UNIKSCAN PROJECT INTEGRATION

Develop the Event Operations & Readiness Management System directly inside the existing UnikScan application at https://qr.venukalyan.ai/admin.

**Requirements:**

1. Reuse the existing Events module. Every operational checklist must be linked to an existing event.
2. Reuse the existing Staff module to assign Event Managers, Office Preparation Staff, and On-Site Assistants.
3. Add an Event Operations module to manage materials, packing, dispatch, venue arrangements, food, tasks, shortages, and readiness.
4. Add a real-time Event Manager dashboard showing completed, pending, delayed, and blocked activities.
5. Provide a mobile-friendly PWA interface for employees to update event preparation and on-site status.
6. Use the existing Supabase database and authentication architecture where compatible.
7. Preserve existing QR Scanning, Attendees, Registrations, Payments, Templates, and other functional modules.
8. Do not introduce UNIKLIFE.AI CRM integration unless explicitly requested later.
9. Do not duplicate existing events, users, employees, or payment records.
10. Maintain all existing functionality while implementing the new features.

**Primary objective:** One integrated UnikScan application where event registration, attendance, payments, event preparation, logistics, staff assignments, and real-time readiness are managed through the existing website.

## 24. TESTING REQUIREMENTS

Implement automated and manual test coverage for:

1. Event creation and existing event reuse.
2. Checklist template creation.
3. Staff assignment.
4. Preparation and packing.
5. Material dispatch.
6. Venue receipt and verification.
7. Partial quantities.
8. Additional material request.
9. Approval and rejection.
10. Shortage fulfillment.
11. Manager live dashboard update.
12. Task deadline and delay tracking.
13. Food service checklist.
14. Inventory reservations.
15. Concurrent quantity updates.
16. Offline sync and reconnection.
17. Role-based permissions.
18. Tenant isolation if applicable.
19. Photo uploads.
20. Final event approval and closure.
21. Existing QR registration and scanning regression tests.
22. Existing attendance, payment and reporting regression tests.

Include realistic test data but do not insert demo records into production without approval.

## 25. REQUIRED END-TO-END ACCEPTANCE SCENARIO

Use this scenario to prove that the application works.

Event: Business Growth Masterclass

Date: Tomorrow

Location: Hyderabad

Expected participants: 200

Office staff: Employee A

On-site staff: Employee B

Event Manager: Manager C

### Day Before Event

Manager creates the operational plan linked to the existing event.

Adds:

- 200 books
- 200 pens
- 200 gifts
- 200 water bottles
- 1 projector
- 2 microphones
- Stage lights
- Breakfast for 200
- Lunch for 200

Employee A packs the materials and confirms quantities.

Manager sees preparation status.

### Event Morning

Employee B logs into the PWA.

Checks received materials.

Verifies the projector and stage lights.

Marks lights completed.

Marks sound system in progress.

Finds that 20 additional pens are needed.

Submits an urgent request.

### Manager Action

Manager C receives the alert.

Opens the shortage details.

Approves 20 additional pens.

Assigns procurement.

Procurement confirms dispatch.

Employee B receives and verifies the additional pens.

The shortage becomes resolved.

### Final Approval

The system calculates readiness from verified checklist states.

Manager confirms critical arrangements.

Event is approved as ready.

All actions remain traceable in the audit history.

**This entire scenario must work without paper-based checklists or browser refreshes when online.**

## 26. IMPLEMENTATION APPROACH

Do not start by generating a completely new application.

Proceed in this order:

### Step 1 — Existing Project Audit

Inspect the repository and database.

Identify:

- Technology stack
- Routing
- Existing event entities
- Staff management
- Authentication
- Authorization
- Hosting setup
- Supabase connection
- Existing operational capabilities
- Reusable UI components

### Step 2 — Gap Analysis

Prepare a table showing:

- Existing capability
- Reusable component
- Missing functionality
- Proposed additions
- Database changes required
- Dependencies
- Risk level

### Step 3 — Architecture & UI

Propose:

- Complete navigation structure
- Role-based dashboards
- Desktop layouts
- Mobile PWA screens
- Event readiness control center
- Staff checklist screens
- Database relationships
- Event state transitions
- Permissions
- Integration strategy

### Step 4 — Development Phases

Divide delivery into:

Phase A — Event Operations and Checklist MVP

Phase B — Materials, Packing and Dispatch

Phase C — On-Site PWA and Live Manager Dashboard

Phase D — Shortage Requests, Inventory and Logistics

Phase E — Offline Operations, Reporting and Advanced Automations

### Step 5 — Controlled Implementation

After the audit and proposed plan, implement in small, verifiable steps.

- Create compatible migrations.
- Build components.
- Add role policies.
- Implement business rules.
- Add tests.
- Verify builds.
- Verify existing functionality.
- Report exactly what changed.

Do not silently change established business logic.

## 27. FINAL OUTPUT REQUIRED FROM CLAUDE

First, provide:

1. Analysis of the existing UnikScan architecture.
2. The exact modules and screens to add.
3. Recommended database design.
4. Role and permission matrix.
5. Detailed office-to-venue workflow.
6. Material shortage and approval logic.
7. Live Event Manager dashboard structure.
8. PWA offline architecture.
9. Cloudflare Workers deployment approach.
10. Phased implementation plan.
11. Missing requirements and technical risks.
12. Verification and acceptance checklist.

Distinguish existing, verified project capabilities from proposed new features.

**FINAL PRODUCT GOAL**

Build a centralized Event Operations Control Center where the owner or event manager can monitor every assigned event, employee, required item, setup activity, shortage, delay, and completion from anywhere.

The office team prepares.

The logistics team dispatches.

The on-site team verifies.

The Event Manager monitors, approves and resolves issues.

The platform maintains a reliable, real-time operational record.

**No paper-based checklists. No lost updates. No confusion over responsibility. No hidden shortages. No unverified completion.**

Start with the existing project audit and architecture proposal before implementing changes.
