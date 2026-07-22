import React, { useMemo } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
}

interface ResumoGeralBlocksProps {
  lancamentos: any[]
  filterMonths: number[]
  filterYear: number
  filterDateType: 'caixa' | 'competencia' | 'conciliacao'
  contas?: any[]
}

const DataBlock = ({ type, lancamentos, title, icon: Icon, colorClass, bgLightClass, filterMonths, filterYear, filterDateType, contas }: any) => {
  const filteredData = useMemo(() => {
    const dataByType = lancamentos.filter((l: any) => l.tipo === type && !['cancelado', 'estornado', 'erro'].includes((l.status || '').toLowerCase()))
    
    return dataByType.filter((l: any) => {
       let dStr = l.data || l.created_at
       
       if (filterDateType === 'caixa') {
           dStr = l.data_caixa || l.data_conciliacao || l.data || l.created_at;
       }

       let m = -1
       let y = -1

       if (dStr) {
         const parts = dStr.split('-')
         if (parts.length >= 3) {
           y = parseInt(parts[0])
           m = parseInt(parts[1]) - 1
         }
       }

       if (filterDateType === 'competencia') {
         if (l.competencia_mes !== undefined && l.competencia_mes !== null) m = Number(l.competencia_mes)
         if (l.competencia_ano !== undefined && l.competencia_ano !== null) y = Number(l.competencia_ano)
       } else if (filterDateType === 'conciliacao') {
         if (!l.data_conciliacao) return false
         const parts = l.data_conciliacao.split('-')
         if (parts.length >= 3) {
           y = parseInt(parts[0])
           m = parseInt(parts[1]) - 1
         }
       }

       const matchYear = y === filterYear
       const matchMonth = filterMonths.includes(-1) || filterMonths.includes(m)
       
       const statusLower = (l.status || '').toLowerCase()
       const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes(statusLower) || statusLower === 'parcial' || !!l.data_conciliacao
       
       let matchStatus = true;
       if (filterDateType === 'caixa' || filterDateType === 'conciliacao') {
          matchStatus = isPago;
       }
       
       return matchYear && matchMonth && matchStatus
    }).sort((a: any, b: any) => {
       const dA = new Date(a.data || a.created_at)
       const dB = new Date(b.data || b.created_at)
       return dB.getTime() - dA.getTime()
    })
  }, [lancamentos, type, filterMonths, filterYear, filterDateType])

  const getGrossValue = (l: any) => {
    let val = Number(l.valor || 0);
    if (l.tipo === 'receita') {
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
      if (match) {
        val += parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      }
    }
    return val;
  }

  const total = filteredData.reduce((acc: number, l: any) => acc + getGrossValue(l), 0)

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col h-full w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
         <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${bgLightClass} ${colorClass}`}>
               <Icon size={20} />
            </div>
            <div>
               <h2 className="text-lg font-black text-slate-800">{title}</h2>
               <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{filteredData.length} registros</p>
            </div>
         </div>
      </div>
      
      <div className="mb-6 flex justify-between items-start">
         <div>
            <div className="text-3xl font-black text-slate-800">{formatCurrency(total)}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total no período</div>
         </div>
         {contas && contas.length > 0 && (
             <div className="flex flex-col items-end gap-2 text-right">
                 {contas.filter((c: any) => c.nome.toLowerCase().includes('cora') || c.nome.toLowerCase().includes('caixa')).map((c: any) => {
                     const amountInPeriod = filteredData
                         .filter((l: any) => l.conta_id === c.id)
                         .reduce((acc: number, l: any) => acc + getGrossValue(l), 0);

                     return (
                         <div key={c.id} className="flex flex-col">
                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">{c.nome}</span>
                            <span className="text-[13px] font-black text-slate-700">{formatCurrency(amountInPeriod)}</span>
                         </div>
                     );
                 })}
             </div>
         )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 max-h-[400px] min-h-[300px] no-scrollbar">
         <div className="flex flex-col gap-3">
            {filteredData.length === 0 ? (
               <div className="text-center py-10 text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-2xl">Nenhum registro encontrado no período.</div>
            ) : (
               filteredData.map((l: any) => (
                 <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors gap-2">
                    <div className="flex flex-col">
                       <div className="text-[13px] font-bold text-slate-700 break-words">{l.descricao}</div>
                       <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                         {formatDate(l.data)} 
                         {l.categoria ? ` • ${l.categoria}` : ''}
                         {l.status === 'pago' ? <span className="ml-2 text-emerald-500">PAGO</span> : l.status === 'aberto' ? <span className="ml-2 text-amber-500">ABERTO</span> : ''}
                       </div>
                    </div>
                    <div className={`text-sm font-black whitespace-nowrap ${colorClass}`}>
                       {formatCurrency(getGrossValue(l))}
                    </div>
                 </div>
               ))
            )}
         </div>
      </div>
    </div>
  )
}

export default function ResumoGeralBlocks({ lancamentos, filterMonths, filterYear, filterDateType, contas }: ResumoGeralBlocksProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
       <DataBlock 
         type="receita" 
         lancamentos={lancamentos} 
         title="Recebimentos" 
         icon={ArrowUpRight} 
         colorClass="text-emerald-500" 
         bgLightClass="bg-emerald-50"
         filterMonths={filterMonths}
         filterYear={filterYear}
         filterDateType={filterDateType}
         contas={contas}
       />
       <DataBlock 
         type="despesa" 
         lancamentos={lancamentos} 
         title="Dispêndios" 
         icon={ArrowDownRight} 
         colorClass="text-rose-500" 
         bgLightClass="bg-rose-50"
         filterMonths={filterMonths}
         filterYear={filterYear}
         filterDateType={filterDateType}
         contas={contas}
       />
    </div>
  )
}
