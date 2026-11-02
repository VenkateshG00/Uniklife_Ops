import { formatTime, timeAgo } from '../../lib/utils'
import { cn } from '../../lib/utils'
import type { EventActivityLog } from '../../types'

const actionColors: Record<string, string> = {
  completed:  'bg-emerald-500',
  verified:   'bg-emerald-500',
  shortage:   'bg-red-500',
  approved:   'bg-brand-600',
  dispatched: 'bg-indigo-500',
  received:   'bg-teal-500',
  assigned:   'bg-purple-500',
  overdue:    'bg-amber-500',
  default:    'bg-slate-400',
}

function dotColor(action: string): string {
  const lower = action.toLowerCase()
  for (const [key, color] of Object.entries(actionColors)) {
    if (lower.includes(key)) return color
  }
  return actionColors.default
}

interface ActivityFeedProps {
  items: Pick<EventActivityLog, 'id' | 'actor_name' | 'action' | 'created_at' | 'entity_name'>[]
  maxItems?: number
  className?: string
  compact?: boolean
}

export function ActivityFeed({ items, maxItems = 20, className, compact: _compact }: ActivityFeedProps) {
  const display = items.slice(0, maxItems)

  if (display.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No activity yet
      </div>
    )
  }

  return (
    <div className={cn('divide-y divide-slate-50', className)}>
      {display.map((item) => (
        <div key={item.id} className="activity-item">
          <div className={cn('activity-dot shrink-0', dotColor(item.action))} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 leading-snug">
              <span className="font-semibold text-slate-900">{item.actor_name}</span>
              {' '}{item.action}
              {item.entity_name && (
                <span className="text-slate-500"> — {item.entity_name}</span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{timeAgo(item.created_at)}</p>
          </div>
          <span className="text-xs text-slate-400 shrink-0 ml-2">
            {formatTime(item.created_at)}
          </span>
        </div>
      ))}
    </div>
  )
}
