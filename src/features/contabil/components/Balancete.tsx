'use client'
import React, { useState, useEffect } from 'react'
import { Loader2, Download, Calendar } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Balancete({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  const { calcularBalancete } = lancHook
  const { contas } = planoHook
  const ano = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1
  const currentPeriod = lancHook.periodo || `${ano}-${mesAtual.toString().padStart(2, '0')}`
  const [saldos, setSaldos] = useState<Record<string, { debitos: number; creditos: number }>>({})
  const [loading, setLoading] = useState(false)

  const carregar = async () => {
    setLoading(true)
    const data = await calcularBalancete(currentPeriod)
    setSaldos(data)
    setLoading(false)
  }

  useEffect(() => { if (contas.length > 0) carregar() }, [currentPeriod, contas.length])

  // Calcular saldo por conta
  const getSaldo = (conta: any) => {
    const s = saldos[conta.id]
    if (!s) return { debitos: 0, creditos: 0, saldo: 0 }
    const saldo = conta.natureza === 'devedora' ? s.debitos - s.creditos : s.creditos - s.debitos
    return { ...s, saldo }
  }

  // Totais por classificação
  const calcTotais = (cls: string) => {
    const contasCls = contas.filter((c: any) => c.classificacao === cls && c.tipo === 'analitica')
    return contasCls.reduce((acc: any, c: any) => {
      const s = getSaldo(c)
      return { debitos: acc.debitos + s.debitos, creditos: acc.creditos + s.creditos, saldo: acc.saldo + s.saldo }
    }, { debitos: 0, creditos: 0, saldo: 0 })
  }

  const contasAnaliticas = contas.filter((c: any) => c.tipo === 'analitica')
  const totalD = contasAnaliticas.reduce((s: number, c: any) => s + (saldos[c.id]?.debitos ?? 0), 0)
  const totalC = contasAnaliticas.reduce((s: number, c: any) => s + (saldos[c.id]?.creditos ?? 0), 0)

  const grupos = [
    { cls: 'ativo', label: '1. ATIVO', color: 'text-blue-700' },
    { cls: 'passivo', label: '2. PASSIVO', color: 'text-rose-700' },
    { cls: 'patrimonio_social', label: '2.3 PATRIMÔNIO SOCIAL', color: 'text-purple-700' },
    { cls: 'ingresso', label: '3. INGRESSOS', color: 'text-emerald-700' },
    { cls: 'despesa', label: '4. DISPÊNDIOS', color: 'text-orange-700' },
  ]

  const imprimirBalancetePDF = () => {
    const html = `
      <html>
        <head>
          <title>Balancete de Verificação - ACPROBEC</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
            th { background: #f8fafc; color: #64748b; text-transform: uppercase; padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 900; }
            td { padding: 8px; border: 1px solid #e2e8f0; }
            .row-group { background: #f1f5f9; font-weight: 900; color: #334155; }
            .row-subtotal { background: #f8fafc; font-weight: 700; }
            .row-total { background: #4f46e5; color: white; font-weight: 900; font-size: 10px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .footer { margin-top: 30px; text-align: right; font-size: 8px; color: #94a3b8; }
            @media print {
              @page { size: A4 landscape; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACPROBEC — BALANCETE DE VERIFICAÇÃO</h1>
            <p>CONFORMIDADE ITG 2002 (R1) | PERÍODO: ${currentPeriod}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th width="100">Código</th>
                <th>Conta Contábil</th>
                <th width="100" class="text-right">Débitos</th>
                <th width="100" class="text-right">Créditos</th>
                <th width="100" class="text-right">Saldo Atual</th>
                <th width="40" class="text-center">Nat.</th>
              </tr>
            </thead>
            <tbody>
              ${grupos.map(({ cls, label }) => {
                const totais = calcTotais(cls)
                const contasCls = contas.filter((c: any) => c.classificacao === cls && c.tipo === 'analitica')
                  .filter((c: any) => saldos[c.id]?.debitos > 0 || saldos[c.id]?.creditos > 0)
                
                if (contasCls.length === 0) return ''

                return `
                  <tr class="row-group">
                    <td colspan="6">${label}</td>
                  </tr>
                  ${contasCls.map((conta: any) => {
                    const s = getSaldo(conta)
                    return `
                      <tr>
                        <td>${conta.codigo}</td>
                        <td>${conta.descricao}</td>
                        <td class="text-right">${s.debitos > 0 ? fmtR(s.debitos) : '-'}</td>
                        <td class="text-right">${s.creditos > 0 ? fmtR(s.creditos) : '-'}</td>
                        <td class="text-right">${fmtR(Math.abs(s.saldo))}</td>
                        <td class="text-center">${conta.natureza === 'devedora' ? 'D' : 'C'}</td>
                      </tr>
                    `
                  }).join('')}
                  <tr class="row-subtotal">
                    <td colspan="2">TOTAL ${label}</td>
                    <td class="text-right">${fmtR(totais.debitos)}</td>
                    <td class="text-right">${fmtR(totais.creditos)}</td>
                    <td class="text-right">${fmtR(Math.abs(totais.saldo))}</td>
                    <td></td>
                  </tr>
                `
              }).join('')}
              <tr class="row-total">
                <td colspan="2">TOTAL GERAL (VERIFICAÇÃO)</td>
                <td class="text-right">${fmtR(totalD)}</td>
                <td class="text-right">${fmtR(totalC)}</td>
                <td class="text-right">${Math.abs(totalD - totalC) < 0.01 ? 'ZERADO' : fmtR(Math.abs(totalD - totalC))}</td>
                <td class="text-center">${Math.abs(totalD - totalC) < 0.01 ? 'OK' : 'ERR'}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | Inovacont ACPROBEC</div>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    win?.document.write(html)
    win?.document.close()
    setTimeout(() => win?.print(), 500)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Período: {currentPeriod}</span>
        </div>
        <button onClick={carregar} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-indigo-600 rounded-xl transition-all disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : '🔄'} Atualizar
        </button>
        <button onClick={imprimirBalancetePDF}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all">
          🖨️ Imprimir PDF
        </button>
        <div className="ml-auto flex gap-4 text-xs">
          <div className={`font-black ${Math.abs(totalD - totalC) < 0.01 ? 'text-emerald-600' : 'text-red-500'}`}>
            {Math.abs(totalD - totalC) < 0.01 ? '✅ Balanceado' : '⚠️ Desbalanceado'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-4 py-3 text-left text-[9px] font-black text-indigo-600 uppercase w-28">Código</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-indigo-600 uppercase">Conta</th>
                <th className="px-4 py-3 text-right text-[9px] font-black text-indigo-600 uppercase">Débitos</th>
                <th className="px-4 py-3 text-right text-[9px] font-black text-indigo-600 uppercase">Créditos</th>
                <th className="px-4 py-3 text-right text-[9px] font-black text-indigo-600 uppercase">Saldo</th>
                <th className="px-4 py-3 text-center text-[9px] font-black text-indigo-600 uppercase">Nat.</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map(({ cls, label, color }) => {
                const totais = calcTotais(cls)
                const contasCls = contas.filter((c: any) => c.classificacao === cls && c.tipo === 'analitica')
                  .filter((c: any) => saldos[c.id]?.debitos > 0 || saldos[c.id]?.creditos > 0)

                return (
                  <React.Fragment key={cls}>
                    <tr className="bg-slate-50">
                      <td colSpan={6} className={`px-4 py-2 font-black text-xs ${color}`}>{label}</td>
                    </tr>
                    {contasCls.map((conta: any) => {
                      const s = getSaldo(conta)
                      const temMovimento = s.debitos > 0 || s.creditos > 0
                      if (!temMovimento) return null
                      return (
                        <tr key={conta.id} className="border-t border-slate-50 hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">{conta.codigo}</td>
                          <td className="px-4 py-2.5 text-slate-700 font-medium">{conta.descricao}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-blue-700">{s.debitos > 0 ? fmtR(s.debitos) : '--'}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-purple-700">{s.creditos > 0 ? fmtR(s.creditos) : '--'}</td>
                          <td className={`px-4 py-2.5 text-right font-black ${s.saldo >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{fmtR(Math.abs(s.saldo))}</td>
                          <td className={`px-4 py-2.5 text-center text-[9px] font-black ${conta.natureza === 'devedora' ? 'text-blue-600' : 'text-purple-600'}`}>
                            {conta.natureza === 'devedora' ? 'D' : 'C'}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="border-t-2 border-slate-200">
                      <td colSpan={2} className={`px-4 py-2 text-[10px] font-black ${color}`}>Total {label}</td>
                      <td className="px-4 py-2 text-right text-[10px] font-black text-blue-700">{fmtR(totais.debitos)}</td>
                      <td className="px-4 py-2 text-right text-[10px] font-black text-purple-700">{fmtR(totais.creditos)}</td>
                      <td className="px-4 py-2 text-right text-[10px] font-black text-slate-800">{fmtR(Math.abs(totais.saldo))}</td>
                      <td />
                    </tr>
                  </React.Fragment>
                )
              })}
              {/* Totais gerais */}
              <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                <td colSpan={2} className="px-4 py-3 text-xs font-black text-indigo-800">TOTAL GERAL</td>
                <td className="px-4 py-3 text-right font-black text-blue-700">{fmtR(totalD)}</td>
                <td className="px-4 py-3 text-right font-black text-purple-700">{fmtR(totalC)}</td>
                <td className={`px-4 py-3 text-right font-black text-xs ${Math.abs(totalD - totalC) < 0.01 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {Math.abs(totalD - totalC) < 0.01 ? '✅ Zerado' : fmtR(Math.abs(totalD - totalC))}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
