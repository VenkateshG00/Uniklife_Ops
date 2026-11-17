import { useQuery } from '@tanstack/react-query'
import { programHistoryService } from '../services/programHistory'

export interface EditionSummary {
  eventId: string
  eventTitle: string
  venueName?: string
  startDate?: string
  registrations: number
  grossRevenue: number
  netRevenue: number
  adSpend: number
  totalExpenses: number
  grossProfit: number
  margin: number
  cpl: number
  conversionRate: number
  leads: number
  paidRegistrations: number
}

export interface ProgramTotals {
  registrations: number
  grossRevenue: number
  netRevenue: number
  adSpend: number
  totalExpenses: number
  grossProfit: number
  margin: number
  cpl: number
  conversionRate: number
  leads: number
  paidRegistrations: number
}

export interface ProgramComparison {
  events: EditionSummary[]
  totals: ProgramTotals
}

export function useProgramEditions(program: string) {
  return useQuery({
    queryKey: ['program-editions', program],
    queryFn: async () => {
      const events = await programHistoryService.listProgramEvents(program)
      const summaries: EditionSummary[] = await Promise.all(
        events.map(async (ev) => {
          const summary = await programHistoryService.getEditionSummary(ev.id)
          return {
            eventId: ev.id,
            eventTitle: ev.title,
            venueName: ev.venue_name ?? undefined,
            startDate: ev.start_datetime ?? undefined,
            ...summary,
          }
        }),
      )
      return summaries
    },
    enabled: !!program,
  })
}

export function useCrossProgramComparison(year: number) {
  return useQuery({
    queryKey: ['cross-program', year],
    queryFn: async () => {
      const events = await programHistoryService.listAllProgramEvents(year || undefined)
      const programs = new Map<string, EditionSummary[]>()

      await Promise.all(
        events.map(async (ev) => {
          const summary = await programHistoryService.getEditionSummary(ev.id)
          const entry: EditionSummary = {
            eventId: ev.id,
            eventTitle: ev.title,
            venueName: ev.venue_name ?? undefined,
            startDate: ev.start_datetime ?? undefined,
            ...summary,
          }
          const prog = (ev as any)._program ?? ev.category ?? 'Other'
          if (!programs.has(prog)) programs.set(prog, [])
          programs.get(prog)!.push(entry)
        }),
      )

      const result: Record<string, ProgramComparison> = {}

      for (const [prog, editions] of programs) {
        const totals = editions.reduce<ProgramTotals>(
          (acc, e) => ({
            registrations: acc.registrations + e.registrations,
            grossRevenue: acc.grossRevenue + e.grossRevenue,
            netRevenue: acc.netRevenue + e.netRevenue,
            adSpend: acc.adSpend + e.adSpend,
            totalExpenses: acc.totalExpenses + e.totalExpenses,
            grossProfit: acc.grossProfit + e.grossProfit,
            margin: 0,
            cpl: 0,
            conversionRate: 0,
            leads: acc.leads + e.leads,
            paidRegistrations: acc.paidRegistrations + e.paidRegistrations,
          }),
          {
            registrations: 0, grossRevenue: 0, netRevenue: 0,
            adSpend: 0, totalExpenses: 0, grossProfit: 0,
            margin: 0, cpl: 0, conversionRate: 0,
            leads: 0, paidRegistrations: 0,
          },
        )
        totals.margin = totals.netRevenue > 0 ? (totals.grossProfit / totals.netRevenue) * 100 : 0
        totals.cpl = totals.leads > 0 ? totals.adSpend / totals.leads : 0
        totals.conversionRate = totals.leads > 0 ? (totals.paidRegistrations / totals.leads) * 100 : 0
        result[prog] = { events: editions, totals }
      }

      return result
    },
    enabled: true,
  })
}
