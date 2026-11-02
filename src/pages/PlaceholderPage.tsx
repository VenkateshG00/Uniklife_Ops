import { Header } from '../components/layout/Header'
import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  subtitle?: string
  phase?: string
}

export function PlaceholderPage({ title, subtitle, phase }: PlaceholderPageProps) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <main className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
          {subtitle && <p className="text-slate-500 text-sm mb-3">{subtitle}</p>}
          {phase && (
            <span className="badge badge-inprogress">
              Planned for {phase}
            </span>
          )}
        </div>
      </main>
    </>
  )
}
