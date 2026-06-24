'use client'
import { useState, useMemo } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Trash2, 
  Briefcase,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Calendar,
  Printer,
  FileText,
  ChevronDown
} from 'lucide-react'
import { useDiretoria, Diretor } from '@/lib/hooks/useDiretoria'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import CrudModal from '@/components/ui/CrudModal'
import KpiCard from '@/components/ui/KpiCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'

export default function DiretoriaTab() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dataPagamentoGeral, setDataPagamentoGeral] = useState(new Date().toISOString().split('T')[0])
  const [competenciaMes, setCompetenciaMes] = useState(new Date().getMonth())
  const [competenciaAno, setCompetenciaAno] = useState(new Date().getFullYear())
  const { diretoria, loading, inserir, atualizar, remover } = useDiretoria()
  const { lancamentos, inserirBulk } = useFinanceiro()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ledgerMember, setLedgerMember] = useState<Diretor | null>(null)
  const [periodosMember, setPeriodosMember] = useState<Diretor | null>(null)
  const [tempPeriodos, setTempPeriodos] = useState<any[]>([])
  const [editingItem, setEditingItem] = useState<Diretor | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [showReportMenu, setShowReportMenu] = useState(false)
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all')

  const handleImprimirRelatorio = (tipo: string) => {
    let titulo = ""
    let html = ""

    const fmtDataB = (d: string) => {
      try {
        return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
      } catch {
        return d
      }
    }

    if (tipo === 'ativa') {
      titulo = "Relatório da Diretoria Ativa"
      const ativos = diretoria.filter(d => d.status === 'ativo' && (selectedMemberFilter === 'all' || d.id === selectedMemberFilter))
      html = `
        <table>
          <thead>
            <tr>
              <th width="200">Nome</th>
              <th>Cargo</th>
              <th width="100">CPF</th>
              <th width="150">E-mail</th>
              <th width="100">Telefone</th>
            </tr>
          </thead>
          <tbody>
            ${ativos.map(d => `
              <tr>
                <td class="font-bold">${d.nome}</td>
                <td>${d.cargo}</td>
                <td>${d.cpf || '-'}</td>
                <td>${d.email || '-'}</td>
                <td>${d.telefone || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    } else if (tipo === 'pro_labore') {
      titulo = "Relatório de Pró-labores"
      const filtered = diretoria.filter(d => selectedMemberFilter === 'all' || d.id === selectedMemberFilter)
      html = `
        <table>
          <thead>
            <tr>
              <th>Membro</th>
              <th>Cargo</th>
              <th>Status</th>
              <th class="text-right">Pró-labore Base</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(d => `
              <tr>
                <td class="font-bold">${d.nome}</td>
                <td>${d.cargo}</td>
                <td>${d.status.toUpperCase()}</td>
                <td class="text-right">${fmtR(d.pro_labore_base || 0)}</td>
              </tr>
            `).join('')}
            <tr class="font-black bg-slate-50">
              <td colspan="3">TOTAL MENSAL ESTIMADO</td>
              <td class="text-right">${fmtR(filtered.filter(d => d.status === 'ativo').reduce((s, d) => s + (d.pro_labore_base || 0), 0))}</td>
            </tr>
          </tbody>
        </table>
      `
    } else if (tipo === 'status') {
      titulo = "Relatório de Diretoria por Status"
      const filtered = diretoria.filter(d => selectedMemberFilter === 'all' || d.id === selectedMemberFilter)
      html = `
        <table>
          <thead>
            <tr>
              <th width="100">Status</th>
              <th>Nome</th>
              <th>Cargo</th>
              <th width="120">CPF</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.sort((a,b) => a.status.localeCompare(b.status)).map(d => `
              <tr>
                <td><span class="font-black ${d.status === 'ativo' ? 'text-emerald-600' : 'text-slate-400'}">${d.status.toUpperCase()}</span></td>
                <td class="font-bold">${d.nome}</td>
                <td>${d.cargo}</td>
                <td>${d.cpf || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    } else if (tipo === 'historico_membro') {
       titulo = "Transações Detalhadas por Membro"
       const filtered = diretoria.filter(d => selectedMemberFilter === 'all' || d.id === selectedMemberFilter)
       html = filtered.map(d => {
         const myDocs = lancamentos.filter(l => l.diretor_id === d.id && l.status === 'pago')
         if (myDocs.length === 0) return ''
         
         return `
           <div style="margin-bottom: 40px; page-break-inside: avoid;">
             <h3 style="font-size: 14px; margin-bottom: 10px; color: #4f46e5; border-left: 4px solid #4f46e5; padding-left: 10px;">${d.nome} (${d.cargo})</h3>
             <table>
               <thead>
                 <tr>
                   <th width="80">Data</th>
                   <th>Descrição</th>
                   <th width="120">Categoria</th>
                   <th width="100" class="text-right">Valor</th>
                 </tr>
               </thead>
               <tbody>
                 ${myDocs.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(l => `
                   <tr>
                     <td>${fmtDataB(l.data)}</td>
                     <td>${l.descricao}</td>
                     <td>${l.categoria}</td>
                     <td class="text-right font-black ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}">${l.tipo === 'receita' ? '+' : '-'}${fmtR(l.valor)}</td>
                   </tr>
                 `).join('')}
                 <tr class="font-black bg-slate-50">
                    <td colspan="3">SALDO LÍQUIDO NO PERÍODO</td>
                    <td class="text-right">${fmtR(myDocs.reduce((s, l) => s + (l.tipo === 'receita' ? l.valor : -l.valor), 0))}</td>
                 </tr>
               </tbody>
             </table>
           </div>
         `
       }).join('') || '<p class="text-center">Nenhuma movimentação encontrada para os membros da diretoria.</p>'
    } else if (tipo === 'historico') {
       titulo = "Histórico de Transações da Diretoria"
       const myDocs = lancamentos.filter(l => l.diretor_id && l.status === 'pago' && (selectedMemberFilter === 'all' || l.diretor_id === selectedMemberFilter))
       html = `
        <table>
          <thead>
            <tr>
              <th width="80">Data</th>
              <th width="150">Diretor</th>
              <th>Descrição</th>
              <th width="120">Categoria</th>
              <th width="100" class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${myDocs.length === 0 ? `<tr><td colspan="5" class="text-center">Nenhuma transação encontrada.</td></tr>` : 
              myDocs.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(l => {
              const diretor = diretoria.find(d => d.id === l.diretor_id)
              return `
                <tr>
                  <td>${fmtDataB(l.data)}</td>
                  <td class="font-bold">${diretor?.nome || 'Não identificado'}</td>
                  <td>${l.descricao}</td>
                  <td>${l.categoria}</td>
                  <td class="text-right font-black ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}">${l.tipo === 'receita' ? '+' : '-'}${fmtR(l.valor)}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
       `
    }

    const janela = window.open('', '_blank')
    janela?.document.write(`
      <html>
        <head>
          <title>${titulo} — ACPROBEC</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f8fafc; color: #64748b; text-transform: uppercase; padding: 12px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 9px; font-weight: 900; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-align: left; vertical-align: middle; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: 700; }
            .text-emerald-600 { color: #059669; }
            .text-rose-600 { color: #e11d48; }
            .bg-slate-50 { background-color: #f8fafc; }
            .footer { margin-top: 40px; text-align: right; font-size: 8px; color: #94a3b8; }
            @media print { @page { size: A4 portrait; margin: 1.5cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACPROBEC — ${titulo.toUpperCase()}</h1>
            <p>GESTÃO DE ENTIDADES | DIRETORIA E CONSELHO</p>
          </div>
          ${html}
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | ÁUREA Tech ACPROBEC</div>
        </body>
      </html>
    `)
    janela?.document.close()
    setTimeout(() => {
      janela?.print()
      janela?.close()
    }, 800)
  }
  
  const handleLancarProvisionados = async () => {
    const targets = diretoria.filter(d => selectedIds.includes(d.id) && d.status === 'ativo')
    if (targets.length === 0) return alert('Selecione ao menos um diretor ativo.')
    
    if (!confirm(`Lançar pró-labores provisionados para ${targets.length} diretores na competência ${MESES[competenciaMes]}/${competenciaAno}?`)) return

    const newEntries: any[] = []
    
    targets.forEach(d => {
      const bruto = d.pro_labore_base || 0
      const inss = bruto * 0.11
      const liquido = bruto - inss
      
      // 1. Honorários Líquidos
      newEntries.push({
        tipo: 'despesa',
        categoria: 'HONORÁRIOS DIRETORIA',
        descricao: `HONORÁRIOS DIRETORIA - ${d.nome.toUpperCase()} - (LÍQUIDO)`,
        valor: liquido,
        data: dataPagamentoGeral,
        status: 'aberto',
        competencia_mes: competenciaMes,
        competencia_ano: competenciaAno,
        diretor_id: d.id,
        conta_origem_id: 'default' // O sistema deve tratar ou o usuário ajustar depois
      })
      
      // 2. INSS (11%)
      newEntries.push({
        tipo: 'despesa',
        categoria: 'INSS',
        descricao: `INSS SOBRE HONORÁRIOS DIRETORIA - ${d.nome.toUpperCase()} - 11% (Ref. ${fmtR(bruto)})`,
        valor: inss,
        data: dataPagamentoGeral,
        status: 'aberto',
        competencia_mes: competenciaMes,
        competencia_ano: competenciaAno,
        diretor_id: d.id,
        conta_origem_id: 'default'
      })
    })

    const res = await inserirBulk(newEntries)
    if (res.error) {
      alert(`Erro ao lançar: ${typeof res.error === 'object' ? (res.error as any).message : String(res.error)}`)
    } else {
      alert('Pró-labores provisionados com sucesso no financeiro!')
      setSelectedIds([])
    }
  }

  const handleSalvar = async (data: any) => {
    try {
      const res = editingItem 
        ? await atualizar(editingItem.id, data)
        : await inserir({ ...data, status: 'ativo' })

      if (res?.error) {
        alert(`Erro ao salvar: ${typeof res.error === 'object' ? (res.error as any).message : String(res.error)}`)
      } else {
        setIsModalOpen(false)
        setEditingItem(null)
      }
    } catch (err: any) {
      alert(`Erro inesperado: ${err.message}`)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente remover este membro da diretoria?')) return
    const res = await remover(id)
    if (res?.error) alert(`Erro ao excluir: ${(res.error as any).message}`)
  }

  const filtrados = useMemo(() => {
    let list = diretoria
    if (selectedMemberFilter !== 'all') {
      list = list.filter(d => d.id === selectedMemberFilter)
    }
    if (!searchQ) return list
    const q = searchQ.toLowerCase()
    return list.filter(d => 
      d.nome.toLowerCase().includes(q) || 
      d.cargo.toLowerCase().includes(q) ||
      (d.cpf && d.cpf.includes(q))
    )
  }, [diretoria, searchQ, selectedMemberFilter])

  const totalAtivos = diretoria.filter(d => d.status === 'ativo' && (selectedMemberFilter === 'all' || d.id === selectedMemberFilter)).length
  const totalCusto = diretoria.filter(d => d.status === 'ativo' && (selectedMemberFilter === 'all' || d.id === selectedMemberFilter)).reduce((s, d) => s + (d.pro_labore_base || 0), 0)

  const columns = [
    {
      key: 'membro',
      header: 'Membro / Cargo',
      render: (i: Diretor) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            {i.nome.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">{i.nome}</span>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{i.cargo}</span>
          </div>
        </div>
      )
    },
    {
      key: 'identificacao',
      header: 'Identificação',
      render: (i: Diretor) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-600">{i.cpf || '---'}</span>
          <span className="text-[10px] text-slate-400">CPF/CNPJ</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (i: Diretor) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          i.status === 'ativo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'
        }`}>
          {i.status}
        </span>
      )
    },
    {
      key: 'pro_labore',
      header: 'Bruto',
      render: (i: Diretor) => (
        <span className="text-xs font-black text-slate-700">{fmtR(i.pro_labore_base || 0)}</span>
      )
    },
    {
      key: 'inss',
      header: 'INSS (11%)',
      render: (i: Diretor) => (
        <span className="text-xs font-bold text-rose-500">{fmtR((i.pro_labore_base || 0) * 0.11)}</span>
      )
    },
    {
      key: 'liquido',
      header: 'Líquido',
      render: (i: Diretor) => (
        <span className="text-xs font-black text-emerald-600">{fmtR((i.pro_labore_base || 0) * 0.89)}</span>
      )
    },
    {
      key: 'data_pagamento',
      header: 'Pagamento',
      render: (i: Diretor) => (
        <span className="text-[10px] font-bold text-slate-400">{fmtData(dataPagamentoGeral)}</span>
      )
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (i: Diretor) => (
        <div className="flex items-center gap-2">
          {i.email && <Mail size={14} className="text-slate-300" />}
          {i.telefone && <Phone size={14} className="text-slate-300" />}
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (i: Diretor) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
           <button onClick={() => { setPeriodosMember(i); setTempPeriodos(i.periodos || []) }} className="p-2 text-emerald-400 hover:bg-emerald-50 rounded-lg transition-colors" title="Gerenciar Períodos de Pró-labore (De / A)">
            <Calendar size={14} />
          </button>
          <button onClick={() => setLedgerMember(i)} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors" title="Extrato de Conta Corrente (Retiradas / Reembolsos)">
            <ReceiptText size={14} />
          </button>
          <button onClick={() => { setEditingItem(i); setIsModalOpen(true) }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          </button>
          <button onClick={() => handleExcluir(i.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors" title="Remover">
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={20} /> Gestão da Diretoria
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">Configure os membros oficiais e seus respectivos pró-labores para simulações e termos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowReportMenu(!showReportMenu)}
              className="bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-indigo-100 transition-all border border-indigo-100 flex items-center gap-2"
            >
              <Printer size={16} /> Relatórios <ChevronDown size={14} className={`transition-transform ${showReportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showReportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowReportMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 pb-2 mb-2 border-b border-slate-50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opções de Emissão</span>
                  </div>
                  <button onClick={() => { handleImprimirRelatorio('ativa'); setShowReportMenu(false) }} className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                    <Users size={14} className="text-indigo-400" /> Diretoria Ativa
                  </button>
                  <button onClick={() => { handleImprimirRelatorio('pro_labore'); setShowReportMenu(false) }} className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                    <Briefcase size={14} className="text-indigo-400" /> Pró-labores (Membro/Geral)
                  </button>
                  <button onClick={() => { handleImprimirRelatorio('status'); setShowReportMenu(false) }} className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                    <ShieldCheck size={14} className="text-indigo-400" /> Membros por Status
                  </button>
                  <div className="mx-2 my-2 border-t border-slate-50"></div>
                  <button onClick={() => { handleImprimirRelatorio('historico'); setShowReportMenu(false) }} className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                    <ArrowRightLeft size={14} className="text-indigo-400" /> Histórico Geral
                  </button>
                  <button onClick={() => { handleImprimirRelatorio('historico_membro'); setShowReportMenu(false) }} className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                    <ArrowRightLeft size={14} className="text-indigo-400" /> Transações por Membro
                  </button>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} /> Novo Membro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Membros Ativos" value={totalAtivos} icon={<Users size={20} />} category="info" trendLabel="Diretores oficiais" />
        <KpiCard title="Custo Pró-labore" value={fmtR(totalCusto)} icon={<Briefcase size={20} />} category="info" trendLabel="Total mensal base" />
        <KpiCard title="Status do Conselho" value="Regular" icon={<ShieldCheck size={20} />} category="success" trendLabel="Diretoria vigente" />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-3 rounded-2xl mb-6 border border-slate-100">
          <div className="flex-1 flex items-center gap-3 w-full">
            <Search size={18} className="text-slate-400 ml-2" />
            <input 
              type="text" 
              placeholder="Buscar por nome, cargo ou CPF..." 
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-600 w-full placeholder:text-slate-400"
            />
          </div>
          <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
          <div className="w-full md:w-64">
            <select 
              value={selectedMemberFilter}
              onChange={e => setSelectedMemberFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Filtrar por Membro: Todos</option>
              {diretoria.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Competência</span>
                <div className="flex gap-1">
                  <select value={competenciaMes} onChange={e => setCompetenciaMes(Number(e.target.value))} className="bg-white border border-indigo-100 rounded-lg px-2 py-1 text-[10px] font-bold outline-none">{MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                  <select value={competenciaAno} onChange={e => setCompetenciaAno(Number(e.target.value))} className="bg-white border border-indigo-100 rounded-lg px-2 py-1 text-[10px] font-bold outline-none">{[2024,2025,2026,2027].map(a => <option key={a} value={a}>{a}</option>)}</select>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Data de Pagamento</span>
                <input type="date" value={dataPagamentoGeral} onChange={e => setDataPagamentoGeral(e.target.value)} className="bg-white border border-indigo-100 rounded-lg px-2 py-1 text-[10px] font-bold outline-none" />
              </div>
            </div>
            
            <button 
              onClick={handleLancarProvisionados}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
            >
              <ReceiptText size={14} /> Lançar Pró-labores ({selectedIds.length})
            </button>
          </div>
        )}

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <DataTable 
            columns={columns} 
            data={filtrados} 
            loading={loading} 
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
          />
        </div>
      </div>

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Diretor' : 'Novo Membro da Diretoria'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'nome', label: 'Nome Completo', type: 'text', required: true },
          { name: 'cargo', label: 'Cargo Oficial', type: 'text', required: true, placeholder: 'Ex: Presidente, Diretor Financeiro...' },
          { name: 'cpf', label: 'CPF', type: 'text' },
          { name: 'pro_labore_base', label: 'Pró-labore Base (R$)', type: 'number' },
          { name: 'email', label: 'E-mail', type: 'text' },
          { name: 'telefone', label: 'Telefone/WhatsApp', type: 'text' },
          { name: 'endereco', label: 'Endereço Residencial', type: 'text' },
          { name: 'chave_pix', label: 'Chave PIX', type: 'text' },
          { name: 'banco_info', label: 'Dados Bancários (Banco/Ag/Conta)', type: 'text' },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'ativo', label: 'Ativo' },
            { value: 'inativo', label: 'Inativo' },
          ]},
        ]}
      />

      {periodosMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Calendar className="text-emerald-500" /> Períodos de Pró-labore</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{periodosMember.nome}</p>
              </div>
              <button onClick={() => setPeriodosMember(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">✕</button>
            </div>

            <div className="p-6 bg-slate-50/50 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {tempPeriodos.map((p, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                       <span className="text-[10px] font-bold text-slate-300">R$</span>
                       <input 
                         type="number" 
                         value={p.valor} 
                         onChange={e => {
                           const newP = [...tempPeriodos]
                           newP[idx].valor = Number(e.target.value)
                           setTempPeriodos(newP)
                         }}
                         className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-700"
                       />
                       <button onClick={() => setTempPeriodos(tempPeriodos.filter((_, i) => i !== idx))} className="text-rose-300 hover:text-rose-500"><Trash2 size={14}/></button>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="flex-1 flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Início</span>
                          <div className="flex gap-1">
                            <select value={p.mes_inicio} onChange={e => { const newP = [...tempPeriodos]; newP[idx].mes_inicio = Number(e.target.value); setTempPeriodos(newP) }} className="text-[10px] font-bold p-1 bg-slate-50 rounded border-none outline-none">{MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                            <select value={p.ano_inicio} onChange={e => { const newP = [...tempPeriodos]; newP[idx].ano_inicio = Number(e.target.value); setTempPeriodos(newP) }} className="text-[10px] font-bold p-1 bg-slate-50 rounded border-none outline-none font-bold text-slate-700">{[2024,2025,2026,2027].map(a => <option key={a} value={a}>{a}</option>)}</select>
                          </div>
                       </div>
                       <ArrowRightLeft size={12} className="text-slate-200 mt-4" />
                       <div className="flex-1 flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fim (Opcional)</span>
                          <div className="flex gap-1">
                            <select value={p.mes_fim ?? ''} onChange={e => { const newP = [...tempPeriodos]; newP[idx].mes_fim = e.target.value === '' ? undefined : Number(e.target.value); setTempPeriodos(newP) }} className="text-[10px] font-bold p-1 bg-slate-50 rounded border-none outline-none"><option value="">∞</option>{MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                            <select value={p.ano_fim ?? ''} onChange={e => { const newP = [...tempPeriodos]; newP[idx].ano_fim = e.target.value === '' ? undefined : Number(e.target.value); setTempPeriodos(newP) }} className="text-[10px] font-bold p-1 bg-slate-50 rounded border-none outline-none font-bold text-slate-700"><option value="">∞</option>{[2024,2025,2026,2027].map(a => <option key={a} value={a}>{a}</option>)}</select>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setTempPeriodos([...tempPeriodos, { valor: 0, mes_inicio: 0, ano_inicio: 2024 }])}
                  className="w-full py-3 bg-white border border-dashed border-slate-300 rounded-2xl text-[10px] font-bold text-slate-400 hover:bg-slate-50 transition-colors uppercase tracking-widest"
                >
                  + Adicionar Período
                </button>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
               <button onClick={() => setPeriodosMember(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors">Cancelar</button>
               <button 
                 onClick={async () => {
                   const res = await atualizar(periodosMember.id, { periodos: tempPeriodos })
                   if (!res?.error) setPeriodosMember(null)
                   else alert('Erro ao salvar períodos')
                 }}
                 className="flex-[2] py-3 bg-emerald-500 text-white font-black rounded-2xl text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
               >
                 Salvar Alterações
               </button>
            </div>
          </div>
        </div>
      )}

      {ledgerMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><ArrowRightLeft className="text-indigo-600" /> Extrato Financeiro</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{ledgerMember.nome} ({ledgerMember.cargo})</p>
              </div>
              <button onClick={() => setLedgerMember(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
              {(() => {
                const myDocs = lancamentos.filter(l => l.diretor_id === ledgerMember.id && l.status === 'pago')
                
                // Filtro para ignorar salários e impostos da conta corrente (devendo)
                const isDebt = (l: any) => {
                  if (l.tipo !== 'despesa') return false;
                  const cat = (l.categoria || '').toUpperCase();
                  if (cat.includes('PRÓ-LABORE') || cat.includes('PRO-LABORE') || cat.includes('HONORÁRIOS') || cat.includes('INSS') || cat.includes('SALÁRIO') || cat.includes('IMPOSTO')) return false;
                  return true;
                }

                const entradas = myDocs.filter(l => l.tipo === 'receita').reduce((s, a) => s + a.valor, 0)
                const retiradas = myDocs.filter(l => isDebt(l)).reduce((s, a) => s + a.valor, 0)
                const isWarning = retiradas > entradas

                return (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-3xl border border-emerald-100 text-center shadow-sm">
                        <TrendingUp size={20} className="text-emerald-500 mx-auto mb-2" />
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reembolsou</span>
                        <span className="text-sm font-black text-emerald-600">{fmtR(entradas)}</span>
                      </div>
                      <div className="bg-white p-4 rounded-3xl border border-rose-100 text-center shadow-sm">
                        <TrendingDown size={20} className="text-rose-500 mx-auto mb-2" />
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Retirou / Sacou</span>
                        <span className="text-sm font-black text-rose-600">{fmtR(retiradas)}</span>
                      </div>
                      <div className={`bg-white p-4 col-span-2 md:col-span-1 rounded-3xl border text-center shadow-sm ${isWarning ? 'border-orange-200' : 'border-indigo-100'}`}>
                        <Briefcase size={20} className={`${isWarning ? 'text-orange-500' : 'text-indigo-500'} mx-auto mb-2`} />
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo (Devendo)</span>
                        <span className={`text-sm font-black ${isWarning ? 'text-orange-600' : 'text-indigo-600'}`}>{fmtR(Math.abs(entradas - retiradas))}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                      <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-500 uppercase tracking-widest">Histórico de Transações</div>
                      <ul className="divide-y divide-gray-50">
                        {myDocs.length === 0 ? (
                           <li className="p-8 text-center text-gray-400 font-medium text-xs">Nenhuma movimentação associada a este diretor foi encontrada no financeiro.</li>
                        ) : myDocs.map(l => (
                          <li key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                              <div className="text-xs font-bold text-gray-900">{l.descricao}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{fmtData(l.data)} • {l.categoria}</div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className={`text-xs font-black p-2 rounded-xl border ${l.tipo === 'receita' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {l.tipo === 'receita' ? '+' : '-'}{fmtR(l.valor)}
                              </div>
                              {l.tipo === 'despesa' && !isDebt(l) && (
                                <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Não afeta saldo</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-[32px]">
               <p className="text-[10px] text-center text-gray-400 font-medium tracking-wide">Lançamentos em aberto (pendentes) não entram no cálculo do saldo, apenas liquidados.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
