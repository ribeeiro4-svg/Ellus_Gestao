import React, { useState } from 'react'
import { Building2, Save, X, Loader2 } from 'lucide-react'
import { upsertAtivoAction } from '@/features/contabil/actions/imobilizadoActions'

export interface ImobilizadoShortcutData {
  descricao_produto: string;
  valor_produto: number;
  data_emissao: string;
  numero_nf: string;
  ncm?: string;
}

interface ImobilizadoShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemData: ImobilizadoShortcutData | null;
}

export default function ImobilizadoShortcutModal({ isOpen, onClose, itemData }: ImobilizadoShortcutModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !itemData) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const payload = {
      nome: formData.get('nome') as string,
      valor_aquisicao: parseFloat(formData.get('valor_aquisicao') as string),
      data_aquisicao: itemData.data_emissao,
      codigo_patrimonio: formData.get('codigo_patrimonio') as string,
      status: 'pendente', // Status crucial para não exigir contas agora e não depreciar
      // Campos padrão ou null para os obrigatórios no BD (depende da estrutura exata)
      vida_util_meses: 60, 
      valor_residual: 0,
      conta_imobilizado_id: null,
      conta_depreciacao_acum_id: null,
      conta_despesa_deprec_id: null
    }

    try {
      const res = await upsertAtivoAction(payload)
      if (res.error) {
        alert(`Erro ao cadastrar bem: ${res.error}`)
      } else {
        alert('Bem cadastrado como PENDENTE. Finalize o cadastro no módulo Contábil > Imobilizado.')
        onClose()
      }
    } catch (err: any) {
      alert(`Erro inesperado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">Atalho: Ativo Imobilizado</h3>
              <p className="text-[10px] font-bold text-slate-500">Pré-cadastro a partir da NF-e {itemData.numero_nf}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
            <div className="text-amber-600 mt-0.5">
              <Building2 size={16} />
            </div>
            <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
              Você classificou este item como <span className="font-black">Imobilizado</span>. 
              Crie um registro provisório agora para não esquecer. Ele ficará <span className="font-black">Pendente</span> no módulo Contábil.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nome do Bem</label>
              <input 
                name="nome" 
                defaultValue={itemData.descricao_produto}
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Cód. Patrimônio</label>
                <input 
                  name="codigo_patrimonio" 
                  placeholder="Ex: AC-001"
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Valor (R$)</label>
                <input 
                  name="valor_aquisicao" 
                  type="number" 
                  step="0.01"
                  defaultValue={itemData.valor_produto}
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 px-4 text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 px-4 flex items-center justify-center gap-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Salvar como Pendente
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
