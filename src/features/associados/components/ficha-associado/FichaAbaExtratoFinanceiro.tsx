import React from 'react'
import ExtratoGradeMeses from './ExtratoGradeMeses'
import { fmtR } from '@/lib/utils/formatters'
import { TrendingUp, AlertCircle, CheckCircle, FileText, User } from 'lucide-react'

interface FichaAbaExtratoFinanceiroProps {
  extrato: any[]
  historicoCobrancas?: any[]
}

export default function FichaAbaExtratoFinanceiro({ extrato, historicoCobrancas = [] }: FichaAbaExtratoFinanceiroProps) {
  const totalPago = extrato.filter(m => m.status === 'pago' || m.status === 'adesao_paga').reduce((acc, curr) => acc + curr.valor, 0)
  const totalAberto = extrato.filter(m => m.status === 'pendente').reduce((acc, curr) => acc + curr.valor, 0)
  const totalMesesPagos = extrato.filter(m => m.status === 'pago' || m.status === 'adesao_paga').length
  
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

      {historicoCobrancas && historicoCobrancas.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Histórico de Cobranças</h3>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/70 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Data e Hora</th>
                    <th className="px-6 py-4">Status / Ação</th>
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Lançamentos Cobrados</th>
                    <th className="px-6 py-4">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historicoCobrancas.map((a, idx) => {
                    const dataAtendimento = a.data_agendamento ? new Date(a.data_agendamento) : a.created_at ? new Date(a.created_at) : null
                    let observacao = a.etapas_concluidas?.observacao || '--'
                    const responsavelPresencial = a.responsavel_setor || '--'

                    const lancMatch = observacao.match(/\(Lanc:\s*(.*?)\)/);
                    let lancamentosText = '--';
                    let vencimentoText = '--';
                    
                    if (lancMatch) {
                      lancamentosText = lancMatch[1];
                      observacao = observacao.replace(lancMatch[0], '').trim();
                      observacao = observacao.replace(/-\s*Data base da cobrança informada\.$/, '').replace(/^-\s*/, '').trim();
                    }

                    // Tenta extrair Venc: do formato novo
                    const vencMatch = lancamentosText.match(/Venc:\s*([\d\/]+)/i);
                    if (vencMatch) {
                      vencimentoText = vencMatch[1];
                      lancamentosText = lancamentosText.replace(/\|\s*Venc:\s*[\d\/]+/i, '').replace(/Venc:\s*[\d\/]+/i, '').trim();
                    } else {
                      // Fallback pro formato antigo digitado na observação
                      const obsVencMatch = observacao.match(/vencimento:\s*([\d\/]+)/i);
                      if (obsVencMatch) {
                        vencimentoText = obsVencMatch[1];
                      }
                    }

                    if (vencimentoText !== '--' && vencimentoText.length <= 5) {
                      const ano = dataAtendimento ? dataAtendimento.getFullYear() : new Date().getFullYear();
                      vencimentoText = `${vencimentoText}/${ano}`;
                    }

                    if (!observacao) observacao = '--'

                    return (
                      <tr key={a.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {dataAtendimento ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-800 font-bold">
                                {dataAtendimento.toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {dataAtendimento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ) : '--'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-orange-100 text-orange-700 border border-orange-200/50 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Cobrança ({responsavelPresencial})
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">
                          {vencimentoText}
                        </td>
                        <td className="px-6 py-4 max-w-[200px] text-xs font-medium text-slate-600 whitespace-normal">
                          {lancamentosText}
                        </td>
                        <td className="px-6 py-4 max-w-xs text-xs font-medium text-slate-600 whitespace-normal">
                          <div className="flex items-start gap-1">
                            <FileText size={12} className="text-slate-400 shrink-0 mt-0.5" />
                            <span>{observacao}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
