'use client'
import React from 'react'
import { BarChart3, Briefcase, Users, TrendingUp, Filter, RefreshCw, Star, Database } from 'lucide-react'
import { useVagas } from '@/lib/hooks/useVagas'
import { useCandidatos } from '@/lib/hooks/useCandidatos'
import KpiCard from '@/components/ui/KpiCard'

export default function DashboardTab() {
  const { vagas, loading: loadVagas } = useVagas()
  const { candidatos, loading: loadCands } = useCandidatos()

  if (loadVagas || loadCands) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 animate-spin">
          <RefreshCw size={24} />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Processando Talentos...</p>
      </div>
    )
  }

  // Cálculos de Inteligência
  const vagasAbertas = vagas.filter(v => v.status === 'aberta').length
  const totalCandidatos = candidatos.length
  const candPorVaga = vagasAbertas > 0 ? (totalCandidatos / vagasAbertas).toFixed(1) : '0'
  
  const naFilaContratacao = candidatos.filter(c => c.status === 'contratacao').length
  const noBanco = candidatos.filter(c => c.status === 'banco_talentos').length
  const taxaConversaoFinal = totalCandidatos > 0 ? (naFilaContratacao / totalCandidatos) * 100 : 0
  
  const notaMediaGeral = candidatos.filter(c => c.nota_final).reduce((acc, c) => acc + (c.nota_final || 0), 0) / (candidatos.filter(c => c.nota_final).length || 1)

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Sub-Header para Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-emerald-600" size={20} /> Inteligência de Recrutamento
          </h2>
          <p className="text-xs text-slate-500 font-medium">Monitoramento de funil e performance de captação.</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-3">
          <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Conversão de Funil</span>
          <h4 className="text-sm font-black text-[#0e2d22]">{taxaConversaoFinal.toFixed(1)}%</h4>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard 
          title="Vagas Ativas" 
          value={vagasAbertas.toString()} 
          icon={<Briefcase size={20} />} 
          category="info" 
          explanation={{
            description: "Quantidade de oportunidades de estágio com status 'Aberta' no momento.",
            formula: "COUNT(vagas WHERE status = 'aberta')",
            example: "Se houver 2 vagas para Financeiro e 1 para RH abertas, o total é 3."
          }}
        />
        <KpiCard 
          title="Total de Candidatos" 
          value={totalCandidatos.toString()} 
          icon={<Users size={20} />} 
          category="success" 
          explanation={{
            description: "Volume total de currículos capturados no sistema para todas as vagas.",
            formula: "COUNT(candidatos)",
            example: "Representa a base total de talentos processada pelo portal."
          }}
        />
        <KpiCard 
          title="Candidatos / Vaga" 
          value={candPorVaga} 
          icon={<TrendingUp size={20} />} 
          category="info" 
          explanation={{
            description: "Média de competitividade das vagas abertas.",
            formula: "Candidatos Totais / Vagas Abertas",
            example: "Indica quão atrativas estão sendo as oportunidades da associação."
          }}
        />
        <KpiCard 
          title="Banco de Talentos" 
          value={noBanco.toString()} 
          icon={<Database size={20} />} 
          category="purple" 
          explanation={{
            description: "Candidatos que não foram contratados mas possuem perfil para futuras vagas.",
            formula: "COUNT(candidatos WHERE status = 'banco_talentos')",
            example: "Perfis qualificados que aguardam uma nova oportunidade."
          }}
        />
        <KpiCard 
          title="Média de Notas" 
          value={notaMediaGeral.toFixed(1)} 
          icon={<Star size={20} />} 
          category="success" 
          explanation={{
            description: "Média das avaliações finais (Adm + Dir) de todos os candidatos avaliados.",
            formula: "Σ(Nota Final) / Qtd Avaliados",
            example: "Mede a qualidade técnica geral dos candidatos atraídos."
          }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Distribuição por Etapa */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Distribuição por Etapa do Funil
           </h3>
           
           <div className="space-y-6">
              {['inscrito', 'escolaridade_validada', 'entrevista_adm', 'entrevista_dir', 'contratacao'].map(status => {
                const count = candidatos.filter(c => c.status === status).length
                const pct = totalCandidatos > 0 ? (count / totalCandidatos) * 100 : 0
                return (
                  <div key={status} className="group">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight italic">
                          {status.replace('_', ' ')}
                       </span>
                       <span className="text-[11px] font-black text-slate-900">{count} <span className="text-slate-300 ml-1">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                       <div 
                         className="h-full bg-[#0e2d22] rounded-full transition-all duration-1000 group-hover:bg-emerald-500" 
                         style={{ width: `${pct}%` }}
                       ></div>
                    </div>
                  </div>
                )
              })}
           </div>
        </div>

        {/* Ranking de Vagas */}
        <div className="bg-[#0e2d22] p-8 rounded-[40px] border border-emerald-500/10 shadow-2xl shadow-emerald-900/20 text-white">
           <h3 className="text-sm font-black text-white/80 uppercase tracking-widest mb-8 flex items-center gap-3">
              <TrendingUp size={18} className="text-emerald-400" />
              Ranking de Vagas
           </h3>

           <div className="space-y-5">
              {vagas.slice(0, 5).map((vaga, idx) => {
                const count = candidatos.filter(c => c.vaga_id === vaga.id).length
                return (
                  <div key={vaga.id} className="flex items-center gap-5 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                     <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                        #{idx + 1}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate leading-tight">{vaga.titulo}</h4>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-tighter mt-1">{vaga.area}</p>
                     </div>
                     <div className="text-right">
                        <span className="text-base font-black text-emerald-400">{count}</span>
                        <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Inscritos</p>
                     </div>
                  </div>
                )
              })}
           </div>
        </div>
      </div>
    </div>
  )
}
