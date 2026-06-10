'use client'
import React, { useState, useMemo } from 'react'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import StatusBadge from '@/components/ui/StatusBadge'
import AtendimentoFluxoModal from './AtendimentoFluxoModal'
import FichaAssociadoModal from './FichaAssociadoModal'

export default function BuscaAssociadoAtendimento() {
  const { associados, loading } = useAssociados()
  const [searchQ, setSearchQ] = useState('')
  const [selectedParaFicha, setSelectedParaFicha] = useState<any>(null)
  const [selectedAssociado, setSelectedAssociado] = useState<any>(null)
  const [dadosAlterados, setDadosAlterados] = useState<string[]>([])

  const normalizeStr = (str: string) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  const searchResults = useMemo(() => {
    if (!searchQ || searchQ.length < 3) return []
    
    // Normalizar e dividir a busca por espaços para suportar palavras em qualquer ordem
    const qRaw = normalizeStr(searchQ)
    const terms = qRaw.split(/\s+/).filter(Boolean)
    if (terms.length === 0) return []

    return associados
      .filter((a: any) => {
        const nomeNorm = normalizeStr(a.nome)
        const cpfNorm = (a.cpf || '')
        const emailNorm = (a.email || '').toLowerCase()
        const telNorm = (a.telefone || '')

        // Verifica se cada um dos termos digitados existe em pelo menos um dos campos
        return terms.every(term => 
          nomeNorm.includes(term) ||
          cpfNorm.includes(term) ||
          emailNorm.includes(term) ||
          telNorm.includes(term)
        )
      })
      // Ordenar por relevância (proximidade / onde o termo começa no nome) e secundariamente por ordem alfabética
      .sort((a: any, b: any) => {
        const nomeANorm = normalizeStr(a.nome)
        const nomeBNorm = normalizeStr(b.nome)
        
        // Pega o primeiro termo digitado para fazer a pontuação de relevância
        const primeiroTermo = terms[0]
        
        const indexA = nomeANorm.indexOf(primeiroTermo)
        const indexB = nomeBNorm.indexOf(primeiroTermo)
        
        // Se o termo aparece em posições diferentes, quem tem o menor índice (começa antes) vem primeiro
        if (indexA !== indexB) {
          // Se não encontrou o termo no nome (achou no CPF/Tel), joga para o final da lista de relevância
          const posA = indexA === -1 ? 9999 : indexA
          const posB = indexB === -1 ? 9999 : indexB
          return posA - posB
        }
        
        // Se empatar na relevância de posição, ordena alfabeticamente
        return (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
      })
  }, [associados, searchQ])

  const handleProceed = (associadoAtualizado: any, alterados: string[]) => {
    setSelectedParaFicha(null)
    setDadosAlterados(alterados)
    setSelectedAssociado(associadoAtualizado)
  }

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Search Input */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Busque por Nome, CPF, E-mail ou Telefone..."
          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-[14px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-blue-500">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {searchQ.length >= 3 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[380px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Resultados ({searchResults.length})</h3>
            <button 
              onClick={() => setSearchQ('')} 
              className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wide px-2 py-0.5 rounded-md hover:bg-red-50 transition-colors"
            >
              Fechar Resultados
            </button>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Nenhum associado encontrado com este termo.
            </div>
          ) : (
            searchResults.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                    {(a.nome || 'A')[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 uppercase">{a.nome}</span>
                    <span className="text-[11px] text-slate-500 font-medium">CPF: {a.cpf || 'Não informado'} | Tel: {a.telefone || '--'}{a.email ? ` | ${a.email}` : ''}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <StatusBadge status={a.status} type="associado" />
                  <button 
                    onClick={() => {
                      setSelectedParaFicha(a)
                      setSearchQ('') // Fecha o dropdown ao selecionar
                    }}
                    className="btn-primary text-[11px] uppercase font-black px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Atender
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ficha Modal - Primeiro passo */}
      {selectedParaFicha && (
        <FichaAssociadoModal
          associado={selectedParaFicha}
          onClose={() => setSelectedParaFicha(null)}
          onProceed={handleProceed}
        />
      )}

      {/* Atendimento Modal - Segundo passo */}
      {selectedAssociado && (
        <AtendimentoFluxoModal 
          associado={selectedAssociado}
          dadosAlteradosNoCadastro={dadosAlterados}
          onClose={() => { setSelectedAssociado(null); setDadosAlterados([]) }} 
        />
      )}
    </div>
  )
}

