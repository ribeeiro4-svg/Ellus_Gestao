const fs = require('fs');

const content = \import React, { useState, useMemo } from 'react'
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
}

type PeriodType = '7' | '14' | '30' | 'custom'

const DataBlock = ({ type, lancamentos, title, icon: Icon, colorClass, bgLightClass }: any) => {
  const [period, setPeriod] = useState<PeriodType>('30')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const filteredData = useMemo(() => {
    const dataByType = lancamentos.filter((l: any) => l.tipo === type)
    
    let start: Date
    let end = new Date()
    
    if (period === 'custom') {
       start = dateStart ? new Date(dateStart + 'T00:00:00') : new Date(0)
       end = dateEnd ? new Date(dateEnd + 'T23:59:59') : new Date()
    } else {
       start = new Date()
       start.setDate(start.getDate() - parseInt(period))
       start.setHours(0,0,0,0)
    }

    return dataByType.filter((l: any) => {
       const dStr = l.data || l.created_at
       if (!dStr) return false
       const d = new Date(dStr)
       const adjD = dStr.includes('T') ? d : new Date(d.getTime() + d.getTimezoneOffset() * 60000)
       return adjD >= start && adjD <= end
    }).sort((a: any, b: any) => {
       const dA = new Date(a.data || a.created_at)
       const dB = new Date(b.data || b.created_at)
       return dB.getTime() - dA.getTime()
    })
  }, [lancamentos, type, period, dateStart, dateEnd])

  const total = filteredData.reduce((acc: number, l: any) => acc + Number(l.valor || 0), 0)

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col h-full w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
         <div className="flex items-center gap-3">
            <div className={\p-3 rounded-2xl \ \\}>
               <Icon size={20} />
            </div>
            <div>
               <h2 className="text-lg font-black text-slate-800">{title}</h2>
               <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{filteredData.length} registros</p>
            </div>
         </div>
         <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
           <select 
              value={period} 
              onChange={e => setPeriod(e.target.value as PeriodType)}
              className="bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold border-none outline-none text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10 cursor-pointer w-full sm:w-auto"
           >
              <option value="7">Últimos 7 dias</option>
              <option value="14">Últimos 14 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="custom">Data Livre</option>
           </select>
           {period === 'custom' && (
             <div className="flex gap-2 w-full sm:w-auto">
                <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-slate-50 px-2 py-1.5 rounded-xl text-[11px] font-bold border-none outline-none text-slate-600 flex-1" />
                <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-slate-50 px-2 py-1.5 rounded-xl text-[11px] font-bold border-none outline-none text-slate-600 flex-1" />
             </div>
           )}
         </div>
      </div>
      
      <div className="mb-6">
         <div className="text-3xl font-black text-slate-800">{formatCurrency(total)}</div>
         <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total no período</div>
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
                         {l.categoria ? \ • \\ : ''}
                         {l.status === 'pago' ? <span className="ml-2 text-emerald-500">PAGO</span> : l.status === 'aberto' ? <span className="ml-2 text-amber-500">ABERTO</span> : ''}
                       </div>
                    </div>
                    <div className={\	ext-sm font-black whitespace-nowrap \\}>
                       {formatCurrency(Number(l.valor))}
                    </div>
                 </div>
               ))
            )}
         </div>
      </div>
    </div>
  )
}

export default function ResumoGeralBlocks({ lancamentos }: ResumoGeralBlocksProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
       <DataBlock 
         type="receita" 
         lancamentos={lancamentos} 
         title="Recebimentos" 
         icon={ArrowUpRight} 
         colorClass="text-emerald-600"
         bgLightClass="bg-emerald-50"
       />
       <DataBlock 
         type="despesa" 
         lancamentos={lancamentos} 
         title="Dispêndios" 
         icon={ArrowDownRight} 
         colorClass="text-rose-600"
         bgLightClass="bg-rose-50"
       />
    </div>
  )
}\;
fs.writeFileSync('src/components/financeiro/ResumoGeralBlocks.tsx', content);

// ALSO fix the double </></> in page.tsx
let fin = fs.readFileSync('src/app/(dashboard)/financeiro/page.tsx', 'utf8');
fin = fin.replace(/<\/div>\r?\n\s*<\/>\r?\n\s*\}\)\r?\n\s*<\/>\r?\n\s*\}\)/, '</div></>)}');
fs.writeFileSync('src/app/(dashboard)/financeiro/page.tsx', fin);
