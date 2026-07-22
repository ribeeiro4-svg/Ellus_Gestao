import { useState, useEffect } from 'react'
import { X, HandCoins } from 'lucide-react'

interface Conta {
  id: string
  nome: string
}

interface Diretor {
  id: string
  nome: string
}

interface RecebimentoManualModalProps {
  isOpen: boolean
  onClose: () => void
  lancamento: any
  contas: Conta[]
  diretores: Diretor[]
  onConfirm: (data: {
    data_recebimento: string
    forma_pagamento: string
    conta_id: string
    diretor_id: string
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

export default function RecebimentoManualModal({ 
  isOpen, 
  onClose, 
  lancamento, 
  contas, 
  diretores,
  onConfirm 
}: RecebimentoManualModalProps) {
  const [dataRecebimento, setDataRecebimento] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('DINHEIRO')
  const [contaId, setContaId] = useState('')
  const [diretorId, setDiretorId] = useState('')
  const [loading, setLoading] = useState(false)

  // Filtra as contas: permite apenas contas que não sejam "CORA PJ", ou foca em caixas de espécie.
  // A requisição pede: "não permita recebimento manual para a conta CORA PJ, somente para caixa espécie"
  const contasFiltradas = contas.filter(c => !c.nome.toLowerCase().includes('cora'))

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]
      setDataRecebimento(today)
      setFormaPagamento('DINHEIRO')
      setContaId(contasFiltradas.length > 0 ? contasFiltradas[0].id : '')
      setDiretorId(diretores.length > 0 ? diretores[0].id : '')
    }
  }, [isOpen, contasFiltradas.length, diretores.length])

  if (!isOpen || !lancamento) return null

  const handleConfirm = async () => {
    if (!dataRecebimento || !formaPagamento || !contaId || !diretorId) {
      alert('Preencha todos os campos.')
      return
    }

    try {
      setLoading(true)
      await onConfirm({
        data_recebimento: dataRecebimento,
        forma_pagamento: formaPagamento,
        conta_id: contaId,
        diretor_id: diretorId
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert('Erro ao processar recebimento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <HandCoins size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Recebimento Manual</h2>
              <p className="text-xs font-medium text-slate-500">
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
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Data do Recebimento</label>
            <input
              type="date"
              value={dataRecebimento}
              onChange={(e) => setDataRecebimento(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Forma de Pagamento</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              {FORMAS_PAGAMENTO.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Conta Bancária / Caixa</label>
            <select
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              {contasFiltradas.length === 0 && <option value="">Nenhuma conta disponível</option>}
              {contasFiltradas.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Responsável pelo Recebimento</label>
            <select
              value={diretorId}
              onChange={(e) => setDiretorId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              {diretores.length === 0 && <option value="">Nenhum diretor cadastrado</option>}
              {diretores.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>
          
          {formaPagamento === 'DINHEIRO' && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mt-2">
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                Pagamentos em dinheiro gerarão automaticamente um recibo em PDF para ser enviado ao associado.
              </p>
            </div>
          )}
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
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 rounded-xl transition-all disabled:opacity-50"
            disabled={loading || contasFiltradas.length === 0}
          >
            {loading ? 'Processando...' : 'Confirmar Recebimento'}
          </button>
        </div>

      </div>
    </div>
  )
}
