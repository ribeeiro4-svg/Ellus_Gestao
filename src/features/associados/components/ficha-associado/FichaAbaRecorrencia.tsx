import React, { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Save } from 'lucide-react'
import { fmtR } from '@/lib/utils/formatters'

interface FichaAbaRecorrenciaProps {
  associado: any
  onAtualizar?: (id: string, data: any) => Promise<any>
}

export default function FichaAbaRecorrencia({ associado, onAtualizar }: FichaAbaRecorrenciaProps) {
  const [formData, setFormData] = useState({
    recorrencia_ativa: associado?.recorrencia_ativa || false,
    vencimento_dia: associado?.vencimento_dia || 10,
    mensalidade: associado?.mensalidade || 0
  })
  const [isSaving, setIsSaving] = useState(false)

  if (!associado) return null

  const handleSave = async () => {
    if (!onAtualizar) return
    setIsSaving(true)
    try {
      const res = await onAtualizar(associado.id, formData)
      if (res?.error) {
        alert('Erro ao atualizar: ' + (typeof res.error === 'string' ? res.error : res.error.message))
      } else {
        alert('Configurações de recorrência salvas com sucesso!')
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const isConfigured = formData.recorrencia_ativa && formData.mensalidade > 0

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Banner de Status */}
      <div className={`p-6 rounded-[32px] border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${isConfigured ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isConfigured ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>
            {isConfigured ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          </div>
          <div>
            <h3 className={`text-lg font-black tracking-tight ${isConfigured ? 'text-emerald-800' : 'text-slate-700'}`}>
              {isConfigured ? 'Recorrência Bancária Ativa' : 'Recorrência Desativada'}
            </h3>
            <p className={`text-[11px] font-bold uppercase tracking-widest ${isConfigured ? 'text-emerald-600' : 'text-slate-400'}`}>
              Integração com API Cora
            </p>
          </div>
        </div>
        
        {isConfigured && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Próximo Faturamento</span>
            <span className="text-2xl font-black text-emerald-700 leading-none">
              Dia {formData.vencimento_dia}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Painel de Configurações */}
        <div className="flex flex-col gap-5 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw size={18} className="text-slate-400" />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Configurações Base</h4>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">Ativar Cobrança Automática</span>
              <span className="text-[10px] text-slate-400 font-medium leading-snug">Gera faturas na Cora no dia programado</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.recorrencia_ativa}
                onChange={(e) => setFormData({ ...formData, recorrencia_ativa: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Dia de Vencimento</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
              value={formData.vencimento_dia}
              onChange={(e) => setFormData({ ...formData, vencimento_dia: Number(e.target.value) })}
            >
              {[5, 10, 15, 20, 25, 30].map(d => (
                <option key={d} value={d}>Dia {d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Valor da Mensalidade (R$)</label>
            <input 
              type="number" 
              className="w-full bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
              value={formData.mensalidade}
              onChange={(e) => setFormData({ ...formData, mensalidade: Number(e.target.value) })}
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving || !onAtualizar}
            className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

        {/* Quadro Informativo */}
        <div className="flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={16} />
              <h4 className="text-[11px] font-black uppercase tracking-widest">Como funciona</h4>
            </div>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              O Cron Job do sistema roda automaticamente nos dias 10 e 20 de cada mês. Ele vai analisar esta ficha. Se a "Cobrança Automática" estiver ATIVA, o sistema criará o boleto bancário diretamente na Cora usando a API mTLS, enviará para o cliente, e o Conciliador ficará aguardando o pagamento.
            </p>
            <p className="text-[11px] text-amber-900 font-bold leading-relaxed bg-amber-100/50 p-3 rounded-xl border border-amber-200/50">
              🛡️ Proteção contra duplicidade: O sistema sempre verifica diretamente na Cora se o associado (pelo CPF) já possui uma Assinatura Recorrente ativa lá. Se já possuir, o sistema PULA a emissão para não gerar dois boletos.
            </p>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              <strong>Valor Atual:</strong> {fmtR(formData.mensalidade)} <br />
              <strong>CPF Cadastrado:</strong> {associado.cpf || 'Não preenchido'}
            </p>
            {!associado.cpf && (
              <div className="bg-amber-100/50 p-3 rounded-xl mt-2 border border-amber-200/50">
                <p className="text-[10px] font-bold text-amber-900 leading-tight">
                  Atenção: A emissão não funcionará se o CPF/CNPJ do associado não estiver preenchido nos Dados Cadastrais.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
