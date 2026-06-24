'use client'
import React, { useState, useMemo } from 'react'
import { AlertTriangle, Clock, Search, Trash2, FileText, Calendar, CheckSquare, Square, XCircle, DollarSign } from 'lucide-react'
import { useCancelamentos, HistoricoCancelamento } from '@/lib/hooks/useCancelamentos'
import QuitarPendenciasModal from './QuitarPendenciasModal'

export default function HistoricoCancelamentosTab() {
  const { historico, remover, removerBulk } = useCancelamentos()
  const [busca, setBusca] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null) // id individual ou 'bulk'
  const [senhaExclusao, setSenhaExclusao] = useState('')
  const [erroSenhaExclusao, setErroSenhaExclusao] = useState(false)
  const [quitarItem, setQuitarItem] = useState<HistoricoCancelamento | null>(null)

  const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR')
  const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const filtrados = useMemo(() => {
    return historico.filter(h => {
      const matchBusca = h.nome.toLowerCase().includes(busca.toLowerCase()) || h.cpf.includes(busca)
      const dataH = new Date(h.data_solicitacao)
      const matchInicio = dataInicio ? dataH >= new Date(dataInicio + 'T00:00:00') : true
      const matchFim = dataFim ? dataH <= new Date(dataFim + 'T23:59:59') : true
      return matchBusca && matchInicio && matchFim
    })
  }, [historico, busca, dataInicio, dataFim])

  const totalSelecionados = selecionados.length
  const todosSelecionados = filtrados.length > 0 && filtrados.every(h => selecionados.includes(h.id))
  const totalPendencias = filtrados.reduce((acc, h) => acc + (h.valor_pendente || 0), 0)

  const toggleSelecionado = (id: string) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleTodos = () => {
    if (todosSelecionados) {
      setSelecionados([])
    } else {
      setSelecionados(filtrados.map(h => h.id))
    }
  }

  const handleRemoverIndividual = (id: string) => {
    remover(id)
    setSelecionados(prev => prev.filter(i => i !== id))
    setConfirmDelete(null)
    setSenhaExclusao('')
    setErroSenhaExclusao(false)
  }

  const handleRemoverBulk = () => {
    removerBulk(selecionados)
    setSelecionados([])
    setConfirmDelete(null)
    setSenhaExclusao('')
    setErroSenhaExclusao(false)
  }

  const closeDeleteModal = () => {
    setConfirmDelete(null)
    setSenhaExclusao('')
    setErroSenhaExclusao(false)
  }

  const handleConfirmExclusao = () => {
    if (senhaExclusao !== '19072425') {
      setErroSenhaExclusao(true)
      return
    }
    setErroSenhaExclusao(false)
    if (confirmDelete === 'bulk') {
      handleRemoverBulk()
    } else if (confirmDelete) {
      handleRemoverIndividual(confirmDelete)
    }
  }

  const handleGerarPdf = () => {
    const registros = filtrados
    const periodoLabel = dataInicio && dataFim
      ? `${new Date(dataInicio + 'T12:00:00Z').toLocaleDateString('pt-BR')} a ${new Date(dataFim + 'T12:00:00Z').toLocaleDateString('pt-BR')}`
      : dataInicio
        ? `A partir de ${new Date(dataInicio + 'T12:00:00Z').toLocaleDateString('pt-BR')}`
        : dataFim
          ? `Até ${new Date(dataFim + 'T12:00:00Z').toLocaleDateString('pt-BR')}`
          : 'Todo o período'

    const totalVal = registros.reduce((acc, h) => acc + (h.valor_pendente || 0), 0)

    const linhas = registros.map((h, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569">${new Date(h.data_solicitacao).toLocaleString('pt-BR')}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:800;color:#1e293b;text-transform:uppercase">${h.nome}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#64748b">${h.cpf || '--'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:800;color:#dc2626;text-align:right">${fmtR(h.valor_pendente)}</td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Histórico de Cancelamentos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 32px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 28px; border-bottom: 3px solid #dc2626; padding-bottom: 16px; }
          .header h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; color: #dc2626; letter-spacing: 2px; }
          .header p { font-size: 11px; color: #64748b; margin-top: 4px; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
          .meta-item { font-size: 11px; color: #475569; }
          .meta-item strong { color: #1e293b; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #dc2626; }
          thead th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: white; }
          thead th:last-child { text-align: right; }
          .total-row td { padding: 12px 14px; font-size: 12px; font-weight: 900; color: #1e293b; background: #f1f5f9; border-top: 2px solid #dc2626; }
          .total-row td:last-child { color: #dc2626; text-align: right; }
          .footer { text-align: center; margin-top: 28px; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Histórico de Cancelamentos</h1>
          <p>ACPROBEC — Registros de Solicitações de Cancelamento de Vínculo</p>
        </div>
        <div class="meta">
          <div class="meta-item">Período: <strong>${periodoLabel}</strong></div>
          <div class="meta-item">Total de registros: <strong>${registros.length}</strong></div>
          <div class="meta-item">Total de pendências: <strong style="color:#dc2626">${fmtR(totalVal)}</strong></div>
          <div class="meta-item">Emissão: <strong>${new Date().toLocaleString('pt-BR')}</strong></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Associado</th>
              <th>CPF</th>
              <th style="text-align:right">Pendências</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
            <tr class="total-row">
              <td colspan="3">TOTAL</td>
              <td>${fmtR(totalVal)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} por ÁUREA Tech — ACPROBEC</div>
      </body>
      </html>
    `
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    setTimeout(() => { w.print(); w.close() }, 600)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            Histórico de Cancelamentos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
            {totalPendencias > 0 && <> — Pendências: <span className="font-black text-red-600">{fmtR(totalPendencias)}</span></>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão PDF */}
          <button
            onClick={handleGerarPdf}
            disabled={filtrados.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText size={14} />
            Gerar PDF
          </button>

          {/* Excluir selecionados */}
          {totalSelecionados > 0 && (
            <button
              onClick={() => setConfirmDelete('bulk')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
            >
              <Trash2 size={14} />
              Excluir {totalSelecionados} selecionado{totalSelecionados > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Calendar size={14} className="text-slate-400" />
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer"
            title="Data inicial"
          />
          <span className="text-slate-400 text-xs font-bold">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer"
            title="Data final"
          />
        </div>
        {(dataInicio || dataFim) && (
          <button
            onClick={() => { setDataInicio(''); setDataFim('') }}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors"
          >
            <XCircle size={13} /> Limpar período
          </button>
        )}
      </div>

      {/* Tabela */}
      {historico.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50">
          <AlertTriangle size={48} className="mb-4 text-slate-300 opacity-50" />
          <p className="text-sm font-bold uppercase tracking-widest">Nenhum registro de cancelamento</p>
          <p className="text-xs mt-2">Os cancelamentos solicitados aparecerão aqui.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 w-10">
                  <button onClick={toggleTodos} className="text-slate-400 hover:text-red-600 transition-colors">
                    {todosSelecionados
                      ? <CheckSquare size={16} className="text-red-600" />
                      : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-4">Data/Hora da Solicitação</th>
                <th className="px-4 py-4">Associado</th>
                <th className="px-4 py-4">CPF</th>
                <th className="px-4 py-4">Termo</th>
                <th className="px-4 py-4 text-right">Pendências Registradas</th>
                <th className="px-4 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                    Nenhum resultado para os filtros aplicados.
                  </td>
                </tr>
              ) : filtrados.map((item) => {
                const isSel = selecionados.includes(item.id)
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isSel ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleSelecionado(item.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                        {isSel ? <CheckSquare size={16} className="text-red-600" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-slate-400" />
                        <span className="font-bold text-slate-700 text-xs">{fmtDate(item.data_solicitacao)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-black text-slate-800 uppercase text-xs">{item.nome}</span>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-500">
                      {item.cpf || '--'}
                    </td>
                    <td className="px-4 py-4">
                      {item.termo_url ? (
                        <a 
                          href={item.termo_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 px-2 py-1.5 rounded-lg transition-colors w-max"
                          title="Baixar Termo de Cancelamento"
                        >
                          <FileText size={12} /> VER TERMO
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">Sem termo</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-black text-red-600 text-sm">
                      {fmtR(item.valor_pendente)}
                    </td>
                    <td className="px-4 py-4 text-right flex items-center justify-end gap-1">
                      {item.valor_pendente > 0 && (
                        <button
                          onClick={() => setQuitarItem(item)}
                          className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Informar Pagamento das Pendências"
                        >
                          <DollarSign size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(item.id)}
                        className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir registro"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Trash2 size={28} />
            </div>
            <div className="text-center w-full">
              <h3 className="text-base font-black text-slate-800">Confirmar Exclusão</h3>
              <p className="text-xs text-slate-500 mt-1">
                {confirmDelete === 'bulk'
                  ? `Tem certeza que deseja excluir ${totalSelecionados} registro${totalSelecionados > 1 ? 's' : ''} selecionado${totalSelecionados > 1 ? 's' : ''}?`
                  : 'Tem certeza que deseja excluir este registro?'}
              </p>
              
              <div className="mt-4 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Senha de Segurança</label>
                <input
                  type="password"
                  value={senhaExclusao}
                  onChange={(e) => {
                    setSenhaExclusao(e.target.value)
                    setErroSenhaExclusao(false)
                  }}
                  placeholder="Digite a senha para excluir"
                  className={`w-full mt-1 px-3 py-2 text-xs border rounded-xl outline-none transition-colors ${erroSenhaExclusao ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-slate-400 bg-slate-50'}`}
                />
                {erroSenhaExclusao && (
                  <p className="text-[10px] text-red-500 mt-1 font-bold">Senha incorreta.</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={closeDeleteModal}
                className="flex-1 py-3 rounded-xl text-xs font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmExclusao}
                className="flex-1 py-3 rounded-xl text-xs font-black bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Quitação */}
      <QuitarPendenciasModal
        isOpen={!!quitarItem}
        onClose={() => setQuitarItem(null)}
        item={quitarItem}
        onSuccess={() => {
          // O hook useCancelamentos já atualizou a pendência, React vai re-renderizar
        }}
      />
    </div>
  )
}
