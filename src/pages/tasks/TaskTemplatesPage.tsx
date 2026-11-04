import { useState } from 'react'
import { Header } from '../../components/layout/Header'
import { Modal } from '../../components/ui/Modal'
import { useRole } from '../../hooks/useRole'
import {
  useTaskTemplates, useCreateTaskTemplate, useUpdateTaskTemplate,
  useDeleteTaskTemplate, useAddTaskTemplateItem,
  useUpdateTaskTemplateItem, useDeleteTaskTemplateItem,
} from '../../hooks/useTaskTemplates'
import type { TaskTemplate, TaskTemplateItem } from '../../types'
import {
  Plus, Loader2, ClipboardList, Trash2, Pencil, ChevronDown, ChevronUp, Check, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PROGRAMS = ['BOSS', 'UBM', 'MSGB', 'VK-M', 'Generic']
const CATEGORIES = ['logistics', 'setup', 'coordination', 'technical', 'catering', 'decoration', 'security', 'hospitality', 'documentation', 'other']
const PRIORITIES = ['critical', 'high', 'medium', 'low']
const ROLES = ['event_manager', 'office_staff', 'onsite_staff', 'procurement_staff']

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  }
  return map[p] ?? 'bg-slate-100 text-slate-600'
}

// ── Item row (inline edit) ──────────────────────────────────────────
function TemplateItemRow({ item, canEdit, onDelete }: {
  item: TaskTemplateItem
  canEdit: boolean
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [category, setCategory] = useState(item.category)
  const [priority, setPriority] = useState(item.priority)
  const [daysBeforeEvent, setDaysBeforeEvent] = useState<string>(
    item.days_before_event != null ? String(item.days_before_event) : ''
  )
  const [defaultRole, setDefaultRole] = useState(item.default_role ?? '')
  const updateItem = useUpdateTaskTemplateItem()

  function save() {
    if (!title.trim()) return
    updateItem.mutate({
      id: item.id,
      title: title.trim(),
      category,
      priority,
      days_before_event: daysBeforeEvent !== '' ? Number(daysBeforeEvent) : undefined,
      default_role: defaultRole || undefined,
    })
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0 border-slate-50 hover:bg-slate-50 group">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-800">{item.title}</span>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-400 capitalize bg-slate-100 px-1.5 rounded">{item.category}</span>
            <span className={`text-[10px] px-1.5 rounded capitalize ${priorityBadge(item.priority)}`}>{item.priority}</span>
            {item.days_before_event != null && (
              <span className="text-[10px] text-slate-400">{item.days_before_event}d before event</span>
            )}
            {item.default_role && (
              <span className="text-[10px] text-slate-400 capitalize">{item.default_role.replace('_', ' ')}</span>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm p-1.5">
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button onClick={() => onDelete(item.id)} className="btn btn-ghost btn-sm p-1.5">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex flex-col gap-2">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="input text-sm"
        placeholder="Task title"
        autoFocus
      />
      <div className="flex gap-2 flex-wrap">
        <select value={category} onChange={e => setCategory(e.target.value)} className="input text-xs flex-1 min-w-[120px]">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} className="input text-xs flex-1 min-w-[100px]">
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          type="number"
          value={daysBeforeEvent}
          onChange={e => setDaysBeforeEvent(e.target.value)}
          placeholder="Days before event"
          className="input text-xs w-36"
          min={0}
        />
        <select value={defaultRole} onChange={e => setDefaultRole(e.target.value)} className="input text-xs flex-1 min-w-[140px]">
          <option value="">Role (optional)</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={updateItem.isPending} className="btn btn-primary btn-sm">
          <Check className="w-3.5 h-3.5" /> Save
        </button>
        <button onClick={() => setEditing(false)} className="btn btn-secondary btn-sm">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  )
}

// ── Template card ───────────────────────────────────────────────────
function TemplateCard({ tpl, canEdit }: { tpl: TaskTemplate; canEdit: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('logistics')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDays, setNewDays] = useState('')
  const [newRole, setNewRole] = useState('')
  const [editingMeta, setEditingMeta] = useState(false)
  const [metaName, setMetaName] = useState(tpl.name)
  const [metaProgram, setMetaProgram] = useState(tpl.program ?? '')

  const addItem    = useAddTaskTemplateItem()
  const deleteItem = useDeleteTaskTemplateItem()
  const deleteTpl  = useDeleteTaskTemplate()
  const updateTpl  = useUpdateTaskTemplate()

  const items = tpl.task_template_items ?? []

  function handleAddItem() {
    if (!newTitle.trim()) return
    addItem.mutate({
      template_id: tpl.id,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      days_before_event: newDays !== '' ? Number(newDays) : undefined,
      default_role: newRole || undefined,
      sort_order: items.length,
    }, {
      onSuccess: () => {
        setNewTitle(''); setNewDays(''); setNewRole('')
        setShowAddItem(false)
        toast.success('Task added')
      },
    })
  }

  function saveMeta() {
    if (!metaName.trim()) return
    updateTpl.mutate({ id: tpl.id, name: metaName.trim(), program: metaProgram || undefined })
    setEditingMeta(false)
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
          <ClipboardList className="w-4.5 h-4.5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          {editingMeta ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input value={metaName} onChange={e => setMetaName(e.target.value)} className="input text-sm h-8 w-48" autoFocus />
              <select value={metaProgram} onChange={e => setMetaProgram(e.target.value)} className="input text-sm h-8">
                <option value="">Generic</option>
                {PROGRAMS.filter(p => p !== 'Generic').map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={saveMeta} className="btn btn-primary btn-sm h-8"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditingMeta(false)} className="btn btn-secondary btn-sm h-8"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900 truncate">{tpl.name}</p>
              {tpl.program && (
                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">{tpl.program}</span>
              )}
              <span className="text-xs text-slate-400">{items.length} tasks</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && !editingMeta && (
            <>
              <button onClick={() => setEditingMeta(true)} className="btn btn-ghost btn-sm p-1.5" title="Rename">
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => { if (confirm('Delete this template?')) deleteTpl.mutate(tpl.id) }}
                className="btn btn-ghost btn-sm p-1.5" title="Delete template"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </>
          )}
          <button onClick={() => setExpanded(v => !v)} className="btn btn-ghost btn-sm p-1.5">
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100">
          {items.length === 0 && !showAddItem && (
            <p className="text-xs text-slate-400 text-center py-5">No tasks yet — add the first one</p>
          )}

          {items
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(item => (
              <TemplateItemRow
                key={item.id}
                item={item}
                canEdit={canEdit}
                onDelete={id => deleteItem.mutate(id)}
              />
            ))}

          {canEdit && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
              {!showAddItem ? (
                <button
                  onClick={() => setShowAddItem(true)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add task
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Task title"
                    className="input text-sm"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleAddItem() }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input text-xs flex-1 min-w-[120px]">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="input text-xs flex-1 min-w-[100px]">
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input
                      type="number"
                      value={newDays}
                      onChange={e => setNewDays(e.target.value)}
                      placeholder="Days before event"
                      className="input text-xs w-36"
                      min={0}
                    />
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input text-xs flex-1 min-w-[140px]">
                      <option value="">Role (optional)</option>
                      {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddItem} disabled={addItem.isPending} className="btn btn-primary btn-sm">
                      <Check className="w-3.5 h-3.5" /> Add
                    </button>
                    <button onClick={() => { setShowAddItem(false); setNewTitle('') }} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────
export function TaskTemplatesPage() {
  const { isAdmin } = useRole()
  const { data: templates = [], isLoading } = useTaskTemplates()
  const createTpl = useCreateTaskTemplate()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newProgram, setNewProgram] = useState('')

  function handleCreate() {
    if (!newName.trim()) return
    createTpl.mutate(
      { name: newName.trim(), program: newProgram || undefined },
      { onSuccess: () => { setShowCreate(false); setNewName(''); setNewProgram('') } }
    )
  }

  return (
    <>
      <Header title="Task Templates" subtitle="Reusable task sets per program" />
      <main className="p-4 md:p-6 flex flex-col gap-4">

        {isAdmin() && (
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> New Template
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading templates…
          </div>
        )}

        {!isLoading && templates.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">No task templates yet</p>
            <p className="text-sm mt-1 mb-4">Create templates for BOSS, UBM, MSGB, VK-M to auto-generate prep tasks for each event</p>
            {isAdmin() && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Create First Template
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {templates.map(tpl => (
            <TemplateCard key={tpl.id} tpl={tpl} canEdit={isAdmin()} />
          ))}
        </div>
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Task Template">
        <div className="flex flex-col gap-4 p-4">
          <div>
            <label className="label">Template Name</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. BOSS Standard Prep"
              className="input"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            />
          </div>
          <div>
            <label className="label">Program (optional)</label>
            <select value={newProgram} onChange={e => setNewProgram(e.target.value)} className="input">
              <option value="">Generic (all programs)</option>
              {PROGRAMS.filter(p => p !== 'Generic').map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={!newName.trim() || createTpl.isPending} className="btn btn-primary">
              Create Template
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
