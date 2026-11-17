import { describe, it, expect } from 'vitest'

/**
 * Tests for the business logic in programHistory.ts
 * Since inferProgram is not exported, we replicate its logic here for testing.
 * The financial calculations from getEditionSummary are tested as pure math.
 */

// Replicated from programHistory.ts (non-exported function)
function inferProgram(title: string): string | null {
  const upper = title.toUpperCase()
  if (upper.startsWith('BOSS')) return 'BOSS'
  if (upper.startsWith('UBM')) return 'UBM'
  if (upper.startsWith('MSGB')) return 'MSGB'
  if (upper.startsWith('VK-M') || upper.startsWith('VKM')) return 'VK-M'
  return null
}

// Replicated from getEditionSummary — pure financial math
function calcEditionMetrics(input: {
  netRevenue: number
  actualExpenses: number
  adSpend: number
  leads: number
  paidRegs: number
}) {
  const { netRevenue, actualExpenses, adSpend, leads, paidRegs } = input
  const grossProfit = netRevenue - actualExpenses
  const margin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0
  const cpl = leads > 0 ? adSpend / leads : 0
  const conversionRate = leads > 0 ? (paidRegs / leads) * 100 : 0
  return { grossProfit, margin, cpl, conversionRate }
}

describe('inferProgram', () => {
  it('identifies BOSS programs', () => {
    expect(inferProgram('BOSS Retreat 2024')).toBe('BOSS')
    expect(inferProgram('boss annual meet')).toBe('BOSS')
  })

  it('identifies UBM programs', () => {
    expect(inferProgram('UBM Workshop Delhi')).toBe('UBM')
  })

  it('identifies MSGB programs', () => {
    expect(inferProgram('MSGB Summit')).toBe('MSGB')
  })

  it('identifies VK-M programs (both formats)', () => {
    expect(inferProgram('VK-M Session 5')).toBe('VK-M')
    expect(inferProgram('VKM Masterclass')).toBe('VK-M')
  })

  it('returns null for unrecognized programs', () => {
    expect(inferProgram('Random Event Title')).toBeNull()
    expect(inferProgram('')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(inferProgram('boss lower case')).toBe('BOSS')
    expect(inferProgram('Ubm Mixed Case')).toBe('UBM')
  })
})

describe('Edition Summary — grossProfit', () => {
  it('calculates profit as netRevenue minus actual expenses', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 300000,
      adSpend: 50000,
      leads: 100,
      paidRegs: 40,
    })
    expect(result.grossProfit).toBe(200000)
  })

  it('returns negative profit when expenses exceed revenue', () => {
    const result = calcEditionMetrics({
      netRevenue: 100000,
      actualExpenses: 250000,
      adSpend: 50000,
      leads: 50,
      paidRegs: 10,
    })
    expect(result.grossProfit).toBe(-150000)
  })

  it('handles zero revenue', () => {
    const result = calcEditionMetrics({
      netRevenue: 0,
      actualExpenses: 50000,
      adSpend: 10000,
      leads: 20,
      paidRegs: 0,
    })
    expect(result.grossProfit).toBe(-50000)
  })
})

describe('Edition Summary — margin', () => {
  it('calculates margin as percentage of net revenue', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 300000,
      adSpend: 50000,
      leads: 100,
      paidRegs: 40,
    })
    // (200000 / 500000) * 100 = 40%
    expect(result.margin).toBe(40)
  })

  it('returns 0 margin when netRevenue is zero (division by zero guard)', () => {
    const result = calcEditionMetrics({
      netRevenue: 0,
      actualExpenses: 100000,
      adSpend: 50000,
      leads: 10,
      paidRegs: 2,
    })
    expect(result.margin).toBe(0)
  })

  it('returns negative margin for loss-making events', () => {
    const result = calcEditionMetrics({
      netRevenue: 200000,
      actualExpenses: 400000,
      adSpend: 100000,
      leads: 50,
      paidRegs: 15,
    })
    // grossProfit = -200000; margin = (-200000/200000)*100 = -100%
    expect(result.margin).toBe(-100)
  })

  it('returns 100% margin when expenses are zero', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 0,
      adSpend: 0,
      leads: 100,
      paidRegs: 50,
    })
    expect(result.margin).toBe(100)
  })
})

describe('Edition Summary — CPL (Cost Per Lead)', () => {
  it('calculates CPL as spend divided by leads', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 300000,
      adSpend: 100000,
      leads: 200,
      paidRegs: 50,
    })
    expect(result.cpl).toBe(500) // 100000 / 200
  })

  it('returns 0 when leads is zero (division by zero guard)', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 300000,
      adSpend: 100000,
      leads: 0,
      paidRegs: 0,
    })
    expect(result.cpl).toBe(0)
  })

  it('returns 0 when no ad spend', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 300000,
      adSpend: 0,
      leads: 100,
      paidRegs: 50,
    })
    expect(result.cpl).toBe(0)
  })

  it('handles fractional CPL', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 300000,
      adSpend: 10000,
      leads: 3,
      paidRegs: 1,
    })
    expect(result.cpl).toBeCloseTo(3333.33, 1)
  })
})

describe('Edition Summary — Conversion Rate', () => {
  it('calculates conversion rate as paidRegs / leads * 100', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 300000,
      adSpend: 50000,
      leads: 200,
      paidRegs: 50,
    })
    expect(result.conversionRate).toBe(25) // (50/200)*100
  })

  it('returns 0 when leads is zero', () => {
    const result = calcEditionMetrics({
      netRevenue: 0,
      actualExpenses: 0,
      adSpend: 0,
      leads: 0,
      paidRegs: 0,
    })
    expect(result.conversionRate).toBe(0)
  })

  it('handles 100% conversion', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 300000,
      adSpend: 50000,
      leads: 50,
      paidRegs: 50,
    })
    expect(result.conversionRate).toBe(100)
  })

  it('handles over 100% conversion (more regs than leads — referrals, walk-ins)', () => {
    const result = calcEditionMetrics({
      netRevenue: 500000,
      actualExpenses: 300000,
      adSpend: 50000,
      leads: 50,
      paidRegs: 75,
    })
    expect(result.conversionRate).toBe(150)
  })

  it('handles very low conversion', () => {
    const result = calcEditionMetrics({
      netRevenue: 50000,
      actualExpenses: 100000,
      adSpend: 80000,
      leads: 1000,
      paidRegs: 5,
    })
    expect(result.conversionRate).toBe(0.5)
  })
})
