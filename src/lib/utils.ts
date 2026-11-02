import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, isAfter, isBefore } from 'date-fns'
import type { ItemStatus, Priority, TaskStatus } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, fmt = 'dd MMM yyyy') {
  try { return format(parseISO(dateStr), fmt) } catch { return dateStr }
}

export function formatDateTime(dateStr: string) {
  try { return format(parseISO(dateStr), 'dd MMM yyyy, h:mm a') } catch { return dateStr }
}

export function formatTime(dateStr: string) {
  try { return format(parseISO(dateStr), 'h:mm a') } catch { return dateStr }
}

export function timeAgo(dateStr: string) {
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) } catch { return '' }
}

export function isOverdue(deadlineStr: string) {
  try { return isBefore(parseISO(deadlineStr), new Date()) } catch { return false }
}

export function isUpcoming(dateStr: string, withinHours = 24) {
  try {
    const d = parseISO(dateStr)
    const now = new Date()
    const limit = new Date(now.getTime() + withinHours * 3600 * 1000)
    return isAfter(d, now) && isBefore(d, limit)
  } catch { return false }
}

export function readinessPctColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600'
  if (pct >= 70) return 'text-amber-600'
  return 'text-red-600'
}

export function readinessPctBarColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

export function itemStatusBadge(status: ItemStatus): string {
  const map: Record<ItemStatus, string> = {
    pending:    'badge-pending',
    packed:     'badge-dispatched',
    dispatched: 'badge-dispatched',
    at_venue:   'badge-delivered',
    done:       'badge-completed',
    issue:      'badge-shortage',
  }
  return map[status] ?? 'badge-pending'
}

export function taskStatusBadge(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    pending:     'badge-pending',
    in_progress: 'badge-inprogress',
    completed:   'badge-completed',
    overdue:     'badge-overdue',
    blocked:     'badge-blocked',
    cancelled:   'badge-cancelled',
  }
  return map[status] ?? 'badge-pending'
}

export function priorityClass(priority: Priority): string {
  const map: Record<Priority, string> = {
    critical: 'priority-critical',
    high:     'priority-high',
    medium:   'priority-medium',
    low:      'priority-low',
  }
  return map[priority]
}

export function labelFromStatus(status: ItemStatus): string {
  const labels: Record<ItemStatus, string> = {
    pending:    'Pending',
    packed:     'Packed',
    dispatched: 'Dispatched',
    at_venue:   'At Venue',
    done:       'Done',
    issue:      'Issue',
  }
  return labels[status] ?? status
}

export function calcReadinessPct(
  total: number,
  completed: number,
  criticalTotal: number,
  criticalDone: number
): number {
  if (total === 0) return 100
  // Weight: 60% overall completion + 40% critical completion
  const overall = (completed / total) * 60
  const critical = criticalTotal > 0 ? (criticalDone / criticalTotal) * 40 : 40
  return Math.round(overall + critical)
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`
}
