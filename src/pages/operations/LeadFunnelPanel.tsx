import { useState } from 'react'
import {
  Plus, Trash2, Edit3, X, Check, Loader2,
  Megaphone, Target, Users, CreditCard, TrendingUp, BarChart3, Download,
} from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import { exportToExcel } from '../../lib/exportExcel'
import {
  useAdCampaigns, useCreateAdCampaign, useUpdateAdCampaign, useDeleteAdCampaign,
} from '../../hooks/useLeadFunnel'
import type { AdPlatform, EventAdCampaign } from '../../types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const PLATFORMS: { key: AdPlatform; label: string; color: string }[] = [
  { key: 'meta',     label: 'Meta',     color: '#1877F2' },
  { key: 'google',   label: 'Google',   color: '#EA4335' },
  { key: 'youtube',  label: 'YouTube',  color: '#FF0000' },
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  { key: 'organic',  label: 'Organic',  color: '#64748b' },
  { key: 'referral', label: 'Referral', color: '#8b5cf6' },
  { key: 'other',    label: 'Other',    color: '#94a3b8' },
]

const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map(p => [p.key, p]))

interface Props {
  eventId: string
  isAdmin: boolean
}

const emptyForm = {
  campaign_name: '',
  platform: 'meta' as AdPlatform,
  spend: 0,
  leads_generated: 0,
  leads_contacted: 0,
  payment_links_sent: 0,
  paid_registrations: 0,
  start_date: '',
  end_date: '',
  notes: '',
}

function FunnelSummaryCards({ totalSpend, totalLeads, cpl, paidRegs, convRate, cpr }: {
  totalSpend: number; totalLeads: number; cpl: number
  paidRegs: number; convRate: number; cpr: number
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total Ad Spend</p>
        <p className="text-lg font-bold text-slate-900">{formatCurrency(totalSpend)}</p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total Leads</p>
        <p className="text-lg font-bold text-brand-600">{totalLeads}</p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Cost Per Lead</p>
        <p className="text-lg font-bold text-amber-600">{formatCurrency(cpl)}</p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Paid Registrations</p>
        <p className="text-lg font-bold text-emerald-600">{paidRegs}</p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Conversion Rate</p>
        <p className="text-lg font-bold text-brand-600">{convRate.toFixed(1)}%</p>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Cost Per Registration</p>
        <p className="text-lg font-bold text-amber-600">{formatCurrency(cpr)}</p>
      </div>
    </div>
  )
}

function FunnelVisualization({ stages }: {
  stages: { label: string; count: number; pct: number }[]
}) {
  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <Target className="w-4 h-4 text-brand-500" /> Lead Funnel
      </h3>
      <div className="space-y-2">
        {stages.map((stage, i) => (
          <div key={stage.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{stage.label}</span>
              <span className="tabular-nums text-slate-500">
                {stage.count}{' '}
                <span className="text-slate-400">({stage.pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden flex items-center">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-500' : i === 2 ? 'bg-violet-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.max(stage.pct, stage.count > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlatformComparison({ campaigns }: { campaigns: EventAdCampaign[] }) {
  const byPlatform = new Map<string, { spend: number; leads: number; paid: number }>()
  for (const c of campaigns) {
    const entry = byPlatform.get(c.platform) ?? { spend: 0, leads: 0, paid: 0 }
    entry.spend += Number(c.spend)
    entry.leads += c.leads_generated
    entry.paid += c.paid_registrations
    byPlatform.set(c.platform, entry)
  }
  const chartData = Array.from(byPlatform.entries()).map(([platform, v]) => ({
    platform: PLATFORM_MAP[platform]?.label ?? platform,
    Spend: v.spend,
    Leads: v.leads,
    Paid: v.paid,
  }))

  if (chartData.length === 0) return null

  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-brand-500" /> Platform Comparison
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <XAxis dataKey="platform" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip formatter={(value: number, name: string) => [name === 'Spend' ? formatCurrency(value) : value, name]} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
          <Bar dataKey="Spend" yAxisId="left" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="Leads" yAxisId="right" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="Paid" yAxisId="right" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LeadFunnelPanel({ eventId, isAdmin }: Props) {
  const { data: campaigns = [], isLoading, isError, refetch } = useAdCampaigns(eventId)
  const createCampaign = useCreateAdCampaign(eventId)
  const updateCampaign = useUpdateAdCampaign(eventId)
  const deleteCampaign = useDeleteAdCampaign(eventId)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend), 0)
  const totalLeads = campaigns.reduce((s, c) => s + c.leads_generated, 0)
  const totalContacted = campaigns.reduce((s, c) => s + c.leads_contacted, 0)
  const totalLinksSent = campaigns.reduce((s, c) => s + c.payment_links_sent, 0)
  const totalPaid = campaigns.reduce((s, c) => s + c.paid_registrations, 0)

  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0
  const convRate = totalLeads > 0 ? (totalPaid / totalLeads) * 100 : 0
  const cpr = totalPaid > 0 ? totalSpend / totalPaid : 0

  const funnelStages = [
    { label: 'Leads Generated', count: totalLeads, pct: 100 },
    { label: 'Leads Contacted', count: totalContacted, pct: totalLeads > 0 ? (totalContacted / totalLeads) * 100 : 0 },
    { label: 'Payment Links Sent', count: totalLinksSent, pct: totalLeads > 0 ? (totalLinksSent / totalLeads) * 100 : 0 },
    { label: 'Paid Registrations', count: totalPaid, pct: totalLeads > 0 ? (totalPaid / totalLeads) * 100 : 0 },
  ]

  function handleSubmit() {
    if (!form.campaign_name.trim()) return
    const payload = {
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes || null,
    }
    if (editingId) {
      updateCampaign.mutate({ id: editingId, payload }, {
        onSuccess: () => { setEditingId(null); setShowForm(false); setForm(emptyForm) },
      })
    } else {
      createCampaign.mutate(payload, {
        onSuccess: () => { setShowForm(false); setForm(emptyForm) },
      })
    }
  }

  function startEdit(c: EventAdCampaign) {
    setEditingId(c.id)
    setForm({
      campaign_name: c.campaign_name,
      platform: c.platform,
      spend: Number(c.spend),
      leads_generated: c.leads_generated,
      leads_contacted: c.leads_contacted,
      payment_links_sent: c.payment_links_sent,
      paid_registrations: c.paid_registrations,
      start_date: c.start_date ?? '',
      end_date: c.end_date ?? '',
      notes: c.notes ?? '',
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading lead funnel…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500 text-sm space-y-2">
        <p>Failed to load campaign data</p>
        <button onClick={() => refetch()} className="btn btn-secondary btn-sm">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FunnelSummaryCards
        totalSpend={totalSpend}
        totalLeads={totalLeads}
        cpl={cpl}
        paidRegs={totalPaid}
        convRate={convRate}
        cpr={cpr}
      />

      {campaigns.length > 0 && (
        <>
          <FunnelVisualization stages={funnelStages} />
          <PlatformComparison campaigns={campaigns} />
        </>
      )}

      {/* Campaigns Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-brand-500" /> Ad Campaigns
          </h3>
          <div className="flex items-center gap-2">
            {campaigns.length > 0 && (
              <button
                onClick={async () => {
                  const rows = campaigns.map(c => {
                    const cpl = c.leads_generated > 0 ? Number(c.spend) / c.leads_generated : 0
                    const conv = c.leads_generated > 0 ? (c.paid_registrations / c.leads_generated) * 100 : 0
                    return {
                      Platform: PLATFORM_MAP[c.platform]?.label ?? c.platform,
                      Campaign: c.campaign_name,
                      'Spend (₹)': Number(c.spend),
                      Leads: c.leads_generated,
                      Contacted: c.leads_contacted,
                      'Payment Links': c.payment_links_sent,
                      'Paid Registrations': c.paid_registrations,
                      'CPL (₹)': Number(cpl.toFixed(2)),
                      'Conversion %': Number(conv.toFixed(1)),
                      Notes: c.notes ?? '',
                    }
                  })
                  await exportToExcel(rows, 'lead-funnel-export', 'Lead Funnel')
                }}
                className="btn btn-secondary btn-sm"
                title="Export to Excel"
              >
                <Download className="w-4 h-4" /> Excel
              </button>
            )}
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm) }}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" /> Add Campaign
            </button>
          </div>
        </div>

        {showForm && (
          <div className="card p-4 border-2 border-brand-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">{editingId ? 'Edit Campaign' : 'New Campaign'}</h4>
              <button onClick={cancelForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Campaign Name *</label>
                <input
                  value={form.campaign_name}
                  onChange={e => setForm(f => ({ ...f, campaign_name: e.target.value }))}
                  placeholder="e.g. BOSS-21 Meta Lead Gen"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Platform</label>
                <select
                  value={form.platform}
                  onChange={e => setForm(f => ({ ...f, platform: e.target.value as AdPlatform }))}
                  className="input w-full"
                >
                  {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Spend (₹)</label>
                <input
                  type="number" min={0}
                  value={form.spend || ''}
                  onChange={e => setForm(f => ({ ...f, spend: Number(e.target.value) }))}
                  className="input w-full" placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Leads</label>
                <input
                  type="number" min={0}
                  value={form.leads_generated || ''}
                  onChange={e => setForm(f => ({ ...f, leads_generated: Number(e.target.value) }))}
                  className="input w-full" placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Contacted</label>
                <input
                  type="number" min={0}
                  value={form.leads_contacted || ''}
                  onChange={e => setForm(f => ({ ...f, leads_contacted: Number(e.target.value) }))}
                  className="input w-full" placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Links Sent</label>
                <input
                  type="number" min={0}
                  value={form.payment_links_sent || ''}
                  onChange={e => setForm(f => ({ ...f, payment_links_sent: Number(e.target.value) }))}
                  className="input w-full" placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Paid</label>
                <input
                  type="number" min={0}
                  value={form.paid_registrations || ''}
                  onChange={e => setForm(f => ({ ...f, paid_registrations: Number(e.target.value) }))}
                  className="input w-full" placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Notes</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes"
                  className="input w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={cancelForm} className="btn btn-secondary btn-sm">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!form.campaign_name.trim() || createCampaign.isPending || updateCampaign.isPending}
                className="btn btn-primary btn-sm"
              >
                {(createCampaign.isPending || updateCampaign.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No ad campaigns tracked — add your first campaign
          </div>
        ) : (
          <div className="card overflow-hidden table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5">Campaign</th>
                  <th className="text-left px-4 py-2.5">Platform</th>
                  <th className="text-right px-4 py-2.5">Spend</th>
                  <th className="text-right px-4 py-2.5">Leads</th>
                  <th className="text-right px-4 py-2.5 hidden md:table-cell">Contacted</th>
                  <th className="text-right px-4 py-2.5 hidden md:table-cell">Links</th>
                  <th className="text-right px-4 py-2.5">Paid</th>
                  <th className="text-right px-4 py-2.5 hidden md:table-cell">CPL</th>
                  <th className="text-center px-4 py-2.5 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map(c => {
                  const plat = PLATFORM_MAP[c.platform]
                  const campaignCpl = c.leads_generated > 0 ? Number(c.spend) / c.leads_generated : 0
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.campaign_name}</div>
                        {(c.start_date || c.end_date) && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {c.start_date && new Date(c.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {c.start_date && c.end_date && ' – '}
                            {c.end_date && new Date(c.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: plat?.color ?? '#94a3b8' }}
                        >
                          {plat?.label ?? c.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatCurrency(Number(c.spend))}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-600">{c.leads_generated}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500 hidden md:table-cell">{c.leads_contacted}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500 hidden md:table-cell">{c.payment_links_sent}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-600">{c.paid_registrations}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600 hidden md:table-cell">{formatCurrency(campaignCpl)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors" title="Edit" aria-label="Edit campaign">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button onClick={() => { if (confirm('Remove this campaign?')) deleteCampaign.mutate(c.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete" aria-label="Delete campaign">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-sm">
                  <td className="px-4 py-2.5 text-slate-700" colSpan={2}>Total ({campaigns.length})</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">{formatCurrency(totalSpend)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-brand-600">{totalLeads}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500 hidden md:table-cell">{totalContacted}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500 hidden md:table-cell">{totalLinksSent}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{totalPaid}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-amber-600 hidden md:table-cell">{formatCurrency(cpl)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
