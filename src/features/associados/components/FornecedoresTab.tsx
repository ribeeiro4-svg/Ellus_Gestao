'use client'
import React, { useMemo, useState, useEffect } from 'react'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import { Plus, Mail, Phone, Trash2, Search, HardDrive, ShoppingCart, Link, CheckCircle2, Loader2, Activity } from 'lucide-react'
import { usePlanoContas } from '@/features/contabil/hooks/usePlanoContas'
import { fmtR } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'

export default function FornecedoresTab() {
  const { fornecedores, loading, inserir, atualizar, excluir } = useFornecedores()
  const tenantId = useTenantId()
  const planoHook = usePlanoContas()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQ, setSearchQ] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('todas')
  const [accountsWithEntries, setAccountsWithEntries] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [batchProcessing, setBatchProcessing] = useState(false)

  // Carregar contas que possuem movimentação contábil
  useEffect(() => {
    async function checkEntries() {
      if (!tenantId) return
      try {
        const sb = createClient()
        // Busca a partir da tabela de lançamentos onde o tenant_id é garantido
        const { data, error } = await sb.from('lancamentos_contabeis')
          .select('lancamentos_partidas(conta:conta_id(codigo))')
          .eq('tenant_id', tenantId)
          .limit(3000)
        
        if (error) {
          console.error('Erro ao buscar movimentação:', error)
          return
        }

        if (data) {
          const codes = new Set<string>()
          data.forEach((l: any) => {
            if (l.lancamentos_partidas) {
              l.lancamentos_partidas.forEach((p: any) => {
                if (p.conta?.codigo) codes.add(p.conta.codigo)
              })
            }
          })
          setAccountsWithEntries(codes)
        }
      } catch (err) {
        console.error('Falha na verificação de lançamentos:', err)
      }
    }
    checkEntries()
  }, [tenantId])

  const categorias = useMemo(() => {
    return [...new Set(fornecedores.map(f => f.categoria_padrao || 'GERAL'))].sort()
  }, [fornecedores])

  const filtrados = useMemo(() => {
    let res = fornecedores
    
    if (searchQ) {
      const q = searchQ.toLowerCase()
      res = res.filter(f => 
        f.nome.toLowerCase().includes(q) || 
        (f.cpf_cnpj && f.cpf_cnpj.includes(q)) ||
        (f.email && f.email.toLowerCase().includes(q))
      )
    }

    if (filterCategory !== 'todas') {
      res = res.filter(f => (f.categoria_padrao || 'GERAL') === filterCategory)
    }

    return res
  }, [fornecedores, searchQ, filterCategory])

  const handleSalvar = async (data: any) => {
    try {
      const res = editingItem 
        ? await atualizar(editingItem.id, data)
        : await inserir({ ...data, status: 'ativo' })

      if (res?.error) {
        const errorMsg = typeof res.error === 'object' ? (res.error as any).message : String(res.error)
        alert(`Erro ao salvar: ${errorMsg}`)
      } else {
        setIsModalOpen(false)
        setEditingItem(null)
      }
    } catch (err: any) {
      alert(`Erro inesperado: ${err.message}`)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return
    const res = await excluir(id)
    if (res?.error) {
      alert(`Erro ao excluir: ${(res.error as any).message}`)
    }
  }

  const handleGerarConta = async (fornecedor: any) => {
    if (fornecedor.id === 'generating') return
    setGeneratingId(fornecedor.id)
    
    try {
      const sb = createClient()
      const parentCodigo = '2.1.2'
      
      // 1. Garantir conta pai (2.1.2)
      let { data: pai } = await sb.from('plano_contas').select('*').eq('tenant_id', tenantId).eq('codigo', parentCodigo).maybeSingle()
      
      if (!pai) {
        const { data: novaPai, error: errPai } = await sb.from('plano_contas').insert({
          tenant_id: tenantId, codigo: parentCodigo, descricao: 'FORNECEDORES',
          nivel: 3, tipo: 'sintetica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: false, ativa: true
        }).select().single()
        if (errPai) throw new Error(`Erro ao criar conta pai: ${errPai.message}`)
        pai = novaPai
      } else if (pai.tipo === 'analitica') {
        const { error: errUp } = await sb.from('plano_contas').update({ tipo: 'sintetica', aceita_lancamentos: false }).eq('id', pai.id)
        if (errUp) throw new Error(`Erro ao converter conta pai: ${errUp.message}`)
      }

      // 2. Achar o próximo código disponível (Busca por "buracos" para evitar erro de duplicidade)
      const { data: todas } = await sb.from('plano_contas')
        .select('codigo')
        .eq('tenant_id', tenantId)
        .like('codigo', `${parentCodigo}.%`)

      const codigosExistentes = new Set(todas?.map(c => c.codigo) || [])
      let nextSeq = 1
      let novoCodigo = ''
      
      while (true) {
        const candidate = `${parentCodigo}.${String(nextSeq).padStart(3, '0')}`
        // Checa tanto o formato com zero (001) quanto o sem zero (1) para segurança total
        const candidateAlt = `${parentCodigo}.${nextSeq}`
        
        if (!codigosExistentes.has(candidate) && !codigosExistentes.has(candidateAlt)) {
          novoCodigo = candidate
          break
        }
        nextSeq++
        if (nextSeq > 999) throw new Error('Limite de subcontas atingido (999).')
      }

      // 3. Criar a conta do fornecedor
      const { data: novaConta, error: createError } = await sb.from('plano_contas').insert({
        tenant_id: tenantId,
        codigo: novoCodigo,
        descricao: `FORNECEDOR: ${fornecedor.nome.toUpperCase()}`,
        nivel: 4,
        tipo: 'analitica',
        natureza: 'credora',
        classificacao: 'passivo',
        aceita_lancamentos: true,
        ativa: true,
        conta_pai_id: pai?.id
      }).select().single()

      if (createError) throw new Error(createError.message)

      // 4. Vincular ao fornecedor
      if (novaConta) {
        const { error: updateErr } = await atualizar(fornecedor.id, { conta_contabil_id: novaConta.id })
        if (updateErr) throw new Error(`Erro ao vincular conta: ${typeof updateErr === 'string' ? updateErr : (updateErr as any).message}`)
        
        await planoHook.refresh()
        alert(`Conta ${novoCodigo} gerada e vinculada com sucesso!`)
      }

    } catch (err: any) {
      console.error('Erro detalhado:', err)
      alert(`Erro ao gerar conta: ${err.message}`)
    } finally {
      setGeneratingId(null)
    }
  }

  const handleGerarLote = async () => {
    console.log('Botão Gerar Lote clicado. Selecionados:', selectedIds)
    if (selectedIds.length === 0) {
      alert('Nenhum fornecedor selecionado.')
      return
    }
    
    // Filtra apenas quem REALMENTE precisa de conta (mesma lógica da seleção)
    const alvosReais = selectedIds.filter(id => {
      const f = fornecedores.find(item => item.id === id)
      if (!f) return false
      
      // 1. Checa se tem ID vinculado e se ele é válido
      if (f.conta_contabil_id) {
         const existe = planoHook.contas.some(c => c.id === f.conta_contabil_id)
         if (existe) return false
      }
      
      // 2. Checa se existe conta com a descrição padrão
      const descBuscada = `FORNECEDOR: ${f.nome.toUpperCase()}`
      const descBuscadaLegada = `FORN: ${f.nome.toUpperCase()}`
      const existePorDesc = planoHook.contas.some(c => 
        c.descricao.toUpperCase() === descBuscada || 
        c.descricao.toUpperCase() === descBuscadaLegada
      )
      
      return !existePorDesc
    })

    if (alvosReais.length === 0) {
      alert('Os fornecedores selecionados já possuem contas válidas ou identificadas.')
      setSelectedIds([])
      return
    }

    if (!confirm(`Gerar conta contábil para ${alvosReais.length} fornecedores?`)) return
    
    setBatchProcessing(true)
    let sucessos = 0
    let erros = 0

    try {
      const sb = createClient()
      const parentCodigo = '2.1.2'
      
      // 1. Garantir conta pai
      let { data: pai } = await sb.from('plano_contas').select('*').eq('tenant_id', tenantId).eq('codigo', parentCodigo).maybeSingle()
      if (!pai) {
        const { data: nP } = await sb.from('plano_contas').insert({
          tenant_id: tenantId, codigo: parentCodigo, descricao: 'FORNECEDORES',
          nivel: 3, tipo: 'sintetica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: false, ativa: true
        }).select().single()
        pai = nP
      } else if (pai.tipo === 'analitica') {
        await sb.from('plano_contas').update({ tipo: 'sintetica', aceita_lancamentos: false }).eq('id', pai.id)
      }

      for (const id of alvosReais) {
        const f = fornecedores.find(item => item.id === id)
        if (!f) continue

        try {
          const { data: todas } = await sb.from('plano_contas').select('codigo').eq('tenant_id', tenantId).like('codigo', `${parentCodigo}.%`)
          const codigosExistentes = new Set(todas?.map(c => c.codigo) || [])
          
          let nextSeq = 1
          let novoCodigo = ''
          while (true) {
            const candidate = `${parentCodigo}.${String(nextSeq).padStart(3, '0')}`
            const candidateAlt = `${parentCodigo}.${nextSeq}`
            if (!codigosExistentes.has(candidate) && !codigosExistentes.has(candidateAlt)) {
              novoCodigo = candidate
              break
            }
            nextSeq++
          }

          const { data: nC, error: cErr } = await sb.from('plano_contas').insert({
            tenant_id: tenantId,
            codigo: novoCodigo,
            descricao: `FORNECEDOR: ${f.nome.toUpperCase()}`,
            nivel: 4,
            tipo: 'analitica',
            natureza: 'credora',
            classificacao: 'passivo',
            aceita_lancamentos: true,
            ativa: true,
            conta_pai_id: pai?.id
          }).select().single()

          if (!cErr && nC) {
            await atualizar(f.id, { conta_contabil_id: nC.id })
            sucessos++
          } else {
            erros++
          }
        } catch (e) {
          erros++
        }
      }
      
      await planoHook.refresh()
      setSelectedIds([])
      alert(`Processamento concluído!\nSucessos: ${sucessos}\nFalhas: ${erros}`)
    } finally {
      setBatchProcessing(false)
    }
  }

  const selecionarSemConta = () => {
    console.log('Botão Selecionar Sem Conta clicado')
    const alvos = filtrados.filter(f => {
      // 1. Checa se tem ID vinculado
      if (f.conta_contabil_id) {
         const existe = planoHook.contas.some(c => c.id === f.conta_contabil_id)
         if (existe) return false
      }
      
      // 2. Checa se existe conta com a descrição padrão
      const descBuscada = `FORNECEDOR: ${f.nome.toUpperCase()}`
      const descBuscadaLegada = `FORN: ${f.nome.toUpperCase()}`
      const existePorDesc = planoHook.contas.some(c => 
        c.descricao.toUpperCase() === descBuscada || 
        c.descricao.toUpperCase() === descBuscadaLegada
      )
      
      return !existePorDesc
    }).map(f => f.id)
    
    console.log('Alvos encontrados:', alvos.length)
    if (alvos.length === 0) {
      alert('Todos os fornecedores filtrados já possuem conta contábil (ou vínculo identificado).')
    }
    setSelectedIds(alvos)
  }

  const columns = [
    {
      header: 'Fornecedor / Prestador', key: 'nome',
      render: (i: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold border border-orange-100 shadow-sm">
            {(i.nome || 'F')[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">{i.nome}</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">{i.categoria_padrao || 'GERAL'}</span>
          </div>
        </div>
      )
    },
    { header: 'CPF/CNPJ', key: 'cpf_cnpj', render: (i: any) => <span className="text-xs font-semibold text-slate-500">{i.cpf_cnpj || 'Não informado'}</span> },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="associado" /> },
    {
      header: 'Contato', key: 'id',
      render: (i: any) => (
        <div className="flex items-center gap-2">
          {i.email && (
            <a href={`mailto:${i.email}`} title={i.email} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-600 hover:text-white transition-all">
              <Mail size={14} />
            </a>
          )}
          {i.telefone && (
            <a href={`https://wa.me/${i.telefone.replace(/\D/g, '')}`} target="_blank" title={i.telefone} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all">
              <Phone size={14} />
            </a>
          )}
        </div>
      )
    },
    {
      header: 'Contabilidade', key: 'conta_contabil_id',
      render: (i: any) => {
        // 1. Busca direta pelo ID vinculado
        let conta = planoHook.contas.find(c => c.id === i.conta_contabil_id)
        
        // 2. Busca inteligente pela descrição (caso o ID esteja vazio ou inválido)
        if (!conta) {
          const descBuscada = `FORNECEDOR: ${i.nome.toUpperCase()}`
          const descBuscadaLegada = `FORN: ${i.nome.toUpperCase()}`
          conta = planoHook.contas.find(c => 
            c.descricao.toUpperCase() === descBuscada || 
            c.descricao.toUpperCase() === descBuscadaLegada
          )
        }

        if (conta) {
          return (
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 w-fit" title="Conta já existe no Plano de Contas">
              <CheckCircle2 size={12} />
              <span className="text-[10px] font-bold uppercase">{conta.codigo}</span>
            </div>
          )
        }
        return (
          <button 
            onClick={() => handleGerarConta(i)}
            disabled={generatingId === i.id}
            className="flex items-center gap-1.5 text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 transition-all text-[10px] font-black uppercase disabled:opacity-50"
          >
            {generatingId === i.id ? <Loader2 size={12} className="animate-spin" /> : <Link size={12} />}
            Gerar Conta
          </button>
        )
      }
    },
    {
      header: 'Movimentação', key: 'movimentacao',
      render: (i: any) => {
        let conta = planoHook.contas.find(c => c.id === i.conta_contabil_id)
        if (!conta) {
          const descBuscada = `FORNECEDOR: ${i.nome.toUpperCase()}`
          const descBuscadaLegada = `FORN: ${i.nome.toUpperCase()}`
          conta = planoHook.contas.find(c => 
            c.descricao.toUpperCase() === descBuscada || 
            c.descricao.toUpperCase() === descBuscadaLegada
          )
        }

        const hasEntries = conta && accountsWithEntries.has(conta.codigo)
        
        if (hasEntries) {
          return (
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 w-fit" title="Já possui lançamentos contábeis">
              <Activity size={12} />
              <span className="text-[10px] font-bold uppercase">Com Lançamentos</span>
            </div>
          )
        }
        return (
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-fit" title="Sem movimentação contábil até o momento">
            <span className="text-[10px] font-bold uppercase tracking-tight">Sem Movimento</span>
          </div>
        )
      }
    },
    {
      header: '', key: 'acoes', className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => { setEditingItem(i); setIsModalOpen(true) }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          </button>
          <button onClick={() => handleExcluir(i.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
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
            <ShoppingCart className="text-orange-500" size={20} /> Fornecedores e Prestadores
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">Gerencie quem presta serviços para facilitar a conciliação de saídas.</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-slate-200"
        >
          <Plus size={18} strokeWidth={3} />
          Novo Fornecedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
             <HardDrive size={20} />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-800">{fornecedores.length}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cadastrado</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-800 font-semibold placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none text-slate-600 focus:ring-2 focus:ring-orange-500 transition-all"
        >
          <option value="todas">TODAS CATEGORIAS</option>
          {categorias.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
        </select>
        { (searchQ || filterCategory !== 'todas') && (
          <button onClick={() => { setSearchQ(''); setFilterCategory('todas') }} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">Limpar Filtros</button>
        )}
        
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={selecionarSemConta}
            className="px-3 py-2 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-tight"
          >
            Selecionar s/ Conta
          </button>
          
          {selectedIds.length > 0 && (
            <button 
              onClick={handleGerarLote}
              disabled={batchProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {batchProcessing ? <Loader2 size={14} className="animate-spin" /> : <Link size={14} />}
              Gerar {selectedIds.length} Contas
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filtrados} 
          loading={loading || batchProcessing}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
        />
      </div>

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'nome', label: 'Nome / Razão Social', type: 'text', required: true },
          { name: 'cpf_cnpj', label: 'CPF ou CNPJ', type: 'text' },
          { name: 'email', label: 'E-mail', type: 'text' },
          { name: 'telefone', label: 'Telefone / WhatsApp', type: 'text' },
          { name: 'categoria_padrao', label: 'Categoria de Despesa (ex: Energia, Aluguel, Serviços)', type: 'text' },
        ]}
      />
    </div>
  )
}
