import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-xl mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">UniklifeOps</h1>
          <p className="text-slate-400 text-sm mt-1">Event Operations Control Center</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label text-slate-300">Email address</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={cn(
                  'input bg-white/10 border-white/20 text-white placeholder:text-slate-500',
                  'focus:bg-white/15 focus:border-brand-400',
                  errors.email && 'input-error'
                )}
              />
              {errors.email && <p className="error-msg text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label text-slate-300">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    'input bg-white/10 border-white/20 text-white placeholder:text-slate-500 pr-10',
                    'focus:bg-white/15 focus:border-brand-400',
                    errors.password && 'input-error'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-msg text-red-400">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center mt-2 py-3 text-base"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            Secure access for authorized staff only
          </p>
        </div>
      </div>
    </div>
  )
}
