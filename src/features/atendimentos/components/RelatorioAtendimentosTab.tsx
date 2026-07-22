'use client'
import React, { useState } from 'react'
import { FileDown, Calendar as CalendarIcon } from 'lucide-react'
import { useAtendimentos } from '@/lib/hooks/useAtendimentos'
import { gerarRelatorioAtendimentosPdf } from '../utils/gerarPdfsAtendimento'
import { useUsuarios } from '@/lib/hooks/useUsuarios'
import { useDiretoria } from '@/lib/hooks/useDiretoria'

export default function RelatorioAtendimentosTab() {
  const { atendimentos, responsaveis } = useAtendimentos()
  const { usuarios } = useUsuarios()
  const { diretoria } = useDiretoria()
  const todosResponsaveis = React.useMemo(() => [...responsaveis, ...usuarios, ...diretoria], [responsaveis, usuarios, diretoria])

  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0])
  const [filtroAtendente, setFiltroAtendente] = useState('')
  const [filtroCorretor, setFiltroCorretor] = useState('')
  const [filtroFaixa, setFiltroFaixa] = useState('')

  const corretores = responsaveis.filter(r => r.tipo === 'Venda do Plano')
  const atendentes = React.useMemo(() => {
    return todosResponsaveis.filter((r: any) => r.tipo !== 'Venda do Plano')
  }, [todosResponsaveis])

  const faixasDisponiveis = React.useMemo(() => {
    const faixas = new Set<string>()
    atendimentos.forEach(a => {
      if (a.etapas_concluidas?.faixa_etaria) faixas.add(a.etapas_concluidas.faixa_etaria)
    })
    return Array.from(faixas).sort()
  }, [atendimentos])

  const filtrados = React.useMemo(() => {
    const inicio = new Date(`${dataInicio}T00:00:00`)
    const fim = new Date(`${dataFim}T23:59:59`)

    return atendimentos.filter(a => {
      if (!a.etapas_concluidas?.enviado_hgu_em) return false
      const d = new Date(`${a.etapas_concluidas.enviado_hgu_em}T12:00:00`)
      if (d < inicio || d > fim) return false
      
      if (filtroAtendente && a.responsavel_id !== filtroAtendente) return false
      if (filtroCorretor && a.etapas_concluidas?.corretor_id !== filtroCorretor) return false
      if (filtroFaixa && a.etapas_concluidas?.faixa_etaria !== filtroFaixa) return false
      
      return true
    })
  }, [atendimentos, dataInicio, dataFim, filtroAtendente, filtroCorretor, filtroFaixa])

  const handleGerarRelatorio = () => {
    if (filtrados.length === 0) {
      alert('Nenhum atendimento encontrado neste período.')
      return
    }

    gerarRelatorioAtendimentosPdf(filtrados, dataInicio, dataFim, todosResponsaveis)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Relatório de Atendimentos</h3>
        <p className="text-sm text-slate-500">Gere uma lista em PDF dos atendimentos realizados no período selecionado.</p>
      </div>

      <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase">Data Início</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date" 
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="pl-10 p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none w-full text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase">Data Fim</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date" 
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="pl-10 p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none w-full text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase">Atendente</label>
            <select 
              value={filtroAtendente}
              onChange={e => setFiltroAtendente(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none w-full text-sm bg-white"
            >
              <option value="">Todos</option>
              {atendentes.map((r: any) => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase">Corretor</label>
            <select 
              value={filtroCorretor}
              onChange={e => setFiltroCorretor(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none w-full text-sm bg-white"
            >
              <option value="">Todos</option>
              {corretores.map((r: any) => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase">Faixa Etária</label>
            <select 
              value={filtroFaixa}
              onChange={e => setFiltroFaixa(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none w-full text-sm bg-white"
            >
              <option value="">Todas</option>
              {faixasDisponiveis.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-2 border-t border-slate-200 pt-4">
          <button 
            onClick={handleGerarRelatorio}
            disabled={filtrados.length === 0}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown size={18} />
            Gerar Relatório (PDF)
          </button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="text-sm font-black text-slate-800 uppercase">Pré-visualização do Relatório</h4>
          <span className="text-[11px] font-black bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full uppercase tracking-widest">
            {filtrados.length} ATENDIMENTO{filtrados.length !== 1 ? 'S' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-4 py-4">Data/Hora</th>
                <th className="px-4 py-4">Associado</th>
                <th className="px-4 py-4">Tipo</th>
                <th className="px-4 py-4">Fx. Etária</th>
                <th className="px-4 py-4">Tabela</th>
                <th className="px-4 py-4">Valor</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Data Inclusão HGU</th>
                <th className="px-4 py-4">Resp. Atend.</th>
                <th className="px-4 py-4">Corretor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">
                    Nenhum atendimento neste período.
                  </td>
                </tr>
              ) : (
                filtrados.map((a, idx) => (
                  <tr key={a.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-slate-600">
                      {new Date(a.data_agendamento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-800">
                      {a.associados?.nome || 'Não informado'}
                    </td>
                    <td className="px-4 py-4">
                      {a.etapas_concluidas?.tipo ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">{a.etapas_concluidas.tipo}</span>
                      ) : '--'}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {a.etapas_concluidas?.faixa_etaria || '--'}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {a.etapas_concluidas?.tabela || '--'}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {a.etapas_concluidas?.valor_mensal || '--'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                        a.status === 'agendado' ? 'bg-amber-100 text-amber-700' :
                        a.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                        a.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {a.status === 'em_andamento' ? 'Andamento' : a.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-indigo-600 font-bold">
                      {a.etapas_concluidas?.enviado_hgu_em ? new Date(`${a.etapas_concluidas.enviado_hgu_em}T12:00:00`).toLocaleDateString('pt-BR') : '--'}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-600">
                      {todosResponsaveis.find((r: any) => r.id === a.responsavel_id)?.nome || '--'}
                    </td>
                    <td className="px-4 py-4 font-bold text-emerald-600">
                      {todosResponsaveis.find((r: any) => r.id === a.etapas_concluidas?.corretor_id)?.nome || '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
