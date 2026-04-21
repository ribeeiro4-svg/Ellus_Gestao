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
  Calendar,
  UserPlus
} from 'lucide-react'
import { useVagas } from '@/lib/hooks/useVagas'
import { useCandidatos } from '@/lib/hooks/useCandidatos'
import { fmtR } from '@/lib/utils/formatters'
import CrudModal from '@/components/ui/CrudModal'
import type { Vaga } from '@/lib/types'

export default function VagasTab() {
  const { vagas, loading, inserir, atualizar, remover } = useVagas()
  const { candidatos, inserir: inserirCandidato } = useCandidatos()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCandModalOpen, setIsCandModalOpen] = useState(false)
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null)
  const [selectedVagaId, setSelectedVagaId] = useState('')
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

  const handleSalvarCandidato = async (data: any) => {
    await inserirCandidato({ ...data, vaga_id: selectedVagaId, status: 'inscrito' })
    setIsCandModalOpen(false)
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
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Briefcase className="text-[#2d8c6f]" size={20} /> Gestão de Vagas
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium italic">
            Cadastre e gerencie as oportunidades de estágio disponíveis na associação.
          </p>
        </div>
        <button 
          onClick={() => { setEditingVaga(null); setIsModalOpen(true) }}
          className="px-6 py-3 bg-[#0e2d22] text-white text-[11px] font-black rounded-2xl hover:bg-[#163d2f] transition-all flex items-center gap-3 uppercase tracking-widest shadow-xl shadow-emerald-900/10 border border-emerald-500/20"
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
          <div key={vaga.id} className="group relative bg-white p-8 rounded-[32px] border border-slate-100 hover:border-emerald-500/20 hover:shadow-2xl transition-all cursor-default">
            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest border-l border-b ${getStatusBadge(vaga.status)}`}>
              {vaga.status}
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[2px]">{vaga.area}</span>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight mt-1 truncate">{vaga.titulo}</h3>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex flex-col items-center shrink-0">
                   <span className="text-sm font-black text-[#0e2d22]">{candidatos.filter(c => c.vaga_id === vaga.id).length}</span>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Inscritos</span>
                </div>
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
                    onClick={() => { setSelectedVagaId(vaga.id); setIsCandModalOpen(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                    title="Adicionar Candidato"
                  >
                    <UserPlus size={14} />
                    Candidato
                  </button>
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

      <CrudModal 
        isOpen={isCandModalOpen}
        onClose={() => setIsCandModalOpen(false)}
        title="Cadastrar Novo Candidato"
        onSubmit={handleSalvarCandidato}
        fields={[
          { name: 'nome', label: 'Nome Completo', type: 'text', required: true },
          { name: 'email', label: 'E-mail', type: 'text', required: true },
          { name: 'telefone', label: 'Telefone / WhatsApp', type: 'text' },
          { name: 'curso', label: 'Curso', type: 'text' },
          { name: 'instituicao', label: 'Instituição de Ensino', type: 'text' },
          { name: 'semestre', label: 'Semestre Atual', type: 'number' },
        ]}
      />
    </div>
  )
}
