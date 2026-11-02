import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 minutes
      if (r) setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
      <span>New version available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-1 rounded-xl text-xs font-bold transition-colors"
      >
        Refresh
      </button>
    </div>
  )
}
