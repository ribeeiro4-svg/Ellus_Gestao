'use client'
import React, { useState } from 'react'
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Users,
  Pencil,
  Trash2,
  Calendar
} from 'lucide-react'
import { useVagas } from '@/lib/hooks/useVagas'
import { fmtR } from '@/lib/utils/formatters'
import CrudModal from '@/components/ui/CrudModal'
import type { Vaga } from '@/lib/types'

export default function VagasPage() {
  const { vagas, loading, inserir, atualizar, remover } = useVagas()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredVagas = vagas.filter(v => 
    v.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.area.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSalvar = async (data: any) => {
    if (editingVaga) {
      await atualizar(editingVaga.id, data)
    } else {
      await inserir(data)
    }
    setIsModalOpen(false)
    setEditingVaga(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberta': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'analise': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'encerrada': return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Briefcase className="text-[#2d8c6f]" />
            Gestão de Vagas
          </h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium italic">
            Cadastre e gerencie as oportunidades de estágio disponíveis na associação.
          </p>
        </div>
        <button 
          onClick={() => { setEditingVaga(null); setIsModalOpen(true) }}
          className="px-6 py-3.5 bg-[#0e2d22] text-white text-[11px] font-black rounded-2xl hover:bg-[#163d2f] transition-all flex items-center gap-3 uppercase tracking-widest shadow-xl shadow-emerald-900/10 active:scale-95 border border-emerald-500/20"
        >
          <Plus size={16} strokeWidth={4} />
          Nova Vaga
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título ou área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-emerald-500/30 transition-all shadow-sm"
          />
        </div>
        <button className="h-12 px-6 bg-white border border-slate-100 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-all flex items-center gap-3">
          <Filter size={16} />
          Filtros
        </button>
      </div>

      {/* Listagem de Vagas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
             <div key={i} className="h-64 bg-slate-50 rounded-[32px] border border-slate-100 animate-pulse"></div>
          ))
        ) : filteredVagas.map(vaga => (
          <div key={vaga.id} className="group relative bg-white p-8 rounded-[32px] border border-slate-100 hover:border-emerald-500/20 hover:shadow-2xl transition-all cursor-default overflow-hidden">
            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest border-l border-b ${getStatusBadge(vaga.status)}`}>
              {vaga.status}
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[2px]">{vaga.area}</span>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight mt-1 truncate">{vaga.titulo}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-400">
                  <MapPin size={14} />
                  <span className="text-[11px] font-bold uppercase">{vaga.modelo}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Clock size={14} />
                  <span className="text-[11px] font-bold uppercase">{vaga.carga_horaria}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Users size={14} />
                  <span className="text-[11px] font-bold uppercase">{vaga.quantidade} Vaga(s)</span>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-slate-300 font-black uppercase tracking-widest mb-0.5">Bolsa Auxílio</div>
                  <div className="text-base font-black text-[#0e2d22]">{fmtR(vaga.bolsa)}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingVaga(vaga); setIsModalOpen(true) }}
                    className="p-3 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 rounded-xl transition-all"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => confirm('Deseja excluir esta vaga?') && remover(vaga.id)}
                    className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVagas.length === 0 && !loading && (
        <div className="py-20 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
            <Briefcase size={32} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[3px]">Nenhuma vaga encontrada</p>
        </div>
      )}

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVaga ? 'Editar Vaga' : 'Nova Vaga de Estágio'}
        initialData={editingVaga}
        onSubmit={handleSalvar}
        fields={[
          { name: 'titulo', label: 'Nome da Vaga', type: 'text', required: true, placeholder: 'Ex: Estágio em Administração' },
          { name: 'area', label: 'Área / Departamento', type: 'text', required: true, placeholder: 'Ex: Financeiro, TI, RH' },
          { name: 'quantidade', label: 'Quantidade de Vagas', type: 'number', required: true, defaultValue: 1 },
          { name: 'modelo', label: 'Modelo de Trabalho', type: 'select', required: true, options: [
            { value: 'presencial', label: 'Presencial' },
            { value: 'hibrido', label: 'Híbrido' },
            { value: 'remoto', label: 'Remoto' },
          ], defaultValue: 'presencial'},
          { name: 'status', label: 'Status da Vaga', type: 'select', required: true, options: [
            { value: 'aberta', label: 'Aberta' },
            { value: 'analise', label: 'Em Análise' },
            { value: 'encerrada', label: 'Encerrada' },
          ], defaultValue: 'aberta'},
          { name: 'carga_horaria', label: 'Carga Horária', type: 'text', placeholder: 'Ex: 6h p/ dia, 30h semanais' },
          { name: 'bolsa', label: 'Bolsa Auxílio (R$)', type: 'number', placeholder: 'Ex: 1200' },
          { name: 'beneficios', label: 'Benefícios', type: 'textarea', placeholder: 'Ex: VT, VR, Seguro de Vida...' },
          { name: 'requisitos_obrigatorios', label: 'Requisitos Obrigatórios', type: 'textarea' },
          { name: 'requisitos_desejaveis', label: 'Requisitos Desejáveis', type: 'textarea' },
          { name: 'conhecimentos_sistemas', label: 'Conhecimentos em Sistemas', type: 'textarea' },
          { name: 'prazo_inscricao', label: 'Prazo de Inscrição', type: 'date' },
          { name: 'responsavel', label: 'Responsável pela Vaga', type: 'text' },
        ]}
      />
    </div>
  )
}
