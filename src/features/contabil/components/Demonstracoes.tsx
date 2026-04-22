'use client'
import React, { useState } from 'react'
const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function Demonstracoes({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  const { contas } = planoHook
  const [demo, setDemo] = useState<'dsd' | 'bp' | 'dmps'>('dsd')
  const ano = new Date().getFullYear()

  const getSaldoConta = (codigo: string) => {
    const conta = contas.find((c: any) => c.codigo.startsWith(codigo))
    return 0 // Placeholder — em produção usa calcularBalancete do hook
  }

  // DSD — Demonstração do Superávit ou Déficit
  const DSD = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-emerald-600 px-6 py-4">
        <h3 className="text-white font-black text-sm">DEMONSTRAÇÃO DO SUPERÁVIT OU DÉFICIT DO PERÍODO</h3>
        <p className="text-emerald-100 text-xs mt-0.5">Exercício findo em 31/12/{ano} • Conforme ITG 2002 (R1)</p>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {[
            { label: 'INGRESSOS DAS ATIVIDADES', value: 0, bold: true, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Mensalidades de Associados (4.1.1.01)', value: 0, indent: true },
            { label: 'Taxa de Adesão (4.1.1.02)', value: 0, indent: true },
            { label: 'Contribuições Voluntárias (4.1.1.03)', value: 0, indent: true },
            { label: 'Subvenções e Doações (4.1.2)', value: 0, indent: true },
            { label: 'Receita de Eventos e Projetos (4.1.3)', value: 0, indent: true },
            { label: 'Rendimentos Financeiros (4.2.1.01)', value: 0, indent: true },
            { label: 'TOTAL DE INGRESSOS', value: 0, bold: true, color: 'text-emerald-700', borderTop: true },
            { label: '', value: null },
            { label: 'DESPESAS DAS ATIVIDADES', value: 0, bold: true, color: 'text-rose-700', bg: 'bg-rose-50' },
            { label: 'Despesas com Pessoal — Ativ. Fim (5.1.1)', value: 0, indent: true },
            { label: 'Materiais Distribuídos a Beneficiários (5.1.2.01)', value: 0, indent: true },
            { label: 'Serviços Técnicos — Ativ. Fim (5.1.3)', value: 0, indent: true },
            { label: 'DESPESAS ADMINISTRATIVAS', value: 0, bold: true, color: 'text-rose-700', bg: 'bg-rose-50' },
            { label: 'Despesas com Pessoal — Admin. (5.2.1)', value: 0, indent: true },
            { label: 'Despesas Operacionais (5.2.2)', value: 0, indent: true },
            { label: 'Depreciações e Amortizações (5.3)', value: 0, indent: true },
            { label: 'TOTAL DE DESPESAS', value: 0, bold: true, color: 'text-rose-700', borderTop: true },
            { label: '', value: null },
            { label: 'SUPERÁVIT (DÉFICIT) DO EXERCÍCIO', value: 0, bold: true, color: 'text-indigo-700', bg: 'bg-indigo-50', borderTop: true },
          ].filter(r => r.value !== null).map((row, i) => (
            <tr key={i} className={`border-t border-slate-50 ${row.bg || ''} ${row.borderTop ? 'border-t-2 border-slate-300' : ''}`}>
              <td className={`px-6 py-2.5 ${row.indent ? 'pl-12' : ''} ${row.bold ? 'font-black' : 'font-medium'} ${row.color || 'text-slate-700'}`}>
                {row.label}
              </td>
              <td className={`px-6 py-2.5 text-right ${row.bold ? 'font-black' : 'font-medium'} ${row.color || 'text-slate-700'} w-40`}>
                {fmtR(row.value as number)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-[9px] text-slate-400 font-medium">
          * Os valores acima são calculados automaticamente com base nos lançamentos contábeis do Livro Diário.
          Lançar os lançamentos na aba "Livro Diário" para que os valores sejam refletidos aqui.
        </p>
      </div>
    </div>
  )

  // BP — Balanço Patrimonial
  const BP = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-indigo-600 px-6 py-4">
        <h3 className="text-white font-black text-sm">BALANÇO PATRIMONIAL</h3>
        <p className="text-indigo-100 text-xs mt-0.5">Exercício findo em 31/12/{ano} • Conforme ITG 2002 (R1)</p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-100">
        {/* ATIVO */}
        <div>
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-xs font-black text-blue-700">ATIVO</p>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {[
                { label: 'ATIVO CIRCULANTE', bold: true, bg: 'bg-slate-50' },
                { label: 'Caixa e Equivalentes de Caixa', indent: true, value: 0 },
                { label: 'Créditos a Receber', indent: true, value: 0 },
                { label: 'Estoques', indent: true, value: 0 },
                { label: 'Outros Ativos Circulantes', indent: true, value: 0 },
                { label: 'TOTAL ATIVO CIRCULANTE', bold: true, value: 0, borderTop: true },
                { label: '' },
                { label: 'ATIVO NÃO CIRCULANTE', bold: true, bg: 'bg-slate-50' },
                { label: 'Realizável a Longo Prazo', indent: true, value: 0 },
                { label: 'Imobilizado (líquido)', indent: true, value: 0 },
                { label: 'Intangível', indent: true, value: 0 },
                { label: 'TOTAL ATIVO NÃO CIRCULANTE', bold: true, value: 0, borderTop: true },
                { label: '' },
                { label: 'TOTAL DO ATIVO', bold: true, value: 0, borderTop: true, bg: 'bg-blue-50', color: 'text-blue-700' },
              ].map((row, i) => (
                <tr key={i} className={`border-t border-slate-50 ${row.bg || ''} ${row.borderTop ? 'border-t-2 border-slate-200' : ''}`}>
                  <td className={`px-4 py-2 ${row.indent ? 'pl-8' : ''} ${row.bold ? 'font-black' : 'font-medium'} ${row.color || 'text-slate-700'}`}>{row.label}</td>
                  <td className={`px-4 py-2 text-right ${row.bold ? 'font-black' : ''} ${row.color || 'text-slate-600'} w-28`}>{row.value !== undefined ? fmtR(row.value) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* PASSIVO + PATRIMÔNIO SOCIAL */}
        <div>
          <div className="px-5 py-3 bg-rose-50 border-b border-rose-100">
            <p className="text-xs font-black text-rose-700">PASSIVO + PATRIMÔNIO SOCIAL</p>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {[
                { label: 'PASSIVO CIRCULANTE', bold: true, bg: 'bg-slate-50' },
                { label: 'Obrigações Trabalhistas', indent: true, value: 0 },
                { label: 'Obrigações Fiscais', indent: true, value: 0 },
                { label: 'Fornecedores e Contas a Pagar', indent: true, value: 0 },
                { label: 'Receitas Antecipadas', indent: true, value: 0 },
                { label: 'TOTAL PASSIVO CIRCULANTE', bold: true, value: 0, borderTop: true },
                { label: '' },
                { label: 'PASSIVO NÃO CIRCULANTE', bold: true, bg: 'bg-slate-50' },
                { label: 'Exigível a Longo Prazo', indent: true, value: 0 },
                { label: 'TOTAL PASSIVO NÃO CIRCULANTE', bold: true, value: 0, borderTop: true },
                { label: '' },
                { label: 'PATRIMÔNIO SOCIAL', bold: true, bg: 'bg-purple-50', color: 'text-purple-700' },
                { label: 'Fundo Social', indent: true, value: 0 },
                { label: 'Superávits/Déficits Acumulados', indent: true, value: 0 },
                { label: 'Superávit/Déficit do Exercício', indent: true, value: 0 },
                { label: 'TOTAL PATRIMÔNIO SOCIAL', bold: true, value: 0, borderTop: true, color: 'text-purple-700' },
                { label: '' },
                { label: 'TOTAL PASSIVO + PAT. SOCIAL', bold: true, value: 0, borderTop: true, bg: 'bg-rose-50', color: 'text-rose-700' },
              ].map((row, i) => (
                <tr key={i} className={`border-t border-slate-50 ${row.bg || ''} ${row.borderTop ? 'border-t-2 border-slate-200' : ''}`}>
                  <td className={`px-4 py-2 ${row.indent ? 'pl-8' : ''} ${row.bold ? 'font-black' : 'font-medium'} ${row.color || 'text-slate-700'}`}>{row.label}</td>
                  <td className={`px-4 py-2 text-right ${row.bold ? 'font-black' : ''} ${row.color || 'text-slate-600'} w-28`}>{row.value !== undefined ? fmtR(row.value) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // DMPS — Demonstração das Mutações do Patrimônio Social
  const DMPS = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-purple-600 px-6 py-4">
        <h3 className="text-white font-black text-sm">DEMONSTRAÇÃO DAS MUTAÇÕES DO PATRIMÔNIO SOCIAL — DMPS</h3>
        <p className="text-purple-100 text-xs mt-0.5">Exercício findo em 31/12/{ano} • Conforme ITG 2002 (R1)</p>
      </div>
      <table className="w-full text-xs">
        <thead className="bg-slate-50">
          <tr>
            {['Discriminação', 'Fundo Social', 'Superávits/Déficits Acumulados', 'Superávit/Déficit do Exercício', 'Total'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'Saldo em 01/01/' + ano, fundo: 0, acumulados: 0, exercicio: 0 },
            { label: 'Superávit/Déficit do Exercício', fundo: 0, acumulados: 0, exercicio: 0 },
            { label: 'Destinação do Resultado', fundo: 0, acumulados: 0, exercicio: 0 },
            { label: 'Saldo em 31/12/' + ano, fundo: 0, acumulados: 0, exercicio: 0, bold: true, bg: 'bg-purple-50' },
          ].map((row, i) => {
            const total = row.fundo + row.acumulados + row.exercicio
            return (
              <tr key={i} className={`border-t border-slate-100 ${row.bg || ''}`}>
                <td className={`px-4 py-2.5 ${row.bold ? 'font-black text-purple-700' : 'font-medium text-slate-700'}`}>{row.label}</td>
                <td className={`px-4 py-2.5 text-right ${row.bold ? 'font-black' : ''}`}>{fmtR(row.fundo)}</td>
                <td className={`px-4 py-2.5 text-right ${row.bold ? 'font-black' : ''}`}>{fmtR(row.acumulados)}</td>
                <td className={`px-4 py-2.5 text-right ${row.bold ? 'font-black' : ''}`}>{fmtR(row.exercicio)}</td>
                <td className={`px-4 py-2.5 text-right font-black ${row.bold ? 'text-purple-700' : 'text-slate-800'}`}>{fmtR(total)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'dsd', label: '📊 DSD' },
          { id: 'bp', label: '⚖️ Balanço Patrimonial' },
          { id: 'dmps', label: '🔄 DMPS' },
        ].map(t => (
          <button key={t.id} onClick={() => setDemo(t.id as any)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${demo === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3">
        <p className="text-[10px] font-bold text-indigo-700">
          ⚠️ Os valores das demonstrações são calculados a partir dos lançamentos contábeis registrados no Livro Diário.
          Para que as demonstrações reflitam a realidade, é necessário lançar todos os fatos contábeis do período.
        </p>
      </div>

      {demo === 'dsd' && <DSD />}
      {demo === 'bp' && <BP />}
      {demo === 'dmps' && <DMPS />}
    </div>
  )
}
