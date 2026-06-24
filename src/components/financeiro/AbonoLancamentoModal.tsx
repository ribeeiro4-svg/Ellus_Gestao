import { useState } from 'react'
import { X, Gift } from 'lucide-react'

interface AbonoLancamentoModalProps {
  isOpen: boolean
  onClose: () => void
  lancamentoCount: number
  onConfirm: (motivo: string) => Promise<void>
}

const MOTIVOS_ABONO = [
  { value: '01 - Abonado por Decisão da ACPROBEC', label: '01 - Abonado por Decisão da ACPROBEC' },
  { value: '02 - Abonado por Decisão do HGU', label: '02 - Abonado por Decisão do HGU' },
  { value: '03 - Abonado por Decisão Judicial', label: '03 - Abonado por Decisão Judicial' }
]

export default function AbonoLancamentoModal({ isOpen, onClose, lancamentoCount, onConfirm }: AbonoLancamentoModalProps) {
  const [motivo, setMotivo] = useState(MOTIVOS_ABONO[0].value)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm(motivo)
      onClose()
    } catch (err) {
      console.error(err)
      alert('Erro ao abonar lançamento(s).')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Gift size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Abonar Mensalidade(s)</h2>
              <p className="text-xs font-medium text-slate-500">
                {lancamentoCount === 1 ? '1 lançamento selecionado' : `${lancamentoCount} lançamentos selecionados`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
            <p className="text-xs text-indigo-800 font-medium leading-relaxed">
              Esta ação alterará o status {lancamentoCount === 1 ? 'deste lançamento' : 'destes lançamentos'} para <strong>ABONADO</strong> e isentará o associado deste pagamento de forma definitiva. O status geral do associado não será alterado.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Motivo do Abono</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            >
              {MOTIVOS_ABONO.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
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
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 rounded-xl transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Abonando...' : 'Confirmar Abono'}
          </button>
        </div>

      </div>
    </div>
  )
}
