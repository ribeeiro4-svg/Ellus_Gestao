import React, { useState } from 'react'
import { useFichaAssociado } from '../../hooks/useFichaAssociado'
import FichaAssociadoHeader from './FichaAssociadoHeader'
import FichaAbaDadosCadastrais from './FichaAbaDadosCadastrais'
import FichaAbaExtratoFinanceiro from './FichaAbaExtratoFinanceiro'
import FichaAbaHistoricoAtendimentos from './FichaAbaHistoricoAtendimentos'
import FichaAbaRecorrencia from './FichaAbaRecorrencia'
import FichaRodape from './FichaRodape'
import { gerarPdfFicha } from '../../utils/gerarPdfFicha'
import { Loader2 } from 'lucide-react'

interface FichaAssociadoModalProps {
  isOpen: boolean
  onClose: () => void
  associadoId: string | null
  onAtualizar?: (id: string, data: any) => Promise<any>
}

export default function FichaAssociadoModal({ isOpen, onClose, associadoId, onAtualizar }: FichaAssociadoModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<'cadastrais' | 'financeiro' | 'historico' | 'recorrencia'>('cadastrais')
  const { associado, extrato, atendimentos, loading } = useFichaAssociado(associadoId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#071a12]/90 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Container do Modal */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 border border-white/20">
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-emerald-600" size={48} />
            <p className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Carregando Ficha...</p>
          </div>
        ) : associado ? (
          <>
            <FichaAssociadoHeader 
              nome={associado.nome} 
              status={associado.status} 
              onClose={onClose} 
            />

            {/* Abas de Navegação */}
            <div className="px-8 border-b border-slate-100 flex gap-8 bg-slate-50/50">
              <button 
                onClick={() => setAbaAtiva('cadastrais')}
                className={`py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${abaAtiva === 'cadastrais' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Dados Cadastrais
                {abaAtiva === 'cadastrais' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full animate-in slide-in-from-bottom-1" />}
              </button>
              <button 
                onClick={() => setAbaAtiva('financeiro')}
                className={`py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${abaAtiva === 'financeiro' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Extrato Financeiro
                {abaAtiva === 'financeiro' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full animate-in slide-in-from-bottom-1" />}
              </button>
              <button 
                onClick={() => setAbaAtiva('historico')}
                className={`py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${abaAtiva === 'historico' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Histórico de Atendimentos
                {abaAtiva === 'historico' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full animate-in slide-in-from-bottom-1" />}
              </button>
              <button 
                onClick={() => setAbaAtiva('recorrencia')}
                className={`py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${abaAtiva === 'recorrencia' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Recorrência Cora
                {abaAtiva === 'recorrencia' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full animate-in slide-in-from-bottom-1" />}
              </button>
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              {abaAtiva === 'cadastrais' ? (
                <FichaAbaDadosCadastrais associado={associado} />
              ) : abaAtiva === 'financeiro' ? (
                <FichaAbaExtratoFinanceiro extrato={extrato} />
              ) : abaAtiva === 'historico' ? (
                <FichaAbaHistoricoAtendimentos atendimentos={atendimentos || []} />
              ) : (
                <FichaAbaRecorrencia associado={associado} onAtualizar={onAtualizar} />
              )}
            </div>

            <FichaRodape 
              onClose={onClose} 
              onExportPdf={() => gerarPdfFicha(associado, extrato, atendimentos)} 
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
            <p className="text-sm font-bold">Associado não encontrado.</p>
            <button onClick={onClose} className="text-xs font-black uppercase underline">Voltar</button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  )
}
