'use client'

import React, { useState, useMemo } from 'react'
import { ShieldCheck, Download, Search, AlertTriangle, CheckCircle2, FileText, Upload, Info } from 'lucide-react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useOFXParser, OFXTransaction } from '@/lib/hooks/useOFXParser'
import OFXUpload from '@/components/conciliacao/OFXUpload'
import * as XLSX from 'xlsx'
import { fmtR } from '@/lib/utils/formatters'

type AuditTab = 'adesoes' | 'extratos'

export default function AuditoriaFinanceiraTab() {
  const { associados, loading: loadingAssoc } = useAssociados()
  const { lancamentos, loading: loadingFin } = useFinanceiro()
  const { parseOFX } = useOFXParser()

  const [activeTab, setActiveTab] = useState<AuditTab>('adesoes')
  
  // --- Estados para Adesoes ---
  const [searchQAdesoes, setSearchQAdesoes] = useState('')
  const [filterTypeAdesoes, setFilterTypeAdesoes] = useState<'todos' | 'divergencias'>('divergencias')

  // --- Estados para Extratos ---
  const [extrato, setExtrato] = useState<OFXTransaction[]>([])
  const [searchQExtratos, setSearchQExtratos] = useState('')
  const [filterTypeExtratos, setFilterTypeExtratos] = useState<'todos' | 'divergencias'>('divergencias')

  const loading = loadingAssoc || loadingFin

  const MESES_AUDITADOS = [
    { mes: 1, label: 'Janeiro' },
    { mes: 2, label: 'Fevereiro' },
    { mes: 3, label: 'Março' },
    { mes: 4, label: 'Abril' },
    { mes: 5, label: 'Maio' },
    { mes: 6, label: 'Junho' },
  ]

  // ==========================================
  // LÓGICA DE AUDITORIA DE ADESÕES
  // ==========================================
  const adesoesData = useMemo(() => {
    if (!associados || !lancamentos) return []

    const alvos = associados.filter((a: any) => {
      if (a.status === 'inativo') return false
      if (!a.recorrencia_ativa) return false
      
      const joinedDate = a.data_assinatura || a.created_at
      if (!joinedDate) return false
      
      const date = new Date(joinedDate + 'T12:00:00Z')
      if (date.getFullYear() > 2026) return false
      if (date.getFullYear() === 2026 && date.getMonth() > 5) return false
      
      return true
    })

    const results = alvos.map((assoc: any) => {
      const joinedDate = new Date((assoc.data_assinatura || assoc.created_at) + 'T12:00:00Z')
      const joinYear = joinedDate.getFullYear()
      const joinMonth = joinedDate.getMonth() + 1

      const assocLancs = lancamentos.filter((l: any) => l.associado_id === assoc.id)

      let divergencias: string[] = []
      const mesesStatus: any = {}

      MESES_AUDITADOS.forEach(({ mes, label }) => {
        if (joinYear === 2026 && mes < joinMonth) {
          mesesStatus[mes] = { status: 'n/a', msg: 'Não era associado' }
          return
        }

        const lancsNoMes = assocLancs.filter((l: any) => {
          if (!l.data) return false
          const [y, m] = l.data.split('-')
          return parseInt(y) === 2026 && parseInt(m) === mes
        })

        const temAdesao = lancsNoMes.some((l: any) => (l.categoria || '').toUpperCase().includes('ADESÃO') || (l.descricao || '').toUpperCase().includes('ADESÃO'))
        const temMensalidade = lancsNoMes.some((l: any) => (l.categoria || '').toUpperCase().includes('MENSALIDADE') || (l.descricao || '').toUpperCase().includes('MENSALIDADE'))

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

  const filteredAdesoesData = useMemo(() => {
    let data = adesoesData
    if (filterTypeAdesoes === 'divergencias') data = data.filter(d => d.divergencias.length > 0)
    if (searchQAdesoes) {
      const q = searchQAdesoes.toLowerCase()
      data = data.filter(d => d.associado.nome?.toLowerCase().includes(q) || d.associado.cpf?.includes(q))
    }
    return data
  }, [adesoesData, searchQAdesoes, filterTypeAdesoes])


  // ==========================================
  // LÓGICA DE AUDITORIA DE EXTRATOS (OFX)
  // ==========================================
  const extratosData = useMemo(() => {
    if (!extrato.length || !lancamentos) return []

    return extrato.map(ofx => {
      const exato = lancamentos.find((l: any) => l.banco_transacao_id === ofx.fitid)
      
      let status: 'ok' | 'valor_divergente' | 'manual' | 'nao_encontrado' = 'nao_encontrado'
      let matchLanc = null
      let msg = 'Não encontrado no sistema'

      if (exato) {
        matchLanc = exato
        if (Math.abs(exato.valor) !== Math.abs(ofx.amount)) {
          status = 'valor_divergente'
          msg = `Divergência. Sist: ${fmtR(Math.abs(exato.valor))} | Banco: ${fmtR(Math.abs(ofx.amount))}`
        } else {
          status = 'ok'
          msg = 'Conciliado OK'
        }
      } else {
        const mesmoDiaValor = lancamentos.find((l: any) => {
          if (!l.data) return false
          const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes((l.status || '').toLowerCase()) || l.conciliado
          const valueMatches = Math.abs(l.valor) === Math.abs(ofx.amount)
          const dateMatches = (l.data_caixa || l.data_conciliacao || l.data).startsWith(ofx.date)
          return isPago && valueMatches && dateMatches
        })

        if (mesmoDiaValor) {
          matchLanc = mesmoDiaValor
          status = 'manual'
          msg = 'Provável pgto manual (não atrelado via OFX)'
        }
      }

      return { ofx, status, msg, matchLanc }
    }).sort((a, b) => {
      if (a.status === 'ok' && b.status !== 'ok') return 1;
      if (a.status !== 'ok' && b.status === 'ok') return -1;
      return new Date(a.ofx.date).getTime() - new Date(b.ofx.date).getTime()
    })
  }, [extrato, lancamentos])

  const filteredExtratosData = useMemo(() => {
    let data = extratosData
    if (filterTypeExtratos === 'divergencias') data = data.filter(d => d.status !== 'ok')
    if (searchQExtratos) {
      const q = searchQExtratos.toLowerCase()
      data = data.filter(d => 
        d.ofx.memo.toLowerCase().includes(q) || 
        (d.matchLanc && d.matchLanc.descricao?.toLowerCase().includes(q))
      )
    }
    return data
  }, [extratosData, searchQExtratos, filterTypeExtratos])


  // ==========================================
  // EXPORTS
  // ==========================================
  const handleExportAdesoes = () => {
    const wsData = filteredAdesoesData.map(d => {
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
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria_Adesoes')
    XLSX.writeFile(wb, 'Auditoria_Adesoes_Mensalidades.xlsx')
  }

  const handleExportExtratos = () => {
    const wsData = filteredExtratosData.map(d => ({
      'Data (Banco)': d.ofx.date.split('-').reverse().join('/'),
      'Tipo': d.ofx.type,
      'Descrição (Banco)': d.ofx.memo,
      'Valor (Banco)': fmtR(Math.abs(d.ofx.amount)),
      'Status de Auditoria': d.msg,
      'Lançamento Referência (Sistema)': d.matchLanc ? d.matchLanc.descricao : '--',
      'Categoria (Sistema)': d.matchLanc ? (d.matchLanc.categoria || '--') : '--'
    }))
    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria_Extratos')
    XLSX.writeFile(wb, 'Auditoria_Extratos_OFX.xlsx')
  }

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Analisando milhares de transações...</div>
  }

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20 p-8">
      {/* HEADER */}
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
              Validação de Regras e Conciliações
            </p>
          </div>
        </div>
        
        <button 
          onClick={activeTab === 'adesoes' ? handleExportAdesoes : handleExportExtratos} 
          className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Download size={16} />
          Exportar Excel ({activeTab === 'adesoes' ? 'Adesões' : 'Extratos'})
        </button>
      </div>

      {/* TABS MENU */}
      <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm self-start">
        <button
          onClick={() => setActiveTab('adesoes')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'adesoes' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
        >
          <FileText size={16} />
          Adesões vs Mensalidades
        </button>
        <button
          onClick={() => setActiveTab('extratos')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'extratos' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
        >
          <Upload size={16} />
          Auditoria de Extratos (OFX)
        </button>
      </div>

      {/* CONTENT: ADESÕES */}
      {activeTab === 'adesoes' && (
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button 
                onClick={() => setFilterTypeAdesoes('divergencias')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTypeAdesoes === 'divergencias' ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Com Divergências ({adesoesData.filter(d => d.divergencias.length > 0).length})
              </button>
              <button 
                onClick={() => setFilterTypeAdesoes('todos')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTypeAdesoes === 'todos' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Todos Ativos ({adesoesData.length})
              </button>
            </div>
            
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar associado..."
                value={searchQAdesoes}
                onChange={e => setSearchQAdesoes(e.target.value)}
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
                {filteredAdesoesData.map((row, i) => (
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
                {filteredAdesoesData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400 font-medium">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT: EXTRATOS */}
      {activeTab === 'extratos' && (
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 animate-in fade-in duration-300">
          {extrato.length === 0 ? (
            <div className="max-w-xl mx-auto py-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Cruze seu Extrato Bancário</h3>
                <p className="text-sm text-slate-500 mt-2">Faça o upload de um arquivo OFX para que o sistema identifique se alguma transação do banco ficou de fora do sistema ou foi conciliada com valor divergente.</p>
              </div>
              <OFXUpload onUpload={(data: any) => setExtrato(parseOFX(data))} />
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button 
                    onClick={() => setFilterTypeExtratos('divergencias')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTypeExtratos === 'divergencias' ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Divergências ({extratosData.filter(d => d.status !== 'ok').length})
                  </button>
                  <button 
                    onClick={() => setFilterTypeExtratos('todos')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTypeExtratos === 'todos' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Extrato Completo ({extratosData.length})
                  </button>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar descrição..."
                      value={searchQExtratos}
                      onChange={e => setSearchQExtratos(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-slate-400"
                    />
                  </div>
                  <button 
                    onClick={() => setExtrato([])}
                    className="flex-shrink-0 flex items-center justify-center px-4 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors text-[10px] font-bold uppercase tracking-widest"
                    title="Carregar outro OFX"
                  >
                    Novo OFX
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-100">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transação (Banco)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status de Vínculo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredExtratosData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                          {row.ofx.date.split('-').reverse().join('/')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-800">{row.ofx.memo}</div>
                          {row.ofx.type === 'CREDIT' 
                            ? <span className="text-[9px] font-black text-emerald-500 uppercase">Receita</span> 
                            : <span className="text-[9px] font-black text-rose-500 uppercase">Despesa</span>}
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-slate-700 whitespace-nowrap">
                          {fmtR(Math.abs(row.ofx.amount))}
                        </td>
                        <td className="px-6 py-4">
                          {row.status === 'ok' ? (
                            <div className="flex items-start gap-2">
                              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{row.msg}</span>
                                <span className="text-[10px] font-medium text-slate-500 truncate max-w-[200px]" title={row.matchLanc?.descricao}>{row.matchLanc?.descricao}</span>
                              </div>
                            </div>
                          ) : row.status === 'manual' ? (
                            <div className="flex items-start gap-2">
                              <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{row.msg}</span>
                                <span className="text-[10px] font-medium text-slate-500 truncate max-w-[200px]" title={row.matchLanc?.descricao}>{row.matchLanc?.descricao}</span>
                              </div>
                            </div>
                          ) : row.status === 'valor_divergente' ? (
                            <div className="flex items-start gap-2">
                              <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{row.msg}</span>
                                <span className="text-[10px] font-medium text-slate-500 truncate max-w-[200px]" title={row.matchLanc?.descricao}>{row.matchLanc?.descricao}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{row.msg}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredExtratosData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-400 font-medium">
                          Nenhuma divergência encontrada ou extrato vazio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
