'use client'
import React, { useState, useEffect } from 'react'
import { FolderOpen, Target, ArrowRight, Loader2 } from 'lucide-react'
import { getCentrosCustoAction } from '../actions/centroCustoActions'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function ExecucaoRubrica({ lancHook }: { lancHook: any }) {
  const { lancamentos } = lancHook
  const [ccs, setCcs] = useState<any[]>([])
  const [selectedCc, setSelectedCc] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await getCentrosCustoAction()
      setCcs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const ccSelecionado = ccs.find(c => c.id === selectedCc)
  
  // Calcular execução para o CC selecionado
  const execucao = lancamentos.reduce((acc: any, l: any) => {
    l.lancamentos_partidas?.forEach((p: any) => {
      if (p.centro_custo_id === selectedCc) {
        acc.realizado += Number(p.valor)
      }
    })
    return acc
  }, { realizado: 0, previsto: 50000 }) // 'previsto' seria um campo na tabela CC, simulando 50k

  const imprimirExecucaoPDF = () => {
    if (!ccSelecionado) return
    const entries = lancamentos.filter((l: any) => l.lancamentos_partidas?.some((p: any) => p.centro_custo_id === selectedCc))
    const html = `
      <html>
        <head>
          <title>Relatório de Execução - ${ccSelecionado.nome}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #9333ea; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; color: #9333ea; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
            .summary-box { padding: 15px; background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 12px; }
            .summary-box p { margin: 0; font-size: 8px; color: #7e22ce; font-weight: 900; text-transform: uppercase; }
            .summary-box h2 { margin: 5px 0 0; font-size: 16px; color: #581c87; font-weight: 900; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f8fafc; color: #64748b; text-transform: uppercase; padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-size: 9px; font-weight: 900; }
            td { padding: 10px; border: 1px solid #e2e8f0; font-size: 10px; }
            .text-right { text-align: right; }
            .footer { margin-top: 40px; text-align: right; font-size: 9px; color: #94a3b8; }
            @media print { @page { size: A4; margin: 1.5cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RELATÓRIO DE EXECUÇÃO — MROSC / PROJETOS</h1>
            <p>PROJETO: ${ccSelecionado.codigo} - ${ccSelecionado.nome}</p>
          </div>
          <div class="summary">
            <div class="summary-box"><p>Total Realizado</p><h2>${fmtR(execucao.realizado)}</h2></div>
            <div class="summary-box"><p>Saldo Previsto</p><h2>${fmtR(execucao.previsto - execucao.realizado)}</h2></div>
            <div class="summary-box"><p>% Execução</p><h2>${((execucao.realizado / execucao.previsto) * 100).toFixed(1)}%</h2></div>
          </div>
          <table>
            <thead>
              <tr>
                <th width="80">Data</th>
                <th>Histórico do Lançamento</th>
                <th width="120" class="text-right">Valor Vinculado</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map((l: any) => `
                <tr>
                  <td>${new Date(l.data_lancamento).toLocaleDateString('pt-BR')}</td>
                  <td><strong>${l.historico}</strong></td>
                  <td class="text-right">${fmtR(l.lancamentos_partidas.find((p: any) => p.centro_custo_id === selectedCc)?.valor)}</td>
                </tr>
              `).join('')}
              ${entries.length === 0 ? '<tr><td colspan="3" style="text-align:center;padding:40px;color:#94a3b8">Nenhum lançamento vinculado.</td></tr>' : ''}
            </tbody>
          </table>
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | ÁUREA Tech ACPROBEC</div>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    win?.document.write(html)
    win?.document.close()
    setTimeout(() => win?.print(), 500)
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2" /> Carregando projetos...</div>

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
            <FolderOpen size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Execução por Rubrica / MROSC</h3>
            <p className="text-xs text-slate-500 font-medium italic">Acompanhamento detalhado de projetos e convênios.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Selecione o Projeto ou Centro de Custo</label>
            <select 
              value={selectedCc} 
              onChange={e => setSelectedCc(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">Selecione um projeto...</option>
              {ccs.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>)}
            </select>
          </div>
        </div>

        {ccSelecionado ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">Total Realizado</p>
                <p className="text-xl font-black text-slate-800">{fmtR(execucao.realizado)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">Saldo em Conta do Projeto</p>
                <p className="text-xl font-black text-slate-800">{fmtR(execucao.previsto - execucao.realizado)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-[10px] font-black text-purple-600 uppercase">% de Execução</p>
                <p className="text-xl font-black text-purple-800">{((execucao.realizado / execucao.previsto) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-700">Lançamentos Vinculados ao Projeto</h4>
                <button onClick={imprimirExecucaoPDF} className="text-[10px] font-black text-purple-600 hover:underline flex items-center gap-1">
                  🖨️ Imprimir PDF
                </button>
              </div>
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[9px] tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left">Data</th>
                    <th className="px-6 py-3 text-left">Histórico</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lancamentos.filter((l: any) => l.lancamentos_partidas?.some((p: any) => p.centro_custo_id === selectedCc)).map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-3 font-medium text-slate-500">{new Date(l.data_lancamento).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-3 font-bold text-slate-700">{l.historico}</td>
                      <td className="px-6 py-3 text-right font-black text-indigo-600">{fmtR(l.lancamentos_partidas.find((p: any) => p.centro_custo_id === selectedCc)?.valor)}</td>
                    </tr>
                  ))}
                  {lancamentos.filter((l: any) => l.lancamentos_partidas?.some((p: any) => p.centro_custo_id === selectedCc)).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">Nenhum lançamento vinculado a este projeto.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <Target size={32} className="text-slate-300 mx-auto mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Selecione um projeto para ver o relatório de execução</p>
          </div>
        )}
      </div>
    </div>
  )
}
