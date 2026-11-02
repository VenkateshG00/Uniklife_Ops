import { cn } from '../../lib/utils'
import type { ItemStatus, TaskStatus, Priority, ShortageStatus } from '../../types'
import { itemStatusBadge, taskStatusBadge, labelFromStatus } from '../../lib/utils'

interface BadgeProps {
  className?: string
  children: React.ReactNode
  variant?: 'completed' | 'inprogress' | 'pending' | 'blocked' | 'shortage' | 'overdue' | 'cancelled' | 'critical' | 'dispatched' | 'delivered' | 'verified' | 'not_applicable'
}

export function Badge({ className, children, variant = 'pending' }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {children}
    </span>
  )
}

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={cn('badge', itemStatusBadge(status))}>
      {labelFromStatus(status)}
    </span>
  )
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn('badge', taskStatusBadge(status))}>
      {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, string> = {
    critical: 'bg-red-600 text-white',
    high:     'bg-orange-100 text-orange-700',
    medium:   'bg-amber-100 text-amber-700',
    low:      'bg-slate-100 text-slate-500',
  }
  return (
    <span className={cn('badge', map[priority])}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

export function ShortageStatusBadge({ status }: { status: ShortageStatus }) {
  const map: Record<ShortageStatus, string> = {
    pending:               'badge-pending',
    under_review:          'badge-inprogress',
    approved:              'badge-inprogress',
    rejected:              'badge-cancelled',
    procurement_assigned:  'badge-dispatched',
    dispatched:            'badge-dispatched',
    received:              'badge-delivered',
    resolved:              'badge-completed',
  }
  return (
    <span className={cn('badge', map[status])}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  )
}
