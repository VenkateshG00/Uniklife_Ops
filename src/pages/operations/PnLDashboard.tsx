import { Loader2, TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3, Info, Target, Download } from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import { exportToExcel } from '../../lib/exportExcel'
import { usePnL } from '../../hooks/usePnL'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const CATEGORY_COLORS: Record<string, string> = {
  ad_spend: '#3b82f6',
  venue_facilities: '#a855f7',
  travel_stay: '#f59e0b',
  gifts_merchandise: '#ec4899',
  inventory: '#14b8a6',
  other: '#64748b',
}

const CATEGORY_LABELS: Record<string, string> = {
  ad_spend: 'Ad Spend',
  venue_facilities: 'Venue & Facilities',
  travel_stay: 'Travel & Stay',
  gifts_merchandise: 'Gifts & Merch',
  inventory: 'Inventory',
  other: 'Other',
}

const BRAND_COLOR = '#6366f1'

interface Props {
  eventId: string
}

function SummaryCards({ netRevenue, totalActual, netPnL, margin }: {
  netRevenue: number; totalActual: number; netPnL: number; margin: number
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Net Revenue</p>
        <p className={cn('text-lg font-bold', netRevenue >= 0 ? 'text-emerald-600' : 'text-red-600')}>
          {formatCurrency(netRevenue)}
        </p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total Expenses</p>
        <p className="text-lg font-bold text-slate-900">{formatCurrency(totalActual)}</p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Net P&L</p>
        <p className={cn('text-lg font-bold', netPnL >= 0 ? 'text-emerald-600' : 'text-red-600')}>
          {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL)}
        </p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Margin</p>
        <div className="flex items-center gap-1.5">
          <p className={cn('text-lg font-bold', margin >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {margin.toFixed(1)}%
          </p>
          {margin >= 0
            ? <TrendingUp className="w-4 h-4 text-emerald-500" />
            : <TrendingDown className="w-4 h-4 text-red-500" />}
        </div>
      </div>
    </div>
  )
}

function RevenueVsExpensesBar({ netRevenue, totalActual }: { netRevenue: number; totalActual: number }) {
  const max = Math.max(netRevenue, totalActual, 1)
  const revPct = (netRevenue / max) * 100
  const expPct = (totalActual / max) * 100

  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-brand-500" /> Revenue vs Expenses
      </h3>
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-700">Net Revenue</span>
            <span className="tabular-nums font-medium text-slate-700">{formatCurrency(netRevenue)}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.max(revPct, 0)}%` }} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-red-700">Total Expenses</span>
            <span className="tabular-nums font-medium text-slate-700">{formatCurrency(totalActual)}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.max(expPct, 0)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ExpenseBreakdown({ expensesByCategory }: {
  expensesByCategory: { category: string; planned: number; actual: number }[]
}) {
  const pieData = expensesByCategory
    .filter(c => c.actual > 0)
    .map(c => ({ name: CATEGORY_LABELS[c.category] ?? c.category, value: c.actual, key: c.category }))

  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-amber-500" /> Expense Breakdown
      </h3>
      {pieData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
              fontSize={11}
            >
              {pieData.map(entry => (
                <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key] ?? '#64748b'} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center py-12 text-slate-400 text-sm">No expenses recorded</div>
      )}
      {expensesByCategory.length > 0 && (
        <div className="table-scroll">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wide">
                <th className="text-left px-2 py-1.5">Category</th>
                <th className="text-right px-2 py-1.5">Planned</th>
                <th className="text-right px-2 py-1.5">Actual</th>
                <th className="text-right px-2 py-1.5">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expensesByCategory.map(c => {
                const variance = c.planned - c.actual
                return (
                  <tr key={c.category}>
                    <td className="px-2 py-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.category] ?? '#64748b' }} />
                      <span className="text-slate-700 font-medium">{CATEGORY_LABELS[c.category] ?? c.category}</span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">{formatCurrency(c.planned)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-900 font-medium">{formatCurrency(c.actual)}</td>
                    <td className={cn('px-2 py-1.5 text-right tabular-nums font-medium', variance < 0 ? 'text-red-600' : 'text-emerald-600')}>
                      {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RevenueByTier({ revenueByTier }: {
  revenueByTier: { tierName: string; revenue: number; price: number; sold: number }[]
}) {
  const totalSold = revenueByTier.reduce((s, t) => s + t.sold, 0)

  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-brand-500" /> Revenue by Tier
      </h3>
      {revenueByTier.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={revenueByTier} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="tierName" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} labelStyle={{ fontWeight: 600 }} />
            <Bar dataKey="revenue" fill={BRAND_COLOR} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center py-12 text-slate-400 text-sm">No tiers set</div>
      )}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase">Total Sold</p>
          <p className="text-sm font-bold text-brand-600 tabular-nums">{totalSold}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase">Tiers</p>
          <p className="text-sm font-bold text-slate-900 tabular-nums">{revenueByTier.length}</p>
        </div>
      </div>
    </div>
  )
}

function PnLStatement({ grossRevenue, totalAdjustments, netRevenue, expensesByCategory, totalActual, netPnL }: {
  grossRevenue: number; totalAdjustments: number; netRevenue: number
  expensesByCategory: { category: string; actual: number }[]
  totalActual: number; netPnL: number
}) {
  return (
    <div className="card p-5 space-y-1">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-slate-500" /> P&L Statement
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {/* Revenue section */}
          <tr>
            <td className="py-1.5 font-bold text-slate-800 uppercase text-xs tracking-wide" colSpan={2}>Revenue</td>
          </tr>
          <tr>
            <td className="py-1 pl-4 text-slate-600">Ticket Sales (gross)</td>
            <td className="py-1 text-right tabular-nums text-slate-900 font-medium">{formatCurrency(grossRevenue)}</td>
          </tr>
          <tr>
            <td className="py-1 pl-4 text-slate-600">Adjustments</td>
            <td className={cn('py-1 text-right tabular-nums font-medium', totalAdjustments < 0 ? 'text-red-600' : 'text-emerald-600')}>
              {totalAdjustments >= 0 ? '+' : ''}{formatCurrency(totalAdjustments)}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="py-0.5"><div className="border-t border-slate-200" /></td>
          </tr>
          <tr>
            <td className="py-1.5 pl-4 font-semibold text-slate-800">Net Revenue</td>
            <td className={cn('py-1.5 text-right tabular-nums font-bold', netRevenue >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {formatCurrency(netRevenue)}
            </td>
          </tr>

          {/* Spacer */}
          <tr><td className="py-2" colSpan={2} /></tr>

          {/* Expenses section */}
          <tr>
            <td className="py-1.5 font-bold text-slate-800 uppercase text-xs tracking-wide" colSpan={2}>Expenses</td>
          </tr>
          {expensesByCategory.filter(c => c.actual > 0).map(c => (
            <tr key={c.category}>
              <td className="py-1 pl-4 text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.category] ?? '#64748b' }} />
                {CATEGORY_LABELS[c.category] ?? c.category}
              </td>
              <td className="py-1 text-right tabular-nums text-slate-900 font-medium">{formatCurrency(c.actual)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className="py-0.5"><div className="border-t border-slate-200" /></td>
          </tr>
          <tr>
            <td className="py-1.5 pl-4 font-semibold text-slate-800">Total Expenses</td>
            <td className="py-1.5 text-right tabular-nums font-bold text-slate-900">{formatCurrency(totalActual)}</td>
          </tr>

          {/* Net P&L */}
          <tr>
            <td colSpan={2} className="py-1"><div className="border-t-2 border-slate-300" /></td>
          </tr>
          <tr>
            <td className="py-2 font-bold text-slate-900 text-base">{netPnL >= 0 ? 'Net Profit' : 'Net Loss'}</td>
            <td className={cn('py-2 text-right tabular-nums font-bold text-base', netPnL >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function PnLDashboard({ eventId }: Props) {
  const pnl = usePnL(eventId)

  if (pnl.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading P&L…
      </div>
    )
  }

  if (pnl.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500 gap-2">
        <p className="text-sm font-medium">Failed to load P&L data</p>
        <button onClick={() => window.location.reload()} className="text-xs text-brand-600 hover:underline">Retry</button>
      </div>
    )
  }

  async function exportPnL() {
    const rows: Record<string, unknown>[] = [
      { Line: 'REVENUE', Amount: null },
      { Line: 'Ticket Sales (gross)', Amount: pnl.grossRevenue },
      { Line: 'Adjustments', Amount: pnl.totalAdjustments },
      { Line: 'Net Revenue', Amount: pnl.netRevenue },
      { Line: '', Amount: null },
      { Line: 'EXPENSES', Amount: null },
      ...pnl.expensesByCategory.filter(c => c.actual > 0).map(c => ({
        Line: CATEGORY_LABELS[c.category] ?? c.category,
        Amount: c.actual,
      })),
      { Line: 'Total Expenses', Amount: pnl.totalActual },
      { Line: '', Amount: null },
      { Line: pnl.netPnL >= 0 ? 'NET PROFIT' : 'NET LOSS', Amount: pnl.netPnL },
      { Line: 'Margin %', Amount: Number(pnl.margin.toFixed(1)) },
    ]
    await exportToExcel(rows, 'pnl-export', 'P&L')
  }

  return (
    <div className="space-y-4">
      {(pnl.netRevenue !== 0 || pnl.totalActual !== 0) && (
        <div className="flex items-center justify-end">
          <button onClick={exportPnL} className="btn btn-secondary btn-sm" title="Export P&L to Excel">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      )}
      <SummaryCards
        netRevenue={pnl.netRevenue}
        totalActual={pnl.totalActual}
        netPnL={pnl.netPnL}
        margin={pnl.margin}
      />

      {pnl.avgTicketPrice > 0 && (
        <div className="card p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-600">Break-even Point</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="tabular-nums font-bold text-slate-900">{pnl.breakEvenRegistrations} registrations</span>
            <span className="text-slate-400">@ avg {formatCurrency(pnl.avgTicketPrice)}/ticket</span>
            {pnl.totalRegistrations >= pnl.breakEvenRegistrations
              ? <span className="text-emerald-600 font-semibold">Reached</span>
              : <span className="text-amber-600 font-semibold">{pnl.breakEvenRegistrations - pnl.totalRegistrations} more needed</span>
            }
          </div>
        </div>
      )}

      <RevenueVsExpensesBar netRevenue={pnl.netRevenue} totalActual={pnl.totalActual} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpenseBreakdown expensesByCategory={pnl.expensesByCategory} />
        <RevenueByTier revenueByTier={pnl.revenueByTier} />
      </div>

      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Expenses are sourced from the <strong>Budget</strong> panel. Ad spend tracked under Lead Funnel is for campaign analytics only and is not counted here to avoid double-counting.</span>
      </div>

      <PnLStatement
        grossRevenue={pnl.grossRevenue}
        totalAdjustments={pnl.totalAdjustments}
        netRevenue={pnl.netRevenue}
        expensesByCategory={pnl.expensesByCategory}
        totalActual={pnl.totalActual}
        netPnL={pnl.netPnL}
      />
    </div>
  )
}
