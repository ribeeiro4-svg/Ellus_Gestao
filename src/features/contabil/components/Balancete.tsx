'use client'
import React, { useState, useEffect } from 'react'
import { Loader2, Download } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Balancete({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  const { calcularBalancete } = lancHook
  const { contas } = planoHook
  const ano = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1
  const [periodo, setPeriodo] = useState(`${ano}-${mesAtual.toString().padStart(2, '0')}`)
  const [saldos, setSaldos] = useState<Record<string, { debitos: number; creditos: number }>>({})
  const [loading, setLoading] = useState(false)

  const carregar = async () => {
    setLoading(true)
    const data = await calcularBalancete(periodo)
    setSaldos(data)
    setLoading(false)
  }

  useEffect(() => { if (contas.length > 0) carregar() }, [periodo, contas.length])

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
    { cls: 'patrimonio_social', label: '3. PATRIMÔNIO SOCIAL', color: 'text-purple-700' },
    { cls: 'ingresso', label: '4. INGRESSOS', color: 'text-emerald-700' },
    { cls: 'despesa', label: '5. DESPESAS', color: 'text-orange-700' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Período</label>
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none">
            {MESES.map((m, i) => <option key={i} value={`${ano}-${(i+1).toString().padStart(2,'0')}`}>{m}/{ano}</option>)}
          </select>
        </div>
        <button onClick={carregar} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-indigo-600 rounded-xl transition-all disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : '🔄'} Atualizar
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
