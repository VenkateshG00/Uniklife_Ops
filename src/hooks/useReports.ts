import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../services/reports'

export function useEventReadiness() {
  return useQuery({
    queryKey: ['reports', 'event-readiness'],
    queryFn: reportsService.getEventReadiness,
    staleTime: 60_000,
  })
}

export function useIssueItems() {
  return useQuery({
    queryKey: ['reports', 'issues'],
    queryFn: reportsService.getIssueItems,
    staleTime: 60_000,
  })
}

export function useCategoryBreakdown() {
  return useQuery({
    queryKey: ['reports', 'categories'],
    queryFn: reportsService.getCategoryBreakdown,
    staleTime: 60_000,
  })
}

export function useShortageSummary() {
  return useQuery({
    queryKey: ['reports', 'shortages'],
    queryFn: reportsService.getShortageSummary,
    staleTime: 60_000,
  })
}
