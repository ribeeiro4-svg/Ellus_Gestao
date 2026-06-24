'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Info, MessageCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import { useConciliacaoCalendario, CalendarioNota } from '@/lib/hooks/useConciliacaoCalendario'
import CalendarioNotaDrawer from './CalendarioNotaDrawer'
import Skeleton from '@/components/ui/Skeleton'

interface CalendarioConciliacaoProps {
  contas: any[]
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CalendarioConciliacao({ contas }: CalendarioConciliacaoProps) {
  const [selectedContaId, setSelectedContaId] = useState<string>('')
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear())
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1)
  const [visao, setVisao] = useState<'mensal' | 'anual'>('mensal')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  
  const { dias, loading, fetchDias, salvarNotas } = useConciliacaoCalendario()

  // Seta conta padrão para CORA PJ
  useEffect(() => {
    if (contas && contas.length > 0 && !selectedContaId) {
      const cora = contas.find(c => c.nome.toUpperCase().includes('CORA'))
      if (cora) {
        setSelectedContaId(cora.id)
      } else {
        setSelectedContaId(contas[0].id)
      }
    }
  }, [contas, selectedContaId])

  // Busca dados sempre que muda a conta, ano ou visão
  useEffect(() => {
    if (selectedContaId) {
      if (visao === 'mensal') {
        fetchDias(selectedContaId, anoAtual, mesAtual)
      } else {
        fetchDias(selectedContaId, anoAtual) // Busca o ano todo
      }
    }
  }, [selectedContaId, anoAtual, mesAtual, visao, fetchDias])

  const handlePrev = () => {
    if (visao === 'mensal') {
      if (mesAtual === 1) {
        setMesAtual(12)
        setAnoAtual(prev => prev - 1)
      } else {
        setMesAtual(prev => prev - 1)
      }
    } else {
      setAnoAtual(prev => prev - 1)
    }
  }

  const handleNext = () => {
    if (visao === 'mensal') {
      if (mesAtual === 12) {
        setMesAtual(1)
        setAnoAtual(prev => prev + 1)
      } else {
        setMesAtual(prev => prev + 1)
      }
    } else {
      setAnoAtual(prev => prev + 1)
    }
  }

  // Gera array de dias para o grid do calendário
  const gerarGridDias = (ano: number, mes: number) => {
    const primeiroDia = new Date(ano, mes - 1, 1).getDay()
    const diasNoMes = new Date(ano, mes, 0).getDate()
    const grid = []

    // Dias vazios do mês anterior
    for (let i = 0; i < primeiroDia; i++) {
      grid.push(null)
    }

    // Dias do mês atual
    for (let i = 1; i <= diasNoMes; i++) {
      const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      grid.push(dataStr)
    }

    return grid
  }

  const gridAtual = useMemo(() => gerarGridDias(anoAtual, mesAtual), [anoAtual, mesAtual])

  const getStatusDia = (dataStr: string) => {
    const diaInfo = dias.find(d => d.data === dataStr)
    if (!diaInfo) return { status: 'sem_movimento', notas: [] }

    const temPendencia = diaInfo.notas.some(n => n.tipo === 'pendencia' && !n.resolvido)
    const temAlerta = diaInfo.notas.some(n => n.tipo === 'alerta')
    
    let status = 'conciliado'
    if (!diaInfo.primeira_conciliacao_em) {
        // Tem nota mas não tem conciliação oficial do OFX/Cora
        status = 'sem_movimento'
    } else if (temPendencia) {
        status = 'pendencia'
    } else if (temAlerta) {
        status = 'alerta'
    }

    return { status, notas: diaInfo.notas, conciliadoEm: diaInfo.primeira_conciliacao_em }
  }

  const getCorStatus = (status: string) => {
    switch (status) {
      case 'conciliado': return 'bg-emerald-100 text-emerald-600 border-emerald-200'
      case 'pendencia': return 'bg-rose-100 text-rose-600 border-rose-200'
      case 'alerta': return 'bg-amber-100 text-amber-600 border-amber-200'
      default: return 'bg-white text-slate-700 border-slate-100 hover:border-slate-300'
    }
  }

  const getDiaAtualStr = () => {
    const hj = new Date()
    return `${hj.getFullYear()}-${String(hj.getMonth() + 1).padStart(2, '0')}-${String(hj.getDate()).padStart(2, '0')}`
  }

  const diaAtualStr = getDiaAtualStr()

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      
      {/* Header e Filtros */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Calendário de Conciliação</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acompanhamento e Observações</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <Filter size={14} className="text-slate-400 ml-2" />
            <select
              value={selectedContaId}
              onChange={(e) => setSelectedContaId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none p-2 focus:ring-0"
            >
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button 
              onClick={() => setVisao('mensal')} 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${visao === 'mensal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mensal
            </button>
            <button 
              onClick={() => setVisao('anual')} 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${visao === 'anual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Anual
            </button>
          </div>
        </div>
      </div>

      {/* Navegação de Data */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-[24px] shadow-sm border border-slate-100">
        <button onClick={handlePrev} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">
          {visao === 'mensal' ? `${MESES[mesAtual - 1]} de ${anoAtual}` : `Ano de ${anoAtual}`}
        </h3>
        <button onClick={handleNext} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 px-2">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400"></div><span className="text-xs font-bold text-slate-500 uppercase">Conciliado</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-400"></div><span className="text-xs font-bold text-slate-500 uppercase">Pendência</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span className="text-xs font-bold text-slate-500 uppercase">Alerta / Obs</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></div><span className="text-xs font-bold text-slate-500 uppercase">Sem Movimento / Não Importado</span></div>
      </div>

      {/* Grid Principal */}
      {loading ? (
        <Skeleton height={400} className="rounded-[32px]" />
      ) : visao === 'mensal' ? (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DIAS_SEMANA.map(dia => (
              <div key={dia} className="p-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                {dia}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr">
            {gridAtual.map((dataStr, i) => {
              if (!dataStr) return <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-slate-50 bg-slate-50/50" />
              
              const { status, notas, conciliadoEm } = getStatusDia(dataStr)
              const numDia = parseInt(dataStr.split('-')[2], 10)
              const isHoje = dataStr === diaAtualStr

              return (
                <div 
                  key={dataStr} 
                  onClick={() => setSelectedDay(dataStr)}
                  className={`relative min-h-[100px] p-2 border-r border-b border-slate-100 cursor-pointer transition-all group ${
                    status === 'conciliado' ? 'bg-emerald-50/70 hover:bg-emerald-100/70' : 'hover:bg-slate-50/80'
                  } ${isHoje ? 'ring-2 ring-indigo-500 ring-inset z-10' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${isHoje ? 'bg-indigo-600 text-white' : 'text-slate-600 group-hover:bg-slate-200'}`}>
                      {numDia}
                    </span>
                    <div className={`w-2 h-2 rounded-full mt-1 ${status === 'conciliado' ? 'bg-emerald-400' : status === 'pendencia' ? 'bg-rose-400' : status === 'alerta' ? 'bg-amber-400' : 'bg-transparent'}`} />
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-2">
                    {notas.slice(0, 2).map((nota, idx) => (
                      <div key={idx} className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${nota.tipo === 'pendencia' ? (nota.resolvido ? 'bg-slate-100 text-slate-400 line-through' : 'bg-rose-100 text-rose-600') : nota.tipo === 'alerta' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        {nota.texto}
                      </div>
                    ))}
                    {notas.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-400 pl-1">+ {notas.length - 2} notas</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {MESES.map((nomeMes, idxMes) => {
            const m = idxMes + 1
            const grid = gerarGridDias(anoAtual, m)
            return (
              <div key={m} className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3 text-center cursor-pointer hover:text-indigo-600" onClick={() => { setMesAtual(m); setVisao('mensal'); }}>
                  {nomeMes}
                </h4>
                <div className="grid grid-cols-7 gap-1">
                  {grid.map((dataStr, i) => {
                    if (!dataStr) return <div key={`empty-${i}`} className="aspect-square" />
                    const { status } = getStatusDia(dataStr)
                    const cor = status === 'conciliado' ? 'bg-emerald-400' : status === 'pendencia' ? 'bg-rose-400' : status === 'alerta' ? 'bg-amber-400' : 'bg-slate-100'
                    return (
                      <div 
                        key={dataStr} 
                        onClick={() => setSelectedDay(dataStr)}
                        className={`aspect-square rounded-sm cursor-pointer hover:opacity-70 transition-opacity ${cor}`} 
                        title={dataStr}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Drawer */}
      <CalendarioNotaDrawer 
        isOpen={!!selectedDay} 
        onClose={() => setSelectedDay(null)} 
        data={selectedDay} 
        notasExistentes={selectedDay ? (dias.find(d => d.data === selectedDay)?.notas || []) : []} 
        diaInfo={selectedDay ? dias.find(d => d.data === selectedDay) : undefined}
        onSaveNotas={(notas) => {
          if (selectedContaId && selectedDay) {
            salvarNotas(selectedContaId, selectedDay, notas)
          }
        }} 
      />

    </div>
  )
}
