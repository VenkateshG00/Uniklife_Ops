import { supabase } from '../lib/supabase'

function inferProgram(title: string): string | null {
  const upper = title.toUpperCase()
  if (upper.startsWith('BOSS')) return 'BOSS'
  if (upper.startsWith('UBM')) return 'UBM'
  if (upper.startsWith('MSGB')) return 'MSGB'
  if (upper.startsWith('VK-M') || upper.startsWith('VKM')) return 'VK-M'
  return null
}

export const programHistoryService = {
  async listProgramEvents(program: string) {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, category, start_datetime, end_datetime, venue_name, organization_id, tour_id, event_tours(program)')
      .order('start_datetime', { ascending: true })
    if (error) throw error

    const all = (data ?? []).map(ev => ({
      ...ev,
      _program: (ev.event_tours as any)?.program || inferProgram(ev.title) || ev.category || 'Other',
    }))

    if (program === 'ALL') return all

    return all.filter(ev => ev._program.toUpperCase() === program.toUpperCase())
  },

  async listAllProgramEvents(year?: number) {
    let query = supabase
      .from('events')
      .select('id, title, category, start_datetime, end_datetime, venue_name, organization_id, tour_id, event_tours(program)')
      .order('start_datetime', { ascending: true })

    if (year) {
      query = query.gte('start_datetime', `${year}-01-01`).lt('start_datetime', `${year + 1}-01-01`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(ev => ({
      ...ev,
      _program: (ev.event_tours as any)?.program || inferProgram(ev.title) || ev.category,
    }))
  },

  async getEventBudgetSummary(eventId: string) {
    const { data, error } = await supabase
      .from('event_budget_items')
      .select('planned_amount, actual_amount')
      .eq('event_id', eventId)
    if (error) throw error
    const planned = (data ?? []).reduce((s, r) => s + Number(r.planned_amount), 0)
    const actual = (data ?? []).reduce((s, r) => s + Number(r.actual_amount), 0)
    return { planned, actual }
  },

  async getEventRevenueSummary(eventId: string) {
    const { data: tiers, error: e1 } = await supabase
      .from('event_revenue_tiers')
      .select('price, seats_sold')
      .eq('event_id', eventId)
    if (e1) throw e1

    const { data: adjs, error: e2 } = await supabase
      .from('event_revenue_adjustments')
      .select('amount')
      .eq('event_id', eventId)
    if (e2) throw e2

    const grossRevenue = (tiers ?? []).reduce((s, r) => s + Number(r.price) * Number(r.seats_sold), 0)
    const totalRegistrations = (tiers ?? []).reduce((s, r) => s + Number(r.seats_sold), 0)
    const adjustments = (adjs ?? []).reduce((s, r) => s + Number(r.amount), 0)
    return { grossRevenue, totalRegistrations, netRevenue: grossRevenue + adjustments, adjustments }
  },

  async getEventAdSummary(eventId: string) {
    const { data, error } = await supabase
      .from('event_ad_campaigns')
      .select('spend, leads_generated, leads_contacted, payment_links_sent, paid_registrations')
      .eq('event_id', eventId)
    if (error) throw error
    return (data ?? []).reduce((acc, r) => ({
      spend: acc.spend + Number(r.spend),
      leads: acc.leads + Number(r.leads_generated),
      contacted: acc.contacted + Number(r.leads_contacted),
      linksSent: acc.linksSent + Number(r.payment_links_sent),
      paidRegs: acc.paidRegs + Number(r.paid_registrations),
    }), { spend: 0, leads: 0, contacted: 0, linksSent: 0, paidRegs: 0 })
  },

  async getEditionSummary(eventId: string) {
    const [budget, revenue, ads] = await Promise.all([
      this.getEventBudgetSummary(eventId),
      this.getEventRevenueSummary(eventId),
      this.getEventAdSummary(eventId),
    ])

    const grossProfit = revenue.netRevenue - budget.actual
    const margin = revenue.netRevenue > 0 ? (grossProfit / revenue.netRevenue) * 100 : 0
    const cpl = ads.leads > 0 ? ads.spend / ads.leads : 0
    const conversionRate = ads.leads > 0 ? (ads.paidRegs / ads.leads) * 100 : 0

    return {
      registrations: revenue.totalRegistrations,
      grossRevenue: revenue.grossRevenue,
      netRevenue: revenue.netRevenue,
      adSpend: ads.spend,
      totalExpenses: budget.actual,
      grossProfit,
      margin,
      cpl,
      conversionRate,
      leads: ads.leads,
      paidRegistrations: ads.paidRegs,
    }
  },
}
