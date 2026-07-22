'use client'
import React, { useState, useEffect } from 'react'
import { Associado } from '@/lib/types'
import { Search, Filter, X } from 'lucide-react'
import { ComunicadoHistorico } from '@/lib/hooks/useComunicados'

interface FiltrosAssociadosProps {
  associados: Associado[]
  onFilter: (filtered: Associado[]) => void
  historico?: ComunicadoHistorico[]
  selectedTemplateId?: string | null
}

export default function FiltrosAssociados({ associados, onFilter, historico, selectedTemplateId }: FiltrosAssociadosProps) {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('todos')
  const [planoSaude, setPlanoSaude] = useState('todos')
  const [categoria, setCategoria] = useState('todos')
  const [vencimentoDia, setVencimentoDia] = useState('todos')
  const [statusEnvio, setStatusEnvio] = useState('todos')
  
  const [dataIngressoInicio, setDataIngressoInicio] = useState('')
  const [dataIngressoFim, setDataIngressoFim] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('filtros_comunicados_massa')
    if (saved) {
      try {
        const p = JSON.parse(saved)
        if (p.busca !== undefined) setBusca(p.busca)
        if (p.status !== undefined) setStatus(p.status)
        if (p.planoSaude !== undefined) setPlanoSaude(p.planoSaude)
        if (p.vencimentoDia !== undefined) setVencimentoDia(p.vencimentoDia)
        if (p.statusEnvio !== undefined) setStatusEnvio(p.statusEnvio)
        if (p.dataIngressoInicio !== undefined) setDataIngressoInicio(p.dataIngressoInicio)
        if (p.dataIngressoFim !== undefined) setDataIngressoFim(p.dataIngressoFim)
      } catch (e) {}
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when filters change
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem('filtros_comunicados_massa', JSON.stringify({
      busca, status, planoSaude, vencimentoDia, statusEnvio, dataIngressoInicio, dataIngressoFim
    }))
  }, [busca, status, planoSaude, vencimentoDia, statusEnvio, dataIngressoInicio, dataIngressoFim, isLoaded])

  // Obter planos de saúde únicos
  const planosUnicos = Array.from(new Set(associados.map(a => a.plano_saude).filter(Boolean))).sort()

  const aplicarFiltros = () => {
    let filtrados = [...associados]

    // Busca (Nome, CPF)
    if (busca.trim()) {
      const normalizeStr = (str: string) => str ? String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ""
      const b = normalizeStr(busca)
      const bNumbers = b.replace(/\D/g, '')
      filtrados = filtrados.filter(a => {
        const matchNome = normalizeStr(a.nome).includes(b)
        const matchCpf = bNumbers ? (a.cpf && String(a.cpf).replace(/\D/g, '').includes(bNumbers)) : false
        return matchNome || matchCpf
      })
    }

    // Status Associado
    if (status !== 'todos') {
      filtrados = filtrados.filter(a => (a.status || '').toLowerCase() === status)
    }

    // Plano Saúde
    if (planoSaude !== 'todos') {
      filtrados = filtrados.filter(a => a.plano_saude === planoSaude)
    }

    // Vencimento (Dia)
    if (vencimentoDia !== 'todos') {
      filtrados = filtrados.filter(a => a.vencimento_dia?.toString() === vencimentoDia)
    }

    // Data de Ingresso
    if (dataIngressoInicio || dataIngressoFim) {
      filtrados = filtrados.filter(a => {
        if (!a.data_ingresso) return false
        try {
          const d = new Date(a.data_ingresso)
          const start = dataIngressoInicio ? new Date(dataIngressoInicio + 'T00:00:00') : new Date(0)
          const end = dataIngressoFim ? new Date(dataIngressoFim + 'T23:59:59') : new Date(8640000000000000)
          return d >= start && d <= end
        } catch {
          return false
        }
      })
    }

    // Status do Envio
    if (statusEnvio !== 'todos') {
      filtrados = filtrados.filter(a => {
        let jaFoiComunicado = false
        if (historico && historico.length > 0) {
          if (selectedTemplateId) {
            jaFoiComunicado = historico.some(h => h.associado_id === a.id && h.template_id === selectedTemplateId)
          } else {
            jaFoiComunicado = historico.some(h => h.associado_id === a.id)
          }
        }
        
        if (statusEnvio === 'enviado') return jaFoiComunicado
        if (statusEnvio === 'pendente') return !jaFoiComunicado
        return true
      })
    }

    onFilter(filtrados)
  }

  // Auto-aplicar quando associados mudam, ou quando clica no botão?
  // O requisito diz "Ao final dos filtros deverá existir o botão: Pesquisar. A pesquisa deverá ocorrer sem recarregar a página."
  // Portanto, só aplica ao clicar no botão.
  
  // Auto-aplicar quando associados ou qualquer filtro mudam
  useEffect(() => {
    aplicarFiltros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associados, busca, status, planoSaude, vencimentoDia, statusEnvio, dataIngressoInicio, dataIngressoFim, historico, selectedTemplateId])

  const handleLimpar = () => {
    setBusca('')
    setStatus('todos')
    setPlanoSaude('todos')
    setVencimentoDia('todos')
    setStatusEnvio('todos')
    setDataIngressoInicio('')
    setDataIngressoFim('')
    // aplicar não acontece imediatamente aqui, aguarda clique em pesquisar ou força?
    // é bom forçar a limpeza.
    setTimeout(() => {
      onFilter(associados)
    }, 0)
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4 text-slate-700">
        <Filter size={18} />
        <h3 className="font-bold text-sm uppercase tracking-wider">Filtros de Segmentação</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        {/* Busca */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Nome ou CPF/CNPJ</label>
          <input
            type="text"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="Buscar..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Situação do Associado</label>
          <select
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inadimplente">Inadimplentes</option>
            <option value="pendente">Pendentes</option>
            <option value="suspenso">Suspensos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        {/* Plano Saúde */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Plano de Saúde</label>
          <select
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            value={planoSaude}
            onChange={e => setPlanoSaude(e.target.value)}
          >
            <option value="todos">Todos</option>
            {planosUnicos.map(plano => (
              <option key={plano} value={plano}>{plano}</option>
            ))}
          </select>
        </div>

        {/* Vencimento */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Dia de Vencimento</label>
          <select
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            value={vencimentoDia}
            onChange={e => setVencimentoDia(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="5">Dia 5</option>
            <option value="10">Dia 10</option>
            <option value="15">Dia 15</option>
            <option value="20">Dia 20</option>
            <option value="25">Dia 25</option>
          </select>
        </div>

        {/* Status de Envio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Status de Envio</label>
          <select
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            value={statusEnvio}
            onChange={e => setStatusEnvio(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendente">Apenas Pendentes</option>
            <option value="enviado">Apenas Enviados (OK)</option>
          </select>
        </div>

        {/* Período de Ingresso */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Período de Ingresso</label>
          <div className="flex gap-2">
            <input
              type="date"
              className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              value={dataIngressoInicio}
              onChange={e => setDataIngressoInicio(e.target.value)}
            />
            <input
              type="date"
              className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              value={dataIngressoFim}
              onChange={e => setDataIngressoFim(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={handleLimpar}
          className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wider"
        >
          <X size={16} />
          Limpar Filtros
        </button>
        <button
          onClick={aplicarFiltros}
          className="px-6 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-amber-500/20 uppercase tracking-wider"
        >
          <Search size={16} />
          Pesquisar
        </button>
      </div>
    </div>
  )
}
