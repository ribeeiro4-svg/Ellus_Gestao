'use client'
import React, { useState } from 'react'
import { Printer, X, FileText, Calendar, Wrench, DollarSign } from 'lucide-react'
import { BemDuravel, Manutencao } from '../hooks/useBensDuraveis'

type Props = {
  isOpen: boolean
  onClose: () => void
  bens: BemDuravel[]
  manutencoes: Manutencao[]
}

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtData = (d: string) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return d } }

export default function FixedAssetsReports({ isOpen, onClose, bens, manutencoes }: Props) {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  if (!isOpen) return null

  const handlePrint = (type: 'list' | 'maintenance' | 'costs') => {
    let titulo = ''
    let htmlContent = ''
    
    const filteredManutencoes = manutencoes.filter(m => {
      const d = m.data_ocorrencia
      return d >= startDate && d <= endDate
    })

    if (type === 'list') {
      titulo = 'Relação de Bens Duráveis'
      const ativos = bens.filter(b => b.status === 'ativo')
      htmlContent = `
        <table>
          <thead>
            <tr>
              <th>Cód.</th>
              <th>Descrição do Bem</th>
              <th>Aquisição</th>
              <th>Entrada</th>
              <th class="text-right">Valor Aquis.</th>
              <th>Vida Útil</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${ativos.map(b => `
              <tr>
                <td>${b.codigo_interno || '-'}</td>
                <td class="font-bold">${b.descricao}</td>
                <td class="text-center">${fmtData(b.data_aquisicao!)}</td>
                <td class="text-center">${fmtData(b.data_entrada || b.created_at)}</td>
                <td class="text-right">${fmtR(b.valor_aquisicao!)}</td>
                <td class="text-center">${b.vida_util_meses} meses</td>
                <td class="text-center uppercase">${b.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    } else if (type === 'maintenance') {
      titulo = 'Listagem de Manutenções por Bem'
      const assetsWithMaintenance = bens.filter(b => manutencoes.some(m => m.bem_id === b.id))
      
      htmlContent = assetsWithMaintenance.map(b => {
        const bm = filteredManutencoes.filter(m => m.bem_id === b.id)
        if (bm.length === 0) return ''
        
        return `
          <div style="margin-top: 20px; border-top: 2px solid #e2e8f0; padding-top: 10px;">
            <h3 style="font-size: 12px; margin-bottom: 10px; color: #1e293b;">BEM: <strong>${b.descricao}</strong> (${b.codigo_interno || 'S/C'})</h3>
            <table>
              <thead>
                <tr>
                  <th width="80">Data</th>
                  <th width="100">Tipo</th>
                  <th>Descrição da Manutenção</th>
                  <th width="100" class="text-right">Custo</th>
                </tr>
              </thead>
              <tbody>
                ${bm.map(m => `
                  <tr>
                    <td class="text-center">${fmtData(m.data_ocorrencia)}</td>
                    <td class="text-center uppercase">${m.tipo}</td>
                    <td>${m.descricao}</td>
                    <td class="text-right">${fmtR(m.custo)}</td>
                  </tr>
                `).join('')}
                <tr class="bg-slate-50">
                  <td colspan="3" class="text-right font-bold">TOTAL DO BEM:</td>
                  <td class="text-right font-bold">${fmtR(bm.reduce((s, m) => s + m.custo, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `
      }).join('')
    } else if (type === 'costs') {
      titulo = 'Custos de Manutenções por Período'
      const totalPeriodo = filteredManutencoes.reduce((s, m) => s + m.custo, 0)
      
      htmlContent = `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin:0; font-size: 14px;">Total Geral de Custos no Período: <strong>${fmtR(totalPeriodo)}</strong></p>
          <p style="margin:5px 0 0; font-size: 11px; color: #64748b;">Total de intervenções: ${filteredManutencoes.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th width="80">Data</th>
              <th>Bem Durável</th>
              <th>Manutenção / Ocorrência</th>
              <th width="100" class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${filteredManutencoes.map(m => {
              const bem = bens.find(b => b.id === m.bem_id)
              return `
                <tr>
                  <td class="text-center">${fmtData(m.data_ocorrencia)}</td>
                  <td>${bem?.descricao || 'N/I'}</td>
                  <td>${m.descricao}</td>
                  <td class="text-right font-bold">${fmtR(m.custo)}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      `
    }

    const html = `
      <html>
        <head>
          <title>${titulo} - ACPROBEC</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 30px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
            th { background: #f8fafc; color: #64748b; text-transform: uppercase; padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 900; }
            td { padding: 8px; border: 1px solid #e2e8f0; vertical-align: top; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .footer { margin-top: 30px; text-align: right; font-size: 8px; color: #94a3b8; }
            @media print {
              @page { size: A4 portrait; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACPROBEC — ${titulo.toUpperCase()}</h1>
            <p>RELATÓRIO PATRIMONIAL | PERÍODO: ${fmtData(startDate)} A ${fmtData(endDate)}</p>
          </div>
          ${htmlContent}
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | ÁUREA Tech ACPROBEC</div>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    win?.document.write(html)
    win?.document.close()
    setTimeout(() => {
      win?.print()
      win?.close()
    }, 500)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex justify-end animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Relatórios Patrimoniais</h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Controle de Bens Duráveis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* FILTRO DE PERÍODO */}
          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
            <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar size={14} /> Filtro Inteligente de Período
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Início</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fim</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                />
              </div>
            </div>
          </div>

          {/* OPÇÕES DE RELATÓRIO */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Selecione o Relatório</h4>
            
            {[
              { id: 'list', title: 'Relação de Bens Duráveis', desc: 'Listagem completa de todos os bens ativos no sistema.', icon: FileText, color: 'bg-emerald-50 text-emerald-600' },
              { id: 'maintenance', title: 'Listagem de Manutenções', desc: 'Histórico de ocorrências e manutenções agrupado por bem.', icon: Wrench, color: 'bg-amber-50 text-amber-600' },
              { id: 'costs', title: 'Custos de Manutenções', desc: 'Visão financeira dos gastos com manutenção no período.', icon: DollarSign, color: 'bg-rose-50 text-rose-600' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => handlePrint(r.id as any)}
                className="w-full p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 transition-all text-left group flex items-start gap-4"
              >
                <div className={`w-10 h-10 rounded-xl ${r.color} flex items-center justify-center shrink-0`}>
                  <r.icon size={18} />
                </div>
                <div className="flex-1">
                  <h5 className="text-[13px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{r.title}</h5>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">{r.desc}</p>
                </div>
                <div className="mt-1">
                  <Printer size={14} className="text-slate-300 group-hover:text-indigo-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-gray-100">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Os relatórios são gerados em formato PDF otimizado para impressão A4. 
            O design segue o padrão de conformidade e transparência da plataforma.
          </p>
        </div>
      </div>
    </div>
  )
}
