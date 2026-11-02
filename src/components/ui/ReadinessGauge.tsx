import { cn, readinessPctColor, readinessPctBarColor } from '../../lib/utils'

interface ReadinessGaugeProps {
  pct: number
  criticalPct?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ReadinessGauge({ pct, criticalPct, size = 'md', showLabel = true, className }: ReadinessGaugeProps) {
  const clampedPct = Math.min(100, Math.max(0, Math.round(pct)))

  const sizes = {
    sm:  { radius: 28, stroke: 5,  text: 'text-xl' },
    md:  { radius: 45, stroke: 7,  text: 'text-3xl' },
    lg:  { radius: 60, stroke: 9,  text: 'text-4xl' },
  }

  const { radius, stroke, text } = sizes[size]
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedPct / 100) * circumference
  const svgSize = (radius + stroke + 4) * 2

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={clampedPct >= 90 ? '#10b981' : clampedPct >= 70 ? '#f59e0b' : '#ef4444'}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className={cn('font-bold leading-none', text, readinessPctColor(clampedPct))}>
            {clampedPct}%
          </span>
          {showLabel && size !== 'sm' && (
            <span className="text-[10px] text-slate-400 mt-0.5">Readiness</span>
          )}
        </div>
      </div>

      {criticalPct !== undefined && (
        <div className="text-center">
          <div className="text-xs text-slate-500">
            Critical: <span className={cn('font-bold', readinessPctColor(criticalPct))}>{Math.round(criticalPct)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function ReadinessBar({ pct, className }: { pct: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, Math.round(pct)))
  return (
    <div className={cn('progress-bar w-full', className)}>
      <div
        className={cn('progress-bar-fill', readinessPctBarColor(clamped))}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
