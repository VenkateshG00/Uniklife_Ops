import { describe, it, expect } from 'vitest'

/**
 * Tests for GST calculation logic from BudgetPanel.tsx
 * Replicated calcGst as a pure function for unit testing.
 */

type GstType = 'none' | 'cgst_sgst' | 'igst'

interface BudgetItem {
  actual_amount: number
  qty: number
  gst_rate: number
  gst_type: GstType
}

function calcGst(item: BudgetItem) {
  const base = Number(item.actual_amount) * item.qty
  const rate = Number(item.gst_rate) || 0
  if (rate === 0 || item.gst_type === 'none') return { total: 0, label: '' }
  const tax = Math.round((base * rate) / 100 * 100) / 100
  if (item.gst_type === 'cgst_sgst') {
    const half = Math.round((tax / 2) * 100) / 100
    return { total: tax, label: `CGST ${half} + SGST ${half}` }
  }
  return { total: tax, label: `IGST ${tax}` }
}

describe('GST type none', () => {
  it('returns zero tax when gst_type is none', () => {
    const result = calcGst({ actual_amount: 10000, qty: 1, gst_rate: 18, gst_type: 'none' })
    expect(result.total).toBe(0)
    expect(result.label).toBe('')
  })

  it('returns zero tax when gst_rate is 0 regardless of type', () => {
    const result = calcGst({ actual_amount: 10000, qty: 2, gst_rate: 0, gst_type: 'cgst_sgst' })
    expect(result.total).toBe(0)
  })

  it('returns zero tax for zero amount', () => {
    const result = calcGst({ actual_amount: 0, qty: 5, gst_rate: 18, gst_type: 'igst' })
    expect(result.total).toBe(0)
  })
})

describe('GST type cgst_sgst (intra-state)', () => {
  it('splits 18% GST into equal CGST and SGST', () => {
    const result = calcGst({ actual_amount: 10000, qty: 1, gst_rate: 18, gst_type: 'cgst_sgst' })
    // base = 10000, tax = 1800, half = 900
    expect(result.total).toBe(1800)
    expect(result.label).toContain('CGST')
    expect(result.label).toContain('SGST')
  })

  it('handles 5% rate correctly', () => {
    const result = calcGst({ actual_amount: 20000, qty: 1, gst_rate: 5, gst_type: 'cgst_sgst' })
    // base = 20000, tax = 1000, half = 500
    expect(result.total).toBe(1000)
  })

  it('handles odd tax amounts (rounding)', () => {
    const result = calcGst({ actual_amount: 999, qty: 1, gst_rate: 5, gst_type: 'cgst_sgst' })
    // base = 999, tax = round(999 * 5 / 100 * 100) / 100 = round(4995) / 100 = 49.95
    expect(result.total).toBe(49.95)
  })

  it('applies quantity multiplier', () => {
    const result = calcGst({ actual_amount: 5000, qty: 3, gst_rate: 18, gst_type: 'cgst_sgst' })
    // base = 5000 * 3 = 15000, tax = 2700
    expect(result.total).toBe(2700)
  })
})

describe('GST type igst (inter-state)', () => {
  it('applies full IGST at 18%', () => {
    const result = calcGst({ actual_amount: 10000, qty: 1, gst_rate: 18, gst_type: 'igst' })
    expect(result.total).toBe(1800)
    expect(result.label).toContain('IGST')
    expect(result.label).not.toContain('CGST')
  })

  it('applies IGST at 28%', () => {
    const result = calcGst({ actual_amount: 50000, qty: 1, gst_rate: 28, gst_type: 'igst' })
    // 50000 * 28 / 100 = 14000
    expect(result.total).toBe(14000)
  })

  it('applies IGST at 12%', () => {
    const result = calcGst({ actual_amount: 25000, qty: 1, gst_rate: 12, gst_type: 'igst' })
    expect(result.total).toBe(3000)
  })
})

describe('GST with various rates', () => {
  it('handles 0% rate', () => {
    const result = calcGst({ actual_amount: 10000, qty: 1, gst_rate: 0, gst_type: 'igst' })
    expect(result.total).toBe(0)
  })

  it('handles 5% rate', () => {
    const result = calcGst({ actual_amount: 10000, qty: 1, gst_rate: 5, gst_type: 'igst' })
    expect(result.total).toBe(500)
  })

  it('handles 12% rate', () => {
    const result = calcGst({ actual_amount: 10000, qty: 1, gst_rate: 12, gst_type: 'igst' })
    expect(result.total).toBe(1200)
  })

  it('handles 18% rate', () => {
    const result = calcGst({ actual_amount: 10000, qty: 1, gst_rate: 18, gst_type: 'igst' })
    expect(result.total).toBe(1800)
  })

  it('handles 28% rate', () => {
    const result = calcGst({ actual_amount: 10000, qty: 1, gst_rate: 28, gst_type: 'igst' })
    expect(result.total).toBe(2800)
  })
})

describe('GST with quantity multiplier', () => {
  it('multiplies base by qty before calculating tax', () => {
    const result = calcGst({ actual_amount: 1000, qty: 10, gst_rate: 18, gst_type: 'igst' })
    // base = 1000 * 10 = 10000, tax = 1800
    expect(result.total).toBe(1800)
  })

  it('handles qty of 1 (no multiplication effect)', () => {
    const single = calcGst({ actual_amount: 5000, qty: 1, gst_rate: 18, gst_type: 'igst' })
    expect(single.total).toBe(900)
  })

  it('handles fractional amounts with quantity', () => {
    const result = calcGst({ actual_amount: 333, qty: 3, gst_rate: 18, gst_type: 'igst' })
    // base = 333 * 3 = 999, tax = round(999 * 18 / 100 * 100) / 100 = round(17982) / 100 = 179.82
    expect(result.total).toBe(179.82)
  })

  it('cgst_sgst with quantity splits correctly', () => {
    const result = calcGst({ actual_amount: 2000, qty: 5, gst_rate: 12, gst_type: 'cgst_sgst' })
    // base = 10000, tax = 1200, half = 600
    expect(result.total).toBe(1200)
  })

  it('large quantity with high rate', () => {
    const result = calcGst({ actual_amount: 500, qty: 100, gst_rate: 28, gst_type: 'igst' })
    // base = 50000, tax = 14000
    expect(result.total).toBe(14000)
  })
})
