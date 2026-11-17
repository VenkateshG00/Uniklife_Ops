import { describe, it, expect } from 'vitest'

/**
 * Tests for the P&L calculation logic from usePnL.ts
 * We extract the pure math and test it without React hooks/Supabase.
 */

type AdjustmentType = 'refund' | 'gateway_fee' | 'discount' | 'sponsorship' | 'other_income'
const NEGATIVE_ADJ: AdjustmentType[] = ['refund', 'gateway_fee', 'discount']

interface Tier { price: number; seats_sold: number; tier_name: string }
interface Adjustment { amount: number; type: AdjustmentType }
interface BudgetItem { planned_amount: number; actual_amount: number; category: string }

function calcPnL(tiers: Tier[], adjustments: Adjustment[], budgetItems: BudgetItem[]) {
  const grossRevenue = tiers.reduce((s, t) => s + t.price * t.seats_sold, 0)
  const totalRegistrations = tiers.reduce((s, t) => s + t.seats_sold, 0)

  const totalAdjustments = adjustments.reduce((s, a) => {
    return s + (NEGATIVE_ADJ.includes(a.type) ? -a.amount : a.amount)
  }, 0)

  const netRevenue = grossRevenue + totalAdjustments

  const totalPlanned = budgetItems.reduce((s, i) => s + i.planned_amount, 0)
  const totalActual = budgetItems.reduce((s, i) => s + i.actual_amount, 0)
  const budgetVariance = totalPlanned - totalActual

  const netPnL = netRevenue - totalActual
  const margin = netRevenue > 0 ? (netPnL / netRevenue) * 100 : 0

  // Expense aggregation by category
  const catMap = new Map<string, { planned: number; actual: number }>()
  for (const item of budgetItems) {
    const entry = catMap.get(item.category) ?? { planned: 0, actual: 0 }
    entry.planned += item.planned_amount
    entry.actual += item.actual_amount
    catMap.set(item.category, entry)
  }
  const expensesByCategory = Array.from(catMap.entries()).map(([category, v]) => ({
    category, planned: v.planned, actual: v.actual,
  }))

  // Revenue by tier
  const revenueByTier = tiers.map(t => ({
    tierName: t.tier_name, price: t.price, sold: t.seats_sold,
    revenue: t.price * t.seats_sold,
  }))

  const avgTicketPrice = totalRegistrations > 0 ? grossRevenue / totalRegistrations : 0
  const breakEvenRegistrations = avgTicketPrice > 0 ? Math.ceil(totalActual / avgTicketPrice) : 0

  return {
    grossRevenue, totalAdjustments, netRevenue, totalRegistrations,
    totalPlanned, totalActual, budgetVariance,
    netPnL, margin, expensesByCategory, revenueByTier,
    avgTicketPrice, breakEvenRegistrations,
  }
}

describe('Net Revenue calculation', () => {
  it('sums tier revenues correctly', () => {
    const result = calcPnL(
      [
        { tier_name: 'Early Bird', price: 5000, seats_sold: 20 },
        { tier_name: 'Regular', price: 8000, seats_sold: 50 },
      ],
      [],
      [],
    )
    expect(result.grossRevenue).toBe(5000 * 20 + 8000 * 50) // 500,000
  })

  it('subtracts negative adjustments (refund, gateway_fee, discount)', () => {
    const result = calcPnL(
      [{ tier_name: 'Standard', price: 10000, seats_sold: 30 }],
      [
        { amount: 20000, type: 'refund' },
        { amount: 5000, type: 'gateway_fee' },
        { amount: 10000, type: 'discount' },
      ],
      [],
    )
    expect(result.grossRevenue).toBe(300000)
    expect(result.totalAdjustments).toBe(-35000)
    expect(result.netRevenue).toBe(265000)
  })

  it('adds positive adjustments (sponsorship, other_income)', () => {
    const result = calcPnL(
      [{ tier_name: 'Standard', price: 10000, seats_sold: 10 }],
      [
        { amount: 50000, type: 'sponsorship' },
        { amount: 10000, type: 'other_income' },
      ],
      [],
    )
    expect(result.netRevenue).toBe(100000 + 60000)
  })

  it('handles mix of positive and negative adjustments', () => {
    const result = calcPnL(
      [{ tier_name: 'VIP', price: 15000, seats_sold: 10 }],
      [
        { amount: 25000, type: 'sponsorship' },
        { amount: 10000, type: 'refund' },
        { amount: 3000, type: 'gateway_fee' },
      ],
      [],
    )
    // gross = 150000, adj = +25000 - 10000 - 3000 = +12000
    expect(result.netRevenue).toBe(162000)
  })

  it('handles empty tiers and adjustments', () => {
    const result = calcPnL([], [], [])
    expect(result.grossRevenue).toBe(0)
    expect(result.netRevenue).toBe(0)
  })
})

describe('Expense aggregation by category', () => {
  it('groups budget items by category', () => {
    const result = calcPnL(
      [],
      [],
      [
        { category: 'ad_spend', planned_amount: 50000, actual_amount: 45000 },
        { category: 'ad_spend', planned_amount: 30000, actual_amount: 28000 },
        { category: 'venue_facilities', planned_amount: 100000, actual_amount: 95000 },
      ],
    )
    expect(result.expensesByCategory).toHaveLength(2)
    const adSpend = result.expensesByCategory.find(e => e.category === 'ad_spend')
    expect(adSpend?.planned).toBe(80000)
    expect(adSpend?.actual).toBe(73000)
  })

  it('calculates total planned and actual', () => {
    const result = calcPnL(
      [],
      [],
      [
        { category: 'ad_spend', planned_amount: 50000, actual_amount: 45000 },
        { category: 'travel_stay', planned_amount: 30000, actual_amount: 35000 },
      ],
    )
    expect(result.totalPlanned).toBe(80000)
    expect(result.totalActual).toBe(80000)
  })

  it('calculates budget variance (positive = under budget)', () => {
    const result = calcPnL(
      [],
      [],
      [
        { category: 'other', planned_amount: 100000, actual_amount: 80000 },
      ],
    )
    expect(result.budgetVariance).toBe(20000) // under budget
  })

  it('handles over-budget scenario', () => {
    const result = calcPnL(
      [],
      [],
      [
        { category: 'venue_facilities', planned_amount: 100000, actual_amount: 130000 },
      ],
    )
    expect(result.budgetVariance).toBe(-30000) // over budget
  })
})

describe('Net P&L and Margin', () => {
  it('calculates net P&L as netRevenue - totalActual expenses', () => {
    const result = calcPnL(
      [{ tier_name: 'Standard', price: 10000, seats_sold: 50 }],
      [],
      [{ category: 'other', planned_amount: 300000, actual_amount: 300000 }],
    )
    expect(result.netPnL).toBe(200000) // 500000 - 300000
  })

  it('calculates margin as (netPnL / netRevenue) * 100', () => {
    const result = calcPnL(
      [{ tier_name: 'Standard', price: 10000, seats_sold: 50 }],
      [],
      [{ category: 'other', planned_amount: 300000, actual_amount: 300000 }],
    )
    expect(result.margin).toBe(40) // (200000/500000)*100
  })

  it('returns 0 margin when netRevenue is zero', () => {
    const result = calcPnL(
      [],
      [],
      [{ category: 'other', planned_amount: 50000, actual_amount: 50000 }],
    )
    expect(result.margin).toBe(0)
  })

  it('handles loss scenario with negative P&L', () => {
    const result = calcPnL(
      [{ tier_name: 'Standard', price: 5000, seats_sold: 10 }],
      [{ amount: 10000, type: 'refund' }],
      [{ category: 'other', planned_amount: 100000, actual_amount: 100000 }],
    )
    // netRevenue = 50000 - 10000 = 40000
    // netPnL = 40000 - 100000 = -60000
    // margin = (-60000/40000)*100 = -150
    expect(result.netPnL).toBe(-60000)
    expect(result.margin).toBe(-150)
  })
})

describe('Revenue by tier', () => {
  it('maps each tier with its revenue', () => {
    const result = calcPnL(
      [
        { tier_name: 'Early Bird', price: 5000, seats_sold: 20 },
        { tier_name: 'Regular', price: 8000, seats_sold: 50 },
        { tier_name: 'VIP', price: 15000, seats_sold: 10 },
      ],
      [],
      [],
    )
    expect(result.revenueByTier).toEqual([
      { tierName: 'Early Bird', price: 5000, sold: 20, revenue: 100000 },
      { tierName: 'Regular', price: 8000, sold: 50, revenue: 400000 },
      { tierName: 'VIP', price: 15000, sold: 10, revenue: 150000 },
    ])
  })

  it('handles single tier', () => {
    const result = calcPnL(
      [{ tier_name: 'General', price: 7500, seats_sold: 100 }],
      [],
      [],
    )
    expect(result.revenueByTier).toHaveLength(1)
    expect(result.revenueByTier[0].revenue).toBe(750000)
  })
})

describe('Avg ticket price & break-even', () => {
  it('calculates average ticket price', () => {
    const result = calcPnL(
      [
        { tier_name: 'Cheap', price: 2000, seats_sold: 50 },
        { tier_name: 'Expensive', price: 10000, seats_sold: 50 },
      ],
      [],
      [],
    )
    // gross = 100000 + 500000 = 600000, regs = 100
    expect(result.avgTicketPrice).toBe(6000)
  })

  it('calculates break-even registrations', () => {
    const result = calcPnL(
      [{ tier_name: 'Standard', price: 5000, seats_sold: 100 }],
      [],
      [{ category: 'other', planned_amount: 200000, actual_amount: 200000 }],
    )
    // avgTicket = 5000, totalActual = 200000, breakEven = ceil(200000/5000) = 40
    expect(result.breakEvenRegistrations).toBe(40)
  })

  it('returns 0 break-even when avg ticket is 0', () => {
    const result = calcPnL([], [], [{ category: 'other', planned_amount: 100000, actual_amount: 100000 }])
    expect(result.breakEvenRegistrations).toBe(0)
  })

  it('rounds break-even up', () => {
    const result = calcPnL(
      [{ tier_name: 'Standard', price: 3000, seats_sold: 10 }],
      [],
      [{ category: 'other', planned_amount: 10000, actual_amount: 10000 }],
    )
    // avgTicket = 3000, breakEven = ceil(10000/3000) = ceil(3.33) = 4
    expect(result.breakEvenRegistrations).toBe(4)
  })
})
