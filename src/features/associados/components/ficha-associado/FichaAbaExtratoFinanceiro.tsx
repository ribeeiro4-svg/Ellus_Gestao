import React from 'react'
import ExtratoGradeMeses from './ExtratoGradeMeses'
import { fmtR } from '@/lib/utils/formatters'
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

interface FichaAbaExtratoFinanceiroProps {
  extrato: any[]
}

export default function FichaAbaExtratoFinanceiro({ extrato }: FichaAbaExtratoFinanceiroProps) {
  const totalPago = extrato.filter(m => m.status === 'pago' || m.status === 'adesao').reduce((acc, curr) => acc + curr.valor, 0)
  const totalAberto = extrato.filter(m => m.status === 'pendente').reduce((acc, curr) => acc + curr.valor, 0)
  const totalMesesPagos = extrato.filter(m => m.status === 'pago' || m.status === 'adesao').length
  
  const situacaoGeral = totalAberto > 0 ? 'Com Pendências' : 'Em Dia'

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Resumo do Ano */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={48} className="text-emerald-600" />
          </div>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Pago no Ano</span>
          <div className="text-2xl font-black text-emerald-800 tracking-tight">{fmtR(totalPago)}</div>
          <span className="text-[10px] font-bold text-emerald-600/60 uppercase">{totalMesesPagos} de 12 meses pagos</span>
        </div>

        <div className={`p-6 rounded-[32px] border flex flex-col gap-2 relative overflow-hidden group ${totalAberto > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <AlertCircle size={48} className={totalAberto > 0 ? 'text-rose-600' : 'text-slate-400'} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${totalAberto > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Total em Aberto</span>
          <div className={`text-2xl font-black tracking-tight ${totalAberto > 0 ? 'text-rose-800' : 'text-slate-500'}`}>{fmtR(totalAberto)}</div>
          <span className={`text-[10px] font-bold uppercase ${totalAberto > 0 ? 'text-rose-600/60' : 'text-slate-400/60'}`}>Competências pendentes</span>
        </div>

        <div className="p-6 bg-white rounded-[32px] border border-slate-100 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle size={48} className={totalAberto > 0 ? 'text-amber-500' : 'text-emerald-500'} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Situação Geral</span>
          <div className={`text-2xl font-black tracking-tight ${totalAberto > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{situacaoGeral.toUpperCase()}</div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Ano Corrente {new Date().getFullYear()}</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Grade de Mensalidades</h3>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">Pago</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600" /><span className="text-[9px] font-bold text-slate-400 uppercase">Adesão</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">Pendente</span></div>
          </div>
        </div>
        
        <ExtratoGradeMeses extrato={extrato} />
      </div>
    </div>
  )
}
