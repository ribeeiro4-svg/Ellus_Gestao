'use client'
import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, ArrowRight, Calendar as CalendarIcon, CalendarClock, Ban, Trash2, UserPlus, MessageCircle, Send } from 'lucide-react'
import { useAtendimentos } from '@/lib/hooks/useAtendimentos'
import { useAssociados } from '@/lib/hooks/useAssociados'
import StatusBadge from '@/components/ui/StatusBadge'
import AtendimentoFluxoModal from './AtendimentoFluxoModal'
import BuscaAssociadoAtendimento from './BuscaAssociadoAtendimento'
import FichaAssociadoModal from './FichaAssociadoModal'
import CaixaEspecieSection from './CaixaEspecieSection'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CalendarioAgendamentos({ onStartAtendimento, onRegistrarAdesao, onSalvarHistorico }: {
  onStartAtendimento: () => void
  onRegistrarAdesao?: (dados: { nome_completo: string; cpf: string; telefone: string }) => void
  onSalvarHistorico?: (dados: { nome_completo: string; cpf: string; telefone: string }) => void
}) {
  const { atendimentos, responsaveis, inserir, atualizar, remover, loading } = useAtendimentos()
  const { associados, loading: loadingAssoc } = useAssociados()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentUserId, setCurrentUserId] = useState<string>('')
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('user_profile')
      if (raw) setCurrentUserId(JSON.parse(raw).id)
    } catch {}
  }, [])
  const [selectedDayAtendimentos, setSelectedDayAtendimentos] = useState<any[] | null>(null)
  const [selectedDateLabel, setSelectedDateLabel] = useState('')
  const [isNewAgendamentoOpen, setIsNewAgendamentoOpen] = useState(false)
  const [agendamentoDate, setAgendamentoDate] = useState('')
  const [agendamentoTime, setAgendamentoTime] = useState('')
  const [agendamentoAssocId, setAgendamentoAssocId] = useState('')
  const [agendamentoRespId, setAgendamentoRespId] = useState('')
  const [agendamentoTipo, setAgendamentoTipo] = useState('INCLUSÃO NOVA')
  const [agendamentoTabela, setAgendamentoTabela] = useState('')
  const [agendamentoValor, setAgendamentoValor] = useState('')
  const [agendamentoFaixa, setAgendamentoFaixa] = useState('')
  const [agendamentoCorretorId, setAgendamentoCorretorId] = useState('')
  
  const [editarAgendamento, setEditarAgendamento] = useState<any>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editAssocId, setEditAssocId] = useState('')
  const [editRespId, setEditRespId] = useState('')
  const [editTipo, setEditTipo] = useState('INCLUSÃO NOVA')
  const [editTabela, setEditTabela] = useState('')
  const [editValor, setEditValor] = useState('')
  const [editFaixa, setEditFaixa] = useState('')
  const [editCorretorId, setEditCorretorId] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  
  const [selectedAssociadoForAtendimento, setSelectedAssociadoForAtendimento] = useState<any>(null)
  const [selectedParaFicha, setSelectedParaFicha] = useState<any>(null)
  const [dadosAlterados, setDadosAlterados] = useState<string[]>([])

  // Remarcar
  const [remarcarAgendamento, setRemarcarAgendamento] = useState<any>(null)
  const [remarcarDate, setRemarcarDate] = useState('')
  const [remarcarTime, setRemarcarTime] = useState('')
  const [remarcarSaving, setRemarcarSaving] = useState(false)

  // Cancelar / Excluir
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancelar' | 'excluir', agendamento: any } | null>(null)
  const [confirmSaving, setConfirmSaving] = useState(false)

  // Novo Associado
  const [isNovoAssociadoOpen, setIsNovoAssociadoOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('+55')
  const [novoCpf, setNovoCpf] = useState('')

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()
  const corretores = responsaveis.filter(r => r.tipo === 'Venda do Plano')

  const dias = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const daysArray = []
    const startPadding = firstDay.getDay()
    
    for (let i = 0; i < startPadding; i++) {
      daysArray.push(null)
    }
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      daysArray.push(new Date(year, month, d))
    }
    
    return daysArray
  }, [month, year])

  const atendimentosNoMes = useMemo(() => {
    const map = new Map<string, any[]>()
    atendimentos.forEach(a => {
      if (!a.data_agendamento || a.status === 'concluido') return
      const date = new Date(a.data_agendamento)
      if (date.getMonth() === month && date.getFullYear() === year) {
        const key = date.getDate().toString()
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(a)
      }
    })
    return map
  }, [atendimentos, month, year])

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const handleDayClick = (date: Date) => {
    const key = date.getDate().toString()
    const dayAtend = atendimentosNoMes.get(key) || []
    setSelectedDayAtendimentos(dayAtend)
    setSelectedDateLabel(`${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`)
  }

  const handleCreateAgendamento = async () => {
    if (!agendamentoAssocId || !agendamentoDate || !agendamentoTime) return alert('Preencha todos os campos.')
    const dateTime = new Date(`${agendamentoDate}T${agendamentoTime}:00`)
    await inserir({
      associado_id: agendamentoAssocId,
      data_agendamento: dateTime.toISOString(),
      responsavel_id: currentUserId,
      etapas_concluidas: { 
        tipo: agendamentoTipo,
        tabela: agendamentoTabela,
        valor_mensal: agendamentoValor,
        faixa_etaria: agendamentoFaixa,
        corretor_id: agendamentoCorretorId
      },
      status: 'agendado'
    })
    setIsNewAgendamentoOpen(false)
    setAgendamentoAssocId('')
    setAgendamentoDate('')
    setAgendamentoTime('')
    setAgendamentoRespId('')
    setAgendamentoTipo('INCLUSÃO NOVA')
    setAgendamentoTabela('')
    setAgendamentoValor('')
    setAgendamentoFaixa('')
    setAgendamentoCorretorId('')
  }

  const handleEditAgendamento = async () => {
    if (!editAssocId || !editDate || !editTime || !editarAgendamento) return alert('Preencha todos os campos.')
    setEditSaving(true)
    const dateTime = new Date(`${editDate}T${editTime}:00`)
    await atualizar(editarAgendamento.id, {
      associado_id: editAssocId,
      data_agendamento: dateTime.toISOString(),
      responsavel_id: editRespId || currentUserId,
      etapas_concluidas: { 
        ...(editarAgendamento.etapas_concluidas || {}), 
        tipo: editTipo,
        tabela: editTabela,
        valor_mensal: editValor,
        faixa_etaria: editFaixa,
        corretor_id: editCorretorId
      }
    })
    setEditSaving(false)
    setEditarAgendamento(null)
    setSelectedDayAtendimentos(null)
  }

  const handleRemarcar = async () => {
    if (!remarcarDate || !remarcarTime || !remarcarAgendamento) return alert('Informe a nova data e horário.')
    setRemarcarSaving(true)
    const dateTime = new Date(`${remarcarDate}T${remarcarTime}:00`)
    await atualizar(remarcarAgendamento.id, {
      data_agendamento: dateTime.toISOString(),
      status: 'agendado'
    })
    setRemarcarSaving(false)
    setRemarcarAgendamento(null)
    setRemarcarDate('')
    setRemarcarTime('')
    // Atualiza a lista do dia se ainda estiver aberta
    setSelectedDayAtendimentos(null)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    setConfirmSaving(true)
    if (confirmAction.type === 'cancelar') {
      await atualizar(confirmAction.agendamento.id, { status: 'cancelado' })
    } else {
      await remover(confirmAction.agendamento.id)
    }
    setConfirmSaving(false)
    setConfirmAction(null)
    setSelectedDayAtendimentos(null)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Buscar Associado - topo */}
      <div className="rounded-2xl shadow-md relative" style={{ background: 'linear-gradient(175deg, #0e2d22 0%, #163d2f 35%, #1d4f3e 65%, #24604c 100%)', border: '1px solid rgba(45,140,111,.25)' }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(45,140,111,.18)' }}>
          <span className="text-[11px] font-black text-emerald-300 uppercase tracking-widest">Iniciar Atendimento</span>
        </div>
        <div className="px-6 py-8">
          <BuscaAssociadoAtendimento />
        </div>
      </div>

      {/* Divisor */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Calendário de Agendamentos</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Header Calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest min-w-[200px] text-center">
            {MESES[month]} {year}
          </h3>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setIsNovoAssociadoOpen(true); setNovoNome(''); setNovoTelefone('+55'); setNovoCpf('') }}
            className="btn-primary text-[11px] uppercase font-black px-5 py-2.5 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <UserPlus size={14} /> Novo Associado
          </button>
          <button 
            onClick={() => setIsNewAgendamentoOpen(true)}
            className="btn-primary text-[11px] uppercase font-black px-5 py-2.5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={14} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-slate-100 gap-[1px]">
          {dias.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="bg-white min-h-[100px] opacity-40"></div>
            
            const isToday = new Date().toDateString() === date.toDateString()
            const dayEvents = atendimentosNoMes.get(date.getDate().toString()) || []
            const hasEvents = dayEvents.length > 0
            
            return (
              <div 
                key={date.toISOString()} 
                onClick={() => handleDayClick(date)}
                className={`bg-white min-h-[100px] p-2 hover:bg-slate-50 cursor-pointer transition-colors relative flex flex-col items-center justify-start gap-2 ${isToday ? 'bg-blue-50/30' : ''}`}
              >
                <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                  {date.getDate()}
                </span>
                
                {hasEvents && (
                  <div className="w-full mt-1 flex flex-col gap-1">
                    <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 rounded-lg py-1 px-2 text-center flex items-center justify-center gap-1">
                      <CalendarIcon size={10} />
                      {dayEvents.length} agend.
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal Lista do Dia */}
      {selectedDayAtendimentos && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Agendamentos — {selectedDateLabel}</h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const [d, m, y] = selectedDateLabel.split('/')
                    setAgendamentoDate(`${y}-${m}-${d}`)
                    setIsNewAgendamentoOpen(true)
                  }}
                  className="btn-primary text-[10px] uppercase font-black px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={14} /> Novo Agendamento
                </button>
                <button onClick={() => setSelectedDayAtendimentos(null)} className="p-2 rounded-full hover:bg-slate-200 text-slate-400">
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {selectedDayAtendimentos.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center gap-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 text-sm font-medium">Nenhum agendamento para este dia.</p>
                  <button 
                    onClick={() => {
                      const [d, m, y] = selectedDateLabel.split('/')
                      setAgendamentoDate(`${y}-${m}-${d}`)
                      setIsNewAgendamentoOpen(true)
                    }}
                    className="text-[11px] uppercase font-black px-5 py-2.5 flex items-center gap-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                  >
                    <Plus size={14} /> Criar Primeiro Agendamento
                  </button>
                </div>
              ) : (
                selectedDayAtendimentos.map((a: any) => {
                  const assoc = a.associados || {}
                  const hora = new Date(a.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  
                  return (
                    <div key={a.id} className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex flex-col items-center justify-center font-bold text-xs uppercase shrink-0">
                            {hora}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800 uppercase">
                              {assoc.nome || 'Associado Removido'}
                              {a.etapas_concluidas?.tipo && <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-black uppercase">{a.etapas_concluidas.tipo}</span>}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">CPF: {assoc.cpf || '--'} | Tel: {assoc.telefone || '--'}</span>
                          </div>
                        </div>
                        <StatusBadge status={a.status} type="associado" />
                      </div>

                      <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
                         <button
                           onClick={() => {
                             const d = new Date(a.data_agendamento)
                             setEditDate(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`)
                             setEditTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`)
                             setEditAssocId(a.associado_id || '')
                             setEditRespId(a.responsavel_id || '')
                             setEditTipo(a.etapas_concluidas?.tipo || 'INCLUSÃO NOVA')
                             setEditTabela(a.etapas_concluidas?.tabela || '')
                             setEditValor(a.etapas_concluidas?.valor_mensal || '')
                             setEditFaixa(a.etapas_concluidas?.faixa_etaria || '')
                             setEditCorretorId(a.etapas_concluidas?.corretor_id || '')
                             setEditarAgendamento(a)
                           }}
                           className="shrink-0 text-[10px] uppercase font-black px-3 py-2 flex items-center gap-1.5 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                         >
                           Editar
                         </button>
                         <button
                           onClick={() => {
                             setRemarcarAgendamento(a)
                             setRemarcarDate('')
                             setRemarcarTime('')
                           }}
                           className="shrink-0 text-[10px] uppercase font-black px-3 py-2 flex items-center gap-1.5 rounded-xl border border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors"
                         >
                           <CalendarClock size={12} />
                           Remarcar
                         </button>
                         {a.status !== 'cancelado' && (
                           <button
                             onClick={() => setConfirmAction({ type: 'cancelar', agendamento: a })}
                             className="shrink-0 text-[10px] uppercase font-black px-3 py-2 flex items-center gap-1.5 rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-50 transition-colors"
                           >
                             <Ban size={12} />
                             Cancelar
                           </button>
                         )}
                         <button
                           onClick={() => setConfirmAction({ type: 'excluir', agendamento: a })}
                           className="shrink-0 text-[10px] uppercase font-black px-3 py-2 flex items-center gap-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                         >
                           <Trash2 size={12} />
                           Excluir
                         </button>
                         <button 
                           onClick={() => {
                             setSelectedDayAtendimentos(null)
                             setSelectedParaFicha({id: a.associado_id, ...assoc})
                           }}
                           className="shrink-0 btn-primary text-[10px] uppercase font-black px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                         >
                           Atender
                           <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                         </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Cancelar/Excluir */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className={`text-base font-black uppercase tracking-tight ${confirmAction.type === 'excluir' ? 'text-red-600' : 'text-slate-700'}`}>
                  {confirmAction.type === 'cancelar' ? 'Cancelar Agendamento' : 'Excluir Agendamento'}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{confirmAction.agendamento.associados?.nome || 'Associado'}</p>
              </div>
              <button onClick={() => setConfirmAction(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <p className="text-sm text-slate-600">
              {confirmAction.type === 'cancelar'
                ? 'Tem certeza que deseja cancelar este agendamento? O registro será mantido com status "Cancelado".'
                : 'Tem certeza que deseja excluir permanentemente este agendamento? Esta ação não pode ser desfeita.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmSaving}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${confirmAction.type === 'excluir' ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-600 hover:bg-slate-700'}`}
              >
                {confirmAction.type === 'excluir' ? <Trash2 size={14} /> : <Ban size={14} />}
                {confirmSaving ? 'Aguarde...' : confirmAction.type === 'cancelar' ? 'Confirmar Cancelamento' : 'Excluir Definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Remarcar Agendamento */}
      {remarcarAgendamento && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Remarcar Agendamento</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{remarcarAgendamento.associados?.nome || 'Associado'}</p>
              </div>
              <button onClick={() => setRemarcarAgendamento(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nova Data</span>
                <input
                  type="date"
                  value={remarcarDate}
                  onChange={e => setRemarcarDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-amber-500"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Novo Horário</span>
                <input
                  type="time"
                  value={remarcarTime}
                  onChange={e => setRemarcarTime(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-amber-500"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRemarcarAgendamento(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemarcar}
                disabled={remarcarSaving}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <CalendarClock size={14} />
                {remarcarSaving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Agendamento */}
      {isNewAgendamentoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Novo Agendamento</h2>
              <button onClick={() => setIsNewAgendamentoOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Associado</span>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                  value={agendamentoAssocId}
                  onChange={e => setAgendamentoAssocId(e.target.value)}
                >
                  <option value="">Selecione um associado...</option>
                  {associados.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Responsável pela Venda (Corretor)</span>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={agendamentoCorretorId}
                    onChange={e => setAgendamentoCorretorId(e.target.value)}
                  >
                    <option value="">Nenhum/Indefinido</option>
                    {corretores.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.nome}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tipo de Atendimento</span>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={agendamentoTipo}
                    onChange={e => setAgendamentoTipo(e.target.value)}
                  >
                    <option value="INCLUSÃO NOVA">INCLUSÃO NOVA</option>
                    <option value="MIGRAÇÃO">MIGRAÇÃO</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tabela</span>
                  <input 
                    type="text" 
                    placeholder="Ex: Tabela 1"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={agendamentoTabela}
                    onChange={e => {
                      if (editarAgendamento) setEditTabela(e.target.value)
                      else setAgendamentoTabela(e.target.value)
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Valor Mensal</span>
                  <input 
                    type="text" 
                    placeholder="R$ 0,00"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={agendamentoValor}
                    onChange={e => {
                      if (editarAgendamento) setEditValor(e.target.value)
                      else setAgendamentoValor(e.target.value)
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Faixa Etária</span>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={agendamentoFaixa}
                    onChange={e => {
                      if (editarAgendamento) setEditFaixa(e.target.value)
                      else setAgendamentoFaixa(e.target.value)
                    }}
                  >
                    <option value="">Selecione...</option>
                    <option value="0 a 18">0 a 18</option>
                    <option value="19 a 23">19 a 23</option>
                    <option value="24 a 28">24 a 28</option>
                    <option value="29 a 33">29 a 33</option>
                    <option value="34 a 38">34 a 38</option>
                    <option value="39 a 43">39 a 43</option>
                    <option value="44 a 48">44 a 48</option>
                    <option value="49 a 53">49 a 53</option>
                    <option value="54 a 58">54 a 58</option>
                    <option value="> 59">{'> 59'}</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Data</span>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={agendamentoDate}
                    onChange={e => setAgendamentoDate(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Horário</span>
                  <input 
                    type="time" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={agendamentoTime}
                    onChange={e => setAgendamentoTime(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <button onClick={handleCreateAgendamento} className="btn-primary uppercase font-black w-full py-4 text-sm mt-2">
              Confirmar Agendamento
            </button>
          </div>
        </div>
      )}

      {/* Modal Editar Agendamento */}
      {editarAgendamento && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[115] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Editar Agendamento</h2>
              <button onClick={() => setEditarAgendamento(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Associado</span>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                  value={editAssocId}
                  onChange={e => setEditAssocId(e.target.value)}
                >
                  <option value="">Selecione um associado...</option>
                  {associados.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Responsável pela Venda (Corretor)</span>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={editCorretorId}
                    onChange={e => setEditCorretorId(e.target.value)}
                  >
                    <option value="">Nenhum/Indefinido</option>
                    {corretores.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.nome}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tipo de Atendimento</span>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={editTipo}
                    onChange={e => setEditTipo(e.target.value)}
                  >
                    <option value="INCLUSÃO NOVA">INCLUSÃO NOVA</option>
                    <option value="MIGRAÇÃO">MIGRAÇÃO</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tabela</span>
                  <input 
                    type="text" 
                    placeholder="Ex: Tabela 1"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={editTabela}
                    onChange={e => setEditTabela(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Valor Mensal</span>
                  <input 
                    type="text" 
                    placeholder="R$ 0,00"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={editValor}
                    onChange={e => setEditValor(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Faixa Etária</span>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={editFaixa}
                    onChange={e => setEditFaixa(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    <option value="0 a 18">0 a 18</option>
                    <option value="19 a 23">19 a 23</option>
                    <option value="24 a 28">24 a 28</option>
                    <option value="29 a 33">29 a 33</option>
                    <option value="34 a 38">34 a 38</option>
                    <option value="39 a 43">39 a 43</option>
                    <option value="44 a 48">44 a 48</option>
                    <option value="49 a 53">49 a 53</option>
                    <option value="54 a 58">54 a 58</option>
                    <option value="> 59">{'> 59'}</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Data</span>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Horário</span>
                  <input 
                    type="time" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <button disabled={editSaving} onClick={handleEditAgendamento} className="btn-primary uppercase font-black w-full py-4 text-sm mt-2 disabled:opacity-50">
              {editSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Ficha Modal */}
      {selectedParaFicha && (
        <FichaAssociadoModal
          associado={selectedParaFicha}
          onClose={() => setSelectedParaFicha(null)}
          onProceed={(associadoAtualizado, alterados) => {
            setSelectedParaFicha(null)
            setDadosAlterados(alterados)
            setSelectedAssociadoForAtendimento(associadoAtualizado)
          }}
        />
      )}

      {/* Modal de Atendimento (Aberto a partir do Agendamento) */}
      {selectedAssociadoForAtendimento && (
        <AtendimentoFluxoModal 
          associado={selectedAssociadoForAtendimento} 
          dadosAlteradosNoCadastro={dadosAlterados}
          onClose={() => {
            setSelectedAssociadoForAtendimento(null)
            setDadosAlterados([])
          }} 
        />
      )}
      {/* Modal Novo Associado */}
      {isNovoAssociadoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Novo Associado</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Iniciar processo de adesão</p>
                </div>
              </div>
              <button onClick={() => setIsNovoAssociadoOpen(false)} className="p-2 rounded-full hover:bg-slate-200 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Campos */}
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nome Completo <span className="text-red-400">*</span></span>
                  <input
                    type="text"
                    placeholder="Ex: Maria da Silva"
                    value={novoNome}
                    onChange={e => setNovoNome(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">CPF <span className="text-red-400">*</span></span>
                  <input
                    type="text"
                    placeholder="Ex: 000.000.000-00"
                    value={novoCpf}
                    onChange={e => setNovoCpf(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Telefone (WhatsApp) <span className="text-red-400">*</span></span>
                  <input
                    type="tel"
                    placeholder="DDD + Número"
                    value={novoTelefone}
                    onChange={e => {
                      const val = e.target.value
                      if (!val.startsWith('+55')) setNovoTelefone('+55')
                      else setNovoTelefone(val)
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </label>
              </div>

              {/* Preview resumido */}
              {novoNome && novoCpf && novoTelefone && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                    <MessageCircle size={10} /> Mensagem pronta para enviar
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Link do termo + instruções de pagamento (R$50,00) via PIX CNPJ CORA serão enviados para <strong>{novoTelefone}</strong>.
                  </p>
                </div>
              )}

              {/* Botão WhatsApp */}
              <a
                href={novoNome && novoCpf && novoTelefone
                  ? `https://wa.me/${novoTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${novoNome}!\n\nPara formalizar sua adesão à ACPROBEC, acesse o link abaixo, preencha seus dados com atenção, e continue para assinatura:\n\n*Atenção ao e-mail que você vai informar, pois a plataforma vai encaminhar um e-mail com um código para validar sua assinatura digital.*\n\nLink: https://app.zapsign.com.br/verificar/doc/dc27a27e-452e-4d27-aa03-1d62b669a1f3\n\n\nEm seguida, o próximo passo é realizar o pagamento da taxa de adesão, no valor de R$50,00.\n\nO pagamento da taxa de adesão (R$50,00), pode ser feito via pix abaixo:\n\nBanco CORA - *Chave: Pix CNPJ:* 64.219.750/0001-31\nAssociação Colaborativa De Profissionais Liberais, Comercio e Setor de Beleza\n\n*Ao concluir, basta nos enviar o comprovante de pagamento!*\n\nPara as mensalidades da associação, os boletos serão enviados para o e-mail que você cadastrar nesse termo de adesão. Sempre com vencimento no dia 10 de cada mês.`)}`
                  : '#'}
                target="_blank"
                rel="noreferrer"
                onClick={e => {
                    if (!novoNome || !novoCpf || !novoTelefone) {
                      e.preventDefault()
                    } else {
                      onRegistrarAdesao?.({ nome_completo: novoNome, cpf: novoCpf, telefone: novoTelefone })
                    }
                  }}
                className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-wide transition-all ${
                  novoNome && novoCpf && novoTelefone
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                }`}
              >
                <Send size={15} />
                Formalizar Termo de Adesão
              </a>

              {(!novoNome || !novoCpf || !novoTelefone) && (
                <p className="text-[10px] text-slate-400 text-center -mt-2">
                  Preencha todos os campos obrigatórios para habilitar o envio.
                </p>
              )}

              {/* Divisor */}
              {novoNome && novoCpf && novoTelefone && (
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] text-slate-400 font-medium">ou</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              )}

              {/* Botão Salvar no Histórico */}
              <button
                disabled={!novoNome || !novoCpf || !novoTelefone}
                onClick={() => {
                  if (!novoNome || !novoCpf || !novoTelefone) return
                  onSalvarHistorico?.({ nome_completo: novoNome, cpf: novoCpf, telefone: novoTelefone })
                  setIsNovoAssociadoOpen(false)
                }}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold transition-all border-2 ${
                  novoNome && novoCpf && novoTelefone
                    ? 'border-violet-500 text-violet-600 hover:bg-violet-50'
                    : 'border-slate-200 text-slate-300 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Salvar no Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção Caixa (Espécie) */}
      <CaixaEspecieSection />
    </div>
  )
}
