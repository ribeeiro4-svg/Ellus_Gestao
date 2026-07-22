import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Loader2, Printer } from 'lucide-react'

import { useTenant } from '@/lib/hooks/useTenant'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function DFC({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  const { contas } = planoHook
  const { lancamentos } = lancHook
  const { tenant } = useTenant()
  const [fluxos, setFluxos] = useState<any>({ operacionais: [], investimentos: [], financiamentos: [] })
  const [loading, setLoading] = useState(true)
  const ano = new Date().getFullYear()

  const handlePrint = (titulo: string, id: string) => {
    const conteudo = document.getElementById(id)
    if (!conteudo) return
    const janela = window.open('', '_blank')
    if (!janela) return
    janela.document.write(`
      <html>
        <head>
          <title>${titulo} - ACPROBEC</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            
            .header { background-color: #0b2218; display: flex; align-items: center; justify-content: flex-start; padding: 25px 35px; margin-bottom: 30px; border-radius: 12px; }
            .header-logo { max-height: 45px; margin-right: 20px; border-radius: 8px; object-fit: contain; }
            .header-info { text-align: left; }
            .header h1 { margin: 0; font-size: 20px; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; }
            .header p { margin: 6px 0 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: left; }
            .text-right { text-align: right; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: 700; }
            .bg-slate-50 { background-color: #f8fafc; }
            .bg-indigo-50 { background-color: #eef2ff; }
            .text-emerald-600 { color: #059669; }
            .text-rose-600 { color: #e11d48; }
            .text-indigo-800 { color: #3730a3; }
            .indent { padding-left: 40px !important; }
            
            .footer { margin-top: 60px; background-color: #ffffff; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; padding-bottom: 20px; font-weight: 600; letter-spacing: 0.5px; }
            .footer-logo { height: 50px; margin-bottom: 10px; }
            
            @media print { 
              @page { size: A4; margin: 1.5cm; } 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${tenant?.logo_url ? `<img src="${tenant.logo_url}" class="header-logo" onerror="this.style.display='none'" />` : ''}
            <div class="header-info">
              <h1>${tenant?.nome || 'Associação'}</h1>
              <p>${titulo.toUpperCase()} | MÉTODO DIRETO | ITG 2002 | EXERCÍCIO ${ano}</p>
            </div>
          </div>
          ${conteudo.innerHTML}
          <div class="footer">
            <img src="/ellus_logo_v2.svg" class="footer-logo" onerror="this.style.display='none'" /><br/>
            Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} pelo sistema Éllus Gestão
          </div>
        </body>
      </html>
    `)
    janela.document.close()
    setTimeout(() => { janela.print(); janela.close(); }, 500)
  }

  useEffect(() => {
    // Cálculo simplificado do DFC Direto baseado nos lançamentos do Livro Diário
    // Filtramos apenas as partidas que tocam Disponibilidades (1.1.1)
    setLoading(true)
    
    const disponibilidadesIds = new Set(contas.filter((c: any) => c.codigo.startsWith('1.1.1') && c.tipo === 'analitica').map((c: any) => c.id))
    
    const ops: any[] = []
    const inv: any[] = []
    const fin: any[] = []

    // Agrupar por conta de contrapartida (DRE ou Ativo/Passivo)
    const agrupado: Record<string, number> = {}

    lancamentos.forEach((l: any) => {
      const dataAno = new Date(l.data_lancamento).getFullYear()
      if (dataAno !== ano) return

      // Encontrar a partida de caixa
      const partidaCaixa = l.lancamentos_partidas?.find((p: any) => disponibilidadesIds.has(p.conta_id))
      if (!partidaCaixa) return

      // Encontrar a contrapartida
      const contrapartida = l.lancamentos_partidas?.find((p: any) => !disponibilidadesIds.has(p.conta_id))
      if (!contrapartida) return

      const contaObj = contas.find((c: any) => c.id === contrapartida.conta_id)
      const nomeGrupo = contaObj?.descricao || 'Outros'
      
      // Valor líquido (Entrada - Saída)
      const valor = partidaCaixa.tipo_partida === 'D' ? Number(partidaCaixa.valor) : -Number(partidaCaixa.valor)
      
      agrupado[nomeGrupo] = (agrupado[nomeGrupo] || 0) + valor
    })

    // Classificar (Simplificado: 3.x e 4.x são operacionais, 1.2 imobilizado investimento, 2.x financiamento/obrigações)
    Object.entries(agrupado).forEach(([nome, valor]) => {
      const conta = contas.find((c: any) => c.descricao === nome)
      if (conta?.codigo.startsWith('3') || conta?.codigo.startsWith('4')) {
        ops.push({ label: nome, value: valor })
      } else if (conta?.codigo.startsWith('1.2')) {
        inv.push({ label: nome, value: valor })
      } else {
        fin.push({ label: nome, value: valor })
      }
    })

    setFluxos({ operacionais: ops, investimentos: inv, financiamentos: fin })
    setLoading(false)
  }, [lancamentos, contas, ano])

  const totalOps = fluxos.operacionais.reduce((acc: number, curr: any) => acc + curr.value, 0)
  const totalInv = fluxos.investimentos.reduce((acc: number, curr: any) => acc + curr.value, 0)
  const totalFin = fluxos.financiamentos.reduce((acc: number, curr: any) => acc + curr.value, 0)

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Processando Fluxo de Caixa...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-white font-black text-sm">DEMONSTRAÇÃO DOS FLUXOS DE CAIXA (DFC) — MÉTODO DIRETO</h3>
            <p className="text-indigo-100 text-xs mt-0.5">Exercício de {ano} • Conforme ITG 2002 (R1)</p>
          </div>
          <button 
            onClick={() => handlePrint('Demonstração dos Fluxos de Caixa (DFC)', 'dfc-table')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-wider"
          >
            <Printer size={14} /> Imprimir PDF
          </button>
        </div>

        <div id="dfc-table">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-slate-50">
            {/* Atividades Operacionais */}
            <tr className="bg-slate-50">
              <td className="px-6 py-3 font-black text-slate-700 uppercase tracking-wider">1. ATIVIDADES OPERACIONAIS</td>
              <td className="px-6 py-3 text-right font-black text-slate-700">{fmtR(totalOps)}</td>
            </tr>
            {fluxos.operacionais.map((f: any, i: number) => (
              <tr key={i}>
                <td className="px-12 py-2.5 text-slate-600 font-medium indent">{f.label}</td>
                <td className={`px-6 py-2.5 text-right font-bold ${f.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmtR(f.value)}
                </td>
              </tr>
            ))}

            {/* Atividades de Investimento */}
            <tr className="bg-slate-50">
              <td className="px-6 py-3 font-black text-slate-700 uppercase tracking-wider">2. ATIVIDADES DE INVESTIMENTO</td>
              <td className="px-6 py-3 text-right font-black text-slate-700">{fmtR(totalInv)}</td>
            </tr>
            {fluxos.investimentos.map((f: any, i: number) => (
              <tr key={i}>
                <td className="px-12 py-2.5 text-slate-600 font-medium indent">{f.label}</td>
                <td className={`px-6 py-2.5 text-right font-bold ${f.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmtR(f.value)}
                </td>
              </tr>
            ))}

            {/* Atividades de Financiamento */}
            <tr className="bg-slate-50">
              <td className="px-6 py-3 font-black text-slate-700 uppercase tracking-wider">3. ATIVIDADES DE FINANCIAMENTO</td>
              <td className="px-6 py-3 text-right font-black text-slate-700">{fmtR(totalFin)}</td>
            </tr>
            {fluxos.financiamentos.map((f: any, i: number) => (
              <tr key={i}>
                <td className="px-12 py-2.5 text-slate-600 font-medium indent">{f.label}</td>
                <td className={`px-6 py-2.5 text-right font-bold ${f.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmtR(f.value)}
                </td>
              </tr>
            ))}

            <tr className="bg-indigo-50 border-t-2 border-indigo-200">
              <td className="px-6 py-4 font-black text-indigo-800 uppercase tracking-widest text-sm">Aumento (Redução) Líquida de Caixa</td>
              <td className="px-6 py-4 text-right font-black text-indigo-800 text-sm">
                {fmtR(totalOps + totalInv + totalFin)}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-700 uppercase">Geração de Caixa Operacional</p>
            <p className="text-xl font-black text-emerald-800">{fmtR(totalOps)}</p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-700 uppercase">Saldo Final de Disponibilidades</p>
            <p className="text-xl font-black text-slate-800">{fmtR(totalOps + totalInv + totalFin)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
