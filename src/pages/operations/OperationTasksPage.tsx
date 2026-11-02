import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '../../components/layout/Header'
import { Modal } from '../../components/ui/Modal'
import { useTasksByPlan, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '../../hooks/useTasks'
import { useOperationPlanById } from '../../hooks/useEvents'
import { useStaff } from '../../hooks/useStaff'
import { cn, formatDateTime } from '../../lib/utils'
import type { TaskStatus, Priority } from '../../types'
import {
  Plus, ArrowLeft, Loader2, Trash2, CheckCircle2, Clock, ClipboardList
} from 'lucide-react'

const taskSchema = z.object({
  title:          z.string().min(1, 'Title required'),
  description:    z.string().optional(),
  category:       z.string().min(1, 'Category required'),
  priority:       z.enum(['critical','high','medium','low']),
  assigned_to_id: z.string().optional(),
  deadline:       z.string().optional(),
})
type TaskForm = z.infer<typeof taskSchema>

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'badge-pending' },
  in_progress: { label: 'In Progress', color: 'badge-inprogress' },
  completed:   { label: 'Completed',   color: 'badge-completed' },
  overdue:     { label: 'Overdue',     color: 'badge-critical' },
  blocked:     { label: 'Blocked',     color: 'badge-blocked' },
  cancelled:   { label: 'Cancelled',   color: 'badge-pending' },
}

const PRIORITIES: Priority[] = ['critical','high','medium','low']
const CATEGORIES = ['venue','logistics','catering','av_tech','security','registration','staff','communications','general']

export function OperationTasksPage() {
  const { id: planId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)

  const { data: plan } = useOperationPlanById(planId ?? '')
  const { data: tasks = [], isLoading } = useTasksByPlan(planId ?? '')
  const { data: staff = [] } = useStaff()
  const createTask = useCreateTask(planId ?? '')
  const updateStatus = useUpdateTaskStatus(planId ?? '')
  const deleteTask = useDeleteTask(planId ?? '')

  const ev = (plan as any)?.events

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium', category: 'general' },
  })

  const onAdd = (values: TaskForm) => {
    createTask.mutate({
      ...values,
      event_id: (plan as any)?.event_id,
      deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
      assigned_to_id: values.assigned_to_id || undefined,
    }, {
      onSuccess: () => { setShowAdd(false); reset() }
    })
  }

  const pending = tasks.filter(t => !['completed','cancelled'].includes(t.status)).length
  const done = tasks.filter(t => t.status === 'completed').length

  return (
    <>
      <Header
        title="Task Assignments"
        subtitle={ev ? `${ev.title}` : 'Manage tasks for this operation'}
      />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => navigate(`/operations/${planId}`)} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" /> Control Center
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        {/* KPI row */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{tasks.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{pending}</p>
              <p className="text-xs text-slate-400 mt-0.5">Pending</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{done}</p>
              <p className="text-xs text-slate-400 mt-0.5">Done</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading tasks…
          </div>
        )}

        {!isLoading && tasks.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No tasks yet</p>
            <p className="text-sm mt-1 mb-4">Add tasks to assign work to your team</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Add First Task
            </button>
          </div>
        )}

        {tasks.length > 0 && (
          <div className="flex flex-col gap-3">
            {tasks.map(task => {
              const s = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending
              const isOverdue = task.deadline && !['completed','cancelled'].includes(task.status)
                && new Date(task.deadline) < new Date()
              return (
                <div key={task.id} className={cn(
                  'card p-5 flex items-start gap-4',
                  isOverdue && 'border-red-200 bg-red-50/30'
                )}>
                  <button
                    onClick={() => updateStatus.mutate({
                      id: task.id,
                      status: task.status === 'completed' ? 'pending' : 'completed' as TaskStatus
                    })}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                      task.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 hover:border-brand-400'
                    )}
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className={cn(
                        'font-semibold text-slate-900',
                        task.status === 'completed' && 'line-through text-slate-400'
                      )}>{task.title}</p>
                      <span className={`badge ${s.color}`}>{s.label}</span>
                      {task.priority === 'critical' && (
                        <span className="badge badge-critical">Critical</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-400">
                      <span className="capitalize">{task.category.replace('_',' ')}</span>
                      {(task as any).profiles?.full_name && (
                        <span>→ {(task as any).profiles.full_name}</span>
                      )}
                      {task.deadline && (
                        <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500')}>
                          <Clock className="w-3 h-3" /> {formatDateTime(task.deadline)}
                          {isOverdue && ' (overdue)'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={task.status}
                      onChange={e => updateStatus.mutate({ id: task.id, status: e.target.value as TaskStatus })}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 cursor-pointer"
                      disabled={updateStatus.isPending}
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteTask.mutate(task.id)}
                      className="btn btn-ghost btn-sm text-red-400 hover:text-red-600 p-1"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Add Task" size="md">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div>
            <label className="label">Task Title *</label>
            <input {...register('title')} className={cn('input', errors.title && 'input-error')} placeholder="e.g. Set up registration desk" />
            {errors.title && <p className="error-msg">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea {...register('description')} rows={2} className="input resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select {...register('category')} className="input">
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Assign To</label>
              <select {...register('assigned_to_id')} className="input">
                <option value="">Unassigned</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Deadline</label>
              <input type="datetime-local" {...register('deadline')} className="input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAdd(false); reset() }} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={createTask.isPending} className="btn btn-primary px-6">
              {createTask.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
