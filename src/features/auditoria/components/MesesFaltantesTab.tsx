'use client'

import React, { useState, useMemo } from 'react'
import { AlertTriangle, CheckCircle2, Search, ChevronDown, ChevronUp, Eye, Plus, Download, ListChecks } from 'lucide-react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { fmtR } from '@/lib/utils/formatters'
import * as XLSX from 'xlsx'

const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function normStr(s: string) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function formatDateBr(d?: string) {
  if (!d) return '—'
  const part = d.split('T')[0].split('-')
  if (part.length === 3) return `${part[2]}/${part[1]}/${part[0]}`
  return d
}

// ─── Tipos internos ──────────────────────────────────────────────────────────
interface MesFaltante {
  mes: number   // 1-12
  ano: number
  label: string // "Jul/2026"
}

interface AssociadoAudit {
  id: string
  nome: string
  status: string
  vencimento_dia?: number
  data_ingresso?: string
  data_assinatura?: string
  mesesFaltantes: MesFaltante[]
  selected: boolean
}

interface PreviewItem {
  associado_id: string
  nome: string
  mes: number
  ano: number
  label: string
  data: string      // YYYY-MM-DD (dia 10 do mês)
  descricao: string
  valor: number
  tipo: 'receita'
  categoria: string
  status: 'atrasado'
  selItem: boolean  // selecionado para lançar
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MesesFaltantesTab() {
  const { associados, loading: loadingAssoc } = useAssociados()
  const { lancamentos, loading: loadingFin, inserirBulk } = useFinanceiro()

  // Filtros de período
  const anoAtual = new Date().getFullYear()
  const [anoAnalise, setAnoAnalise]       = useState<number>(anoAtual)
  const [mesInicio, setMesInicio]         = useState<number>(1)
  const [mesFim, setMesFim]               = useState<number>(new Date().getMonth() + 1)
  const [searchQ, setSearchQ]             = useState('')

  // Preview modal
  const [previewItems, setPreviewItems]   = useState<PreviewItem[] | null>(null)
  const [isLancando, setIsLancando]       = useState(false)
  const [resultado, setResultado]         = useState<{ ok: number; erros: string[]; aviso?: string } | null>(null)

  // ─── Calcular meses com ausência de receita por associado ──────────────────
  const auditoriaData = useMemo<AssociadoAudit[]>(() => {
    if (loadingAssoc || loadingFin) return []

    const ativos = associados.filter(a => (a.status || '').toLowerCase() === 'ativo')

    return ativos.map(assoc => {
      const mesesFaltantes: MesFaltante[] = []

      // ─── Extrair data de ingresso ───
      let joinMes = 1;
      let joinAno = 0; // Se não tiver data_ingresso, assume que está desde sempre
      
      // Opcional: usar data_assinatura como fallback se data_ingresso não existir
      const dataEntrada = assoc.data_ingresso || assoc.data_assinatura
      if (dataEntrada) {
        // Pega YYYY-MM-DD
        const parts = dataEntrada.split('T')[0].split('-')
        if (parts.length >= 2) {
          joinAno = parseInt(parts[0], 10)
          joinMes = parseInt(parts[1], 10)
        }
      }

      for (let m = mesInicio; m <= mesFim; m++) {
        // Ignora meses antes da entrada do associado
        if (anoAnalise < joinAno) continue
        if (anoAnalise === joinAno && m < joinMes) continue

        // Verifica se há QUALQUER lançamento de RECEITA (ingresso) para esse associado nesse mês/ano
        const temReceita = lancamentos.some(l => {
          if (l.tipo !== 'receita') return false
          if (!l.associado_id) return false
          if (l.associado_id !== assoc.id) return false

          // Verificar pelo competencia_mes/ano primeiro (mais preciso)
          if (l.competencia_mes && l.competencia_ano) {
            return Number(l.competencia_mes) === m && Number(l.competencia_ano) === anoAnalise
          }

          // Fallback: verificar pela data do lançamento
          if (l.data) {
            const d = new Date(l.data + 'T00:00:00')
            return d.getMonth() + 1 === m && d.getFullYear() === anoAnalise
          }

          return false
        })

        if (!temReceita) {
          mesesFaltantes.push({
            mes: m,
            ano: anoAnalise,
            label: `${MESES_NOMES[m - 1]}/${anoAnalise}`,
          })
        }
      }

      return {
        id: assoc.id,
        nome: assoc.nome,
        status: assoc.status,
        vencimento_dia: assoc.vencimento_dia,
        data_ingresso: assoc.data_ingresso,
        data_assinatura: assoc.data_assinatura,
        mesesFaltantes,
        selected: false,
      }
    }).filter(a => a.mesesFaltantes.length > 0)
  }, [associados, lancamentos, loadingAssoc, loadingFin, anoAnalise, mesInicio, mesFim])

  // Seleção de associados + meses
  const [selecoes, setSelecoes] = useState<Record<string, Set<string>>>({})
  // key: assocId, value: Set de "mes-ano" ex: "7-2026"

  const toggleMes = (assocId: string, mes: number, ano: number) => {
    const key = `${mes}-${ano}`
    setSelecoes(prev => {
      const set = new Set(prev[assocId] || [])
      if (set.has(key)) set.delete(key)
      else set.add(key)
      return { ...prev, [assocId]: set }
    })
  }

  const toggleTodosAssoc = (assoc: AssociadoAudit) => {
    const currentSet = selecoes[assoc.id] || new Set()
    const todosKeys = assoc.mesesFaltantes.map(m => `${m.mes}-${m.ano}`)
    const todosSel = todosKeys.every(k => currentSet.has(k))
    setSelecoes(prev => {
      const newSet = new Set(todosSel ? [] : todosKeys)
      return { ...prev, [assoc.id]: newSet }
    })
  }

  // Filtro de busca
  const dadosFiltrados = useMemo(() => {
    if (!searchQ) return auditoriaData
    const q = normStr(searchQ)
    return auditoriaData.filter(a => normStr(a.nome).includes(q))
  }, [auditoriaData, searchQ])

  // Contagem de selecionados
  const totalSelecionados = useMemo(() => {
    return Object.values(selecoes).reduce((acc, set) => acc + set.size, 0)
  }, [selecoes])

  // Selecionar todos os visíveis (filtrados)
  const toggleSelecionarTodosVisiveis = () => {
    setSelecoes(prev => {
      const next = { ...prev }
      let todosJaSelecionados = true
      
      // Verifica se todos já estão selecionados
      for (const assoc of dadosFiltrados) {
        const currentSet = next[assoc.id] || new Set()
        const todosKeys = assoc.mesesFaltantes.map(m => `${m.mes}-${m.ano}`)
        const todosSel = todosKeys.every(k => currentSet.has(k))
        if (!todosSel) {
          todosJaSelecionados = false
          break
        }
      }

      // Se já estavam todos, limpa a seleção deles. Se não, seleciona todos.
      for (const assoc of dadosFiltrados) {
        if (todosJaSelecionados) {
          next[assoc.id] = new Set()
        } else {
          const todosKeys = assoc.mesesFaltantes.map(m => `${m.mes}-${m.ano}`)
          next[assoc.id] = new Set(todosKeys)
        }
      }
      return next
    })
  }

  // Exportar Excel
  const handleExportExcel = () => {
    const rows = dadosFiltrados.map(assoc => ({
      'Associado': assoc.nome,
      'Associado Desde': formatDateBr(assoc.data_ingresso || assoc.data_assinatura),
      'Meses sem ingresso': assoc.mesesFaltantes.map(m => m.label).join(', '),
      'Qtd': assoc.mesesFaltantes.length,
      'Status': assoc.status
    }))

    if (rows.length === 0) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Meses Faltantes")
    XLSX.writeFile(wb, `auditoria_meses_faltantes_${anoAnalise}.xlsx`)
  }

  // ─── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = () => {
    const items: PreviewItem[] = []

    for (const assoc of auditoriaData) {
      const set = selecoes[assoc.id]
      if (!set || set.size === 0) continue

      for (const key of Array.from(set)) {
        const [mesStr, anoStr] = key.split('-')
        const mes = Number(mesStr)
        const ano = Number(anoStr)
        const mesLabel = `${MESES_NOMES[mes - 1]}/${ano}`
        const dia = String(assoc.vencimento_dia || 10).padStart(2, '0')
        const mesISO = String(mes).padStart(2, '0')
        const data = `${ano}-${mesISO}-${dia}`

        items.push({
          associado_id: assoc.id,
          nome: assoc.nome,
          mes,
          ano,
          label: mesLabel,
          data,
          descricao: `RECEB. DE MENSALIDADE - ${assoc.nome.toUpperCase()} [FIXO]`,
          valor: 50,
          tipo: 'receita',
          categoria: 'Mensalidades',
          status: 'atrasado',
          selItem: true,
        })
      }
    }

    // Ordena por associado, depois por data
    items.sort((a, b) => a.nome.localeCompare(b.nome) || a.data.localeCompare(b.data))
    setPreviewItems(items)
    setResultado(null)
  }

  // Selecionar / deselecionar itens no preview
  const togglePreviewItem = (idx: number) => {
    setPreviewItems(prev => prev
      ? prev.map((it, i) => i === idx ? { ...it, selItem: !it.selItem } : it)
      : null
    )
  }

  // ─── Lançar ────────────────────────────────────────────────────────────────
  const handleLancar = async () => {
    if (!previewItems) return
    const paraLancar = previewItems.filter(it => it.selItem)
    if (paraLancar.length === 0) return

    setIsLancando(true)
    try {
      // 1. Double check rigoroso no front-end para evitar qualquer duplicata
      const realmenteFaltantes = paraLancar.filter(it => {
        const jaExiste = lancamentos.some(l => {
          if (l.tipo !== 'receita') return false
          if (l.associado_id !== it.associado_id) return false
          
          // Se tiver competencia_mes/ano na base, bate exato
          if (l.competencia_mes && l.competencia_ano) {
            return Number(l.competencia_mes) === it.mes && Number(l.competencia_ano) === it.ano
          }
          
          // Se não, tenta bater pelo ano/mês da data gerada no BD
          if (l.data) {
            const d = new Date(l.data + 'T00:00:00')
            return d.getMonth() + 1 === it.mes && d.getFullYear() === it.ano
          }
          
          return false
        })
        return !jaExiste
      })

      if (realmenteFaltantes.length === 0) {
        setResultado({ ok: 0, erros: ['Todos os itens selecionados já possuem lançamento gerado no sistema (Prevenção de duplicidade ativada).'] })
        setIsLancando(false)
        return
      }

      const batch = realmenteFaltantes.map(it => ({
        associado_id: it.associado_id,
        data: it.data,
        competencia_mes: it.mes,
        competencia_ano: it.ano,
        descricao: it.descricao,
        categoria: it.categoria,
        tipo: it.tipo,
        valor: it.valor,
        status: it.status,
        conciliado: false
        // Removido force_create para permitir que a API faça sua própria checagem adicional anti-duplicata
      }))

      const res = await inserirBulk(batch as any)
      if (res?.error) {
        setResultado({ ok: 0, erros: [String(res.error)] })
      } else {
        const qtdLancados = realmenteFaltantes.length
        const msgExtra = qtdLancados < paraLancar.length 
          ? ` (Ignorados ${paraLancar.length - qtdLancados} duplicados já existentes)` 
          : ''
          
        setResultado({ ok: qtdLancados, erros: [], aviso: msgExtra })
        
        // Limpa seleções dos que foram lançados
        setSelecoes(prev => {
          const next = { ...prev }
          for (const it of realmenteFaltantes) {
            const set = new Set(next[it.associado_id] || [])
            set.delete(`${it.mes}-${it.ano}`)
            next[it.associado_id] = set
          }
          return next
        })
      }
    } catch (err: any) {
      setResultado({ ok: 0, erros: [err.message || 'Erro inesperado'] })
    } finally {
      setIsLancando(false)
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loadingAssoc || loadingFin) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Analisando lançamentos...</span>
      </div>
    )
  }

  const totalAssocAtivos = associados.filter(a => (a.status || '').toLowerCase() === 'ativo').length
  const totalComFalta = auditoriaData.length
  const totalMesesFaltantes = auditoriaData.reduce((acc, a) => acc + a.mesesFaltantes.length, 0)

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {/* ─── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Associados Ativos</p>
          <p className="text-3xl font-black text-slate-700">{totalAssocAtivos}</p>
        </div>
        <div className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Com mês(es) faltante(s)</p>
          <p className="text-3xl font-black text-rose-600">{totalComFalta}</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Total de meses faltantes</p>
          <p className="text-3xl font-black text-amber-600">{totalMesesFaltantes}</p>
        </div>
      </div>

      {/* ─── Filtros ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ano</label>
          <select
            value={anoAnalise}
            onChange={e => setAnoAnalise(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white"
          >
            {[anoAtual - 1, anoAtual, anoAtual + 1].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">De</label>
          <select
            value={mesInicio}
            onChange={e => setMesInicio(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white"
          >
            {MESES_NOMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Até</label>
          <select
            value={mesFim}
            onChange={e => setMesFim(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white"
          >
            {MESES_NOMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
          </select>
        </div>
        <div className="flex-1 relative min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar associado..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        {/* Botão Preview / Lançar em Lote */}
        {totalSelecionados > 0 && (
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-indigo-600/20"
          >
            <Eye size={15} />
            Preview ({totalSelecionados} mês{totalSelecionados !== 1 ? 'es' : ''})
          </button>
        )}
        
        {dadosFiltrados.length > 0 && (
          <>
            <button
              onClick={toggleSelecionarTodosVisiveis}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              title="Selecionar todos da lista atual"
            >
              <ListChecks size={15} />
              Sel. Todos
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-emerald-500/20"
            >
              <Download size={15} />
              Excel
            </button>
          </>
        )}
      </div>

      {/* ─── Tabela de resultados ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {dadosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <CheckCircle2 size={40} className="text-emerald-400" />
            <p className="text-sm font-semibold">Nenhum associado com meses faltantes no período selecionado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Associado</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-36">Desde</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Meses sem ingresso</th>
                <th className="text-center px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-28">Qtd</th>
                <th className="text-right px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-40">Sel. tudo</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map((assoc, idx) => {
                const setAssoc = selecoes[assoc.id] || new Set()
                const todosSelected = assoc.mesesFaltantes.every(m => setAssoc.has(`${m.mes}-${m.ano}`))

                return (
                  <tr
                    key={assoc.id}
                    className={`border-b border-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                  >
                    {/* Nome */}
                    <td className="px-5 py-3 font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                        {assoc.nome}
                      </div>
                    </td>

                    {/* Desde */}
                    <td className="px-5 py-3 text-slate-500 font-medium">
                      {formatDateBr(assoc.data_ingresso || assoc.data_assinatura)}
                    </td>

                    {/* Meses — chips clicáveis */}
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {assoc.mesesFaltantes.map(m => {
                          const key = `${m.mes}-${m.ano}`
                          const isSel = setAssoc.has(key)
                          return (
                            <button
                              key={key}
                              onClick={() => toggleMes(assoc.id, m.mes, m.ano)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer select-none ${
                                isSel
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {m.label}
                            </button>
                          )
                        })}
                      </div>
                    </td>

                    {/* Qtd */}
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
                        {assoc.mesesFaltantes.length}
                      </span>
                    </td>

                    {/* Sel tudo */}
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => toggleTodosAssoc(assoc)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                          todosSelected
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                        }`}
                      >
                        {todosSelected ? '✓ Todos sel.' : 'Sel. todos'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── MODAL PREVIEW ────────────────────────────────────────────────── */}
      {previewItems && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-800">Preview do Lançamento em Lote</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {previewItems.filter(it => it.selItem).length} de {previewItems.length} itens selecionados •{' '}
                  {fmtR(previewItems.filter(it => it.selItem).reduce((s, it) => s + it.valor, 0))} total
                </p>
              </div>
              <button
                onClick={() => { setPreviewItems(null); setResultado(null) }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Resultado pós-lançamento */}
            {resultado && (
              <div className={`mx-8 mt-5 p-4 rounded-2xl text-sm font-semibold ${resultado.erros.length === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {resultado.erros.length === 0
                  ? `✅ ${resultado.ok} lançamento(s) inserido(s) com sucesso!${resultado.aviso || ''}`
                  : `❌ Erro: ${resultado.erros.join(' | ')}`
                }
              </div>
            )}

            {/* Tabela Preview */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr>
                    <th className="text-center py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-10">Sel</th>
                    <th className="text-left py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Associado</th>
                    <th className="text-center py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-24">Mês Ref.</th>
                    <th className="text-center py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-24">Data</th>
                    <th className="text-right py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-20">Valor</th>
                    <th className="text-center py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewItems.map((it, idx) => (
                    <tr
                      key={idx}
                      onClick={() => togglePreviewItem(idx)}
                      className={`border-b border-slate-50 cursor-pointer transition-colors ${it.selItem ? 'bg-indigo-50/40' : 'opacity-40 bg-slate-50'}`}
                    >
                      <td className="py-2.5 text-center">
                        <div className={`w-4 h-4 rounded border-2 mx-auto flex items-center justify-center transition-all ${it.selItem ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                          {it.selItem && <span className="text-white text-[10px] font-black">✓</span>}
                        </div>
                      </td>
                      <td className="py-2.5 font-medium text-slate-700 pr-4">{it.nome}</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-full border border-rose-200">
                          {it.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-xs text-slate-500 font-mono">{it.data}</td>
                      <td className="py-2.5 text-right font-bold text-slate-700">{fmtR(it.valor)}</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                          atrasado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Clique em um item para incluir/excluir do lançamento.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setPreviewItems(null); setResultado(null) }}
                  className="px-5 py-2 text-sm font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                {!resultado?.ok && (
                  <button
                    onClick={handleLancar}
                    disabled={isLancando || previewItems.filter(it => it.selItem).length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-indigo-600/20"
                  >
                    {isLancando
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Lançando...</>
                      : <><Plus size={15} /> Lançar {previewItems.filter(it => it.selItem).length} registro(s)</>
                    }
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
