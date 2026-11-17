import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../components/layout/Header'
import {
  useProgramEditions,
  useCrossProgramComparison,
} from '../../hooks/useProgramHistory'
import { formatCurrency, cn } from '../../lib/utils'
import { exportToExcel } from '../../lib/exportExcel'
import type { ProgramName } from '../../types'
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Loader2,
  IndianRupee,
  Target,
  Percent,
  Download,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'

const PROGRAMS: ProgramName[] = ['BOSS', 'UBM', 'MSGB', 'VK-M']
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

type Tab = 'editions' | 'comparison'

const PROGRAM_COLORS: Record<string, string> = {
  BOSS: '#6366f1',
  UBM: '#10b981',
  MSGB: '#f59e0b',
  'VK-M': '#ef4444',
}
const FALLBACK_COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6']
function getColor(program: string, idx = 0) {
  return PROGRAM_COLORS[program] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
}

function pctStr(v: number) {
  return `${v.toFixed(1)}%`
}

function growthPct(prev: number, curr: number) {
  if (prev === 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / prev) * 100
}

function GrowthArrow({ prev, curr }: { prev: number; curr: number }) {
  const g = growthPct(prev, curr)
  if (g === 0) return <span className="text-slate-400 text-xs">—</span>
  return g > 0 ? (
    <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600">
      <TrendingUp className="w-3 h-3" /> +{g.toFixed(1)}%
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5 text-xs text-red-500">
      <TrendingDown className="w-3 h-3" /> {g.toFixed(1)}%
    </span>
  )
}

function EditionHistoryTab({ program }: { program: string }) {
  const { data: editions = [], isLoading } = useProgramEditions(program)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading editions…
      </div>
    )
  }

  if (editions.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No events found{program !== 'ALL' ? ` for ${program}` : ''}</p>
      </div>
    )
  }

  const chartData = editions.map(e => ({
    name: e.eventTitle,
    Revenue: e.netRevenue,
    Expenses: e.totalExpenses,
    'Margin %': e.margin,
  }))

  const first = editions[0]
  const last = editions[editions.length - 1]
  const growthMetrics = [
    { label: 'Revenue', growth: growthPct(first.netRevenue, last.netRevenue) },
    { label: 'Registrations', growth: growthPct(first.registrations, last.registrations) },
    { label: 'Profit', growth: growthPct(first.grossProfit, last.grossProfit) },
    { label: 'Conversion', growth: growthPct(first.conversionRate, last.conversionRate) },
  ]

  async function exportEditions() {
    const rows = editions.map(e => ({
      Event: e.eventTitle,
      Venue: e.venueName ?? '',
      Date: e.startDate ?? '',
      Registrations: e.registrations,
      'Gross Revenue (₹)': e.grossRevenue,
      'Net Revenue (₹)': e.netRevenue,
      'Expenses (₹)': e.totalExpenses,
      'Profit (₹)': e.grossProfit,
      'Margin %': Number(e.margin.toFixed(1)),
      'CPL (₹)': Number(e.cpl.toFixed(2)),
      'Conversion %': Number(e.conversionRate.toFixed(1)),
    }))
    await exportToExcel(rows, 'program-history-export', 'Edition History')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={exportEditions} className="btn btn-secondary btn-sm" title="Export to Excel">
          <Download className="w-4 h-4" /> Excel
        </button>
      </div>
      {/* Trend Chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Edition Trend{program !== 'ALL' ? ` — ${program}` : ''}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
            <Tooltip
              formatter={(value, name) =>
                name === 'Margin %' ? `${Number(value).toFixed(1)}%` : formatCurrency(Number(value))
              }
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            <Line yAxisId="left" type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="Margin %" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Edition Comparison Table */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Edition Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Edition</th>
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">Venue</th>
                <th className="pb-2 pr-4 font-medium text-right">Registrations</th>
                <th className="pb-2 pr-4 font-medium text-right">Revenue</th>
                <th className="pb-2 pr-4 font-medium text-right">Ad Spend</th>
                <th className="pb-2 pr-4 font-medium text-right">Gross Profit</th>
                <th className="pb-2 pr-4 font-medium text-right">Margin %</th>
                <th className="pb-2 pr-4 font-medium text-right">CPL</th>
                <th className="pb-2 font-medium text-right">Conversion %</th>
              </tr>
            </thead>
            <tbody>
              {editions.map((e, i) => {
                const prev = i > 0 ? editions[i - 1] : null
                return (
                  <tr key={e.eventId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{e.eventTitle}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{e.startDate}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{e.venueName || '—'}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <span>{e.registrations}</span>
                      {prev && <div><GrowthArrow prev={prev.registrations} curr={e.registrations} /></div>}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span>{formatCurrency(e.netRevenue)}</span>
                      {prev && <div><GrowthArrow prev={prev.netRevenue} curr={e.netRevenue} /></div>}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span>{formatCurrency(e.adSpend)}</span>
                      {prev && <div><GrowthArrow prev={prev.adSpend} curr={e.adSpend} /></div>}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className={e.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                        {formatCurrency(e.grossProfit)}
                      </span>
                      {prev && <div><GrowthArrow prev={prev.grossProfit} curr={e.grossProfit} /></div>}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className={e.margin >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                        {pctStr(e.margin)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">{formatCurrency(e.cpl)}</td>
                    <td className="py-2.5 text-right">{pctStr(e.conversionRate)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Growth Indicators */}
      {editions.length >= 2 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Overall Growth ({first.eventTitle} → {last.eventTitle})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {growthMetrics.map(m => (
              <div key={m.label} className="text-center p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                <p className={cn('text-lg font-bold', m.growth >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {m.growth >= 0 ? '+' : ''}{m.growth.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CrossProgramTab({ year }: { year: number }) {
  const { data: comparison, isLoading } = useCrossProgramComparison(year)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading comparison…
      </div>
    )
  }

  if (!comparison || Object.keys(comparison).length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No events found for {year}</p>
      </div>
    )
  }

  const programs = Object.keys(comparison)
  const rows = programs.map(p => ({ program: p as ProgramName, ...comparison[p].totals, eventCount: comparison[p].events.length }))

  const bestOf = (key: keyof typeof rows[0], higherIsBetter = true) => {
    const vals = rows.map(r => r[key] as number)
    return higherIsBetter ? Math.max(...vals) : Math.min(...vals)
  }
  const bestRevenue = bestOf('grossRevenue')
  const bestProfit = bestOf('grossProfit')
  const bestMargin = bestOf('margin')
  const bestCPL = bestOf('cpl', false)
  const bestConversion = bestOf('conversionRate')

  const isBest = (val: number, best: number) => val === best && val !== 0

  const chartData = programs.map(p => ({
    name: p,
    Revenue: comparison[p]?.totals.netRevenue ?? 0,
    Expenses: comparison[p]?.totals.totalExpenses ?? 0,
    Profit: comparison[p]?.totals.grossProfit ?? 0,
  }))

  const rankings = [
    { label: 'Best Revenue', metric: programs.reduce((best, p) => (comparison[p]?.totals.grossRevenue ?? 0) > (comparison[best]?.totals.grossRevenue ?? 0) ? p : best, programs[0]), value: (p: string) => formatCurrency(comparison[p]?.totals.grossRevenue ?? 0), icon: IndianRupee },
    { label: 'Best Margin', metric: programs.reduce((best, p) => (comparison[p]?.totals.margin ?? 0) > (comparison[best]?.totals.margin ?? 0) ? p : best, programs[0]), value: (p: string) => pctStr(comparison[p]?.totals.margin ?? 0), icon: Percent },
    { label: 'Best CPL', metric: programs.reduce((best, p) => { const v = comparison[p]?.totals.cpl ?? Infinity; const bv = comparison[best]?.totals.cpl ?? Infinity; return v > 0 && v < bv ? p : best }, programs[0]), value: (p: string) => formatCurrency(comparison[p]?.totals.cpl ?? 0), icon: Target },
    { label: 'Best Conversion', metric: programs.reduce((best, p) => (comparison[p]?.totals.conversionRate ?? 0) > (comparison[best]?.totals.conversionRate ?? 0) ? p : best, programs[0]), value: (p: string) => pctStr(comparison[p]?.totals.conversionRate ?? 0), icon: TrendingUp },
  ]

  async function exportComparison() {
    if (!comparison) return
    const exportRows = programs.map(p => {
      const t = comparison[p]?.totals
      return {
        Program: p,
        Events: comparison[p]?.events.length ?? 0,
        Registrations: t?.registrations ?? 0,
        'Revenue (₹)': t?.netRevenue ?? 0,
        'Expenses (₹)': t?.totalExpenses ?? 0,
        'Profit (₹)': t?.grossProfit ?? 0,
        'Margin %': Number((t?.margin ?? 0).toFixed(1)),
        'CPL (₹)': Number((t?.cpl ?? 0).toFixed(2)),
        'Conversion %': Number((t?.conversionRate ?? 0).toFixed(1)),
      }
    })
    await exportToExcel(exportRows, 'program-comparison-export', 'Program Comparison')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={exportComparison} className="btn btn-secondary btn-sm" title="Export to Excel">
          <Download className="w-4 h-4" /> Excel
        </button>
      </div>
      {/* Program Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {programs.map((p, i) => {
          const t = comparison[p].totals
          return (
            <div key={p} className="card p-4" style={{ borderTop: `3px solid ${getColor(p, i)}` }}>
              <h4 className="font-semibold text-slate-900 mb-3">{p}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Revenue</span>
                  <span className="font-medium">{formatCurrency(t.netRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Profit</span>
                  <span className={cn('font-medium', t.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {formatCurrency(t.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Margin</span>
                  <span className={cn('font-medium', t.margin >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {pctStr(t.margin)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registrations</span>
                  <span className="font-medium">{t.registrations}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Bar Chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue vs Expenses vs Profit — {year}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Table */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Program Comparison Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Program</th>
                <th className="pb-2 pr-4 font-medium text-right">Events</th>
                <th className="pb-2 pr-4 font-medium text-right">Registrations</th>
                <th className="pb-2 pr-4 font-medium text-right">Revenue</th>
                <th className="pb-2 pr-4 font-medium text-right">Ad Spend</th>
                <th className="pb-2 pr-4 font-medium text-right">Profit</th>
                <th className="pb-2 pr-4 font-medium text-right">Margin %</th>
                <th className="pb-2 pr-4 font-medium text-right">CPL</th>
                <th className="pb-2 font-medium text-right">Conversion %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.program} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 pr-4">
                    <span className="font-medium text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor(r.program) }} />
                      {r.program}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">{r.eventCount}</td>
                  <td className="py-2.5 pr-4 text-right">{r.registrations}</td>
                  <td className={cn('py-2.5 pr-4 text-right', isBest(r.grossRevenue, bestRevenue) && 'bg-emerald-50 font-semibold text-emerald-700')}>
                    {formatCurrency(r.grossRevenue)}
                  </td>
                  <td className="py-2.5 pr-4 text-right">{formatCurrency(r.adSpend)}</td>
                  <td className={cn('py-2.5 pr-4 text-right', isBest(r.grossProfit, bestProfit) && 'bg-emerald-50 font-semibold text-emerald-700')}>
                    {formatCurrency(r.grossProfit)}
                  </td>
                  <td className={cn('py-2.5 pr-4 text-right', isBest(r.margin, bestMargin) && 'bg-emerald-50 font-semibold text-emerald-700')}>
                    {pctStr(r.margin)}
                  </td>
                  <td className={cn('py-2.5 pr-4 text-right', isBest(r.cpl, bestCPL) && 'bg-emerald-50 font-semibold text-emerald-700')}>
                    {formatCurrency(r.cpl)}
                  </td>
                  <td className={cn('py-2.5 text-right', isBest(r.conversionRate, bestConversion) && 'bg-emerald-50 font-semibold text-emerald-700')}>
                    {pctStr(r.conversionRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rankings */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Efficiency Rankings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {rankings.map(r => {
            const Icon = r.icon
            return (
              <div key={r.label} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="p-2 rounded-lg bg-white shadow-sm">
                  <Icon className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{r.label}</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {r.metric} <span className="font-normal text-slate-500">({r.value(r.metric)})</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ProgramHistoryPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('editions')
  const [program, setProgram] = useState<string>('ALL')
  const [year, setYear] = useState(0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Program History & Comparison</h1>
            <p className="text-sm text-slate-500">Compare editions and programs over time</p>
          </div>
        </div>

        {/* Controls */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Tab switcher */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setTab('editions')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  tab === 'editions' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Edition History
              </button>
              <button
                onClick={() => setTab('comparison')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  tab === 'comparison' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Program Comparison
              </button>
            </div>

            {/* Context selector */}
            <div className="ml-auto">
              {tab === 'editions' ? (
                <select
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={program}
                  onChange={e => setProgram(e.target.value)}
                >
                  <option value="ALL">All Events</option>
                  {PROGRAMS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <select
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                >
                  <option value={0}>All Years</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Tab content */}
        {tab === 'editions' ? (
          <EditionHistoryTab program={program} />
        ) : (
          <CrossProgramTab year={year} />
        )}
      </div>
    </div>
  )
}
