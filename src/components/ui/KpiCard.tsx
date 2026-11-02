import { cn } from '../../lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  iconBg?: string
  iconColor?: string
  trend?: { value: number; label: string; positive?: boolean }
  accent?: string
  className?: string
  onClick?: () => void
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg = 'bg-brand-50',
  iconColor = 'text-brand-600',
  trend,
  accent,
  className,
  onClick,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'kpi-card',
        onClick && 'cursor-pointer card-hover',
        accent && `border-l-4 ${accent}`,
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs mt-1 font-medium',
              trend.positive !== false ? 'text-emerald-600' : 'text-red-500'
            )}>
              {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        )}
      </div>
    </div>
  )
}
