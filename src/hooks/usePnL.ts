import { useMemo } from 'react'
import { useBudgetItems } from './useBudget'
import { useRevenueTiers, useRevenueAdjustments } from './useRevenue'
import type { RevenueAdjustmentType } from '../types'

const NEGATIVE_ADJ: RevenueAdjustmentType[] = ['refund', 'gateway_fee', 'discount']

const CATEGORY_LABELS: Record<string, string> = {
  ad_spend: 'Ad Spend',
  venue_facilities: 'Venue & Facilities',
  travel_stay: 'Travel & Stay',
  gifts_merchandise: 'Gifts & Merch',
  inventory: 'Inventory',
  other: 'Other',
}

export interface PnLData {
  grossRevenue: number
  totalAdjustments: number
  netRevenue: number
  totalRegistrations: number

  totalPlanned: number
  totalActual: number
  budgetVariance: number

  netPnL: number
  margin: number

  expensesByCategory: { category: string; label: string; planned: number; actual: number }[]
  revenueByTier: { tierName: string; price: number; sold: number; revenue: number }[]

  avgTicketPrice: number
  breakEvenRegistrations: number

  isLoading: boolean
  isError: boolean
}

export function usePnL(eventId: string): PnLData {
  const { data: budgetItems = [], isLoading: budgetLoading, isError: budgetError } = useBudgetItems(eventId)
  const { data: tiers = [], isLoading: tiersLoading, isError: tiersError } = useRevenueTiers(eventId)
  const { data: adjustments = [], isLoading: adjLoading, isError: adjError } = useRevenueAdjustments(eventId)

  return useMemo(() => {
    const isLoading = budgetLoading || tiersLoading || adjLoading
    const isError = budgetError || tiersError || adjError

    const grossRevenue = tiers.reduce((s, t) => s + Number(t.price) * t.seats_sold, 0)
    const totalRegistrations = tiers.reduce((s, t) => s + t.seats_sold, 0)

    const totalAdjustments = adjustments.reduce((s, a) => {
      const amount = Number(a.amount)
      return s + (NEGATIVE_ADJ.includes(a.type) ? -amount : amount)
    }, 0)

    const netRevenue = grossRevenue + totalAdjustments

    const totalPlanned = budgetItems.reduce((s, i) => s + Number(i.planned_amount), 0)
    const totalActual = budgetItems.reduce((s, i) => s + Number(i.actual_amount), 0)
    const budgetVariance = totalPlanned - totalActual

    const netPnL = netRevenue - totalActual
    const margin = netRevenue > 0 ? (netPnL / netRevenue) * 100 : 0

    const catMap = new Map<string, { planned: number; actual: number }>()
    for (const item of budgetItems) {
      const entry = catMap.get(item.category) ?? { planned: 0, actual: 0 }
      entry.planned += Number(item.planned_amount)
      entry.actual += Number(item.actual_amount)
      catMap.set(item.category, entry)
    }
    const expensesByCategory = Array.from(catMap.entries()).map(([category, v]) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      planned: v.planned,
      actual: v.actual,
    }))

    const revenueByTier = tiers.map(t => ({
      tierName: t.tier_name,
      price: Number(t.price),
      sold: t.seats_sold,
      revenue: Number(t.price) * t.seats_sold,
    }))

    const avgTicketPrice = totalRegistrations > 0 ? grossRevenue / totalRegistrations : 0
    const breakEvenRegistrations = avgTicketPrice > 0 ? Math.ceil(totalActual / avgTicketPrice) : 0

    return {
      grossRevenue,
      totalAdjustments,
      netRevenue,
      totalRegistrations,
      totalPlanned,
      totalActual,
      budgetVariance,
      netPnL,
      margin,
      expensesByCategory,
      revenueByTier,
      avgTicketPrice,
      breakEvenRegistrations,
      isLoading,
      isError,
    }
  }, [budgetItems, tiers, adjustments, budgetLoading, tiersLoading, adjLoading, budgetError, tiersError, adjError])
}
