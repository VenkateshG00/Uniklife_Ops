import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '../../components/layout/Header'
import { Modal } from '../../components/ui/Modal'
import { useTasksByOrg, useCreateTaskFromOrg, useUpdateTaskStatus, useUpdateTaskFromOrg, useClaimTask, useReleaseTask } from '../../hooks/useTasks'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRole } from '../../hooks/useRole'
import { cn, formatDateTime } from '../../lib/utils'
import type { TaskStatus, Priority } from '../../types'
import {
  Loader2, CheckCircle2, Clock, ClipboardList,
  Filter, Plus, User, Calendar, AlertTriangle, Hand, Undo2, Pencil, LayoutTemplate,
} from 'lucide-react'

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'badge-pending' },
  in_progress: { label: 'In Progress', color: 'badge-inprogress' },
  completed:   { label: 'Completed',   color: 'badge-completed' },
  overdue:     { label: 'Overdue',     color: 'badge-critical' },
  blocked:     { label: 'Blocked',     color: 'badge-blocked' },
  cancelled:   { label: 'Cancelled',   color: 'badge-pending' },
}

const TASK_CATEGORIES = [
  'logistics', 'setup', 'coordination', 'technical', 'catering',
  'decoration', 'security', 'hospitality', 'documentation', 'other',
]

const taskSchema = z.object({
  title:             z.string().min(2, 'Title required'),
  description:       z.string().optional(),
  category:          z.string().min(1, 'Category required'),
  priority:          z.enum(['critical', 'high', 'medium', 'low']),
  assigned_to_id:    z.string().optional(),
  operation_plan_id: z.string().min(1, 'Link to event is required'),
  deadline:          z.string().min(1, 'Deadline is required'),
})
type TaskForm = z.infer<typeof taskSchema>

type FilterOption = 'all' | 'mine' | 'pending' | 'in_progress' | 'completed' | 'overdue'

export function TasksPage() {
  const navigate = useNavigate()
  const { canWrite } = useRole()
  const orgId = useAuthStore(s => s.profile?.organization_id)
  const userId = useAuthStore(s => s.user?.id)
  const { data: tasks = [], isLoading } = useTasksByOrg()
  const createTask = useCreateTaskFromOrg()
  const updateTask = useUpdateTaskFromOrg()
  const updateStatus = useUpdateTaskStatus('')
  const claimTask = useClaimTask()
  const releaseTask = useReleaseTask()
  const [editTask, setEditTask] = useState<any | null>(null)
  const [filter, setFilter] = useState<FilterOption>('all')
  const [showAdd, setShowAdd] = useState(false)

  // Staff for assignment dropdown
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff-list', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, job_title')
        .eq('organization_id', orgId!)
        .eq('is_active', true)
        .in('role', ['event_manager', 'office_staff', 'onsite_staff', 'procurement_staff'])
        .order('full_name')
      if (error) throw error
      return data as { id: string; full_name: string; role: string; job_title: string | null }[]
    },
    enabled: !!orgId,
    staleTime: 60_000,
  })

  // Operation plans for event dropdown
  const { data: plans = [] } = useQuery({
    queryKey: ['plans-list', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_operation_plans')
        .select('id, event_id, events(title, start_datetime)')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as { id: string; event_id: string; events: { title: string; start_datetime: string } | null }[]
    },
    enabled: !!orgId,
    staleTime: 60_000,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(taskSchema) as any,
    defaultValues: { priority: 'medium', category: 'logistics' },
  })

  useEffect(() => {
    if (editTask) {
      reset({
        title:             editTask.title ?? '',
        description:       (editTask.description ?? '').replace(/^\[Released by[^\]]+\]\n?/, ''),
        category:          editTask.category ?? 'logistics',
        priority:          editTask.priority ?? 'medium',
        assigned_to_id:    editTask.assigned_to_id ?? '',
        operation_plan_id: editTask.operation_plan_id ?? '',
        deadline:          editTask.deadline ? new Date(editTask.deadline).toISOString().slice(0, 16) : '',
      })
    }
  }, [editTask, reset])

  const onEdit = async (values: TaskForm) => {
    if (!editTask) return
    await updateTask.mutateAsync({
      id:                editTask.id,
      title:             values.title,
      description:       values.description || undefined,
      category:          values.category,
      priority:          values.priority as Priority,
      assigned_to_id:    values.assigned_to_id || undefined,
      operation_plan_id: values.operation_plan_id,
      event_id:          plans.find(p => p.id === values.operation_plan_id)?.event_id || undefined,
      deadline:          new Date(values.deadline).toISOString(),
    })
    setEditTask(null)
    reset()
  }

  const onAdd = async (values: TaskForm) => {
    await createTask.mutateAsync({
      title: values.title,
      description: values.description || undefined,
      category: values.category,
      priority: values.priority as Priority,
      assigned_to_id: values.assigned_to_id || undefined,
      operation_plan_id: values.operation_plan_id,
      event_id: plans.find(p => p.id === values.operation_plan_id)?.event_id || undefined,
      deadline: new Date(values.deadline).toISOString(),
      status: 'pending',
      escalation_state: 'none',
      proof_urls: [],
    })
    reset()
    setShowAdd(false)
  }

  const filtered = tasks.filter((t: any) => {
    const isOverdue = t.deadline && !['completed', 'cancelled'].includes(t.status)
      && new Date(t.deadline) < new Date()
    if (filter === 'all') return true
    if (filter === 'mine') return t.assigned_to_id === userId
    if (filter === 'overdue') return isOverdue
    return t.status === filter
  })

  const overdueCnt = tasks.filter((t: any) =>
    t.deadline && !['completed', 'cancelled'].includes(t.status)
    && new Date(t.deadline) < new Date()
  ).length

  return (
    <>
      <Header title="Tasks" subtitle="All tasks across every operation" />
      <main className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {([
              ['all',         'All',         tasks.length],
              ['mine',        "My Task's",   tasks.filter((t: any) => t.assigned_to_id === userId).length],
              ['pending',     'Pending',     tasks.filter((t: any) => t.status === 'pending').length],
              ['in_progress', 'In Progress', tasks.filter((t: any) => t.status === 'in_progress').length],
              ['completed',   'Completed',   tasks.filter((t: any) => t.status === 'completed').length],
              ['overdue',     'Overdue',     overdueCnt],
            ] as [FilterOption, string, number][]).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                  filter === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  key === 'overdue' && count > 0 && filter !== key && 'bg-red-100 text-red-600'
                )}
              >
                {label} <span className="ml-1 opacity-70">{count}</span>
              </button>
            ))}
          </div>

          {canWrite() && (
            <div className="flex items-center gap-2 shrink-0">
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/task-templates')}>
                <LayoutTemplate className="w-4 h-4" /> Templates
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading tasks…
          </div>
        )}

        {!isLoading && tasks.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No tasks yet</p>
            <p className="text-sm mt-1 mb-4">Create a task and assign it to a staff member</p>
            {canWrite() && (
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" /> Add First Task
              </button>
            )}
          </div>
        )}

        {!isLoading && tasks.length > 0 && filtered.length === 0 && (
          <div className="card p-8 text-center text-slate-400 text-sm">No tasks match this filter</div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map((task: any) => {
              const s = STATUS_CONFIG[task.status as TaskStatus] ?? STATUS_CONFIG.pending
              const isOverdue = task.deadline && !['completed', 'cancelled'].includes(task.status)
                && new Date(task.deadline) < new Date()
              return (
                <div
                  key={task.id}
                  className={cn(
                    'card p-4 md:p-5 flex items-start gap-3 md:gap-4',
                    isOverdue && 'border-red-200 bg-red-50/30'
                  )}
                >
                  {/* Complete toggle */}
                  <button
                    onClick={() => updateStatus.mutate({
                      id: task.id,
                      status: task.status === 'completed' ? 'pending' : 'completed',
                    })}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                      task.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 hover:border-brand-400'
                    )}
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1.5">
                      <p className={cn(
                        'font-semibold text-slate-900',
                        task.status === 'completed' && 'line-through text-slate-400'
                      )}>{task.title}</p>
                      <span className={`badge ${s.color}`}>{s.label}</span>
                      {isOverdue && (
                        <span className="badge badge-critical flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                      {!task.assigned_to_id && task.description?.startsWith('[Released by') && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5">
                          <Undo2 className="w-3 h-3" /> Returned
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 mb-1.5">
                        {task.description.replace(/^\[Released by[^\]]+\]\n?/, '')}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {task.events?.title && (
                        <span
                          className="flex items-center gap-1 text-brand-600 cursor-pointer hover:underline font-medium"
                          onClick={() => navigate('/operations')}
                        >
                          <Calendar className="w-3 h-3" /> {task.events.title}
                        </span>
                      )}
                      <span className="capitalize bg-slate-100 px-1.5 py-0.5 rounded">
                        {task.category.replace(/_/g, ' ')}
                      </span>
                      {task.profiles?.full_name && (
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <User className="w-3 h-3" />
                          {task.status === 'completed' ? 'Done by ' : ''}
                          {task.profiles.full_name}
                          {(task.profiles as any).job_title && (
                            <span className="text-slate-400 font-normal">({(task.profiles as any).job_title})</span>
                          )}
                        </span>
                      )}
                      {task.profiles?.full_name && task.assigned_to_id === userId && task.status !== 'completed' && (
                        <button
                          onClick={() => releaseTask.mutate({ taskId: task.id, currentDesc: task.description })}
                          disabled={releaseTask.isPending}
                          className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5 hover:bg-rose-100 transition-colors"
                        >
                          <Undo2 className="w-3 h-3" /> Release
                        </button>
                      )}
                      {!task.profiles?.full_name && task.status !== 'completed' && (
                        <button
                          onClick={() => claimTask.mutate(task.id)}
                          disabled={claimTask.isPending}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 hover:bg-amber-100 transition-colors"
                        >
                          <Hand className="w-3 h-3" /> Claim Task
                        </button>
                      )}
                      {!task.profiles?.full_name && task.status === 'completed' && (
                        <span className="text-slate-300 italic text-xs">Completed</span>
                      )}
                      {task.deadline && (
                        <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500 font-semibold')}>
                          <Clock className="w-3 h-3" /> {formatDateTime(task.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status selector + edit */}
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={task.status}
                      onChange={e => updateStatus.mutate({ id: task.id, status: e.target.value as TaskStatus })}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 cursor-pointer hidden sm:block"
                      disabled={updateStatus.isPending}
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    {canWrite() && (
                      <button
                        onClick={() => setEditTask(task)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-300 transition-colors"
                        title="Edit task"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Edit Task Modal */}
      <Modal open={!!editTask} onClose={() => { setEditTask(null); reset() }} title="Edit Task" size="md">
        <form onSubmit={handleSubmit(onEdit)} className="space-y-4">

          <div>
            <label className="label">Task Title *</label>
            <input
              {...register('title')}
              className={cn('input', errors.title && 'input-error')}
              placeholder="e.g. Set up stage lighting"
            />
            {errors.title && <p className="error-msg">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="input resize-none"
              placeholder="Any details or instructions…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select {...register('category')} className="input">
                {TASK_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Assign to Staff</label>
            <select {...register('assigned_to_id')} className="input">
              <option value="">— Open to All —</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}{s.job_title ? ` (${s.job_title})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Link to Event *</label>
            <select {...register('operation_plan_id')} className={cn('input', errors.operation_plan_id && 'input-error')}>
              <option value="">— Select an event —</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {(p.events as any)?.title ?? p.id.slice(0, 8)}
                </option>
              ))}
            </select>
            {errors.operation_plan_id && <p className="error-msg">{errors.operation_plan_id.message}</p>}
          </div>

          <div>
            <label className="label">Deadline *</label>
            <input type="datetime-local" {...register('deadline')} className={cn('input', errors.deadline && 'input-error')} />
            {errors.deadline && <p className="error-msg">{errors.deadline.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setEditTask(null); reset() }} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={updateTask.isPending} className="btn btn-primary px-6">
              {updateTask.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset() }} title="Add Task" size="md">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">

          <div>
            <label className="label">Task Title *</label>
            <input
              {...register('title')}
              className={cn('input', errors.title && 'input-error')}
              placeholder="e.g. Set up stage lighting, Confirm caterer arrival"
            />
            {errors.title && <p className="error-msg">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              {...register('description')}
              rows={2}
              className="input resize-none"
              placeholder="Any details or instructions…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select {...register('category')} className="input">
                {TASK_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Assign to staff */}
          <div>
            <label className="label">Assign to Staff</label>
            <select {...register('assigned_to_id')} className="input">
              <option value="">— Open to All —</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name}{s.job_title ? ` (${s.job_title})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Link to event/plan */}
          <div>
            <label className="label">Link to Event *</label>
            <select {...register('operation_plan_id')} className={cn('input', errors.operation_plan_id && 'input-error')}>
              <option value="">— Select an event —</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {(p.events as any)?.title ?? p.id.slice(0, 8)}
                </option>
              ))}
            </select>
            {errors.operation_plan_id && <p className="error-msg">{errors.operation_plan_id.message}</p>}
          </div>

          {/* Deadline */}
          <div>
            <label className="label">Deadline *</label>
            <input type="datetime-local" {...register('deadline')} className={cn('input', errors.deadline && 'input-error')} />
            {errors.deadline && <p className="error-msg">{errors.deadline.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAdd(false); reset() }} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createTask.isPending} className="btn btn-primary px-6">
              {createTask.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
