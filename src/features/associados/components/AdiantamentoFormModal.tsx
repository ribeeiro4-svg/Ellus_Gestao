'use client'
import { useState } from 'react'
import { Diretor } from '@/lib/hooks/useDiretoria'
import { DiretoriaConfig, Adiantamento, TipoAdiantamento } from '@/lib/types'
import { useAdiantamentos } from '@/lib/hooks/useAdiantamentos'

interface Props {
  isOpen: boolean
  onClose: () => void
  diretoria: Diretor[]
  config?: DiretoriaConfig
}

export default function AdiantamentoFormModal({ isOpen, onClose, diretoria, config }: Props) {
  const { criar } = useAdiantamentos()
  const [tipo, setTipo] = useState<TipoAdiantamento>('ADIANTAMENTO')
  const [diretorId, setDiretorId] = useState('')
  const [valor, setValor] = useState('')
  const [parcelas, setParcelas] = useState('1')
  const [dataPrevista, setDataPrevista] = useState(new Date().toISOString().split('T')[0])
  const [motivo, setMotivo] = useState('')

  if (!isOpen) return null

  const handleSalvar = async () => {
    if (!diretorId || !valor) return alert('Preencha os campos obrigatórios')
    const v = Number(valor)
    
    // Validar limites
    if (tipo === 'ADIANTAMENTO' && config) {
      const diretor = diretoria.find(d => d.id === diretorId)
      if (diretor) {
        const limite = diretor.pro_labore_base * (config.max_percent_adiantamento / 100)
        if (v > limite) {
          return alert(`Valor excede o limite de ${config.max_percent_adiantamento}% do pró-labore (Limite: R$ ${limite.toFixed(2)})`)
        }
      }
    }

    const { error } = await criar({
      tipo,
      diretor_id: diretorId,
      valor: v,
      parcelas: Number(parcelas),
      data_prevista_desconto: new Date(dataPrevista).toISOString(),
      motivo,
      status: 'SOLICITADO'
    })

    if (error) {
      console.error('ERRO SUPABASE:', error)
      alert(`Erro ao salvar solicitação: ${error.message || JSON.stringify(error)}`)
    }
    else onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-800 text-lg">Nova Solicitação</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</span>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoAdiantamento)} className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500">
                <option value="ADIANTAMENTO">Adiantamento</option>
                <option value="EMPRESTIMO">Empréstimo</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diretor</span>
              <select value={diretorId} onChange={e => setDiretorId(e.target.value)} className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500">
                <option value="">Selecione...</option>
                {diretoria.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor (R$)</span>
              <input type="number" value={valor} onChange={e => setValor(e.target.value)} className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500" placeholder="0.00" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parcelas</span>
              <input type="number" value={parcelas} onChange={e => setParcelas(e.target.value)} min="1" className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500" />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Prev. Desconto</span>
            <input type="date" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)} className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo / Observação</span>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} className="p-2 border rounded-xl text-sm font-medium outline-none focus:border-emerald-500" placeholder="Especifique a necessidade..." />
          </label>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={handleSalvar} className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">Salvar Solicitação</button>
        </div>
      </div>
    </div>
  )
}
