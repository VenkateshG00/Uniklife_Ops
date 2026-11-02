import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRole } from '../../hooks/useRole'
import {
  User, Phone, Lock, LogOut, Loader2, Check,
  Building2, Mail, Briefcase, MapPin, Hash, Save, ImageIcon
} from 'lucide-react'

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin', event_manager: 'Event Manager', office_staff: 'Office Staff',
  onsite_staff: 'Staff', procurement_staff: 'Staff', read_only: 'Read Only',
}

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone:     z.string().optional(),
  job_title: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  password: z.string().min(8, 'Min 8 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })
type PasswordForm = z.infer<typeof passwordSchema>

const companySchema = z.object({
  name:          z.string().min(2, 'Company name required'),
  logo_url:      z.string().optional(),
  address:       z.string().optional(),
  gst_number:    z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
})
type CompanyForm = z.infer<typeof companySchema>

export function SettingsPage() {
  const { profile, setProfile, signOut } = useAuthStore()
  const { isAdmin } = useRole()
  const [profileSaved,  setProfileSaved]  = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [companySaved,  setCompanySaved]  = useState(false)
  const [authEmail, setAuthEmail] = useState<string>('')
  const [orgId, setOrgId] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setAuthEmail(data.user.email)
    })
  }, [])

  // Load org details for admin
  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', logo_url: '', address: '', gst_number: '', contact_phone: '', contact_email: '' },
  })

  useEffect(() => {
    if (!profile?.organization_id || !isAdmin()) return
    supabase
      .from('organizations')
      .select('id, name, logo_url, settings')
      .eq('id', profile.organization_id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setOrgId(data.id)
        const s = (data.settings ?? {}) as Record<string, string>
        companyForm.reset({
          name:          data.name ?? '',
          logo_url:      data.logo_url ?? '',
          address:       s.address ?? '',
          gst_number:    s.gst_number ?? '',
          contact_phone: s.contact_phone ?? '',
          contact_email: s.contact_email ?? '',
        })
      })
  }, [profile?.organization_id, isAdmin()])

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone:     profile?.phone ?? '',
      job_title: profile?.job_title ?? '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  async function onSaveProfile(values: ProfileForm) {
    if (!profile) return
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: values.full_name,
        phone:     values.phone || null,
        job_title: values.job_title || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) { toast.error(error.message); return }
    setProfile({
      ...profile,
      full_name: data.full_name,
      phone:     data.phone ?? undefined,
      job_title: data.job_title ?? undefined,
      updated_at: data.updated_at,
    })
    setProfileSaved(true)
    toast.success('Profile updated')
    setTimeout(() => setProfileSaved(false), 2000)
  }

  async function onChangePassword(values: PasswordForm) {
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) { toast.error(error.message); return }
    passwordForm.reset()
    setPasswordSaved(true)
    toast.success('Password changed')
    setTimeout(() => setPasswordSaved(false), 2000)
  }

  async function onSaveCompany(values: CompanyForm) {
    if (!orgId) return
    const { error } = await supabase
      .from('organizations')
      .update({
        name:     values.name,
        logo_url: values.logo_url || null,
        settings: {
          address:       values.address       || null,
          gst_number:    values.gst_number    || null,
          contact_phone: values.contact_phone || null,
          contact_email: values.contact_email || null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)

    if (error) { toast.error(error.message); return }
    setCompanySaved(true)
    toast.success('Company details saved')
    setTimeout(() => setCompanySaved(false), 2000)
  }

  if (!profile) return null

  return (
    <>
      <Header title="Settings" subtitle="Manage your profile and account" />
      <main className="p-6 max-w-2xl mx-auto flex flex-col gap-6">

        {/* Profile card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Profile</h2>
              <p className="text-xs text-slate-400">Update your name, phone and job title</p>
            </div>
          </div>

          {/* Avatar + role badge */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {profile.full_name?.charAt(0) ?? 'U'}
            </div>
            <div>
              <p className="font-bold text-slate-900">{profile.full_name}</p>
              {profile.job_title && (
                <p className="text-xs text-brand-600 font-medium">{profile.job_title}</p>
              )}
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />{authEmail || '—'}
              </p>
              <span className="badge badge-inprogress mt-1">
                {roleLabels[profile.role] ?? profile.role}
              </span>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...profileForm.register('full_name')} className="input" />
              {profileForm.formState.errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Job Title
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                {...profileForm.register('job_title')}
                className="input"
                placeholder="e.g. Operations Manager, CEO, Finance Head"
              />
              <p className="text-xs text-slate-400 mt-1">
                Shown on task cards and staff list instead of your role
              </p>
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input {...profileForm.register('phone')} type="tel" className="input" placeholder="+91 98765 43210" />
            </div>
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={profileForm.formState.isSubmitting} className="btn btn-primary">
                {profileForm.formState.isSubmitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : profileSaved
                    ? <><Check className="w-4 h-4" /> Saved</>
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Company Details — admin only */}
        {isAdmin() && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Company Details</h2>
                <p className="text-xs text-slate-400">Used in PDF exports and reports</p>
              </div>
            </div>

            <form onSubmit={companyForm.handleSubmit(onSaveCompany)} className="space-y-4">

              {/* Logo preview */}
              {companyForm.watch('logo_url') && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <img
                    src={companyForm.watch('logo_url')}
                    alt="Company logo"
                    className="h-10 object-contain rounded"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="text-xs text-slate-500">Logo preview</span>
                </div>
              )}

              <div>
                <label className="label">Company Name *</label>
                <input {...companyForm.register('name')} className="input" placeholder="UnikScan Events Pvt. Ltd." />
                {companyForm.formState.errors.name && (
                  <p className="text-red-500 text-xs mt-1">{companyForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="label flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Logo URL
                </label>
                <input
                  {...companyForm.register('logo_url')}
                  className="input"
                  placeholder="https://your-cdn.com/logo.png"
                />
                <p className="text-xs text-slate-400 mt-1">Paste a public image URL — used in PDF exports</p>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </label>
                <textarea
                  {...companyForm.register('address')}
                  className="input resize-none"
                  rows={2}
                  placeholder="123, Main Street, Chennai, TN 600001"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> GST Number
                  </label>
                  <input
                    {...companyForm.register('gst_number')}
                    className="input"
                    placeholder="33AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Contact Phone
                  </label>
                  <input
                    {...companyForm.register('contact_phone')}
                    type="tel"
                    className="input"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div>
                <label className="label flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Contact Email
                </label>
                <input
                  {...companyForm.register('contact_email')}
                  type="email"
                  className="input"
                  placeholder="info@unikscan.com"
                />
                {companyForm.formState.errors.contact_email && (
                  <p className="text-red-500 text-xs mt-1">{companyForm.formState.errors.contact_email.message}</p>
                )}
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" disabled={companyForm.formState.isSubmitting} className="btn btn-primary">
                  {companyForm.formState.isSubmitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : companySaved
                      ? <><Check className="w-4 h-4" /> Saved</>
                      : <><Save className="w-4 h-4" /> Save Company Details</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-400">Choose a strong password</p>
            </div>
          </div>

          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input {...passwordForm.register('password')} type="password" className="input" placeholder="Min 8 characters" />
              {passwordForm.formState.errors.password && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input {...passwordForm.register('confirm')} type="password" className="input" placeholder="Repeat password" />
              {passwordForm.formState.errors.confirm && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirm.message}</p>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={passwordForm.formState.isSubmitting} className="btn btn-primary">
                {passwordForm.formState.isSubmitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : passwordSaved
                    ? <><Check className="w-4 h-4" /> Changed</>
                    : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Organisation info (read-only) */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Account Info</h2>
              <p className="text-xs text-slate-400">Your workspace details</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Email</span>
              <span className="text-slate-700 truncate max-w-[220px]">{authEmail || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Your Role</span>
              <span className="font-semibold text-slate-800">{roleLabels[profile.role] ?? profile.role}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Member since</span>
              <span className="text-slate-700">
                {new Date(profile.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="card p-6 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Sign Out</p>
              <p className="text-sm text-slate-500 mt-0.5">Sign out from this device</p>
            </div>
            <button onClick={signOut} className="btn btn-secondary text-red-500 hover:bg-red-50 hover:border-red-200">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

      </main>
    </>
  )
}
