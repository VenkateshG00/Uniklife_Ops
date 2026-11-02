import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '../../components/layout/Header'
import { Modal } from '../../components/ui/Modal'
import { usePayments, useAddPayment } from '../../hooks/usePayments'
import { useEvents } from '../../hooks/useEvents'
import { useOrganization } from '../../hooks/useOrganization'
import { cn, formatDate } from '../../lib/utils'
import { Plus, IndianRupee, Loader2, CreditCard, TrendingDown, Printer, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const EXPENSE_CATEGORIES = [
  'Venue & Hall', 'Catering & Food', 'Decoration', 'AV & Technical',
  'Materials & Supplies', 'Staff & Labour', 'Transport & Logistics',
  'Printing & Stationery', 'Miscellaneous',
]

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', upi: 'UPI', card: 'Card', bank_transfer: 'Bank Transfer', other: 'Other',
}

const expSchema = z.object({
  payer_name:   z.string().min(1, 'Vendor / expense name required'),
  category:     z.string().min(1, 'Select a category'),
  amount:       z.string().min(1, 'Amount required'),
  payment_type: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'other']),
  payment_date: z.string().min(1, 'Date required'),
  reference_no: z.string().optional(),
  description:  z.string().optional(),
})
type ExpForm = z.infer<typeof expSchema>

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const today = () => new Date().toISOString().slice(0, 10)

export function PaymentsPage() {
  const { data: events = [] } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [showAdd, setShowAdd] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const eventId = selectedEventId || events[0]?.id || ''
  const selectedEvent = events.find(e => e.id === eventId)

  const { data: expenses = [], isLoading } = usePayments(eventId)
  const addExpense = useAddPayment(eventId)
  const { data: org } = useOrganization()

  const totalSpent = expenses.reduce((s, p) => s + Number(p.amount), 0)

  // Category breakdown
  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: expenses
      .filter((p: any) => p.category === cat || (!p.category && cat === 'Miscellaneous'))
      .reduce((s, p) => s + Number(p.amount), 0),
  })).filter(c => c.total > 0)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpForm>({
    resolver: zodResolver(expSchema),
    defaultValues: { payment_type: 'cash', payment_date: today() },
  })

  const onAdd = (values: ExpForm) => {
    const amt = parseFloat(values.amount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    addExpense.mutate({
      payer_name:   values.payer_name,
      amount:       amt,
      payment_type: values.payment_type,
      payment_date: new Date(values.payment_date).toISOString(),
      reference_no: values.reference_no || undefined,
      description:  values.description || undefined,
      // store category in description prefix if no dedicated column
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      category:     values.category,
    } as any, {
      onSuccess: () => { setShowAdd(false); reset({ payment_type: 'cash', payment_date: today() }) },
    })
  }

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { toast.error('Allow popups to print'); return }

    const companyName    = org?.name          ?? 'UniklifeOps'
    const companyAddress = org?.address        ?? ''
    const gstNumber      = org?.gst_number     ?? ''
    const contactPhone   = org?.contact_phone  ?? ''
    const contactEmail   = org?.contact_email  ?? ''
    const logoUrl        = org?.logo_url        ?? ''
    const generatedOn    = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Report — ${selectedEvent?.title ?? 'Event'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 32px; max-width: 860px; margin: 0 auto; }

          /* Branded header */
          .letterhead { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 20px; }
          .letterhead-left { display: flex; align-items: center; gap: 14px; }
          .letterhead-logo { max-height: 52px; max-width: 180px; object-fit: contain; }
          .letterhead-name { font-size: 18px; font-weight: bold; color: #1e3a8a; }
          .letterhead-meta { font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.6; }
          .letterhead-right { text-align: right; font-size: 11px; color: #64748b; line-height: 1.8; }

          /* Report title */
          .report-title { font-size: 17px; font-weight: bold; color: #0f172a; margin-bottom: 2px; }
          .report-sub   { font-size: 12px; color: #64748b; margin-bottom: 20px; }

          /* Summary boxes */
          .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
          .summary-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 18px; min-width: 130px; }
          .summary-box .label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }
          .summary-box .value { font-size: 17px; font-weight: bold; margin-top: 2px; }
          .red { color: #dc2626; } .blue { color: #2563eb; }

          h2 { font-size: 12px; font-weight: bold; margin-bottom: 8px; margin-top: 22px; color: #475569; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 7px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
          td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
          tr:last-child td { border-bottom: none; }
          .amount { font-weight: bold; color: #dc2626; text-align: right; font-family: monospace; }
          .tr-total td { font-weight: bold; background: #f8fafc; border-top: 2px solid #e2e8f0; }

          /* Footer */
          .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
          .footer-left { font-size: 10px; color: #94a3b8; }
          .footer-right { font-size: 10px; color: #94a3b8; text-align: right; }

          /* GST badge */
          .gst-badge { display: inline-block; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: bold; letter-spacing: .04em; margin-top: 4px; }

          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>

        <!-- Branded letterhead -->
        <div class="letterhead">
          <div class="letterhead-left">
            ${logoUrl ? `<img src="${logoUrl}" class="letterhead-logo" alt="Logo" />` : ''}
            <div>
              <div class="letterhead-name">${companyName}</div>
              ${companyAddress ? `<div class="letterhead-meta">${companyAddress.replace(/\n/g, '<br>')}</div>` : ''}
              ${gstNumber ? `<div class="gst-badge">GST: ${gstNumber}</div>` : ''}
            </div>
          </div>
          <div class="letterhead-right">
            <div style="font-size:13px;font-weight:bold;color:#1e3a8a;">EXPENSE REPORT</div>
            ${contactPhone ? `<div>📞 ${contactPhone}</div>` : ''}
            ${contactEmail ? `<div>✉ ${contactEmail}</div>` : ''}
            <div style="margin-top:4px;">Date: ${generatedOn}</div>
          </div>
        </div>

        <!-- Event info -->
        <div class="report-title">${selectedEvent?.title ?? 'Event'}</div>
        <div class="report-sub">
          ${selectedEvent?.start_datetime ? formatDate(selectedEvent.start_datetime) : ''}
          ${selectedEvent?.venue_name ? ' &nbsp;·&nbsp; ' + selectedEvent.venue_name : ''}
        </div>

        <!-- Summary -->
        <div class="summary">
          <div class="summary-box">
            <div class="label">Total Spent</div>
            <div class="value red">${fmt(totalSpent)}</div>
          </div>
          <div class="summary-box">
            <div class="label">No. of Expenses</div>
            <div class="value blue">${expenses.length}</div>
          </div>
          ${byCategory.length > 0 ? `
          <div class="summary-box">
            <div class="label">Categories</div>
            <div class="value blue">${byCategory.length}</div>
          </div>` : ''}
        </div>

        ${byCategory.length > 0 ? `
        <h2>Category Breakdown</h2>
        <table>
          <thead><tr><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            ${byCategory.map(c => `<tr><td>${c.cat}</td><td class="amount">${fmt(c.total)}</td></tr>`).join('')}
            <tr class="tr-total"><td>Total</td><td class="amount">${fmt(totalSpent)}</td></tr>
          </tbody>
        </table>` : ''}

        <h2>Detailed Expenses</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Vendor / Expense</th>
              <th>Category</th>
              <th>Method</th>
              <th>Date</th>
              <th>Ref No.</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((p: any, i: number) => `
              <tr>
                <td style="color:#94a3b8">${i + 1}</td>
                <td>${p.payer_name}${p.description ? `<br><small style="color:#94a3b8">${p.description}</small>` : ''}</td>
                <td>${p.category ?? '—'}</td>
                <td>${METHOD_LABELS[p.payment_type] ?? p.payment_type}</td>
                <td>${formatDate(p.payment_date)}</td>
                <td style="color:#64748b">${p.reference_no ?? '—'}</td>
                <td class="amount">${fmt(Number(p.amount))}</td>
              </tr>`).join('')}
            <tr class="tr-total">
              <td colspan="6" style="text-align:right">Grand Total</td>
              <td class="amount">${fmt(totalSpent)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-left">
            ${companyName} &nbsp;·&nbsp; ${companyAddress ? companyAddress.split('\n')[0] : ''}
            ${gstNumber ? `&nbsp;·&nbsp; GST: ${gstNumber}` : ''}
          </div>
          <div class="footer-right">
            Generated by UniklifeOps &nbsp;·&nbsp; ${generatedOn}
          </div>
        </div>

      </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  const handleExcelExport = () => {
    if (!expenses.length) { toast.error('No expenses to export'); return }

    const companyName = org?.name ?? 'UniklifeOps'
    const eventTitle  = selectedEvent?.title ?? 'Event'
    const fileName    = `${companyName} — ${eventTitle} Expenses.xlsx`

    // Sheet 1: All expenses (detailed)
    const detailRows = expenses.map((p: any, i: number) => ({
      '#':               i + 1,
      'Vendor / Expense': p.payer_name,
      'Description':     p.description ?? '',
      'Category':        p.category ?? '—',
      'Payment Method':  METHOD_LABELS[p.payment_type] ?? p.payment_type,
      'Date':            formatDate(p.payment_date),
      'Reference No.':   p.reference_no ?? '',
      'Amount (₹)':      Number(p.amount),
    }))

    // Sheet 2: Category summary
    const summaryRows = byCategory.map(c => ({
      'Category':   c.cat,
      'Amount (₹)': c.total,
    }))
    summaryRows.push({ 'Category': 'TOTAL', 'Amount (₹)': totalSpent })

    const wb = XLSX.utils.book_new()

    // Details sheet
    const wsDetail = XLSX.utils.json_to_sheet(detailRows)
    wsDetail['!cols'] = [
      { wch: 4 }, { wch: 28 }, { wch: 22 }, { wch: 20 },
      { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
    ]
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Expenses')

    // Summary sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
    wsSummary['!cols'] = [{ wch: 26 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Category Summary')

    XLSX.writeFile(wb, fileName)
    toast.success('Excel file downloaded')
  }

  return (
    <>
      <Header title="Expenses" subtitle="Track budget and spending per event" />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6" ref={printRef}>

        {/* Event selector */}
        {events.length > 1 && (
          <select
            value={eventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="input max-w-sm"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}

        {!eventId && (
          <div className="card p-12 text-center text-slate-400">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No events found</p>
          </div>
        )}

        {eventId && (
          <>
            {/* Category breakdown */}
            {byCategory.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {byCategory.map(c => (
                  <div key={c.cat} className="card p-4">
                    <p className="text-[11px] text-slate-400 truncate mb-1">{c.cat}</p>
                    <p className="font-bold text-slate-800 text-sm">{fmt(c.total)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 font-semibold">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
                {totalSpent > 0 && <span className="text-sm text-slate-400">— {fmt(totalSpent)} total</span>}
              </div>
              <div className="flex items-center gap-2">
                {expenses.length > 0 && (
                  <>
                    <button onClick={handleExcelExport} className="btn btn-secondary btn-sm">
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                    <button onClick={handlePrint} className="btn btn-secondary btn-sm">
                      <Printer className="w-4 h-4" /> Export PDF
                    </button>
                  </>
                )}
                <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                  <Plus className="w-4 h-4" /> Add Expense
                </button>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </div>
            )}

            {/* Empty */}
            {!isLoading && expenses.length === 0 && (
              <div className="card p-12 text-center text-slate-400">
                <IndianRupee className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-600">No expenses recorded</p>
                <p className="text-sm mt-1 mb-4">Start tracking what you spend on this event</p>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                  <Plus className="w-4 h-4" /> Add First Expense
                </button>
              </div>
            )}

            {/* Table */}
            {expenses.length > 0 && (
              <div className="card overflow-hidden table-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Vendor / Expense</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Method</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Date</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Ref</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenses.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{p.payer_name}</p>
                          {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                        </td>
                        <td className="px-3 py-3.5 text-xs text-slate-500 hidden md:table-cell">
                          {p.category ?? '—'}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={cn(
                            'badge',
                            p.payment_type === 'cash' ? 'badge-completed' :
                            p.payment_type === 'upi'  ? 'badge-inprogress' : 'badge-dispatched'
                          )}>
                            {METHOD_LABELS[p.payment_type]}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-slate-400 hidden lg:table-cell">
                          {formatDate(p.payment_date)}
                        </td>
                        <td className="px-3 py-3.5 text-xs text-slate-500 hidden lg:table-cell">
                          {p.reference_no ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-red-600 font-mono">
                          {fmt(Number(p.amount))}
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={4} className="px-5 py-3 text-sm font-bold text-slate-700 hidden lg:table-cell">Total</td>
                      <td colSpan={2} className="px-5 py-3 text-right font-bold text-slate-900 text-base lg:hidden">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900 text-base font-mono hidden lg:table-cell">
                        {fmt(totalSpent)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Expense Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset({ payment_type: 'cash', payment_date: today() }) }} title="Add Expense" size="md">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">

          <div>
            <label className="label">Vendor / Expense Name *</label>
            <input
              {...register('payer_name')}
              className={cn('input', errors.payer_name && 'input-error')}
              placeholder="e.g. ABC Caterers, Stage Rental, Transport"
            />
            {errors.payer_name && <p className="error-msg">{errors.payer_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select {...register('category')} className={cn('input', errors.category && 'input-error')}>
                <option value="">Select…</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="error-msg">{errors.category.message}</p>}
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input
                type="number" min="1" step="1"
                {...register('amount')}
                className={cn('input', errors.amount && 'input-error')}
                placeholder="0"
              />
              {errors.amount && <p className="error-msg">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Method</label>
              <select {...register('payment_type')} className="input">
                {Object.entries(METHOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" {...register('payment_date')} className={cn('input', errors.payment_date && 'input-error')} />
              {errors.payment_date && <p className="error-msg">{errors.payment_date.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Reference / Receipt No <span className="text-slate-400 font-normal">(optional)</span></label>
            <input {...register('reference_no')} className="input" placeholder="Invoice no, UPI ref…" />
          </div>

          <div>
            <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <input {...register('description')} className="input" placeholder="Any additional details…" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAdd(false); reset({ payment_type: 'cash', payment_date: today() }) }} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={addExpense.isPending} className="btn btn-primary px-6">
              {addExpense.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
