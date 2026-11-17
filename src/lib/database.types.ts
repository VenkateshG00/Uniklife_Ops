export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      budget_approvals: {
        Row: {
          amount: number
          approved_by: string | null
          budget_item_id: string | null
          category: string | null
          description: string | null
          event_id: string
          id: string
          organization_id: string
          rejection_reason: string | null
          requested_at: string
          requested_by: string
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          budget_item_id?: string | null
          category?: string | null
          description?: string | null
          event_id: string
          id?: string
          organization_id: string
          rejection_reason?: string | null
          requested_at?: string
          requested_by: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          budget_item_id?: string | null
          category?: string | null
          description?: string | null
          event_id?: string
          id?: string
          organization_id?: string
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_approvals_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "event_budget_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_approvals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "budget_approvals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_activity_log: {
        Row: {
          action: string
          actor_id: string
          actor_name: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          event_id: string
          id: string
          meta: Json | null
          new_value: Json | null
          old_value: Json | null
          operation_plan_id: string | null
          organization_id: string
        }
        Insert: {
          action: string
          actor_id: string
          actor_name: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          event_id: string
          id?: string
          meta?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          operation_plan_id?: string | null
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          actor_name?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          event_id?: string
          id?: string
          meta?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          operation_plan_id?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_activity_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_activity_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_activity_log_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_operation_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_activity_log_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "event_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ad_campaigns: {
        Row: {
          campaign_name: string
          created_at: string
          created_by: string | null
          end_date: string | null
          event_id: string
          id: string
          leads_contacted: number
          leads_generated: number
          notes: string | null
          organization_id: string
          paid_registrations: number
          payment_links_sent: number
          platform: string
          spend: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          campaign_name: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          event_id: string
          id?: string
          leads_contacted?: number
          leads_generated?: number
          notes?: string | null
          organization_id: string
          paid_registrations?: number
          payment_links_sent?: number
          platform: string
          spend?: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          event_id?: string
          id?: string
          leads_contacted?: number
          leads_generated?: number
          notes?: string | null
          organization_id?: string
          paid_registrations?: number
          payment_links_sent?: number
          platform?: string
          spend?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_ad_campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_ad_campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_ad_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          checked_in: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          email: string | null
          event_id: string
          full_name: string
          id: string
          notes: string | null
          organization_id: string
          phone: string | null
          ticket_code: string | null
          ticket_type: string
          updated_at: string
        }
        Insert: {
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          email?: string | null
          event_id: string
          full_name: string
          id?: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          ticket_code?: string | null
          ticket_type?: string
          updated_at?: string
        }
        Update: {
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          email?: string | null
          event_id?: string
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          ticket_code?: string | null
          ticket_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_budget_items: {
        Row: {
          actual_amount: number
          approval_status: string | null
          category: Database["public"]["Enums"]["budget_category"]
          created_at: string
          created_by: string | null
          description: string | null
          event_id: string
          gst_rate: number | null
          gst_type: string | null
          hsn_code: string | null
          id: string
          is_reusable: boolean
          label: string
          notes: string | null
          organization_id: string
          planned_amount: number
          qty: number
          receipt_url: string | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          actual_amount?: number
          approval_status?: string | null
          category: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id: string
          gst_rate?: number | null
          gst_type?: string | null
          hsn_code?: string | null
          id?: string
          is_reusable?: boolean
          label: string
          notes?: string | null
          organization_id: string
          planned_amount?: number
          qty?: number
          receipt_url?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          actual_amount?: number
          approval_status?: string | null
          category?: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_id?: string
          gst_rate?: number | null
          gst_type?: string | null
          hsn_code?: string | null
          id?: string
          is_reusable?: boolean
          label?: string
          notes?: string | null
          organization_id?: string
          planned_amount?: number
          qty?: number
          receipt_url?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_budget_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_budget_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_budget_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_budget_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklist_items: {
        Row: {
          additional_approved_qty: number
          additional_requested_qty: number
          catalog_item_id: string | null
          category_id: string
          created_at: string
          damaged_qty: number
          dispatched_qty: number
          due_time: string | null
          event_id: string
          id: string
          is_critical: boolean
          item_type: Database["public"]["Enums"]["item_type"]
          last_updated_by: string | null
          lost_qty: number
          name: string
          notes: string | null
          office_status: string
          operation_plan_id: string
          organization_id: string
          packed_qty: number
          photo_urls: string[]
          priority: Database["public"]["Enums"]["priority_level"]
          received_qty: number
          required_qty: number
          reserved_qty: number
          responsible_staff_id: string | null
          returned_qty: number
          status: Database["public"]["Enums"]["item_status"]
          status_note: string | null
          unit: string
          updated_at: string
          venue_status: string
          venue_verified_qty: number
        }
        Insert: {
          additional_approved_qty?: number
          additional_requested_qty?: number
          catalog_item_id?: string | null
          category_id: string
          created_at?: string
          damaged_qty?: number
          dispatched_qty?: number
          due_time?: string | null
          event_id: string
          id?: string
          is_critical?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          last_updated_by?: string | null
          lost_qty?: number
          name: string
          notes?: string | null
          office_status?: string
          operation_plan_id: string
          organization_id: string
          packed_qty?: number
          photo_urls?: string[]
          priority?: Database["public"]["Enums"]["priority_level"]
          received_qty?: number
          required_qty?: number
          reserved_qty?: number
          responsible_staff_id?: string | null
          returned_qty?: number
          status?: Database["public"]["Enums"]["item_status"]
          status_note?: string | null
          unit?: string
          updated_at?: string
          venue_status?: string
          venue_verified_qty?: number
        }
        Update: {
          additional_approved_qty?: number
          additional_requested_qty?: number
          catalog_item_id?: string | null
          category_id?: string
          created_at?: string
          damaged_qty?: number
          dispatched_qty?: number
          due_time?: string | null
          event_id?: string
          id?: string
          is_critical?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          last_updated_by?: string | null
          lost_qty?: number
          name?: string
          notes?: string | null
          office_status?: string
          operation_plan_id?: string
          organization_id?: string
          packed_qty?: number
          photo_urls?: string[]
          priority?: Database["public"]["Enums"]["priority_level"]
          received_qty?: number
          required_qty?: number
          reserved_qty?: number
          responsible_staff_id?: string | null
          returned_qty?: number
          status?: Database["public"]["Enums"]["item_status"]
          status_note?: string | null
          unit?: string
          updated_at?: string
          venue_status?: string
          venue_verified_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_checklist_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "material_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_checklist_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_operation_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "event_checklist_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_operation_plans: {
        Row: {
          budget: number | null
          created_at: string
          created_by: string
          dispatch_deadline: string | null
          event_id: string
          id: string
          instructions: string | null
          manager_approved_at: string | null
          manager_approved_by: string | null
          organization_id: string
          overall_readiness_pct: number
          phase: Database["public"]["Enums"]["event_phase"]
          reporting_time: string | null
          setup_deadline: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          created_by: string
          dispatch_deadline?: string | null
          event_id: string
          id?: string
          instructions?: string | null
          manager_approved_at?: string | null
          manager_approved_by?: string | null
          organization_id: string
          overall_readiness_pct?: number
          phase?: Database["public"]["Enums"]["event_phase"]
          reporting_time?: string | null
          setup_deadline?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          created_by?: string
          dispatch_deadline?: string | null
          event_id?: string
          id?: string
          instructions?: string | null
          manager_approved_at?: string | null
          manager_approved_by?: string | null
          organization_id?: string
          overall_readiness_pct?: number
          phase?: Database["public"]["Enums"]["event_phase"]
          reporting_time?: string | null
          setup_deadline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_operation_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_operation_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_operation_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_operation_plans_manager_approved_by_fkey"
            columns: ["manager_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_operation_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payments: {
        Row: {
          amount: number
          category: string | null
          collected_by: string | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          organization_id: string
          payer_name: string
          payment_date: string
          payment_type: string
          reference_no: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          collected_by?: string | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          organization_id: string
          payer_name: string
          payment_date?: string
          payment_type?: string
          reference_no?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          collected_by?: string | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          organization_id?: string
          payer_name?: string
          payment_date?: string
          payment_type?: string
          reference_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_payments_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_revenue_adjustments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          label: string
          notes: string | null
          organization_id: string
          type: Database["public"]["Enums"]["revenue_adjustment_type"]
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          label: string
          notes?: string | null
          organization_id: string
          type: Database["public"]["Enums"]["revenue_adjustment_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          label?: string
          notes?: string | null
          organization_id?: string
          type?: Database["public"]["Enums"]["revenue_adjustment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_revenue_adjustments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_revenue_adjustments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_revenue_adjustments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_revenue_tiers: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string
          gst_rate: number | null
          gst_type: string | null
          hsn_code: string | null
          id: string
          notes: string | null
          organization_id: string
          price: number
          seats_available: number
          seats_sold: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: string
          gst_rate?: number | null
          gst_type?: string | null
          hsn_code?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          price?: number
          seats_available?: number
          seats_sold?: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string
          gst_rate?: number | null
          gst_type?: string | null
          hsn_code?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          price?: number
          seats_available?: number
          seats_sold?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_revenue_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_revenue_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_revenue_tiers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff_assignments: {
        Row: {
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          notes: string | null
          operation_plan_id: string
          reporting_time: string | null
          role: string
          staff_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          operation_plan_id: string
          reporting_time?: string | null
          role: string
          staff_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          operation_plan_id?: string
          reporting_time?: string | null
          role?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_staff_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_assignments_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_operation_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_assignments_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "event_staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tasks: {
        Row: {
          assigned_to_id: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string
          deadline: string | null
          delay_reason: string | null
          dependency_task_id: string | null
          description: string | null
          escalation_state: string
          event_id: string
          id: string
          notes: string | null
          operation_plan_id: string | null
          organization_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          proof_urls: string[]
          revised_estimate: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_id?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          delay_reason?: string | null
          dependency_task_id?: string | null
          description?: string | null
          escalation_state?: string
          event_id: string
          id?: string
          notes?: string | null
          operation_plan_id?: string | null
          organization_id: string
          priority?: Database["public"]["Enums"]["priority_level"]
          proof_urls?: string[]
          revised_estimate?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_id?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          delay_reason?: string | null
          dependency_task_id?: string | null
          description?: string | null
          escalation_state?: string
          event_id?: string
          id?: string
          notes?: string | null
          operation_plan_id?: string | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          proof_urls?: string[]
          revised_estimate?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tasks_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_dependency_task_id_fkey"
            columns: ["dependency_task_id"]
            isOneToOne: false
            referencedRelation: "event_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_operation_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "event_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tours: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          program: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          program: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          program?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_tours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_upsells: {
        Row: {
          attendee_email: string | null
          attendee_name: string
          attendee_phone: string | null
          created_at: string
          created_by: string | null
          days_between: number | null
          id: string
          notes: string | null
          organization_id: string
          source_amount: number
          source_event_id: string
          target_amount: number
          target_event_id: string
          updated_at: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name: string
          attendee_phone?: string | null
          created_at?: string
          created_by?: string | null
          days_between?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          source_amount?: number
          source_event_id: string
          target_amount?: number
          target_event_id: string
          updated_at?: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string
          attendee_phone?: string | null
          created_at?: string
          created_by?: string | null
          days_between?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          source_amount?: number
          source_event_id?: string
          target_amount?: number
          target_event_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_upsells_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_upsells_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_upsells_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_upsells_target_event_id_fkey"
            columns: ["target_event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_upsells_target_event_id_fkey"
            columns: ["target_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          budget: number | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          end_datetime: string
          event_manager_id: string | null
          expected_attendees: number
          id: string
          location_link: string | null
          office_coordinator_id: string | null
          organization_id: string
          phase: Database["public"]["Enums"]["event_phase"]
          start_datetime: string
          status: string
          title: string
          tour_id: string | null
          updated_at: string
          venue_address: string | null
          venue_name: string
        }
        Insert: {
          budget?: number | null
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          end_datetime: string
          event_manager_id?: string | null
          expected_attendees?: number
          id?: string
          location_link?: string | null
          office_coordinator_id?: string | null
          organization_id: string
          phase?: Database["public"]["Enums"]["event_phase"]
          start_datetime: string
          status?: string
          title: string
          tour_id?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_name: string
        }
        Update: {
          budget?: number | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_datetime?: string
          event_manager_id?: string | null
          expected_attendees?: number
          id?: string
          location_link?: string | null
          office_coordinator_id?: string | null
          organization_id?: string
          phase?: Database["public"]["Enums"]["event_phase"]
          start_datetime?: string
          status?: string
          title?: string
          tour_id?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_event_manager_id_fkey"
            columns: ["event_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_office_coordinator_id_fkey"
            columns: ["office_coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "event_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_catalog: {
        Row: {
          category_id: string
          created_at: string
          current_stock: number
          description: string | null
          id: string
          is_active: boolean
          item_type: Database["public"]["Enums"]["item_type"]
          minimum_stock: number
          name: string
          organization_id: string
          reserved_stock: number
          sku: string | null
          storage_location: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          minimum_stock?: number
          name: string
          organization_id: string
          reserved_stock?: number
          sku?: string | null
          storage_location?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          minimum_stock?: number
          name?: string
          organization_id?: string
          reserved_stock?: number
          sku?: string | null
          storage_location?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_catalog_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stock_movements: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          inventory_item_id: string
          movement_type: string
          notes: string | null
          organization_id: string
          performed_by: string
          quantity: number
          reference_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          inventory_item_id: string
          movement_type: string
          notes?: string | null
          organization_id: string
          performed_by: string
          quantity: number
          reference_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          inventory_item_id?: string
          movement_type?: string
          notes?: string | null
          organization_id?: string
          performed_by?: string
          quantity?: number
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_stock_movements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_catalog: {
        Row: {
          category_id: string
          created_at: string
          default_quantity: number | null
          description: string | null
          id: string
          is_active: boolean
          item_type: Database["public"]["Enums"]["item_type"]
          name: string
          organization_id: string | null
          sku: string | null
          unit: string
        }
        Insert: {
          category_id: string
          created_at?: string
          default_quantity?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          name: string
          organization_id?: string | null
          sku?: string | null
          unit?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          default_quantity?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          name?: string
          organization_id?: string | null
          sku?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_catalog_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_category: string
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          template_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_category: string
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          template_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_category?: string
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          template_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          organization_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shortage_request_actions: {
        Row: {
          action_by: string
          action_type: string
          created_at: string
          id: string
          notes: string | null
          qty_change: number | null
          shortage_request_id: string
        }
        Insert: {
          action_by: string
          action_type: string
          created_at?: string
          id?: string
          notes?: string | null
          qty_change?: number | null
          shortage_request_id: string
        }
        Update: {
          action_by?: string
          action_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          qty_change?: number | null
          shortage_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortage_request_actions_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_request_actions_shortage_request_id_fkey"
            columns: ["shortage_request_id"]
            isOneToOne: false
            referencedRelation: "shortage_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shortage_requests: {
        Row: {
          additional_qty_requested: number
          approved_qty: number | null
          assigned_procurement_id: string | null
          attachment_urls: string[]
          checklist_item_id: string
          created_at: string
          current_qty: number
          event_id: string
          id: string
          needed_by: string | null
          notes: string | null
          operation_plan_id: string
          organization_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          reason: string
          requested_by: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["shortage_status"]
          updated_at: string
        }
        Insert: {
          additional_qty_requested: number
          approved_qty?: number | null
          assigned_procurement_id?: string | null
          attachment_urls?: string[]
          checklist_item_id: string
          created_at?: string
          current_qty?: number
          event_id: string
          id?: string
          needed_by?: string | null
          notes?: string | null
          operation_plan_id: string
          organization_id: string
          priority?: Database["public"]["Enums"]["priority_level"]
          reason: string
          requested_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["shortage_status"]
          updated_at?: string
        }
        Update: {
          additional_qty_requested?: number
          approved_qty?: number | null
          assigned_procurement_id?: string | null
          attachment_urls?: string[]
          checklist_item_id?: string
          created_at?: string
          current_qty?: number
          event_id?: string
          id?: string
          needed_by?: string | null
          notes?: string | null
          operation_plan_id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          reason?: string
          requested_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["shortage_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortage_requests_assigned_procurement_id_fkey"
            columns: ["assigned_procurement_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_requests_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "event_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "shortage_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_requests_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_operation_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_requests_operation_plan_id_fkey"
            columns: ["operation_plan_id"]
            isOneToOne: false
            referencedRelation: "event_readiness_summary"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "shortage_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invites: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          full_name: string
          id: string
          job_title: string | null
          organization_id: string
          phone: string | null
          role: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          full_name: string
          id?: string
          job_title?: string | null
          organization_id: string
          phone?: string | null
          role: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          full_name?: string
          id?: string
          job_title?: string | null
          organization_id?: string
          phone?: string | null
          role?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_items: {
        Row: {
          category: string
          created_at: string
          days_before_event: number | null
          default_role: string | null
          description: string | null
          id: string
          priority: string
          sort_order: number
          template_id: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          days_before_event?: number | null
          default_role?: string | null
          description?: string | null
          id?: string
          priority?: string
          sort_order?: number
          template_id: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          days_before_event?: number | null
          default_role?: string | null
          description?: string | null
          id?: string
          priority?: string
          sort_order?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          program: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          program?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          program?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_shared_costs: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          label: string
          notes: string | null
          organization_id: string
          split_method: string
          tour_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          notes?: string | null
          organization_id: string
          split_method?: string
          tour_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          notes?: string | null
          organization_id?: string
          split_method?: string
          tour_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_shared_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_shared_costs_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "event_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      event_readiness_summary: {
        Row: {
          blocked: number | null
          completed: number | null
          critical_total: number | null
          critical_verified: number | null
          event_id: string | null
          in_progress: number | null
          pending: number | null
          plan_id: string | null
          readiness_pct: number | null
          shortage_items: number | null
          total_items: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _activity_log_insert:
        | {
            Args: {
              p_action: string
              p_entity_id: string
              p_entity_name: string
              p_entity_type: string
              p_event_id: string
              p_new_value?: Json
              p_old_value?: Json
              p_org_id: string
              p_plan_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_action: string
              p_actor_id: string
              p_entity_id: string
              p_entity_name: string
              p_entity_type: string
              p_event_id: string
              p_new_value?: Json
              p_old_value?: Json
              p_org_id: string
              p_plan_id: string
            }
            Returns: undefined
          }
      get_auth_org_id: { Args: never; Returns: string }
      get_auth_role: { Args: never; Returns: string }
      log_event_activity: {
        Args: {
          p_action: string
          p_actor_id: string
          p_actor_name: string
          p_entity_id?: string
          p_entity_name?: string
          p_entity_type: string
          p_event_id: string
          p_meta?: Json
          p_new_value?: Json
          p_old_value?: Json
          p_org_id: string
          p_plan_id: string
        }
        Returns: string
      }
    }
    Enums: {
      budget_category:
        | "ad_spend"
        | "venue_facilities"
        | "travel_stay"
        | "gifts_merchandise"
        | "inventory"
        | "other"
      event_phase:
        | "planning"
        | "preparation"
        | "dispatch"
        | "event_day"
        | "post_event"
        | "closed"
      item_status:
        | "not_started"
        | "in_progress"
        | "prepared"
        | "packed"
        | "dispatched"
        | "delivered"
        | "venue_verified"
        | "completed"
        | "blocked"
        | "shortage"
        | "damaged"
        | "cancelled"
        | "not_applicable"
        | "pending"
        | "at_venue"
        | "done"
        | "issue"
      item_type: "consumable" | "reusable"
      priority_level: "critical" | "high" | "medium" | "low"
      revenue_adjustment_type:
        | "refund"
        | "advance_booking"
        | "gateway_fee"
        | "discount"
        | "other"
      shortage_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "procurement_assigned"
        | "dispatched"
        | "received"
        | "resolved"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "overdue"
        | "blocked"
        | "cancelled"
      user_role:
        | "super_admin"
        | "event_manager"
        | "office_staff"
        | "onsite_staff"
        | "procurement_staff"
        | "read_only"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      budget_category: [
        "ad_spend",
        "venue_facilities",
        "travel_stay",
        "gifts_merchandise",
        "inventory",
        "other",
      ],
      event_phase: [
        "planning",
        "preparation",
        "dispatch",
        "event_day",
        "post_event",
        "closed",
      ],
      item_status: [
        "not_started",
        "in_progress",
        "prepared",
        "packed",
        "dispatched",
        "delivered",
        "venue_verified",
        "completed",
        "blocked",
        "shortage",
        "damaged",
        "cancelled",
        "not_applicable",
        "pending",
        "at_venue",
        "done",
        "issue",
      ],
      item_type: ["consumable", "reusable"],
      priority_level: ["critical", "high", "medium", "low"],
      revenue_adjustment_type: [
        "refund",
        "advance_booking",
        "gateway_fee",
        "discount",
        "other",
      ],
      shortage_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "procurement_assigned",
        "dispatched",
        "received",
        "resolved",
      ],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "overdue",
        "blocked",
        "cancelled",
      ],
      user_role: [
        "super_admin",
        "event_manager",
        "office_staff",
        "onsite_staff",
        "procurement_staff",
        "read_only",
      ],
    },
  },
} as const
