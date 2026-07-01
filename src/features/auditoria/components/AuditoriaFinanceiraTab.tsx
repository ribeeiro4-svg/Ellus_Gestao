'use client'

import React, { useState, useMemo } from 'react'
import { ShieldCheck, Download, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import * as XLSX from 'xlsx'

export default function AuditoriaFinanceiraTab() {
  const { associados, loading: loadingAssoc } = useAssociados()
  const { lancamentos, loading: loadingFin } = useFinanceiro()
  const [searchQ, setSearchQ] = useState('')
  const [filterType, setFilterType] = useState<'todos' | 'divergencias'>('divergencias')

  const loading = loadingAssoc || loadingFin

  const MESES_AUDITADOS = [
    { mes: 1, label: 'Janeiro' },
    { mes: 2, label: 'Fevereiro' },
    { mes: 3, label: 'Março' },
    { mes: 4, label: 'Abril' },
    { mes: 5, label: 'Maio' },
    { mes: 6, label: 'Junho' },
  ]

  const auditoriaData = useMemo(() => {
    if (!associados || !lancamentos) return []

    // Considerar apenas associados ativos ou pendentes com recorrência ligada, 
    // e que tenham data de assinatura/filiação até Junho/2026.
    const alvos = associados.filter((a: any) => {
      if (a.status === 'inativo') return false
      if (!a.recorrencia_ativa) return false
      
      const joinedDate = a.data_assinatura || a.created_at
      if (!joinedDate) return false
      
      // Somente quem entrou em 2026 até Junho (ou antes de 2026)
      const date = new Date(joinedDate + 'T12:00:00Z')
      if (date.getFullYear() > 2026) return false
      if (date.getFullYear() === 2026 && date.getMonth() > 5) return false // Julho em diante ignora
      
      return true
    })

    const results = alvos.map((assoc: any) => {
      const joinedDate = new Date((assoc.data_assinatura || assoc.created_at) + 'T12:00:00Z')
      const joinYear = joinedDate.getFullYear()
      const joinMonth = joinedDate.getMonth() + 1 // 1 a 12

      const assocLancs = lancamentos.filter((l: any) => l.associado_id === assoc.id)

      let divergencias: string[] = []
      const mesesStatus: any = {}

      MESES_AUDITADOS.forEach(({ mes, label }) => {
        // Se o mês em questão é ANTES do mês que o associado entrou (no mesmo ano), ele não deveria ter nada
        if (joinYear === 2026 && mes < joinMonth) {
          mesesStatus[mes] = { status: 'n/a', msg: 'Não era associado' }
          return
        }

        // Verifica o que o associado tem gerado no mês auditado
        const lancsNoMes = assocLancs.filter((l: any) => {
          if (!l.data) return false
          const [y, m, d] = l.data.split('-')
          return parseInt(y) === 2026 && parseInt(m) === mes
        })

        const temAdesao = lancsNoMes.some((l: any) => (l.categoria || '').toUpperCase().includes('ADESÃO') || (l.descricao || '').toUpperCase().includes('ADESÃO'))
        const temMensalidade = lancsNoMes.some((l: any) => (l.categoria || '').toUpperCase().includes('MENSALIDADE') || (l.descricao || '').toUpperCase().includes('MENSALIDADE'))

        // Regra de Ouro:
        // Se este é o mês exato de entrada (e ele entrou em 2026): Paga APENAS Adesão
        if (joinYear === 2026 && mes === joinMonth) {
          if (!temAdesao) {
            divergencias.push(`Falta Adesão em ${label}`)
            mesesStatus[mes] = { status: 'erro', msg: 'Sem Adesão' }
          } else if (temMensalidade) {
            divergencias.push(`Tem Mensalidade em ${label} (Mês de Adesão)`)
            mesesStatus[mes] = { status: 'erro', msg: 'Mensalidade indevida' }
          } else {
            mesesStatus[mes] = { status: 'ok', msg: 'Adesão OK' }
          }
        } 
        // Se ele entrou antes de 2026, ou se este mês é APÓS o mês de entrada: Paga APENAS Mensalidade
        else {
          if (!temMensalidade) {
            divergencias.push(`Falta Mensalidade em ${label}`)
            mesesStatus[mes] = { status: 'erro', msg: 'Sem Mensalidade' }
          } else {
            mesesStatus[mes] = { status: 'ok', msg: 'Mensalidade OK' }
          }
        }
      })

      return {
        associado: assoc,
        joinedDate: joinedDate.toISOString().split('T')[0],
        joinMonth,
        joinYear,
        mesesStatus,
        divergencias
      }
    })

    return results.sort((a, b) => b.divergencias.length - a.divergencias.length)
  }, [associados, lancamentos])

  const filteredData = useMemo(() => {
    let data = auditoriaData
    
    if (filterType === 'divergencias') {
      data = data.filter(d => d.divergencias.length > 0)
    }

    if (searchQ) {
      const q = searchQ.toLowerCase()
      data = data.filter(d => 
        d.associado.nome?.toLowerCase().includes(q) || 
        d.associado.cpf?.includes(q)
      )
    }

    return data
  }, [auditoriaData, searchQ, filterType])

  const handleExport = () => {
    const wsData = filteredData.map(d => {
      const row: any = {
        'Associado': d.associado.nome,
        'CPF': d.associado.cpf || '--',
        'Data Ingresso': d.joinedDate.split('-').reverse().join('/'),
      }
      
      MESES_AUDITADOS.forEach(({ mes, label }) => {
        row[label] = d.mesesStatus[mes].msg
      })
      
      row['Divergências Encontradas'] = d.divergencias.join(' | ') || 'Nenhuma'
      return row
    })
    
    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria_1o_Semestre_2026')
    XLSX.writeFile(wb, 'Auditoria_Adesoes_Mensalidades.xlsx')
  }

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Analisando milhares de transações...</div>
  }

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20 p-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-900 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">
            <ShieldCheck size={28} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
              <span>CONTROLE DE QUALIDADE</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Auditoria Financeira</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">
              Validação de Adesões e Mensalidades (1º Semestre 2026)
            </p>
          </div>
        </div>
        
        <button onClick={handleExport} className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20">
          <Download size={16} />
          Exportar Excel
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setFilterType('divergencias')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'divergencias' ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Com Divergências ({auditoriaData.filter(d => d.divergencias.length > 0).length})
            </button>
            <button 
              onClick={() => setFilterType('todos')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'todos' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todos Ativos ({auditoriaData.length})
            </button>
          </div>
          
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar associado..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Associado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresso</th>
                {MESES_AUDITADOS.map(m => (
                  <th key={m.mes} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-slate-700">{row.associado.nome}</div>
                    {row.divergencias.length > 0 && (
                      <div className="text-[9px] font-bold text-rose-500 mt-1 uppercase">
                        {row.divergencias.length} Divergência(s) Encontrada(s)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[11px] font-medium text-slate-500">
                    {row.joinedDate.split('-').reverse().join('/')}
                  </td>
                  {MESES_AUDITADOS.map(m => {
                    const status = row.mesesStatus[m.mes]
                    return (
                      <td key={m.mes} className="px-6 py-4 text-center">
                        {status.status === 'n/a' ? (
                          <span className="text-[10px] font-bold text-slate-300 uppercase">-</span>
                        ) : status.status === 'erro' ? (
                          <div className="flex flex-col items-center gap-1 group relative">
                            <AlertTriangle size={16} className="text-rose-500" />
                            <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">{status.msg}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">{status.msg}</span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-medium">
                    Nenhum registro encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
