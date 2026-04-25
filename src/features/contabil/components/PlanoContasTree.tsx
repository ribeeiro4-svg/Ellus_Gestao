'use client'
import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Plus, Loader2, Printer } from 'lucide-react'

const CLS_COLOR: Record<string, string> = {
  ativo: 'text-blue-700 bg-blue-50 border-blue-100',
  passivo: 'text-rose-700 bg-rose-50 border-rose-100',
  patrimonio_social: 'text-purple-700 bg-purple-50 border-purple-100',
  ingresso: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  despesa: 'text-orange-700 bg-orange-50 border-orange-100',
}
const CLS_LABEL: Record<string, string> = {
  ativo: 'Ativo', passivo: 'Passivo', patrimonio_social: 'Patrimônio Social', ingresso: 'Ingresso', despesa: 'Despesa/Dispêndio'
}
const NIVEL_INDENT: Record<number, string> = { 1: '', 2: 'ml-4', 3: 'ml-8', 4: 'ml-12', 5: 'ml-16' }

const CLS_PRINT_COLOR: Record<string, string> = {
  ativo: '#1d4ed8',
  passivo: '#be123c',
  patrimonio_social: '#7e22ce',
  ingresso: '#15803d',
  despesa: '#c2410c',
}
const CLS_PRINT_BG: Record<string, string> = {
  ativo: '#eff6ff',
  passivo: '#fff1f2',
  patrimonio_social: '#faf5ff',
  ingresso: '#f0fdf4',
  despesa: '#fff7ed',
}

function imprimirPlanoPDF(contas: any[]) {
  const now = new Date()
  const dataStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const sorted = [...contas].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))

  const rows = sorted.map(c => {
    const indent = (c.nivel - 1) * 20
    const isSintetica = c.tipo === 'sintetica'
    const clsColor = CLS_PRINT_COLOR[c.classificacao] || '#334155'
    const clsBg = CLS_PRINT_BG[c.classificacao] || '#f8fafc'
    const clsLabel = CLS_LABEL[c.classificacao] || c.classificacao

    return `
      <tr style="background:${isSintetica ? '#f8fafc' : '#ffffff'}; border-bottom:1px solid #e2e8f0;">
        <td style="padding:7px 10px; font-family:monospace; font-size:11px; color:#64748b; white-space:nowrap; border-right:1px solid #e2e8f0;">${c.codigo}</td>
        <td style="padding:7px 10px; padding-left:${10 + indent}px; font-size:${isSintetica ? '11px' : '11px'}; font-weight:${isSintetica ? '800' : '500'}; color:${isSintetica ? '#1e293b' : '#334155'}; text-transform:${isSintetica ? 'uppercase' : 'none'};">
          ${c.descricao}
        </td>
        <td style="padding:7px 10px; text-align:center; border-left:1px solid #e2e8f0;">
          <span style="display:inline-block; padding:2px 8px; background:${clsBg}; color:${clsColor}; font-size:9px; font-weight:800; border-radius:999px; border:1px solid ${clsColor}30; text-transform:uppercase; letter-spacing:0.04em;">${clsLabel}</span>
        </td>
        <td style="padding:7px 10px; text-align:center; font-size:10px; font-weight:700; color:${c.natureza === 'devedora' ? '#1d4ed8' : '#7e22ce'}; border-left:1px solid #e2e8f0;">
          ${c.natureza === 'devedora' ? 'D' : 'C'}
        </td>
        <td style="padding:7px 10px; text-align:center; font-size:10px; font-weight:700; color:${c.tipo === 'analitica' ? '#334155' : '#94a3b8'}; border-left:1px solid #e2e8f0;">
          ${c.tipo === 'analitica' ? 'Analítica' : 'Sintética'}
        </td>
        <td style="padding:7px 10px; text-align:center; border-left:1px solid #e2e8f0;">
          ${c.aceita_lancamentos ? '<span style="font-size:9px;font-weight:800;color:#15803d;background:#f0fdf4;padding:2px 8px;border-radius:999px;border:1px solid #bbf7d0;">✓ SIM</span>' : '<span style="font-size:9px;color:#94a3b8;">—</span>'}
        </td>
      </tr>`
  }).join('')

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Plano de Contas — ACPROBEC — ITG 2002</title>
  <style>
    @page { size: A4 landscape; margin: 1.5cm 1.8cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; border-bottom: 3px solid #4f46e5; padding-bottom: 16px; }
    .logo-area { display: flex; align-items: center; gap: 14px; }
    .logo-box { width: 48px; height: 48px; background: #4f46e5; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; }
    .org-name { font-size: 20px; font-weight: 900; color: #1e293b; letter-spacing: -0.5px; }
    .org-sub { font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
    .doc-info { text-align: right; }
    .doc-title { font-size: 16px; font-weight: 900; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
    .doc-date { font-size: 10px; color: #64748b; font-weight: 600; margin-top: 4px; }
    .doc-norm { font-size: 10px; color: #94a3b8; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    thead { background: #4f46e5; }
    thead th { padding: 10px 10px; text-align: left; font-size: 9px; font-weight: 900; color: white; text-transform: uppercase; letter-spacing: 1px; }
    thead th:not(:first-child) { border-left: 1px solid #ffffff30; }
    .footer { margin-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8; }
    .itg-badge { display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 999px; font-size: 9px; font-weight: 800; border: 1px solid #bfdbfe; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <div class="logo-box">📒</div>
      <div>
        <div class="org-name">ACPROBEC</div>
        <div class="org-sub">Contabilidade ITG 2002 (R1)</div>
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-title">Plano de Contas</div>
      <div class="doc-date">Emitido em: ${dataStr}</div>
      <div class="doc-norm">NBC TG 1000 • ITG 2002 (R1) • Entidade sem Fins Lucrativos</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width:120px;">Código</th>
        <th>Descrição da Conta</th>
        <th style="width:140px;text-align:center;">Classificação</th>
        <th style="width:50px;text-align:center;">N.</th>
        <th style="width:90px;text-align:center;">Tipo</th>
        <th style="width:80px;text-align:center;">Lança</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <div>Total de contas: <strong>${contas.length}</strong> | Analíticas: <strong>${contas.filter(c => c.tipo === 'analitica').length}</strong> | Sintéticas: <strong>${contas.filter(c => c.tipo === 'sintetica').length}</strong></div>
    <div class="itg-badge">📘 Norma ITG 2002 (R1) — CFC — Entidades sem Finalidade de Lucro</div>
    <div>Gerado pelo InovacontACPROBEC</div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1200,height=800')
  if (!win) return alert('Habilite popups para imprimir.')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}


export default function PlanoContasTree({ planoHook }: { planoHook: any }) {
  const { contas, loading, inicializarPlanoContas, adicionarConta } = planoHook
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5']))
  const [showAddForm, setShowAddForm] = useState(false)
  const [initing, setIniting] = useState(false)
  const [filterCls, setFilterCls] = useState('ALL')
  const [newConta, setNewConta] = useState({
    codigo: '', descricao: '', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'ativo', aceita_lancamentos: true, ativa: true, conta_pai_id: null as string | null
  })

  const toggle = (cod: string) => setExpanded(prev => { const n = new Set(prev); n.has(cod) ? n.delete(cod) : n.add(cod); return n })

  const handleInit = async () => {
    setIniting(true)
    const r = await inicializarPlanoContas()
    setIniting(false)
    if (r.error) alert(r.error)
  }

  const filtered = filterCls === 'ALL' ? contas : contas.filter((c: any) => c.classificacao === filterCls)

  // Agrupar por código raiz
  const rootCodes = [...new Set(filtered.map((c: any) => c.codigo.split('.')[0] as string))] as string[]

  const renderTree = (parentCode: string, level: number) => {
    const prefix = parentCode + '.'
    const children = filtered.filter((c: any) => {
      const parts = c.codigo.split('.')
      const parentParts = parentCode.split('.')
      return parts.length === parentParts.length + 1 && c.codigo.startsWith(prefix)
    })
    return children.map((c: any) => {
      const hasChildren = filtered.some((x: any) => x.codigo.startsWith(c.codigo + '.'))
      const isExpanded = expanded.has(c.codigo)
      return (
        <React.Fragment key={c.id}>
          <div className={`flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer group ${NIVEL_INDENT[c.nivel] || 'ml-16'}`}
            onClick={() => toggle(c.codigo)}>
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              {hasChildren ? (isExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />) : <div className="w-2 h-2 rounded-full bg-slate-200" />}
            </div>
            <span className="font-mono text-[10px] text-slate-400 w-24 flex-shrink-0">{c.codigo}</span>
            <span className={`text-xs font-bold ${c.tipo === 'analitica' ? 'text-slate-700' : 'text-slate-500'}`}>{c.descricao}</span>
            <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {c.aceita_lancamentos && (
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded border border-emerald-100">✓ Lança</span>
              )}
              <span className={`px-1.5 py-0.5 text-[8px] font-black rounded border ${CLS_COLOR[c.classificacao] || 'bg-slate-50'}`}>
                {CLS_LABEL[c.classificacao] || c.classificacao}
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] font-black rounded ${c.natureza === 'devedora' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                {c.natureza === 'devedora' ? 'D' : 'C'}
              </span>
            </div>
          </div>
          {isExpanded && hasChildren && renderTree(c.codigo, level + 1)}
        </React.Fragment>
      )
    })
  }

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>

  if (contas.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
      <span className="text-4xl mb-4">📘</span>
      <p className="text-sm font-black text-slate-600 mb-2">Plano de Contas não inicializado</p>
      <p className="text-xs text-slate-400 mb-6 text-center max-w-sm">
        Clique abaixo para carregar automaticamente o Plano de Contas padrão ITG 2002 (R1) para associações sem fins lucrativos.
      </p>
      <button onClick={handleInit} disabled={initing}
        className="flex items-center gap-2 px-8 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all disabled:opacity-50">
        {initing ? <Loader2 size={16} className="animate-spin" /> : '🚀'}
        {initing ? 'Inicializando...' : 'Inicializar Plano ITG 2002'}
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-wrap">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {['ALL', 'ativo', 'passivo', 'patrimonio_social', 'ingresso', 'despesa'].map(cls => (
            <button key={cls} onClick={() => setFilterCls(cls)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterCls === cls ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>
              {cls === 'ALL' ? 'Todos' : CLS_LABEL[cls]}
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-slate-400 ml-auto">{filtered.length} contas</span>
        <button
          onClick={() => imprimirPlanoPDF(contas)}
          className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 rounded-xl transition-all active:scale-95 shadow-sm"
        >
          <Printer size={11} /> Imprimir PDF
        </button>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl">
          <Plus size={11} /> Adicionar Conta
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-black text-slate-700 mb-3">Nova Conta Contábil</h4>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Código</label>
              <input value={newConta.codigo} onChange={e => setNewConta(c => ({ ...c, codigo: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono outline-none" placeholder="5.2.2.09" /></div>
            <div className="col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Descrição</label>
              <input value={newConta.descricao} onChange={e => setNewConta(c => ({ ...c, descricao: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" /></div>
            <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Classificação</label>
              <select value={newConta.classificacao} onChange={e => setNewConta(c => ({ ...c, classificacao: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                {Object.entries(CLS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Natureza</label>
              <select value={newConta.natureza} onChange={e => setNewConta(c => ({ ...c, natureza: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                <option value="devedora">Devedora</option>
                <option value="credora">Credora</option>
              </select></div>
            <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tipo</label>
              <select value={newConta.tipo} onChange={e => setNewConta(c => ({ ...c, tipo: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                <option value="analitica">Analítica</option>
                <option value="sintetica">Sintética</option>
              </select></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={async () => { const r = await adicionarConta(newConta); if (r.error) alert(r.error); else setShowAddForm(false) }}
              className="px-5 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl">Salvar</button>
            <button onClick={() => setShowAddForm(false)} className="px-5 py-2 text-xs font-black text-slate-500 bg-slate-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      {/* Tree */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        {/* Legenda */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {[
            { label: 'ATIVO (1)', cls: 'ativo' },
            { label: 'PASSIVO (2)', cls: 'passivo' },
            { label: 'PATRIMÔNIO SOCIAL (3)', cls: 'patrimonio_social' },
            { label: 'INGRESSOS (4)', cls: 'ingresso' },
            { label: 'DESPESAS (5)', cls: 'despesa' },
          ].map(({ label, cls }) => (
            <span key={cls} className={`px-2 py-1 text-[9px] font-black rounded border ${CLS_COLOR[cls]}`}>{label}</span>
          ))}
        </div>

        {rootCodes.map(root => {
          const rootConta = filtered.find((c: any) => c.codigo === root)
          if (!rootConta) return null
          return (
            <div key={root} className="mb-2">
              <div className="flex items-center gap-2 py-2 px-2 rounded-xl cursor-pointer hover:bg-slate-50"
                onClick={() => toggle(root)}>
                {expanded.has(root) ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                <span className="font-mono text-[10px] text-slate-400 w-8">{rootConta.codigo}</span>
                <span className="text-sm font-black text-slate-800">{rootConta.descricao}</span>
                <span className={`ml-2 px-2 py-0.5 text-[9px] font-black rounded border ${CLS_COLOR[rootConta.classificacao]}`}>
                  {CLS_LABEL[rootConta.classificacao]}
                </span>
              </div>
              {expanded.has(root) && renderTree(root, 2)}
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
        <p className="text-xs font-black text-indigo-800 mb-1">📘 ITG 2002 (R1) — Norma para Entidades sem Finalidade de Lucro</p>
        <p className="text-[10px] text-indigo-600">
          Terminologia obrigatória: <strong>Superávit/Déficit</strong> (não Lucro/Prejuízo) •
          <strong> Ingressos</strong> (não Receitas) • <strong>Patrimônio Social</strong> (não Patrimônio Líquido) •
          <strong> DSD</strong> em vez de DRE
        </p>
      </div>
    </div>
  )
}
