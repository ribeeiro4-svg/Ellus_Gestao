import React, { useState } from 'react';
import { ListChecks, Plus, CheckCircle2, Circle, AlertCircle, Clock, User } from 'lucide-react';

export default function SlidePlanoAcao() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Campanha de Renegociação de Inadimplentes',
      owner: 'Diretoria Financeira',
      deadline: '15/Ago/2026',
      priority: 'high',
      status: 'pending',
    },
    {
      id: 2,
      title: 'Auditoria nos contratos de fornecedores de TI',
      owner: 'Operações',
      deadline: '30/Ago/2026',
      priority: 'medium',
      status: 'in_progress',
    },
    {
      id: 3,
      title: 'Aprovação do novo orçamento de Marketing',
      owner: 'Conselho Administrativo',
      deadline: '05/Set/2026',
      priority: 'low',
      status: 'completed',
    }
  ]);

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

  const toggleTaskStatus = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'completed' ? 'pending' : 'completed' };
      }
      return t;
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <ListChecks className="text-emerald-400" size={36} /> Plano de Ação Executável
          </h1>
          <p className="text-white/50 text-lg">
            Acompanhamento das decisões tomadas e delegação de tarefas (Modo Conselho).
          </p>
        </div>
        
        <button className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-5 py-3 rounded-xl font-bold transition-all">
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
                  <button 
                    onClick={() => toggleTaskStatus(task.id)}
                    className="hover:scale-110 transition-transform"
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={24} className="text-emerald-400" />
                    ) : (
                      <Circle size={24} className="text-white/20 hover:text-emerald-400/50" />
                    )}
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
                
                <div className="col-span-1 flex justify-center">
                  <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`} title={getPriorityLabel(task.priority)}>
                    {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MED' : 'BAIXA'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
