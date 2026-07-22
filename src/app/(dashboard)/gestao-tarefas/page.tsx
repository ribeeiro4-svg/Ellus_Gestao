'use client'
import React, { useState, useEffect, Suspense, useMemo } from 'react'
import { ClipboardList, Plus, Download } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTarefas } from '@/features/gestao-tarefas/hooks/useTarefas'
import { useUsuarios } from '@/lib/hooks/useUsuarios'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useAssociados } from '@/lib/hooks/useAssociados'
import AbasNavegacao from '@/features/gestao-tarefas/components/AbasNavegacao'
import KanbanBoard from '@/features/gestao-tarefas/components/KanbanBoard'
import ListaTarefas from '@/features/gestao-tarefas/components/ListaTarefas'
import FiltrosTarefas from '@/features/gestao-tarefas/components/FiltrosTarefas'
import TarefaModal from '@/features/gestao-tarefas/components/TarefaModal'
import ModelosResolucoesTab from '@/features/gestao-tarefas/components/ModelosResolucoesTab'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import { AssociadoLancamentos } from '@/components/ui/AssociadoLancamentos'
import { Tarefa, StatusTarefa } from '@/lib/types'

export default function GestaoTarefasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando Módulo de Tarefas...</div>}>
      <GestaoTarefasContent />
    </Suspense>
  )
}

function GestaoTarefasContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { tarefas, loading, inserir, atualizar, remover, refresh, buscarComentarios, adicionarComentario, editarComentario, excluirComentario } = useTarefas()
  const { usuarios } = useUsuarios()
  const { diretoria } = useDiretoria()
  const { associados } = useAssociados()

  const { isAdmin } = usePermissions('tarefas')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user_profile')
      if (raw) {
        setCurrentUserId(JSON.parse(raw).id)
      }
    } catch {}
  }, [])

  const [abaAtiva, setAbaAtiva] = useState<'kanban' | 'lista' | 'modelos'>('kanban')
  const [filtros, setFiltros] = useState<any>({ search: '', responsavel_id: '', associado_id: '', prioridade: '', categoria: '', data_inicio: '', data_fim: '' })
  
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Sincronizar aba com a URL
  useEffect(() => {
    const aba = searchParams.get('aba') as any
    if (aba && ['kanban', 'lista', 'modelos'].includes(aba)) {
      setAbaAtiva(aba)
    }
  }, [searchParams])

  const handleAbaChange = (aba: 'kanban' | 'lista' | 'modelos') => {
    setAbaAtiva(aba)
    const params = new URLSearchParams(searchParams.toString())
    params.set('aba', aba)
    router.push(`?${params.toString()}`)
  }

  const handleMoveTask = async (id: string, novoStatus: StatusTarefa) => {
    await atualizar(id, { status: novoStatus })
  }

  const filteredTarefas = tarefas.filter(t => {
    if (!isAdmin) {
      if (!currentUserId || t.responsavel_id !== currentUserId) return false
    }

    const s = filtros.search.toLowerCase()
    const matchSearch = !filtros.search || 
      t.titulo.toLowerCase().includes(s) || 
      t.descricao?.toLowerCase().includes(s) ||
      (t.associado_nome && t.associado_nome.toLowerCase().includes(s))
    const matchResponsavel = !filtros.responsavel_id || t.responsavel_id === filtros.responsavel_id
    const matchAssociado = !filtros.associado_id || t.associado_id === filtros.associado_id
    const matchPrioridade = !filtros.prioridade || t.prioridade === filtros.prioridade
    const matchCategoria = !filtros.categoria || t.categoria === filtros.categoria
    
    // Filtro por data (prazo)
    let matchData = true
    if (t.prazo) {
      const taskDate = t.prazo // formato YYYY-MM-DD
      if (filtros.data_inicio && taskDate < filtros.data_inicio) matchData = false
      if (filtros.data_fim && taskDate > filtros.data_fim) matchData = false
    } else if (filtros.data_inicio || filtros.data_fim) {
      matchData = false // Se tem filtro de data mas a tarefa não tem prazo
    }

    return matchSearch && matchResponsavel && matchAssociado && matchPrioridade && matchCategoria && matchData
  })

  const formFields: Field[] = useMemo(() => [
    { name: 'titulo', label: 'Título da Tarefa', type: 'text', required: true },
    { name: 'descricao', label: 'Descrição Detalhada', type: 'textarea', rows: 6 },
    { 
      name: 'associado_id', 
      label: 'Associado Vinculado', 
      type: 'select', 
      options: [
        { value: '', label: 'Nenhum' },
        ...associados.map(a => ({ value: a.id, label: a.nome }))
      ]
    },
    { 
      name: 'responsavel_id', 
      label: 'Responsável', 
      type: 'select', 
      required: true,
      options: [
        ...usuarios.map(u => ({ value: u.id, label: u.nome + ' (USUÁRIO)' })),
        ...diretoria.map(d => ({ value: d.id, label: d.nome + ' (DIRETORIA)' }))
      ]
    },
    {
      name: 'lancamentos_associado',
      label: '',
      type: 'info',
      showIf: (formData: any) => !!formData.associado_id,
      render: (formData: any) => <AssociadoLancamentos associadoId={formData.associado_id} />
    },
    { 
      name: 'status', 
      label: 'Status Inicial', 
      type: 'select', 
      required: true,
      options: [
        { value: 'A Fazer', label: 'A Fazer' },
        { value: 'Em Andamento', label: 'Em Andamento' },
        { value: 'Aguardando', label: 'Aguardando' },
        { value: 'Concluído', label: 'Concluído' },
      ]
    },
    { 
      name: 'prioridade', 
      label: 'Prioridade', 
      type: 'select', 
      required: true,
      options: [
        { value: 'Alta', label: 'Alta' },
        { value: 'Média', label: 'Média' },
        { value: 'Baixa', label: 'Baixa' },
      ]
    },
    { name: 'categoria', label: 'Categoria', type: 'text' },
    { name: 'prazo', label: 'Prazo Final', type: 'date' },
  ], [associados, usuarios, diretoria])

  const handleExportCSV = () => {
    const csvData = filteredTarefas.map(t => ({
      Título: t.titulo,
      Responsável: t.responsavel_nome,
      Status: t.status,
      Prioridade: t.prioridade,
      Prazo: t.prazo,
      Categoria: t.categoria,
      Descrição: t.descricao
    }))
    
    // Import dynamic import for papaparse
    import('papaparse').then((Papa) => {
      const csv = Papa.unparse(csvData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', `tarefas_${new Date().toISOString().split('T')[0]}.csv`)
      link.click()
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-1000 relative min-h-screen -m-4 lg:-m-8 p-4 lg:p-8 overflow-hidden bg-[#04140e]">
      {/* Background Geométrico Ultra Dark Theme - Full Screen Expansion */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%232d8c6f' stroke-width='1'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%232d8c6f' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '56px 100px',
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Overlay de Gradiente para Profundidade */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-transparent via-[#071a12]/30 to-[#04140e]" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Header Hub */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0a2419]/60 backdrop-blur-3xl p-7 rounded-[32px] border border-white/5 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Gestão de Tarefas</h1>
              <p className="text-sm text-emerald-500/60 font-bold uppercase tracking-widest">Operacional, Modelos e Conhecimento — ACPROBEC</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {abaAtiva === 'lista' && (
               <button
                 onClick={handleExportCSV}
                 className="flex items-center gap-2 bg-white text-slate-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
               >
                 <Download size={14} />
                 Exportar CSV
               </button>
             )}
             <button
               onClick={() => { setEditingTarefa(null); setIsFormOpen(true) }}
               className="flex items-center gap-2 bg-[#0e2d22] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 transition-all active:scale-95"
             >
               <Plus size={16} />
               Nova Tarefa
             </button>
             <AbasNavegacao ativa={abaAtiva} onChange={handleAbaChange} />
          </div>
        </div>

        {/* Área de Filtros (Oculta em Modelos) */}
        {abaAtiva !== 'modelos' && (
          <FiltrosTarefas 
            responsaveis={isAdmin ? [
              ...usuarios.map(u => ({ id: u.id, nome: u.nome })),
              ...diretoria.map(d => ({ id: d.id, nome: d.nome }))
            ] : [
              ...usuarios.map(u => ({ id: u.id, nome: u.nome })),
              ...diretoria.map(d => ({ id: d.id, nome: d.nome }))
            ].filter(r => r.id === currentUserId)} 
            associados={associados}
            filtros={filtros} 
            setFiltros={setFiltros} 
            onClear={() => setFiltros({ search: '', responsavel_id: '', associado_id: '', prioridade: '', categoria: '', data_inicio: '', data_fim: '' })}
          />
        )}

        {/* Conteúdo Dinâmico */}
        <div className="min-h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
               <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {abaAtiva === 'kanban' && (
                <KanbanBoard 
                  tarefas={filteredTarefas} 
                  onAddClick={(status) => {
                    setEditingTarefa({ status } as any)
                    setIsFormOpen(true)
                  }}
                  onCardClick={setSelectedTarefa}
                  onMoveTask={handleMoveTask}
                />
              )}
              {abaAtiva === 'lista' && (
                <div className="flex flex-col gap-4">
                  {/* Painel de Ações em Lote */}
                  {selectedIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-emerald-950/80 border border-emerald-500/20 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-300 font-black uppercase tracking-wider">
                          {selectedIds.length} tarefas selecionadas:
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Alterar Status */}
                        <select 
                          onChange={async (e) => {
                            const val = e.target.value
                            if (!val) return
                            if (confirm(`Alterar o status de ${selectedIds.length} tarefas para "${val}"?`)) {
                              for (const id of selectedIds) {
                                await atualizar(id, { status: val })
                              }
                              setSelectedIds([])
                              e.target.value = ''
                            }
                          }}
                          className="bg-[#0e2d22] text-white border border-emerald-500/20 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer"
                        >
                          <option value="">Status em Lote...</option>
                          <option value="A Fazer">A Fazer</option>
                          <option value="Em Andamento">Em Andamento</option>
                          <option value="Aguardando">Aguardando</option>
                          <option value="Concluído">Concluído</option>
                        </select>

                        {/* Alterar Responsável */}
                        <select 
                          onChange={async (e) => {
                            const val = e.target.value
                            if (!val) return
                            const respNome = [
                              ...usuarios.map(u => ({ id: u.id, nome: u.nome })),
                              ...diretoria.map(d => ({ id: d.id, nome: d.nome }))
                            ].find(r => r.id === val)?.nome || ''
                            if (confirm(`Definir "${respNome}" como responsável por ${selectedIds.length} tarefas?`)) {
                              for (const id of selectedIds) {
                                await atualizar(id, { responsavel_id: val })
                              }
                              setSelectedIds([])
                              e.target.value = ''
                            }
                          }}
                          className="bg-[#0e2d22] text-white border border-emerald-500/20 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer"
                        >
                          <option value="">Responsável em Lote...</option>
                          {[
                            ...usuarios.map(u => ({ id: u.id, nome: u.nome + ' (U)' })),
                            ...diretoria.map(d => ({ id: d.id, nome: d.nome + ' (D)' }))
                          ].map(r => (
                            <option key={r.id} value={r.id}>{r.nome}</option>
                          ))}
                        </select>

                        {/* Alterar Prioridade */}
                        <select 
                          onChange={async (e) => {
                            const val = e.target.value
                            if (!val) return
                            if (confirm(`Alterar prioridade de ${selectedIds.length} tarefas para "${val}"?`)) {
                              for (const id of selectedIds) {
                                await atualizar(id, { prioridade: val })
                              }
                              setSelectedIds([])
                              e.target.value = ''
                            }
                          }}
                          className="bg-[#0e2d22] text-white border border-emerald-500/20 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer"
                        >
                          <option value="">Prioridade em Lote...</option>
                          <option value="Alta">Alta</option>
                          <option value="Média">Média</option>
                          <option value="Baixa">Baixa</option>
                        </select>

                        {/* Alterar Categoria */}
                        <button
                          onClick={async () => {
                            const val = prompt('Informe a nova categoria para as tarefas selecionadas:')
                            if (val === null) return
                            if (confirm(`Definir categoria como "${val || 'Sem Categoria'}" para ${selectedIds.length} tarefas?`)) {
                              for (const id of selectedIds) {
                                await atualizar(id, { categoria: val || null })
                              }
                              setSelectedIds([])
                            }
                          }}
                          className="bg-[#0e2d22] text-white border border-emerald-500/20 hover:bg-[#1a4436] rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                          Categoria em Lote
                        </button>

                        {/* Excluir em Lote */}
                        <button
                          onClick={async () => {
                            if (confirm(`Tem certeza de que deseja EXCLUIR permanentemente ${selectedIds.length} tarefas? Esta ação não pode ser desfeita.`)) {
                              for (const id of selectedIds) {
                                await remover(id)
                              }
                              setSelectedIds([])
                            }
                          }}
                          className="bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                          Excluir em Lote
                        </button>
                      </div>
                    </div>
                  )}

                  <ListaTarefas 
                    tarefas={filteredTarefas}
                    selectedIds={selectedIds}
                    onSelectChange={setSelectedIds}
                    onEdit={(t) => {
                      setEditingTarefa(t)
                      setIsFormOpen(true)
                    }}
                    onDelete={(id) => {
                      if (confirm('Deseja excluir esta tarefa?')) remover(id)
                    }}
                  />
                </div>
              )}
              {abaAtiva === 'modelos' && (
                <ModelosResolucoesTab />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modais */}
      <TarefaModal 
        isOpen={!!selectedTarefa}
        onClose={() => setSelectedTarefa(null)}
        tarefa={selectedTarefa}
        onUpdate={atualizar}
        onCopy={(t) => {
          setSelectedTarefa(null)
          // Prepara para criar uma nova copiando os dados
          setEditingTarefa({
            titulo: `${t.titulo} (CÓPIA)`,
            descricao: t.descricao,
            responsavel_id: t.responsavel_id,
            associado_id: t.associado_id,
            status: t.status,
            prioridade: t.prioridade,
            categoria: t.categoria,
            prazo: t.prazo
          } as any)
          setIsFormOpen(true)
        }}
        buscarComentarios={buscarComentarios}
        adicionarComentario={adicionarComentario}
        editarComentario={editarComentario}
        excluirComentario={excluirComentario}
      />

      <CrudModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingTarefa?.id ? 'Editar Tarefa' : 'Nova Tarefa'}
        fields={formFields}
        initialData={editingTarefa}
        onSubmit={async (data) => {
          const { error } = editingTarefa?.id 
            ? await atualizar(editingTarefa.id, data) 
            : await inserir(data)
          
          if (error) {
            alert('Erro ao salvar tarefa: ' + (error.message || 'Erro desconhecido'))
          } else {
            setIsFormOpen(false)
          }
        }}
      />
    </div>
  )
}
