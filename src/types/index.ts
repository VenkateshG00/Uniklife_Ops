// ─── Core domain types ───────────────────────────────────────────────────────

export type UUID = string

// User roles
export type UserRole =
  | 'super_admin'
  | 'event_manager'
  | 'office_staff'
  | 'onsite_staff'
  | 'procurement_staff'
  | 'read_only'

// Item lifecycle status
export type ItemStatus =
  | 'pending'
  | 'packed'
  | 'dispatched'
  | 'at_venue'
  | 'done'
  | 'issue'

// Task status
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'blocked'
  | 'cancelled'

// Priority
export type Priority = 'critical' | 'high' | 'medium' | 'low'

// Event operational phase
export type EventPhase =
  | 'planning'
  | 'preparation'
  | 'dispatch'
  | 'event_day'
  | 'post_event'
  | 'closed'

// Shortage request status
export type ShortageStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'procurement_assigned'
  | 'dispatched'
  | 'received'
  | 'resolved'

// ─── Database row types ───────────────────────────────────────────────────────

export interface Profile {
  id: UUID
  email: string
  full_name: string
  phone?: string
  job_title?: string
  role: UserRole
  avatar_url?: string
  organization_id?: UUID
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: UUID
  name: string
  slug: string
  logo_url?: string
  settings: Record<string, unknown>
  created_at: string
}

export interface Event {
  id: UUID
  organization_id: UUID
  title: string
  category: string
  description?: string | null
  venue_name: string
  venue_address?: string | null
  location_link?: string | null
  start_datetime: string
  end_datetime: string
  expected_attendees: number
  event_manager_id?: UUID | null
  office_coordinator_id?: UUID | null
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
  phase: EventPhase
  budget?: number | null
  tour_id?: UUID | null
  created_by: UUID
  created_at: string
  updated_at: string
}

export interface EventOperationPlan {
  id: UUID
  event_id: UUID
  organization_id: UUID
  reporting_time?: string
  setup_deadline?: string
  dispatch_deadline?: string
  budget?: number
  instructions?: string
  overall_readiness_pct: number
  phase: EventPhase
  manager_approved_at?: string
  manager_approved_by?: UUID
  created_by: UUID
  created_at: string
  updated_at: string
}

export interface MaterialCategory {
  id: UUID
  organization_id: UUID
  name: string
  icon?: string
  color?: string
  sort_order: number
  is_system: boolean
  created_at: string
}

export interface MaterialCatalogItem {
  id: UUID
  organization_id: UUID
  category_id: UUID
  name: string
  description?: string
  unit: string
  item_type: 'consumable' | 'reusable'
  sku?: string
  default_quantity?: number
  is_active: boolean
  created_at: string
}

export interface EventChecklistItem {
  id: UUID
  operation_plan_id: UUID
  event_id: UUID
  organization_id: UUID
  catalog_item_id?: UUID
  category_id: UUID
  name: string
  unit: string
  item_type: 'consumable' | 'reusable'
  priority: Priority
  is_critical: boolean

  // Quantities
  required_qty: number
  reserved_qty: number
  packed_qty: number
  dispatched_qty: number
  received_qty: number
  venue_verified_qty: number
  additional_requested_qty: number
  additional_approved_qty: number
  damaged_qty: number
  lost_qty: number
  returned_qty: number

  // Assignment
  responsible_staff_id?: UUID
  due_time?: string

  // State
  status: ItemStatus
  office_status: 'not_started' | 'in_progress' | 'packed' | 'dispatched'
  venue_status: 'not_received' | 'partially_received' | 'received' | 'verified'

  // Meta
  notes?: string
  photo_urls: string[]
  last_updated_by?: UUID
  created_at: string
  updated_at: string
}

export interface EventTask {
  id: UUID
  operation_plan_id: UUID
  event_id: UUID
  organization_id: UUID
  title: string
  description?: string
  category: string
  assigned_to_id?: UUID
  created_by: UUID
  priority: Priority
  start_time?: string
  deadline?: string
  completed_at?: string
  status: TaskStatus
  escalation_state: 'none' | 'attention' | 'escalated'
  delay_reason?: string
  revised_estimate?: string
  dependency_task_id?: UUID
  proof_urls: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface ShortageRequest {
  id: UUID
  operation_plan_id: UUID
  event_id: UUID
  organization_id: UUID
  checklist_item_id: UUID
  requested_by: UUID
  current_qty: number
  additional_qty_requested: number
  reason: string
  priority: Priority
  needed_by?: string
  notes?: string
  attachment_urls: string[]
  status: ShortageStatus
  reviewed_by?: UUID
  reviewed_at?: string
  review_notes?: string
  approved_qty?: number
  assigned_procurement_id?: UUID
  resolved_at?: string
  resolved_by?: UUID
  resolution_notes?: string
  created_at: string
  updated_at: string
}

export interface ShortageRequestAction {
  id: UUID
  shortage_request_id: UUID
  action_by: UUID
  action_type: 'submitted' | 'approved' | 'rejected' | 'clarification_requested' | 'procurement_assigned' | 'dispatched' | 'received' | 'resolved'
  notes?: string
  qty_change?: number
  created_at: string
}

export interface EventActivityLog {
  id: UUID
  event_id: UUID
  operation_plan_id?: UUID
  organization_id: UUID
  actor_id: UUID
  actor_name: string
  action: string
  entity_type: string
  entity_id?: UUID
  entity_name?: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  meta?: Record<string, unknown>
  created_at: string
}

export interface EventStaffAssignment {
  id: UUID
  operation_plan_id: UUID
  event_id: UUID
  staff_id: UUID
  role: 'event_manager' | 'office_coordinator' | 'office_staff' | 'onsite_staff' | 'procurement_staff' | 'event_assistant'
  reporting_time?: string
  notes?: string
  checked_in_at?: string
  created_at: string
}

export interface InventoryCatalogItem {
  id: UUID
  organization_id: UUID
  category_id: UUID
  name: string
  sku?: string
  description?: string
  unit: string
  item_type: 'consumable' | 'reusable'
  storage_location?: string
  current_stock: number
  reserved_stock: number
  minimum_stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryStockMovement {
  id: UUID
  inventory_item_id: UUID
  organization_id: UUID
  event_id?: UUID
  movement_type: 'receipt' | 'issue' | 'return' | 'adjustment' | 'damage' | 'loss'
  quantity: number
  reference_id?: UUID
  notes?: string
  performed_by: UUID
  created_at: string
}

export interface OperationTemplate {
  id: UUID
  organization_id: UUID
  name: string
  event_category: string
  description?: string
  categories: TemplateCategory[]
  is_system: boolean
  created_by: UUID
  created_at: string
  updated_at: string
}

export interface TemplateCategory {
  name: string
  items: {
    name: string
    unit: string
    item_type: 'consumable' | 'reusable'
    priority: Priority
    is_critical: boolean
    default_qty?: number
  }[]
}

// ─── View / computed types ────────────────────────────────────────────────────

export interface EventReadinessSummary {
  event_id: UUID
  total_items: number
  completed: number
  in_progress: number
  pending: number
  blocked: number
  shortage: number
  critical_total: number
  critical_verified: number
  open_shortages: number
  overdue_tasks: number
  readiness_pct: number
  critical_readiness_pct: number
  phase: EventPhase
}

export interface TaskTemplate {
  id: UUID
  organization_id: UUID
  created_by?: UUID
  name: string
  program?: string
  description?: string
  created_at: string
  updated_at: string
  task_template_items?: TaskTemplateItem[]
}

export interface TaskTemplateItem {
  id: UUID
  template_id: UUID
  title: string
  description?: string
  category: string
  priority: string
  default_role?: string
  days_before_event?: number
  sort_order: number
  created_at: string
}

// GST
export type GstType = 'none' | 'cgst_sgst' | 'igst'
export const GST_RATES = [0, 5, 12, 18, 28] as const

// Budget categories
export type BudgetCategory =
  | 'ad_spend'
  | 'venue_facilities'
  | 'travel_stay'
  | 'gifts_merchandise'
  | 'inventory'
  | 'other'

export interface EventBudgetItem {
  id: UUID
  event_id: UUID
  organization_id: UUID
  category: BudgetCategory
  label: string
  description?: string | null
  planned_amount: number
  actual_amount: number
  is_reusable: boolean
  qty: number
  vendor_name?: string | null
  receipt_url?: string | null
  notes?: string | null
  gst_rate: number
  gst_type: GstType
  hsn_code?: string | null
  created_by?: UUID | null
  created_at: string
  approval_status?: ApprovalStatus
  updated_at: string
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface BudgetApproval {
  id: UUID
  organization_id: UUID
  event_id: UUID
  budget_item_id?: UUID | null
  requested_by: UUID
  approved_by?: UUID | null
  status: ApprovalStatus
  amount: number
  category?: string | null
  description?: string | null
  rejection_reason?: string | null
  requested_at: string
  resolved_at?: string | null
  updated_at: string
}

// Revenue tracking
export type RevenueAdjustmentType =
  | 'refund'
  | 'advance_booking'
  | 'gateway_fee'
  | 'discount'
  | 'other'

export interface EventRevenueTier {
  id: UUID
  event_id: UUID
  organization_id: UUID
  tier_name: string
  price: number
  seats_available: number
  seats_sold: number
  notes?: string | null
  gst_rate?: number | null
  gst_type?: GstType | null
  hsn_code?: string | null
  created_by?: UUID | null
  created_at: string
  updated_at: string
}

export interface EventRevenueAdjustment {
  id: UUID
  event_id: UUID
  organization_id: UUID
  type: RevenueAdjustmentType
  label: string
  amount: number
  notes?: string
  created_by?: UUID
  created_at: string
  updated_at: string
}

// Lead funnel / ad campaigns
export type AdPlatform = 'meta' | 'google' | 'youtube' | 'whatsapp' | 'organic' | 'referral' | 'other'

export interface EventAdCampaign {
  id: UUID
  event_id: UUID
  organization_id: UUID
  platform: AdPlatform
  campaign_name: string
  spend: number
  leads_generated: number
  leads_contacted: number
  payment_links_sent: number
  paid_registrations: number
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
  created_by?: UUID | null
  created_at: string
  updated_at: string
}

// Tour grouping & rollup
export type ProgramName = 'BOSS' | 'UBM' | 'MSGB' | 'VK-M'

export type TourSplitMethod = 'equal' | 'proportional_revenue' | 'manual'

export interface EventTour {
  id: UUID
  organization_id: UUID
  name: string
  program: string
  year: number
  notes?: string
  created_by?: UUID
  created_at: string
  updated_at: string
}

export interface TourSharedCost {
  id: UUID
  tour_id: UUID
  organization_id: UUID
  label: string
  amount: number
  split_method: TourSplitMethod
  notes?: string | null
  created_by?: UUID | null
  created_at: string
  updated_at: string
}

export interface EventUpsell {
  id: UUID
  source_event_id: UUID
  target_event_id: UUID
  organization_id: UUID
  attendee_name: string
  attendee_email?: string | null
  attendee_phone?: string | null
  source_amount: number
  target_amount: number
  days_between?: number | null
  notes?: string | null
  created_by?: UUID | null
  created_at: string
  updated_at: string
}

export interface KpiData {
  label: string
  value: number | string
  delta?: number
  color?: string
  icon?: string
}
