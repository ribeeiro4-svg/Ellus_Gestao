import React, { useState } from 'react';
import { ListChecks, Plus, CheckCircle2, Circle, AlertCircle, Clock, User } from 'lucide-react';

import { Trash2 } from 'lucide-react';

export interface PlanoAcaoTask {
  id: number;
  title: string;
  owner: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

interface SlidePlanoAcaoProps {
  tasks: PlanoAcaoTask[];
  onToggleStatus: (id: number) => void;
  onAddTask: (task: Omit<PlanoAcaoTask, 'id' | 'status'>) => void;
  onRemoveTask: (id: number) => void;
}

export default function SlidePlanoAcao({ tasks, onToggleStatus, onAddTask, onRemoveTask }: SlidePlanoAcaoProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState<Omit<PlanoAcaoTask, 'id' | 'status'>>({ title: '', owner: '', deadline: '', priority: 'medium' });

  const handleSave = () => {
    if (!newTask.title || !newTask.owner || !newTask.deadline) return;
    onAddTask(newTask);
    setNewTask({ title: '', owner: '', deadline: '', priority: 'medium' });
    setIsAdding(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-white/50 bg-white/5 border-white/10';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta Prioridade';
      case 'medium': return 'Média Prioridade';
      case 'low': return 'Baixa Prioridade';
      default: return 'Normal';
    }
  };


  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative z-[201]">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <ListChecks className="text-emerald-400" size={36} /> Plano de Ação Executável
          </h1>
          <p className="text-white/50 text-lg">
            Acompanhamento das decisões tomadas e delegação de tarefas (Modo Conselho).
          </p>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-5 py-3 rounded-xl font-bold transition-all"
        >
          <Plus size={18} />
          Nova Deliberação
        </button>
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-2 overflow-hidden flex flex-col">
        {/* Header da Tabela */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-black uppercase tracking-widest text-white/40">
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-5">Deliberação / Tarefa</div>
          <div className="col-span-3">Responsável</div>
          <div className="col-span-2">Prazo</div>
          <div className="col-span-1 text-center">Nível</div>
        </div>

        {/* Lista de Tarefas */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isAdding && (
            <div className="grid grid-cols-12 gap-4 p-4 items-center rounded-xl border bg-[#06140f] border-emerald-500/30">
              <div className="col-span-1 flex justify-center text-emerald-500"><AlertCircle size={20} /></div>
              <div className="col-span-5"><input autoFocus type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Título da deliberação..." className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50" /></div>
              <div className="col-span-3"><input type="text" value={newTask.owner} onChange={e => setNewTask({...newTask, owner: e.target.value})} placeholder="Ex: Diretoria..." className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50" /></div>
              <div className="col-span-2"><input type="text" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} placeholder="DD/Mmm/AAAA" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500/50" /></div>
              <div className="col-span-1 flex flex-col gap-2">
                <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as 'high'|'medium'|'low'})} className="bg-black/50 border border-white/10 rounded text-xs p-1 outline-none">
                  <option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option>
                </select>
                <div className="flex justify-between gap-1 mt-1">
                  <button onClick={() => setIsAdding(false)} className="text-[10px] uppercase font-bold text-white/50 hover:text-white px-2 py-1 bg-white/5 rounded">Cancelar</button>
                  <button onClick={handleSave} className="text-[10px] uppercase font-bold text-emerald-900 bg-emerald-500 hover:bg-emerald-400 px-2 py-1 rounded">Salvar</button>
                </div>
              </div>
            </div>
          )}

          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div 
                key={task.id} 
                className={`grid grid-cols-12 gap-4 p-4 items-center rounded-xl border transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' 
                    : 'bg-[#06140f]/60 border-white/5 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="col-span-1 flex justify-center">
                  <button onClick={() => onToggleStatus(task.id)} className={`transition-all ${isCompleted ? 'text-emerald-400 hover:text-emerald-300' : 'text-white/20 hover:text-emerald-400'}`}>
                    {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                </div>
                
                <div className="col-span-5">
                  <p className={`text-base font-bold ${isCompleted ? 'text-white/50 line-through' : 'text-white/90'}`}>
                    {task.title}
                  </p>
                </div>
                
                <div className="col-span-3 flex items-center gap-2 text-white/60">
                  <User size={14} className="text-emerald-400/50" />
                  <span className="text-sm font-semibold">{task.owner}</span>
                </div>
                
                <div className="col-span-2 flex items-center gap-2 text-white/60">
                  <Clock size={14} className={isCompleted ? 'text-white/20' : 'text-amber-400/70'} />
                  <span className="text-sm font-semibold">{task.deadline}</span>
                </div>
                
                <div className="col-span-1 text-center flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Med' : 'Baixa'}
                  </span>
                  <button onClick={() => onRemoveTask(task.id)} className="text-white/10 hover:text-rose-500 transition-colors" title="Remover tarefa">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
