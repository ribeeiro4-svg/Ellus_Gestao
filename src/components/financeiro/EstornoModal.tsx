import { useState, useEffect } from 'react'
import { X, RefreshCcw } from 'lucide-react'

interface Conta {
  id: string
  nome: string
}

interface EstornoModalProps {
  isOpen: boolean
  onClose: () => void
  lancamento: any
  contas: Conta[]
  onConfirm: (data: {
    data_estorno: string
    nome_recebedor: string
    motivo_estorno: string
    forma_pagamento: string
    conta_id: string
  }) => Promise<void>
}

const FORMAS_PAGAMENTO = [
  'DINHEIRO',
  'PIX',
  'CARTÃO DE CRÉDITO',
  'CARTÃO DE DÉBITO',
  'TRANSFERÊNCIA',
  'BOLETO',
  'CHEQUE'
]

export default function EstornoModal({ 
  isOpen, 
  onClose, 
  lancamento,
  contas,
  onConfirm 
}: EstornoModalProps) {
  const [dataEstorno, setDataEstorno] = useState('')
  const [nomeRecebedor, setNomeRecebedor] = useState('')
  const [motivoEstorno, setMotivoEstorno] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [contaId, setContaId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]
      setDataEstorno(today)
      setNomeRecebedor('')
      setMotivoEstorno('')
      setFormaPagamento('PIX')
      if (contas && contas.length > 0) {
        setContaId(contas[0].id)
      }
    }
  }, [isOpen, contas])

  if (!isOpen || !lancamento) return null

  const handleConfirm = async () => {
    if (!dataEstorno || !nomeRecebedor || !motivoEstorno || !formaPagamento || !contaId) {
      alert('Preencha todos os campos.')
      return
    }

    try {
      setLoading(true)
      await onConfirm({
        data_estorno: dataEstorno,
        nome_recebedor: nomeRecebedor,
        motivo_estorno: motivoEstorno,
        forma_pagamento: formaPagamento,
        conta_id: contaId
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert('Erro ao processar estorno.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <RefreshCcw size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Registrar Estorno</h2>
              <p className="text-xs font-medium text-slate-500 line-clamp-1">
                {lancamento.descricao}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Data do Estorno</label>
            <input
              type="date"
              value={dataEstorno}
              onChange={(e) => setDataEstorno(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome do Recebedor</label>
            <input
              type="text"
              placeholder="Ex: João da Silva"
              value={nomeRecebedor}
              onChange={(e) => setNomeRecebedor(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Motivo do Estorno</label>
            <textarea
              placeholder="Ex: Pagamento duplicado, devolução de mercadoria..."
              value={motivoEstorno}
              onChange={(e) => setMotivoEstorno(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Forma de Pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
              >
                {FORMAS_PAGAMENTO.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Banco / Caixa</label>
              <select
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
              >
                {contas && contas.length === 0 && <option value="">Nenhuma conta disponível</option>}
                {contas && contas.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mt-2">
            <p className="text-xs text-rose-800 font-medium leading-relaxed">
              Será criado um novo lançamento de <strong>SAÍDA</strong> no valor de R$ {Number(lancamento.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})} para registrar este estorno.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all"
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/20 rounded-xl transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Confirmar Estorno'}
          </button>
        </div>

      </div>
    </div>
  )
}
