import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OperationTask, MusicRelease, CreativeCampaign } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  DollarSign, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';

export const Operations: React.FC = () => {
  const { tasks, releases, campaigns, addTask, updateTask, deleteTask, currentRole, activeWorkspace } = useApp();

  const filteredReleases = useMemo(() => {
    return releases.filter(r => 
      r.workspaceId === activeWorkspace.id || 
      (!r.workspaceId && activeWorkspace.id === 'ws-lyrical-ent')
    );
  }, [releases, activeWorkspace.id]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => 
      c.workspaceId === activeWorkspace.id || 
      (!c.workspaceId && activeWorkspace.id === 'ws-lyrical-ent')
    );
  }, [campaigns, activeWorkspace.id]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.workspaceId === activeWorkspace.id || 
      (!t.workspaceId && activeWorkspace.id === 'ws-lyrical-ent')
    );
  }, [tasks, activeWorkspace.id]);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OperationTask['category']>('A&R');
  const [priority, setPriority] = useState<OperationTask['priority']>('High');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [assignee, setAssignee] = useState<string>(currentRole);
  const [notes, setNotes] = useState('');

  // Total allocated vs spent across all releases
  const totalAllocatedBudget = filteredReleases.reduce((sum: number, r: MusicRelease) => sum + (r.budgetAllocated || 0), 0) + 
    filteredCampaigns.reduce((sum: number, c: CreativeCampaign) => sum + (c.budget || 0), 0);
  const totalSpentBudget = filteredReleases.reduce((sum: number, r: MusicRelease) => sum + (r.budgetSpent || 0), 0);

  const displayTasks = filteredTasks.filter((t: OperationTask) => {
    return activeCategory === 'All' || t.category === activeCategory;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    addTask({
      title,
      category,
      priority,
      dueDate,
      assignee,
      status: 'Todo',
      notes
    });

    setTitle('');
    setNotes('');
    setIsNewTaskModalOpen(false);
  };

  const handleUpdateStatus = (id: string, status: OperationTask['status']) => {
    updateTask(id, { status });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            OPERATIONS & LABEL WORKFLOW
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Task execution pipelines, budget allocations, A&R deadlines, and meeting records
          </p>
        </div>

        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>New Task Directive</span>
        </button>
      </div>

      {/* Operational KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>ACTIVE TASKS</span>
            <CheckSquare size={14} />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {filteredTasks.filter((t: OperationTask) => t.status !== 'Done').length}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">IN QUEUE</div>
        </div>

        <div className="p-4 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>COMPLETED</span>
            <CheckCircle2 size={14} />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {filteredTasks.filter((t: OperationTask) => t.status === 'Done').length}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">SIGN OFFS</div>
        </div>

        <div className="p-4 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>TOTAL BUDGET ALLOCATED</span>
            <DollarSign size={14} />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            ${totalAllocatedBudget.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">CATALOG & CAMPAIGNS</div>
        </div>

        <div className="p-4 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>EXPENDED TO DATE</span>
            <DollarSign size={14} />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            ${totalSpentBudget.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">
            {totalAllocatedBudget > 0 ? `${Math.round((totalSpentBudget / totalAllocatedBudget) * 100)}% EXPENDED` : '0%'}
          </div>
        </div>
      </div>

      {/* Task Filters */}
      <div className="flex items-center gap-1 p-1 bg-[#121212] border border-[#242424] rounded overflow-x-auto">
        {(['All', 'A&R', 'Creative', 'Legal', 'Distribution', 'Marketing'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-mono whitespace-nowrap rounded ${
              activeCategory === cat ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {cat} Tasks
          </button>
        ))}
      </div>

      {/* Task Kanban Columns: Todo, In Progress, In Review, Done */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['Todo', 'In Progress', 'In Review', 'Done'] as OperationTask['status'][]).map(colStatus => {
          const colTasks = displayTasks.filter((t: OperationTask) => t.status === colStatus);

          return (
            <div key={colStatus} className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-4 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-2 mb-3">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  {colStatus}
                </span>
                <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-neutral-600 font-mono">
                    No tasks in {colStatus.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task: OperationTask) => (
                    <div 
                      key={task.id}
                      className="p-3 bg-[#121212] border border-[#1E1E1E] rounded-md hover:border-[#333333] transition-colors group"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                        <span>{task.category}</span>
                        <span className={`font-semibold ${
                          task.priority === 'Urgent' ? 'text-white' : 'text-neutral-400'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white leading-snug">
                        {task.title}
                      </h4>

                      <div className="mt-2 text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                        <span>Due: {task.dueDate}</span>
                        <span>{task.assignee}</span>
                      </div>

                      {/* Status switcher */}
                      <div className="mt-3 pt-2 border-t border-[#1C1C1C] flex items-center justify-between">
                        <select
                          value={task.status}
                          onChange={e => handleUpdateStatus(task.id, e.target.value as any)}
                          className="bg-[#181818] border border-[#2B2B2B] text-[10px] font-mono text-neutral-300 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                        >
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="In Review">In Review</option>
                          <option value="Done">Done</option>
                        </select>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-neutral-500 hover:text-red-400 p-0.5 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E0E0E] border border-[#242424] rounded-lg p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">Create Operation Task</h3>
            <p className="text-xs text-neutral-400 mb-5">Assign critical directive to label operational staff</p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">TASK DIRECTIVE *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Master tape alignment and metadata sign-off"
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">CATEGORY *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                  >
                    <option value="A&R">A&R</option>
                    <option value="Creative">Creative</option>
                    <option value="Legal">Legal</option>
                    <option value="Distribution">Distribution</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">PRIORITY</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">DUE DATE *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">ASSIGNEE</label>
                  <input
                    type="text"
                    value={assignee}
                    onChange={e => setAssignee(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#1C1C1C] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
