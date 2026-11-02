import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Zap, Loader2, CheckCircle } from 'lucide-react'
import { getInvite, completeJoin } from '../../services/staff'

const roleLabels: Record<string, string> = {
  event_manager: 'Event Manager', office_staff: 'Office Staff',
  onsite_staff: 'Staff', procurement_staff: 'Staff', read_only: 'Read Only',
}

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })
type JoinForm = z.infer<typeof schema>

type InviteInfo = { id: string; full_name: string; role: string; expires_at: string }

export function JoinPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JoinForm>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token) { setLoadError('Invalid invite link'); setLoading(false); return }
    getInvite(token)
      .then(res => setInvite(res.invite))
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Invalid invite'))
      .finally(() => setLoading(false))
  }, [token])

  async function onSubmit(values: JoinForm) {
    try {
      await completeJoin(token!, values.email, values.password)
      setDone(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">UniklifeOps</div>
            <div className="text-slate-400 text-xs leading-tight">Ops Control Center</div>
          </div>
        </div>

        <div className="card p-6">
          {loading && (
            <div className="flex flex-col items-center py-8 gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Validating invite…</p>
            </div>
          )}

          {!loading && loadError && (
            <div className="text-center py-6">
              <p className="text-red-500 font-semibold mb-2">Invalid Invite</p>
              <p className="text-slate-500 text-sm">{loadError}</p>
            </div>
          )}

          {!loading && done && (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-slate-900 mb-1">Account created!</p>
              <p className="text-slate-500 text-sm mb-5">You can now log in to UniklifeOps.</p>
              <button onClick={() => navigate('/login')} className="btn btn-primary w-full">
                Go to Login
              </button>
            </div>
          )}

          {!loading && !loadError && !done && invite && (
            <>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-slate-900">Join UniklifeOps</h1>
                <p className="text-slate-500 text-sm mt-1">
                  You've been invited as <span className="font-semibold text-slate-700">{invite.full_name}</span>{' '}
                  — <span className="text-brand-600">{roleLabels[invite.role] ?? invite.role}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Your Email</label>
                  <input {...register('email')} type="email" className="input" placeholder="you@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Password</label>
                  <input {...register('password')} type="password" className="input" placeholder="Min 8 characters" />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input {...register('confirm')} type="password" className="input" placeholder="Repeat password" />
                  {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full mt-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create My Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
