import React, { useMemo } from 'react'
import { Printer, AlertTriangle, CheckCircle, Package, TrendingUp, Users, Building2, Map, Calendar } from 'lucide-react'
import { fmtR, fmtData } from '@/lib/utils/formatters'

export default function RelatoriosFiscais({ nfeHook, nfseHook, estoqueHook }: { nfeHook: any; nfseHook: any; estoqueHook: any }) {
  const { nfes } = nfeHook
  const { nfses } = nfseHook
  const { produtos } = estoqueHook

  const handleImprimir = (id: string, titulo: string) => {
    const conteudo = document.getElementById(id)
    if (!conteudo) {
      alert(`O relatório "${titulo}" está vazio ou não pôde ser gerado.`)
      return
    }

    const janela = window.open('', '_blank')
    if (!janela) {
      alert('Bloqueio de pop-up detectado!')
      return
    }

    janela.document.write(`
      <html>
        <head>
          <title>${titulo} — ACPROBEC</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
            th { padding: 8px; border-bottom: 2px solid #cbd5e1; background-color: #f8fafc; text-align: left; font-weight: 900; color: #334155; text-transform: uppercase; font-size: 9px; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; color: #475569; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-black { font-weight: 900; color: #0f172a; }
            .font-bold { font-weight: 700; }
            .footer { margin-top: 40px; text-align: right; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            .summary-box { border: 1px solid #e2e8f0; padding: 10px; background-color: #f8fafc; margin-bottom: 20px; border-radius: 4px; display: flex; gap: 20px; }
            .summary-item { display: flex; flex-direction: column; }
            .summary-label { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #64748b; }
            .summary-value { font-size: 14px; font-weight: 900; color: #0f172a; }
            @media print { @page { size: A4 portrait; margin: 1cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACPROBEC — ${titulo.toUpperCase()}</h1>
            <p>RELATÓRIO FISCAL OFICIAL | DATA-BASE: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            ${conteudo.innerHTML}
          </div>
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | Módulo Fiscal Inovacont ACPROBEC</div>
        </body>
      </html>
    `)
    janela.document.close()
    setTimeout(() => {
      janela.print()
      janela.close()
    }, 800)
  }

  // --- COMPONENTES DOS RELATÓRIOS (Renderizados Invisíveis) ---

  const RelatorioPendencias = () => {
    const nfePendentes = nfes.filter((n: any) => n.status_escrituracao === 'pendente' || n.status_escrituracao === 'com_inconsistencia')
    const nfsePendentes = nfses.filter((n: any) => n.status_escrituracao === 'pendente')
    
    return (
      <>
        <div className="summary-box">
          <div className="summary-item"><span className="summary-label">NF-E Pendentes</span><span className="summary-value">{nfePendentes.length}</span></div>
          <div className="summary-item"><span className="summary-label">NFS-E Pendentes</span><span className="summary-value">{nfsePendentes.length}</span></div>
          <div className="summary-item"><span className="summary-label">Total de Documentos</span><span className="summary-value">{nfePendentes.length + nfsePendentes.length}</span></div>
        </div>
        
        {nfePendentes.length > 0 && (
          <>
            <h3 style={{ fontSize: '12px', fontWeight: 900, marginBottom: '5px', color: '#1e293b' }}>NF-e MODELO 55 (PRODUTOS)</h3>
            <table style={{ marginBottom: '30px' }}>
              <thead><tr><th>Número</th><th>Emissão</th><th>Emitente</th><th>Status</th><th className="text-right">Valor</th></tr></thead>
              <tbody>
                {nfePendentes.map((n: any) => (
                  <tr key={n.id}>
                    <td className="font-bold">{n.numero_nf}</td>
                    <td>{fmtData(n.data_emissao)}</td>
                    <td>{n.nome_emitente}</td>
                    <td><span style={{ color: n.status_escrituracao === 'com_inconsistencia' ? 'red' : 'orange', fontWeight: 'bold' }}>{n.status_escrituracao.toUpperCase()}</span></td>
                    <td className="text-right font-black">{fmtR(n.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {nfsePendentes.length > 0 && (
          <>
            <h3 style={{ fontSize: '12px', fontWeight: 900, marginBottom: '5px', color: '#1e293b' }}>NFS-e (SERVIÇOS TOMADOS)</h3>
            <table>
              <thead><tr><th>Número</th><th>Emissão</th><th>Prestador</th><th className="text-right">Valor Bruto</th></tr></thead>
              <tbody>
                {nfsePendentes.map((n: any) => (
                  <tr key={n.id}>
                    <td className="font-bold">{n.numero_nfse}</td>
                    <td>{fmtData(n.data_emissao)}</td>
                    <td>{n.prestador?.nome || n.prestador?.razao_social}</td>
                    <td className="text-right font-black">{fmtR(n.valor_bruto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </>
    )
  }

  const RelatorioEscrituradas = () => {
    const nfeConcluidas = nfes.filter((n: any) => n.status_escrituracao === 'escriturada')
    const nfseConcluidas = nfses.filter((n: any) => n.status_escrituracao === 'concluida')
    const valorNfe = nfeConcluidas.reduce((acc: number, n: any) => acc + Number(n.valor_total || 0), 0)
    const valorNfse = nfseConcluidas.reduce((acc: number, n: any) => acc + Number(n.valor_liquido || 0), 0)

    return (
      <>
        <div className="summary-box">
          <div className="summary-item"><span className="summary-label">NF-E Escrituradas</span><span className="summary-value">{nfeConcluidas.length}</span></div>
          <div className="summary-item"><span className="summary-label">Vlr Total NF-e</span><span className="summary-value">{fmtR(valorNfe)}</span></div>
          <div className="summary-item" style={{ marginLeft: '20px' }}><span className="summary-label">NFS-E Escrituradas</span><span className="summary-value">{nfseConcluidas.length}</span></div>
          <div className="summary-item"><span className="summary-label">Vlr Líquido NFS-e</span><span className="summary-value">{fmtR(valorNfse)}</span></div>
        </div>

        {nfeConcluidas.length > 0 && (
          <>
            <h3 style={{ fontSize: '12px', fontWeight: 900, marginBottom: '5px', color: '#10b981' }}>MERCADORIAS</h3>
            <table style={{ marginBottom: '30px' }}>
              <thead><tr><th>Número</th><th>Emissão</th><th>Emitente</th><th>CFOP Base</th><th className="text-right">Valor</th></tr></thead>
              <tbody>
                {nfeConcluidas.map((n: any) => (
                  <tr key={n.id}>
                    <td className="font-bold">{n.numero_nf}</td>
                    <td>{fmtData(n.data_emissao)}</td>
                    <td>{n.nome_emitente}</td>
                    <td>{n.cfop_escrituracao || 'N/I'}</td>
                    <td className="text-right font-black">{fmtR(n.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {nfseConcluidas.length > 0 && (
          <>
            <h3 style={{ fontSize: '12px', fontWeight: 900, marginBottom: '5px', color: '#10b981' }}>SERVIÇOS</h3>
            <table>
              <thead><tr><th>Número</th><th>Emissão</th><th>Prestador</th><th className="text-right">Vlr Bruto</th><th className="text-right">Vlr Líquido</th></tr></thead>
              <tbody>
                {nfseConcluidas.map((n: any) => (
                  <tr key={n.id}>
                    <td className="font-bold">{n.numero_nfse}</td>
                    <td>{fmtData(n.data_emissao)}</td>
                    <td>{n.prestador?.nome || n.prestador?.razao_social}</td>
                    <td className="text-right">{fmtR(n.valor_bruto)}</td>
                    <td className="text-right font-black text-emerald-600">{fmtR(n.valor_liquido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </>
    )
  }

  const RelatorioCFOP = () => {
    const agrupado: Record<string, { qtd: number; valor: number }> = {}
    nfes.forEach((n: any) => {
      if (n.status_escrituracao === 'escriturada') {
        const cfop = n.cfop_escrituracao || 'NÃO DEFINIDO'
        if (!agrupado[cfop]) agrupado[cfop] = { qtd: 0, valor: 0 }
        agrupado[cfop].qtd++
        agrupado[cfop].valor += Number(n.valor_total || 0)
      }
    })
    const lista = Object.entries(agrupado).sort((a, b) => b[1].valor - a[1].valor)

    return (
      <>
        <table style={{ marginTop: '20px' }}>
          <thead><tr><th>CFOP</th><th className="text-center">Qtd. Notas</th><th className="text-right">Valor Total Movimentado</th></tr></thead>
          <tbody>
            {lista.map(([cfop, data]) => (
              <tr key={cfop}>
                <td className="font-black" style={{ fontSize: '12px' }}>{cfop}</td>
                <td className="text-center">{data.qtd}</td>
                <td className="text-right font-black">{fmtR(data.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  const RelatorioDestinacao = () => {
    const destMap: Record<number, string> = {
      1: 'Comercialização / Revenda',
      2: 'Uso Próprio Administrativo',
      3: 'Consumo Imediato (Projetos/Eventos)',
      4: 'Ativo Imobilizado',
      5: 'Remessa P/ Conserto',
      6: 'Amostra Grátis / Bonificação',
      7: 'Devolução de Compra',
      8: 'Embalagem',
      9: 'Matéria-Prima',
      10: 'Outras Destinações',
    }
    const agrupado: Record<string, { qtd: number; valor: number }> = {}
    nfes.forEach((n: any) => {
      if (n.status_escrituracao === 'escriturada') {
        const dId = n.destinacao_escrituracao || 10
        const label = destMap[dId] || 'Desconhecido'
        if (!agrupado[label]) agrupado[label] = { qtd: 0, valor: 0 }
        agrupado[label].qtd++
        agrupado[label].valor += Number(n.valor_total || 0)
      }
    })
    const lista = Object.entries(agrupado).sort((a, b) => b[1].valor - a[1].valor)

    return (
      <>
        <table style={{ marginTop: '20px' }}>
          <thead><tr><th>Destinação Final</th><th className="text-center">Qtd. Notas</th><th className="text-right">Valor Total Movimentado</th></tr></thead>
          <tbody>
            {lista.map(([label, data]) => (
              <tr key={label}>
                <td className="font-bold">{label.toUpperCase()}</td>
                <td className="text-center">{data.qtd}</td>
                <td className="text-right font-black">{fmtR(data.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  const RelatorioFornecedores = () => {
    const emitentes: Record<string, { nome: string; qtd: number; valor: number }> = {}
    nfes.forEach((n: any) => {
      const cnpj = n.cnpj_emitente || 'N/A'
      if (!emitentes[cnpj]) emitentes[cnpj] = { nome: n.nome_emitente, qtd: 0, valor: 0 }
      emitentes[cnpj].qtd++
      emitentes[cnpj].valor += Number(n.valor_total || 0)
    })
    const lista = Object.entries(emitentes).sort((a, b) => b[1].valor - a[1].valor)

    return (
      <>
        <table style={{ marginTop: '20px' }}>
          <thead><tr><th>Fornecedor (Razão Social)</th><th>CNPJ</th><th className="text-center">Qtd. Notas</th><th className="text-right">Valor Total</th></tr></thead>
          <tbody>
            {lista.map(([cnpj, data]) => (
              <tr key={cnpj}>
                <td className="font-bold">{data.nome}</td>
                <td>{cnpj}</td>
                <td className="text-center">{data.qtd}</td>
                <td className="text-right font-black">{fmtR(data.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  const RelatorioPrestadores = () => {
    const prestadores: Record<string, { nome: string; qtd: number; valor_bruto: number; valor_liquido: number }> = {}
    nfses.forEach((n: any) => {
      const cnpj = n.prestador?.cpf_cnpj || n.prestador?.cnpj || 'N/A'
      const nome = n.prestador?.nome || n.prestador?.razao_social || 'N/A'
      if (!prestadores[cnpj]) prestadores[cnpj] = { nome, qtd: 0, valor_bruto: 0, valor_liquido: 0 }
      prestadores[cnpj].qtd++
      prestadores[cnpj].valor_bruto += Number(n.valor_bruto || 0)
      prestadores[cnpj].valor_liquido += Number(n.valor_liquido || 0)
    })
    const lista = Object.entries(prestadores).sort((a, b) => b[1].valor_bruto - a[1].valor_bruto)

    return (
      <>
        <table style={{ marginTop: '20px' }}>
          <thead><tr><th>Prestador de Serviços</th><th>CPF/CNPJ</th><th className="text-center">Qtd. Notas</th><th className="text-right">Total Bruto</th><th className="text-right">Total Líquido</th></tr></thead>
          <tbody>
            {lista.map(([cnpj, data]) => (
              <tr key={cnpj}>
                <td className="font-bold">{data.nome}</td>
                <td>{cnpj}</td>
                <td className="text-center">{data.qtd}</td>
                <td className="text-right">{fmtR(data.valor_bruto)}</td>
                <td className="text-right font-black">{fmtR(data.valor_liquido)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  const RelatorioEstoque = () => {
    const totalItens = produtos.length
    const valorEstoque = produtos.reduce((acc: number, p: any) => acc + (Number(p.quantidade_atual) * Number(p.valor_unitario)), 0)

    return (
      <>
        <div className="summary-box">
          <div className="summary-item"><span className="summary-label">Itens no Estoque</span><span className="summary-value">{totalItens}</span></div>
          <div className="summary-item"><span className="summary-label">Valor Financeiro de Estoque</span><span className="summary-value">{fmtR(valorEstoque)}</span></div>
        </div>
        
        <table style={{ marginTop: '20px' }}>
          <thead><tr><th>Código</th><th>Descrição / Produto</th><th>Unidade</th><th className="text-right">Custo Un.</th><th className="text-right">Qtd Atual</th><th className="text-right">Valor Total</th></tr></thead>
          <tbody>
            {produtos.map((p: any) => (
              <tr key={p.id}>
                <td style={{ fontSize: '9px' }}>{p.codigo}</td>
                <td className="font-bold">{p.descricao}</td>
                <td className="text-center">{p.unidade}</td>
                <td className="text-right">{fmtR(p.valor_unitario)}</td>
                <td className="text-right font-black">{Number(p.quantidade_atual).toLocaleString('pt-BR')}</td>
                <td className="text-right font-bold text-emerald-600">{fmtR(p.quantidade_atual * p.valor_unitario)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  // --- INTERFACE DO PAINEL ---

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const anoAtual = new Date().getFullYear()
  const periodosOpcoes = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = d.toISOString().slice(0, 7) // 'YYYY-MM'
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value: val, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })

  // Usamos o período da NFe como base de exibição
  const currentPeriod = nfeHook.filterPeriodo || 'all'

  const handlePeriodoChange = (val: string) => {
    nfeHook.setFilterPeriodo(val === 'all' ? '' : val)
    nfseHook.setPeriodo(val)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Barra de Filtros */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Filtro de Período</h3>
            <p className="text-[10px] font-bold text-slate-400">Define o mês para todos os relatórios fiscais</p>
          </div>
        </div>
        
        <select 
          value={currentPeriod} 
          onChange={(e) => handlePeriodoChange(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-black text-slate-700 outline-none hover:bg-slate-100 transition-all cursor-pointer min-w-[200px]"
        >
          <option value="all">Visão Geral (Todos os Períodos)</option>
          {periodosOpcoes.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[
          { id: 'rep-pendencias', title: 'Auditoria de Pendências', desc: 'Relação de NF-e e NFS-e aguardando classificação fiscal', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
          { id: 'rep-escrituradas', title: 'Notas Escrituradas', desc: 'Resumo completo das notas processadas no período', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { id: 'rep-cfop', title: 'Operações por CFOP', desc: 'Análise de valores agrupados por Código Fiscal', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
          { id: 'rep-destinacao', title: 'Notas por Destinação', desc: 'Valores divididos por Uso/Consumo, Imobilizado, etc', icon: Map, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { id: 'rep-fornecedores', title: 'Resumo de Fornecedores', desc: 'Compras (NF-e) agrupadas por CNPJ do Emitente', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50' },
          { id: 'rep-prestadores', title: 'Resumo de Prestadores', desc: 'Serviços Tomados (NFS-e) agrupados por Prestador', icon: Users, color: 'text-rose-500', bg: 'bg-rose-50' },
          { id: 'rep-estoque', title: 'Inventário de Estoque', desc: 'Posição física e financeira do almoxarifado/consumo', icon: Package, color: 'text-teal-500', bg: 'bg-teal-50' },
        ].map((rel, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group flex flex-col justify-between">
            <div>
              <div className={`w-10 h-10 rounded-xl ${rel.bg} flex items-center justify-center ${rel.color} transition-all mb-4`}>
                <rel.icon size={20} />
              </div>
              <h4 className="text-sm font-black text-slate-800 mb-1">{rel.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium mb-6">{rel.desc}</p>
            </div>
            
            <button 
              onClick={() => handleImprimir(rel.id, rel.title)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Printer size={12} />
              Emitir Relatório
            </button>
          </div>
        ))}
      </div>

      {/* Áreas invisíveis onde os relatórios são montados na DOM */}
      <div className="hidden pointer-events-none opacity-0 overflow-hidden h-0">
        <div id="rep-pendencias"><RelatorioPendencias /></div>
        <div id="rep-escrituradas"><RelatorioEscrituradas /></div>
        <div id="rep-cfop"><RelatorioCFOP /></div>
        <div id="rep-destinacao"><RelatorioDestinacao /></div>
        <div id="rep-fornecedores"><RelatorioFornecedores /></div>
        <div id="rep-prestadores"><RelatorioPrestadores /></div>
        <div id="rep-estoque"><RelatorioEstoque /></div>
      </div>

      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
        <span className="text-xl">📄</span>
        <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
          Esta central consolida os dados operacionais em documentos oficiais prontos para arquivamento e impressão. 
          Os relatórios refletem exatamente os dados que estão carregados na tela. Se precisar de meses anteriores, altere os filtros na aba "Períodos" ou "Dashboard".
        </p>
      </div>
    </div>
  )
}
