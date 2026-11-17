import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useTours,
  useAssignEventToTour,
  useRemoveEventFromTour,
  useCreateTour,
} from '../../hooks/useTour'
import type { ProgramName } from '../../types'
import { Map, ExternalLink, Plus, X, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const PROGRAMS: ProgramName[] = ['BOSS', 'UBM', 'MSGB', 'VK-M']

interface TourSelectorProps {
  eventId: string
  currentTourId?: string | null
}

export function TourSelector({ eventId, currentTourId }: TourSelectorProps) {
  const navigate = useNavigate()
  const { data: tours = [], isLoading } = useTours()
  const assign = useAssignEventToTour(eventId)
  const remove = useRemoveEventFromTour(eventId)
  const create = useCreateTour()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newProgram, setNewProgram] = useState<ProgramName>('BOSS')
  const [newYear, setNewYear] = useState(new Date().getFullYear())

  const currentTour = tours.find(t => t.id === currentTourId)

  const handleAssign = (tourId: string) => {
    assign.mutate(tourId)
  }

  const handleRemove = () => {
    remove.mutate()
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    create.mutate(
      { name: newName.trim(), program: newProgram, year: newYear },
      {
        onSuccess: (tour) => {
          setShowCreate(false)
          setNewName('')
          if (tour?.id) assign.mutate(tour.id)
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading tours…
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Tour Grouping</h3>
        </div>
        {currentTour && (
          <button
            onClick={() => navigate(`/tours/${currentTour.id}`)}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
          >
            View Tour P&L <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {currentTour ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">
            <span className="font-medium">{currentTour.name}</span>
            <span className="text-slate-400 ml-1">({currentTour.program} · {currentTour.year})</span>
          </span>
          <button
            onClick={handleRemove}
            disabled={remove.isPending}
            className="ml-auto text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tours.length > 0 && (
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value=""
              onChange={e => { if (e.target.value) handleAssign(e.target.value) }}
              disabled={assign.isPending}
            >
              <option value="">Assign to a tour…</option>
              {tours.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.program} · {t.year})
                </option>
              ))}
            </select>
          )}

          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
            >
              <Plus className="w-3.5 h-3.5" /> Create new tour
            </button>
          ) : (
            <form onSubmit={handleCreate} className="bg-slate-50 rounded-lg p-3 space-y-2">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Tour name (e.g. BOSS-21 South India)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={newProgram}
                  onChange={e => setNewProgram(e.target.value as ProgramName)}
                >
                  {PROGRAMS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="2020"
                  max="2050"
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={newYear}
                  onChange={e => setNewYear(Number(e.target.value))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={create.isPending}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg text-white',
                    create.isPending ? 'bg-brand-400' : 'bg-brand-600 hover:bg-brand-700',
                  )}
                >
                  {create.isPending ? 'Creating…' : 'Create & Assign'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
