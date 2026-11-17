import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDateTime, cn, calcReadinessPct, pluralize, readinessPctColor } from '../utils'

describe('formatCurrency', () => {
  it('formats positive amounts in INR with no decimals', () => {
    const result = formatCurrency(150000)
    // Indian numbering: ₹1,50,000
    expect(result).toContain('1,50,000')
  })

  it('formats zero as ₹0', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('formats negative amounts with minus sign', () => {
    const result = formatCurrency(-25000)
    expect(result).toContain('25,000')
  })

  it('rounds decimal amounts to whole numbers', () => {
    const result = formatCurrency(1234.56)
    // maximumFractionDigits: 0 means it rounds
    expect(result).toContain('1,235')
  })

  it('formats large amounts with Indian grouping (lakhs/crores)', () => {
    const result = formatCurrency(10000000)
    // 1,00,00,000 in Indian format
    expect(result).toContain('1,00,00,000')
  })
})

describe('formatDateTime', () => {
  it('formats ISO datetime string to readable format', () => {
    const result = formatDateTime('2024-03-15T14:30:00Z')
    // Format: dd MMM yyyy, h:mm a
    expect(result).toMatch(/15 Mar 2024/)
  })

  it('returns original string on invalid date', () => {
    const result = formatDateTime('not-a-date')
    expect(result).toBe('not-a-date')
  })

  it('handles date-only ISO strings', () => {
    const result = formatDateTime('2024-01-01')
    expect(result).toMatch(/01 Jan 2024/)
  })

  it('formats PM times correctly', () => {
    const result = formatDateTime('2024-06-20T23:00:00Z')
    // Should contain AM or PM depending on timezone
    expect(result).toMatch(/[AP]M/)
  })

  it('handles empty string gracefully', () => {
    const result = formatDateTime('')
    expect(result).toBe('')
  })
})

describe('cn (class name merge)', () => {
  it('merges simple class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    // tailwind-merge should keep the last conflicting utility
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('merges arrays of class names', () => {
    expect(cn(['px-2', 'py-1'], 'mx-auto')).toBe('px-2 py-1 mx-auto')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})

describe('calcReadinessPct', () => {
  it('returns 100% when total is zero (nothing to do)', () => {
    expect(calcReadinessPct(0, 0, 0, 0)).toBe(100)
  })

  it('calculates weighted readiness: 60% overall + 40% critical', () => {
    // 10 total, 5 done = 50% overall → 30 points
    // 2 critical, 1 done = 50% critical → 20 points
    // total = 50 → rounds to 50
    expect(calcReadinessPct(10, 5, 2, 1)).toBe(50)
  })

  it('gives full critical weight when no critical items exist', () => {
    // 10 total, 10 done = 100% overall → 60 points
    // 0 critical → full 40 points
    expect(calcReadinessPct(10, 10, 0, 0)).toBe(100)
  })

  it('returns rounded result', () => {
    // 3 total, 1 done = 33.3% overall → 20 points
    // 1 critical, 1 done = 100% critical → 40 points
    // total = 60
    expect(calcReadinessPct(3, 1, 1, 1)).toBe(60)
  })

  it('handles all critical items done with partial overall', () => {
    // 10 total, 8 done = 80% overall → 48 points
    // 5 critical, 5 done = 100% critical → 40 points
    // total = 88
    expect(calcReadinessPct(10, 8, 5, 5)).toBe(88)
  })
})

describe('pluralize', () => {
  it('returns singular for count of 1', () => {
    expect(pluralize(1, 'item')).toBe('1 item')
  })

  it('returns plural with s suffix for count > 1', () => {
    expect(pluralize(5, 'item')).toBe('5 items')
  })

  it('uses custom plural form', () => {
    expect(pluralize(3, 'person', 'people')).toBe('3 people')
  })

  it('returns plural for zero count', () => {
    expect(pluralize(0, 'task')).toBe('0 tasks')
  })

  it('uses custom plural for count 0', () => {
    expect(pluralize(0, 'child', 'children')).toBe('0 children')
  })
})

describe('readinessPctColor', () => {
  it('returns emerald for 90% and above', () => {
    expect(readinessPctColor(90)).toBe('text-emerald-600')
    expect(readinessPctColor(100)).toBe('text-emerald-600')
  })

  it('returns amber for 70-89%', () => {
    expect(readinessPctColor(70)).toBe('text-amber-600')
    expect(readinessPctColor(89)).toBe('text-amber-600')
  })

  it('returns red for below 70%', () => {
    expect(readinessPctColor(69)).toBe('text-red-600')
    expect(readinessPctColor(0)).toBe('text-red-600')
  })
})
