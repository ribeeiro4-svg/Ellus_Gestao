'use client'
import React, { useState } from 'react'
import { useAtendimentos } from '@/lib/hooks/useAtendimentos'
import { Clock, Search, Send, CheckSquare, X, Play } from 'lucide-react'
import AtendimentoFluxoModal from './AtendimentoFluxoModal'
import FichaAssociadoModal from './FichaAssociadoModal'
import { useUsuarios } from '@/lib/hooks/useUsuarios'
import { useDiretoria } from '@/lib/hooks/useDiretoria'

export default function HistoricoAgendamentosTab() {
  const { atendimentos, loading, atualizar, responsaveis } = useAtendimentos()
  const { usuarios } = useUsuarios()
  const { diretoria } = useDiretoria()
  
  const responsaveisMap = React.useMemo(() => {
    const map = new Map()
    responsaveis.forEach(r => map.set(r.id, r.nome))
    usuarios.forEach(u => map.set(u.id, u.nome))
    diretoria.forEach(d => map.set(d.id, d.nome))
    return map
  }, [responsaveis, usuarios, diretoria])

  const [busca, setBusca] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalLoteOpen, setModalLoteOpen] = useState(false)
  const [dataEnvioLote, setDataEnvioLote] = useState('')
  const [savingLote, setSavingLote] = useState(false)
  
  const [selectedAtendimento, setSelectedAtendimento] = useState<any | null>(null)
  const [dataEnvioSingle, setDataEnvioSingle] = useState('')
  const [savingSingle, setSavingSingle] = useState(false)
  
  const [selectedAssociadoForAtendimento, setSelectedAssociadoForAtendimento] = useState<any | null>(null)
  const [selectedParaFicha, setSelectedParaFicha] = useState<any | null>(null)
  const [dadosAlterados, setDadosAlterados] = useState<string[]>([])
  
  const [editTipo, setEditTipo] = useState('INCLUSÃO NOVA')
  const [editTabela, setEditTabela] = useState('')
  const [editFaixa, setEditFaixa] = useState('')
  const [editValor, setEditValor] = useState('')
  const [editData, setEditData] = useState('')
  const [editHora, setEditHora] = useState('')

  const filtrados = atendimentos.filter(a => {
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      a.associados?.nome?.toLowerCase().includes(termo) ||
      a.associados?.cpf?.includes(termo) ||
      a.associados?.telefone?.includes(termo)
    )
  })

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Histórico de Agendamentos</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Listagem completa de todos os atendimentos registrados.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setModalLoteOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
            >
              <Send size={14} />
              Enviar ao HGU ({selectedIds.length})
            </button>
          )}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nome, CPF ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filtrados.length && filtrados.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filtrados.map(f => f.id))
                      } else {
                        setSelectedIds([])
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-4">Nome do Associado</th>
                <th className="px-6 py-4">CPF</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4">Corretor</th>
                <th className="px-6 py-4">Data do Agendamento</th>
                <th className="px-6 py-4">Hora</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Enviado ao HGU em</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium animate-pulse">
                    Carregando histórico...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((a, idx) => {
                  const dataAgendamento = a.data_agendamento ? new Date(a.data_agendamento) : null;
                  const enviadoHguEm = a.etapas_concluidas?.enviado_hgu_em;
                  const isSelected = selectedIds.includes(a.id);
                  
                  return (
                    <tr 
                      key={a.id || idx} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''}`}
                      onClick={() => {
                        setSelectedAtendimento(a)
                        setDataEnvioSingle(a.etapas_concluidas?.enviado_hgu_em || '')
                        setEditTipo(a.etapas_concluidas?.tipo || 'INCLUSÃO NOVA')
                        setEditTabela(a.etapas_concluidas?.tabela || '')
                        setEditFaixa(a.etapas_concluidas?.faixa_etaria || '')
                        setEditValor(a.etapas_concluidas?.valor_mensal || '')
                        if (a.data_agendamento) {
                          const d = new Date(a.data_agendamento)
                          const offset = d.getTimezoneOffset() * 60000
                          const localISOTime = new Date(d.getTime() - offset).toISOString()
                          setEditData(localISOTime.split('T')[0])
                          setEditHora(localISOTime.split('T')[1].substring(0, 5))
                        } else {
                          setEditData('')
                          setEditHora('')
                        }
                      }}
                    >
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, a.id])
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== a.id))
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {a.associados?.nome || 'Não informado'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {a.associados?.cpf || '--'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {a.associados?.telefone || '--'}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        {responsaveisMap.get(a.responsavel_id) || 'Sistema'}
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-600">
                        {responsaveisMap.get(a.etapas_concluidas?.corretor_id) || '--'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {dataAgendamento ? dataAgendamento.toLocaleDateString('pt-BR') : '--'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {dataAgendamento ? dataAgendamento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          a.status === 'agendado' ? 'bg-amber-100 text-amber-700' :
                          a.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                          a.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {a.status === 'em_andamento' ? 'Em Andamento' : a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-indigo-600">
                        {enviadoHguEm ? new Date(`${enviadoHguEm}T12:00:00`).toLocaleDateString('pt-BR') : '--'}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        {a.status !== 'concluido' && (
                          <button
                            onClick={() => setSelectedParaFicha({ id: a.associado_id, ...a.associados })}
                            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm ml-auto"
                            title="Iniciar Atendimento"
                          >
                            <Play size={12} fill="currentColor" />
                            Atender
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lote */}
      {modalLoteOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl p-10 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Envio ao HGU em Lote</h2>
            <p className="text-sm text-slate-500">Definir data de envio para {selectedIds.length} agendamento(s) selecionado(s).</p>
            
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Data de Envio</span>
              <input 
                type="date" 
                value={dataEnvioLote}
                onChange={e => setDataEnvioLote(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
              />
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setModalLoteOpen(false)} className="flex-1 btn-secondary text-xs uppercase font-black py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl">Cancelar</button>
              <button 
                onClick={async () => {
                  if (!dataEnvioLote) return alert('Selecione uma data')
                  setSavingLote(true)
                  for (const id of selectedIds) {
                    const at = atendimentos.find(x => x.id === id)
                    if (at) {
                      await atualizar(id, {
                        etapas_concluidas: {
                          ...(at.etapas_concluidas || {}),
                          enviado_hgu_em: dataEnvioLote
                        }
                      })
                    }
                  }
                  setSavingLote(false)
                  setModalLoteOpen(false)
                  setSelectedIds([])
                }} 
                disabled={savingLote} 
                className="flex-1 btn-primary text-xs uppercase font-black py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                {savingLote ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Single Detalhes */}
      {selectedAtendimento && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Detalhes do Agendamento</h2>
              <button onClick={() => setSelectedAtendimento(null)} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X size={16} /></button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex flex-col gap-1 md:col-span-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Associado</span>
                <span className="font-bold text-slate-800">{selectedAtendimento.associados?.nome || '--'} - {selectedAtendimento.associados?.cpf || '--'}</span>
              </div>
              
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</span>
                <input type="date" value={editData} onChange={e => setEditData(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 transition-colors" />
              </label>
              
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora</span>
                <input type="time" value={editHora} onChange={e => setEditHora(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 transition-colors" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</span>
                <select value={editTipo} onChange={e => setEditTipo(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 transition-colors">
                  <option value="INCLUSÃO NOVA">INCLUSÃO NOVA</option>
                  <option value="MIGRAÇÃO">MIGRAÇÃO</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tabela</span>
                <input type="text" value={editTabela} onChange={e => setEditTabela(e.target.value)} placeholder="Ex: Tabela 1" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 transition-colors" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Mensal</span>
                <input type="text" value={editValor} onChange={e => setEditValor(e.target.value)} placeholder="Ex: 150,00" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 transition-colors" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Faixa Etária</span>
                <select value={editFaixa} onChange={e => setEditFaixa(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 transition-colors">
                  <option value="">Selecione...</option>
                  <option value="0 a 18">0 a 18 anos</option>
                  <option value="19 a 23">19 a 23 anos</option>
                  <option value="24 a 28">24 a 28 anos</option>
                  <option value="29 a 33">29 a 33 anos</option>
                  <option value="34 a 38">34 a 38 anos</option>
                  <option value="39 a 43">39 a 43 anos</option>
                  <option value="44 a 48">44 a 48 anos</option>
                  <option value="49 a 53">49 a 53 anos</option>
                  <option value="54 a 58">54 a 58 anos</option>
                  <option value="59+">59 anos ou mais</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Enviado ao HGU em</span>
              <input 
                type="date" 
                value={dataEnvioSingle}
                onChange={e => setDataEnvioSingle(e.target.value)}
                className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl text-sm font-bold text-indigo-900 outline-none focus:border-indigo-500 transition-colors shadow-sm"
              />
            </label>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 mt-2">
              <button 
                onClick={async () => {
                  setSavingSingle(true)
                  let newDateAgendamento = selectedAtendimento.data_agendamento
                  if (editData && editHora) {
                    newDateAgendamento = new Date(`${editData}T${editHora}:00`).toISOString()
                  }
                  
                  await atualizar(selectedAtendimento.id, {
                    data_agendamento: newDateAgendamento,
                    etapas_concluidas: {
                      ...(selectedAtendimento.etapas_concluidas || {}),
                      enviado_hgu_em: dataEnvioSingle,
                      tipo: editTipo,
                      tabela: editTabela,
                      faixa_etaria: editFaixa,
                      valor_mensal: editValor
                    }
                  })
                  setSavingSingle(false)
                  setSelectedAtendimento(null)
                }} 
                disabled={savingSingle} 
                className="w-full btn-primary text-xs uppercase font-black py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all"
              >
                {savingSingle ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
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
    </div>
  )
}
