import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import { Plus, Phone, Loader2, Users, X, Mail, UserPlus, Link2, Copy, Check, Pencil } from 'lucide-react'
import { useStaff, useCreateStaffDirect, useGenerateInviteLink, useUpdateJobTitle } from '../../hooks/useStaff'
import { useRole } from '../../hooks/useRole'

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin', event_manager: 'Event Manager', office_staff: 'Staff',
  onsite_staff: 'Staff', procurement_staff: 'Staff', read_only: 'Read Only',
}
const roleColors: Record<string, string> = {
  event_manager: 'badge-inprogress', office_staff: 'badge-dispatched',
  onsite_staff: 'badge-dispatched', procurement_staff: 'badge-dispatched',
  super_admin: 'badge-critical', read_only: 'badge-pending',
}

const directSchema = z.object({
  full_name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['event_manager', 'office_staff', 'read_only']),
  job_title: z.string().optional(),
  phone: z.string().optional(),
})
type DirectForm = z.infer<typeof directSchema>

const linkSchema = z.object({
  full_name: z.string().min(2, 'Name required'),
  role: z.enum(['event_manager', 'office_staff', 'read_only']),
  job_title: z.string().optional(),
  phone: z.string().optional(),
})
type LinkForm = z.infer<typeof linkSchema>

export function StaffPage() {
  const { data: staff, isLoading } = useStaff()
  const createDirect = useCreateStaffDirect()
  const genLink = useGenerateInviteLink()
  const updateJobTitle = useUpdateJobTitle()
  const { isSuperAdmin } = useRole()

  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState<'direct' | 'link'>('direct')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const directForm = useForm<DirectForm>({
    resolver: zodResolver(directSchema),
    defaultValues: { role: 'office_staff' },
  })
  const linkForm = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
    defaultValues: { role: 'office_staff' },
  })

  function closeModal() {
    setShowModal(false)
    setGeneratedLink(null)
    setCopied(false)
    directForm.reset()
    linkForm.reset()
  }

  async function onDirectSubmit(values: DirectForm) {
    try {
      await createDirect.mutateAsync(values)
      toast.success(`${values.full_name} added — share ${values.email} / password with them`)
      closeModal()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account')
    }
  }

  async function onLinkSubmit(values: LinkForm) {
    try {
      const token = await genLink.mutateAsync(values)
      const url = `${window.location.origin}/join?token=${token}`
      setGeneratedLink(url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate link')
    }
  }

  async function copyLink() {
    if (!generatedLink) return
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select the text
    }
  }

  async function saveJobTitle(id: string) {
    await updateJobTitle.mutateAsync({ id, job_title: editingTitle.trim() })
    toast.success('Job title updated')
    setEditingId(null)
  }

  return (
    <>
      <Header title="Staff" subtitle="Manage your operations team" />
      <main className="p-6">
        <div className="flex justify-end mb-4">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading staff…
          </div>
        )}

        {!isLoading && (!staff || staff.length === 0) && (
          <div className="card p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No staff members yet</p>
            <p className="text-sm mt-1">Add team members to get started</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(staff ?? []).map(s => (
            <div key={s.id} className="card p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-bold shrink-0">
                  {s.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{s.full_name}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    {(s as any).job_title ? (
                      <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-2 py-0.5">
                        {(s as any).job_title}
                      </span>
                    ) : (
                      <span className={`badge ${roleColors[s.role ?? ''] ?? 'badge-pending'}`}>
                        {roleLabels[s.role ?? ''] ?? s.role}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 capitalize">{s.role?.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                {isSuperAdmin() && s.role !== 'super_admin' && (
                  <button
                    onClick={() => { setEditingId(s.id); setEditingTitle((s as any).job_title ?? '') }}
                    className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors shrink-0"
                    title="Set job title"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Inline job title editor */}
              {editingId === s.id && (
                <div className="flex gap-2 mb-3">
                  <input
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    className="input input-sm flex-1 text-xs"
                    placeholder="e.g. CEO, HR, Finance Control"
                    onKeyDown={e => { if (e.key === 'Enter') saveJobTitle(s.id); if (e.key === 'Escape') setEditingId(null) }}
                    autoFocus
                  />
                  <button onClick={() => saveJobTitle(s.id)} className="btn btn-primary btn-sm text-xs px-3">
                    {updateJobTitle.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-sm text-xs px-2">✕</button>
                </div>
              )}

              <div className="space-y-1.5 text-sm text-slate-500">
                {s.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> {s.phone}
                  </p>
                )}
                {!s.phone && (
                  <p className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5" /> No contact info
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-bold text-slate-900">Add Staff Member</h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
              <button
                onClick={() => setTab('direct')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === 'direct' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </button>
              <button
                onClick={() => { setTab('link'); setGeneratedLink(null) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === 'link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" /> Share Link
              </button>
            </div>

            {/* Tab A: Create directly */}
            {tab === 'direct' && (
              <form onSubmit={directForm.handleSubmit(onDirectSubmit)} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input {...directForm.register('full_name')} className="input" placeholder="e.g. Ravi Kumar" />
                  {directForm.formState.errors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{directForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input {...directForm.register('email')} type="email" className="input" placeholder="staff@example.com" />
                  {directForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{directForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Password</label>
                  <input {...directForm.register('password')} type="password" className="input" placeholder="Min 8 characters" />
                  {directForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{directForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Role</label>
                  <select {...directForm.register('role')} className="input">
                    <option value="event_manager">Event Manager</option>
                    <option value="office_staff">Staff</option>
                    <option value="read_only">Read Only</option>
                  </select>
                </div>
                <div>
                  <label className="label">Job Title <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input {...directForm.register('job_title')} className="input" placeholder="e.g. CEO, HR, Finance Control" />
                  <p className="text-xs text-slate-400 mt-1">Shown instead of role name in dropdowns and task cards</p>
                </div>
                <div>
                  <label className="label">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input {...directForm.register('phone')} type="tel" className="input" placeholder="+91 98765 43210" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={createDirect.isPending} className="btn btn-primary flex-1">
                    {createDirect.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Create Account
                  </button>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  Share the email and password with them via WhatsApp or call. They can change their password in Settings.
                </p>
              </form>
            )}

            {/* Tab B: Share link */}
            {tab === 'link' && !generatedLink && (
              <form onSubmit={linkForm.handleSubmit(onLinkSubmit)} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input {...linkForm.register('full_name')} className="input" placeholder="e.g. Priya Singh" />
                  {linkForm.formState.errors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{linkForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Role</label>
                  <select {...linkForm.register('role')} className="input">
                    <option value="event_manager">Event Manager</option>
                    <option value="office_staff">Staff</option>
                    <option value="read_only">Read Only</option>
                  </select>
                </div>
                <div>
                  <label className="label">Job Title <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input {...linkForm.register('job_title')} className="input" placeholder="e.g. CEO, HR, Finance Control" />
                  <p className="text-xs text-slate-400 mt-1">Shown instead of role name in dropdowns and task cards</p>
                </div>
                <div>
                  <label className="label">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input {...linkForm.register('phone')} type="tel" className="input" placeholder="+91 98765 43210" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={genLink.isPending} className="btn btn-primary flex-1">
                    {genLink.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    Generate Link
                  </button>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  A one-time link valid for 7 days. Staff sets their own email and password.
                </p>
              </form>
            )}

            {/* Generated link display */}
            {tab === 'link' && generatedLink && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-800 mb-2">Link generated!</p>
                  <p className="text-xs text-green-700 break-all">{generatedLink}</p>
                </div>
                <button onClick={copyLink} className="btn btn-primary w-full">
                  {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
                </button>
                <p className="text-xs text-slate-400 text-center">
                  Send via WhatsApp or message. Valid for 7 days.
                </p>
                <button onClick={closeModal} className="btn btn-secondary w-full">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
