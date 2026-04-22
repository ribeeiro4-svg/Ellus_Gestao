'use client'
import React, { useMemo, useState } from 'react'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import { Plus, Mail, Phone, Trash2, Search, HardDrive, ShoppingCart, Link, CheckCircle2, Loader2 } from 'lucide-react'
import { usePlanoContas } from '@/features/contabil/hooks/usePlanoContas'
import { fmtR } from '@/lib/utils/formatters'

export default function FornecedoresTab() {
  const { fornecedores, loading, inserir, atualizar, excluir } = useFornecedores()
  const planoHook = usePlanoContas()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQ, setSearchQ] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('todas')

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
    if (fornecedor.conta_contabil_id) return
    setGeneratingId(fornecedor.id)
    
    try {
      // 1. Achar a conta pai (Fornecedores - 2.1.3)
      const pai = planoHook.contas.find(c => c.codigo === '2.1.3')
      if (!pai) {
        alert('Conta pai "2.1.3 - FORNECEDORES" não encontrada no Plano de Contas.')
        return
      }

      // 2. Achar o próximo código disponível
      const filhos = planoHook.contas.filter(c => c.conta_pai_id === pai.id)
      const codigosExistentes = filhos.map(f => {
        const partes = f.codigo.split('.')
        return parseInt(partes[partes.length - 1])
      })
      const proximoNum = codigosExistentes.length > 0 ? Math.max(...codigosExistentes) + 1 : 1
      const novoCodigo = `${pai.codigo}.${proximoNum.toString().padStart(2, '0')}`

      // 3. Criar a conta
      const { error: createError } = await planoHook.adicionarConta({
        codigo: novoCodigo,
        descricao: `FORN: ${fornecedor.nome.toUpperCase()}`,
        nivel: 4,
        tipo: 'analitica',
        natureza: 'credora',
        classificacao: 'passivo',
        aceita_lancamentos: true,
        ativa: true,
        conta_pai_id: pai.id
      })

      if (createError) throw new Error(createError.message)

      // 4. Buscar a conta recém criada para pegar o ID e vincular
      await planoHook.refresh()
      
      const { createClient } = await import('@/lib/supabase/client')
      const sb = createClient()
      const { data: contaCriada } = await sb.from('plano_contas')
        .select('id')
        .eq('codigo', novoCodigo)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (contaCriada) {
        await atualizar(fornecedor.id, { conta_contabil_id: contaCriada.id })
      }

      alert(`Conta ${novoCodigo} gerada e vinculada com sucesso!`)
    } catch (err: any) {
      alert(`Erro ao gerar conta: ${err.message}`)
    } finally {
      setGeneratingId(null)
    }
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
        
        // 2. Busca inteligente pela descrição (caso o ID esteja vazio)
        if (!conta) {
          const descBuscada = `FORN: ${i.nome.toUpperCase()}`
          conta = planoHook.contas.find(c => c.descricao.toUpperCase() === descBuscada)
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
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filtrados} 
          loading={loading}
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
