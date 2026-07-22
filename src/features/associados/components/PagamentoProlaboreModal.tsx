import { useState, useEffect } from 'react'
import { useContas } from '@/lib/hooks/useContas'
import { fmtR } from '@/lib/utils/formatters'

interface PagamentoProlaboreModalProps {
  totalLiquido: number
  totalInss: number
  qtdDiretores: number
  onClose: () => void
  onSuccess: (formaPagamento: string, parcelas: number, contaId: string, dataInicio: string) => Promise<void>
}

export default function PagamentoProlaboreModal({ totalLiquido, totalInss, qtdDiretores, onClose, onSuccess }: PagamentoProlaboreModalProps) {
  const { contas } = useContas()
  const [loading, setLoading] = useState(false)

  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [modo, setModo] = useState<'INTEGRAL' | 'PARCELADO'>('INTEGRAL')
  const [parcelasPagamento, setParcelasPagamento] = useState(1)
  const [contaId, setContaId] = useState('')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])

  // Conta padrão
  useEffect(() => {
    if (contas.length > 0 && !contaId) {
      const padrao = contas[0]
      if (padrao) setContaId(padrao.id)
    }
  }, [contas, contaId])

  const handleConfirmar = async () => {
    if (!contaId) return alert('Selecione uma conta bancária.')
    if (modo === 'PARCELADO' && parcelasPagamento < 2) return alert('Para pagamento parcelado, informe 2 ou mais parcelas.')
    
    try {
      setLoading(true)
      await onSuccess(formaPagamento, modo === 'INTEGRAL' ? 1 : parcelasPagamento, contaId, dataInicio)
    } catch (err: any) {
      alert(err.message || 'Erro ao processar pagamento.')
    } finally {
      setLoading(false)
    }
  }

  const valorParcela = totalLiquido / (modo === 'INTEGRAL' ? 1 : parcelasPagamento || 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-800 text-lg">Pagar Pró-labore ({qtdDiretores} selecionados)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-emerald-800 font-bold text-[10px] uppercase mb-1">Líquido a Pagar</p>
              <p className="text-emerald-600 font-black text-xl">{fmtR(totalLiquido)}</p>
            </div>
            {totalInss > 0 && (
              <div className="flex-1 p-4 bg-rose-50 rounded-xl border border-rose-100 text-center">
                <p className="text-rose-800 font-bold text-[10px] uppercase mb-1">INSS (Guia)</p>
                <p className="text-rose-600 font-black text-xl">{fmtR(totalInss)}</p>
              </div>
            )}
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conta Bancária</span>
            <select value={contaId} onChange={e => setContaId(e.target.value)} className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500">
              <option value="">Selecione...</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forma</span>
              <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500">
                <option value="PIX">PIX</option>
                <option value="TRANSFERENCIA">Transferência</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data do 1º Pag.</span>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500" />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modo de Pagamento</span>
            <div className="flex gap-2">
              <button onClick={() => setModo('INTEGRAL')} className={`flex-1 py-2 text-sm font-bold rounded-xl border ${modo === 'INTEGRAL' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Integral</button>
              <button onClick={() => setModo('PARCELADO')} className={`flex-1 py-2 text-sm font-bold rounded-xl border ${modo === 'PARCELADO' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Parcelado</button>
            </div>
          </label>

          {modo === 'PARCELADO' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantidade de Parcelas (Meses)</span>
                <input type="number" value={parcelasPagamento} onChange={e => setParcelasPagamento(Number(e.target.value))} min="2" className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500" />
              </label>
              <p className="text-[10px] font-medium text-slate-500 text-center">
                Serão gerados {parcelasPagamento || 0} lançamentos mensais de <strong className="text-slate-700 font-bold">{fmtR(valorParcela)}</strong> referentes ao Líquido.
                <br/>
                <span className="text-rose-500">O INSS será gerado em parcela única como Pendente.</span>
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} disabled={loading} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={handleConfirmar} disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50">
            {loading ? 'Processando...' : 'Confirmar e Lançar'}
          </button>
        </div>
      </div>
    </div>
  )
}
