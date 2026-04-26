'use client'
import React, { useState, useEffect } from 'react'
import { Book, Printer, Loader2, Search } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtData = (d: string) => {
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
  } catch {
    return d
  }
}

export default function LivroRazao({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  const { contas } = planoHook
  const { calcularRazao, periodo } = lancHook
  
  const [loading, setLoading] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState<string>('all')
  const [razaoData, setRazaoData] = useState<{ saldosIniciais: Record<string, any>; movimentacao: any[] } | null>(null)
  
  const currentPeriod = periodo || new Date().getFullYear().toString()
  const ano = currentPeriod.split('-')[0]

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const targetContaId = contaSelecionada === 'all' ? undefined : contaSelecionada
        const data = await calcularRazao(currentPeriod, targetContaId)
        setRazaoData(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [calcularRazao, currentPeriod, contaSelecionada])

  const handlePrint = () => {
    const conteudo = document.getElementById('razao-print-content')
    if (!conteudo) return
    const janela = window.open('', '_blank')
    if (!janela) return
    janela.document.write(`
      <html>
        <head>
          <title>Livro Razão Analítico - ACPROBEC</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; }
            th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 900; text-transform: uppercase; color: #475569; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: 700; }
            .bg-slate-50 { background-color: #f8fafc; }
            .bg-indigo-50 { background-color: #eef2ff; }
            .text-indigo-700 { color: #4338ca; }
            .text-emerald-600 { color: #059669; }
            .text-rose-600 { color: #e11d48; }
            .text-slate-500 { color: #64748b; }
            .text-slate-800 { color: #1e293b; }
            .footer { margin-top: 40px; text-align: right; font-size: 9px; color: #94a3b8; }
            .account-header { background-color: #eef2ff; padding: 10px; margin-top: 20px; font-weight: 900; font-size: 12px; color: #4338ca; border-left: 4px solid #4f46e5; }
            @media print { @page { size: A4 portrait; margin: 1.5cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACPROBEC — LIVRO RAZÃO ANALÍTICO</h1>
            <p>CONFORMIDADE ITG 2002 (R1) | PERÍODO: ${currentPeriod === 'all' ? 'Exercício ' + ano : currentPeriod} | CONTA: ${contaSelecionada === 'all' ? 'TODAS AS CONTAS' : contas.find((c: any) => c.id === contaSelecionada)?.codigo}</p>
          </div>
          ${conteudo.innerHTML}
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | Inovacont ACPROBEC</div>
        </body>
      </html>
    `)
    janela.document.close()
    setTimeout(() => { janela.print(); janela.close(); }, 500)
  }

  // Agrupar as movimentações por conta
  const contasComMovimento = new Set(razaoData?.movimentacao.map(m => m.conta_id))
  if (razaoData) {
    Object.keys(razaoData.saldosIniciais).forEach(id => contasComMovimento.add(id))
  }

  // Filtrar contas que têm movimento e são sintéticas/analíticas relevantes
  const contasExibir = contas.filter((c: any) => contasComMovimento.has(c.id)).sort((a: any, b: any) => a.codigo.localeCompare(b.codigo))

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Barra superior de controles */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-slate-50">
        <div>
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Book size={16} className="text-indigo-600" />
            LIVRO RAZÃO ANALÍTICO
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Análise detalhada de saldos e movimentações</p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:min-w-[300px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={contaSelecionada}
              onChange={(e) => setContaSelecionada(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-indigo-300 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
            >
              <option value="all">TODAS AS CONTAS COM MOVIMENTO</option>
              {contasExibir.map((c: any) => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.descricao}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handlePrint}
            disabled={loading || !razaoData}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-xs font-black uppercase tracking-wider disabled:opacity-50 flex-shrink-0 shadow-sm"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
            Imprimir
          </button>
        </div>
      </div>

      {/* Conteúdo do Razão */}
      <div className="p-5 overflow-auto max-h-[70vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Processando Razão...</p>
          </div>
        ) : !razaoData || contasExibir.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <Book size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-black">Nenhuma movimentação encontrada</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">No período selecionado</p>
          </div>
        ) : (
          <div id="razao-print-content">
            {contasExibir.map((conta: any) => {
              // Filtrar movimentações
              const movs = razaoData.movimentacao.filter(m => m.conta_id === conta.id)
              const sInicial = razaoData.saldosIniciais[conta.id] || { debitos: 0, creditos: 0 }
              
              // Determinar natureza para cálculo do saldo (Devedora: D-C, Credora: C-D)
              const natureza = conta.codigo.startsWith('1') || conta.codigo.startsWith('4') ? 'D' : 'C'
              
              let saldoAtual = natureza === 'D' ? sInicial.debitos - sInicial.creditos : sInicial.creditos - sInicial.debitos
              
              // Se não tem saldo inicial nem movimento, não exibe
              if (saldoAtual === 0 && movs.length === 0) return null

              let sumDebitos = 0
              let sumCreditos = 0

              return (
                <div key={conta.id} className="mb-8">
                  <div className="account-header">
                    CONTA: {conta.codigo} — {conta.descricao.toUpperCase()}
                  </div>
                  <table className="w-full text-xs mt-2">
                    <thead>
                      <tr>
                        <th className="w-24">Data</th>
                        <th className="w-28">Nº Lanç.</th>
                        <th>Histórico</th>
                        <th className="w-28 text-right">Débito</th>
                        <th className="w-28 text-right">Crédito</th>
                        <th className="w-32 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Saldo Inicial */}
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <td className="font-medium text-slate-500 text-center" colSpan={3}>SALDO ANTERIOR</td>
                        <td colSpan={2}></td>
                        <td className="text-right font-black text-slate-700">
                          {fmtR(saldoAtual)} {natureza}
                        </td>
                      </tr>
                      
                      {/* Linhas de Movimento */}
                      {movs.map((m: any, i: number) => {
                        const valor = Number(m.valor)
                        if (m.tipo_partida === 'D') {
                          sumDebitos += valor
                          if (natureza === 'D') saldoAtual += valor; else saldoAtual -= valor;
                        } else {
                          sumCreditos += valor
                          if (natureza === 'C') saldoAtual += valor; else saldoAtual -= valor;
                        }
                        
                        // O saldo pode ficar negativo momentaneamente, sinalizando que inverteu a natureza
                        const sufixoNatureza = saldoAtual >= 0 ? natureza : (natureza === 'D' ? 'C' : 'D')

                        return (
                          <tr key={`${m.id}-${i}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="text-slate-500 font-medium">{fmtData(m.lancamento.data_competencia)}</td>
                            <td className="text-indigo-600 font-black text-[10px]">{m.lancamento.numero_lancamento}</td>
                            <td className="text-slate-700">{m.historico_partida}</td>
                            <td className="text-right text-emerald-600 font-medium">{m.tipo_partida === 'D' ? fmtR(valor) : ''}</td>
                            <td className="text-right text-rose-600 font-medium">{m.tipo_partida === 'C' ? fmtR(valor) : ''}</td>
                            <td className="text-right font-black text-slate-800">{fmtR(Math.abs(saldoAtual))} {sufixoNatureza}</td>
                          </tr>
                        )
                      })}

                      {/* Totalizadores */}
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={3} className="text-right font-black text-slate-600 uppercase text-[9px] tracking-widest py-3">Totais do Período</td>
                        <td className="text-right font-black text-emerald-700">{fmtR(sumDebitos)}</td>
                        <td className="text-right font-black text-rose-700">{fmtR(sumCreditos)}</td>
                        <td className="text-right font-black text-indigo-700">{fmtR(Math.abs(saldoAtual))} {saldoAtual >= 0 ? natureza : (natureza === 'D' ? 'C' : 'D')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
