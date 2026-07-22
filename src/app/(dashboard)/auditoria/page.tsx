'use client'

import React, { useState, useEffect, useCallback } from 'react'

import { Activity, Search, Filter, ChevronDown, Shield, Users } from "lucide-react"

const MAPPING_MODULOS: Record<string, string> = {
  'financeiro': 'Financeiro',
  'cobrancas': 'Cobranças',
  'planejamento': 'Planejamento',
  'fechamento': 'Fechamento Mensal',
  'socios': 'Gestão de Vidas',
  'atendimentos': 'Atendimentos',
  'plano_saude': 'Plano de Saúde',
  'estrategia': 'Metas e Projetos',
  'gestao_tarefas': 'Gestão de Tarefas',
  'bens_duraveis': 'Bens Duráveis',
  'recrutamento': 'Recrutamento',
  'fiscal': 'Escrituração Fiscal',
  'contabil': 'Contabilidade',
  'importar': 'Importar Dados',
  'relatorios': 'Relatórios',
  'configuracoes': 'Configurações',
  'auditoria': 'Auditoria',
  'auth': 'Autenticação',
}

export default function AuditoriaPage() {
  return <AuditoriaContent />
}

function AuditoriaContent() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  
  const [modulo, setModulo] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const url = new URL('/api/auditoria', window.location.origin)
      url.searchParams.append('page', page.toString())
      url.searchParams.append('limit', '50')
      if (modulo) url.searchParams.append('modulo', modulo)

      const res = await fetch(url.toString(), {
        
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.registros || [])
        setTotal(data.total || 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page, modulo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20 p-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            <Activity size={28} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100/50">
              <Shield size={10} />
              <span>SEGURANÇA DE DADOS</span>
              <ChevronDown size={10} className="opacity-50 ml-1" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Log de Auditoria</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">Rastreabilidade de Ações (RBAC)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex bg-slate-100/60 p-1.5 rounded-[22px] items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
            <a href="/configuracoes/colaboradores" className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 text-slate-500 hover:bg-white/50 hover:text-slate-700 scale-95 hover:scale-100">
              <Users size={14} className="opacity-70" />
              Colaboradores
            </a>
            <a href="/configuracoes/perfis" className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 text-slate-500 hover:bg-white/50 hover:text-slate-700 scale-95 hover:scale-100">
              <Shield size={14} className="opacity-70" />
              Perfis
            </a>
            <a href="/auditoria" className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 bg-white text-emerald-700 shadow-md shadow-slate-200/50 scale-100">
              <Activity size={14} className="text-emerald-500" />
              Auditoria
            </a>
          </div>
        </div>
      </div>
      <div className="table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={modulo}
                onChange={e => { setModulo(e.target.value); setPage(1) }}
                className="pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-slate-400"
              >
                <option value="">Todos os Módulos</option>
                <option value="auth">Autenticação</option>
                <option value="socios">Sócios</option>
                <option value="financeiro">Financeiro</option>
                <option value="configuracoes">Configurações</option>
              </select>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">{total} Registros Totais</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-sm font-medium">Carregando...</div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="overflow-hidden border border-slate-100 rounded-3xl">
              <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp + (!log.timestamp.includes('Z') && !log.timestamp.match(/[+-]\d{2}:\d{2}$/) ? 'Z' : '')).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700">{log.colaborador}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded">
                        {MAPPING_MODULOS[log.modulo] || log.modulo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{log.acao}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400 text-right">{log.ip || '--'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">Nenhum registro encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center px-2 mt-6">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando {logs.length} resultados nesta página
            </div>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 border border-slate-100"
              >
                Anterior
              </button>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-4 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                Página {page}
              </span>
              <button 
                disabled={logs.length < 50} 
                onClick={() => setPage(p => p + 1)}
                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 border border-slate-100"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
