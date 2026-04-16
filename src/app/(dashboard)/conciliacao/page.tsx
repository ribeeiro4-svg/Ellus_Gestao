'use client'
import React, { useState, useMemo } from 'react'
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  Plus, 
  Banknote,
  RefreshCw,
  FileCheck
} from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useOFXParser, OFXTransaction } from '@/lib/hooks/useOFXParser'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import CrudModal from '@/components/ui/CrudModal'

export default function ConciliacaoPage() {
  const { lancamentos, conciliar, inserir, loading: finLoading } = useFinanceiro()
  const { contas } = useContas()
  const { parseOFX } = useOFXParser()

  const [extrato, setExtrato] = useState<OFXTransaction[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedExtrato, setSelectedExtrato] = useState<OFXTransaction | null>(null)
  
  // Lógica de matching inteligente
  const matchedTransactions = useMemo(() => {
    return extrato.map(ext => {
      // Busca lançamentos com valor exato (ou muito próximo) e data próxima (+/- 3 dias)
      const matches = lancamentos.filter(l => {
        const diffDate = Math.abs(new Date(l.data).getTime() - new Date(ext.date).getTime())
        const daysDiff = diffDate / (1000 * 60 * 60 * 24)
        const valMatch = Math.abs(l.valor - ext.amount) < 0.01
        return valMatch && daysDiff <= 4 && !l.conciliado
      })
      
      return {
        bank: ext,
        match: matches[0] || null,
        similarCount: matches.length
      }
    })
  }, [extrato, lancamentos])

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      const txs = parseOFX(content)
      setExtrato(txs)
    }
    reader.readAsText(file)
  }

  const handleConciliar = async (id: string, bankId: string) => {
    await conciliar(id, bankId)
  }

  const handleQuickCreate = (tx: OFXTransaction) => {
    setSelectedExtrato(tx)
    setIsModalOpen(true)
  }

  const handleSalvarNovo = async (data: any) => {
    if (!selectedExtrato) return
    const res = await inserir({
      ...data,
      valor: selectedExtrato.amount,
      data: selectedExtrato.date,
      conciliado: true,
      banco_transacao_id: selectedExtrato.fitid
    })
    if (!res.error) setIsModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
            <FileCheck size={26} />
          </div>
          <div>
            <h1 className="page-title text-2xl font-bold tracking-tight">Conciliador Bancário</h1>
            <p className="page-subtitle text-xs text-gray-500 font-medium">Cruze seu extrato OFX com o sistema automaticamente.</p>
          </div>
        </div>
      </div>

      {!extrato.length ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileUpload(e); }}
          className={`relative border-2 border-dashed rounded-[32px] p-20 flex flex-col items-center justify-center transition-all bg-white shadow-xl shadow-indigo-900/5 
            ${isDragOver ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-gray-200 hover:border-indigo-300'}`}
        >
          <input type="file" accept=".ofx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 mb-8 animate-bounce-slow">
            <Upload size={36} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Importe seu extrato OFX</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-sm text-center">Arraste aqui ou clique para selecionar o arquivo .ofx exportado do seu banco.</p>
          
          <div className="flex gap-4 mt-12 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <CheckCircle2 size={14} className="text-green-500" /> Detecção Inteligente
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <CheckCircle2 size={14} className="text-green-500" /> Cruzamento de Valores
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="table-card overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Search size={16} className="text-indigo-600" /> Transações do Extrato ({extrato.length})
              </h2>
              <button onClick={() => setExtrato([])} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                Trocar Arquivo
              </button>
            </div>
            
            <div className="divide-y divide-gray-50">
              {matchedTransactions.map((item, idx) => (
                <div key={item.bank.id} className="group p-5 hover:bg-gray-50/80 transition-all flex flex-col md:flex-row items-center gap-6">
                  
                  {/* Extrato Entry */}
                  <div className="flex-1 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                      ${item.bank.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      <Banknote size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{fmtData(item.bank.date)}</div>
                      <div className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{item.bank.memo}</div>
                      <div className="text-xs font-extrabold text-gray-500">{fmtR(item.bank.amount)}</div>
                    </div>
                  </div>

                  <ArrowRight className="text-gray-300 hidden md:block" />

                  {/* System Match */}
                  <div className="flex-1 flex items-center justify-center p-3 rounded-2xl border border-dashed border-gray-200 min-h-[70px]">
                    {item.match ? (
                      <div className="flex items-center gap-3 w-full animate-in fade-in zoom-in duration-300">
                        <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                            Sugerido <span className="text-gray-300 ml-1">•</span> <span className="text-gray-400 capitalize">{item.match.tipo}</span>
                          </div>
                          <div className="text-xs font-bold text-gray-800">{item.match.descricao}</div>
                          <div className="text-[10px] text-gray-400">{fmtData(item.match.data)} — {fmtR(item.match.valor)}</div>
                        </div>
                        <button 
                          onClick={() => handleConciliar(item.match!.id, item.bank.fitid)}
                          className="px-4 py-2 bg-green-600 text-white text-[10px] font-black rounded-lg hover:bg-green-700 transition-all shadow-md shadow-green-100 uppercase"
                        >
                          Confirmar
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-2">
                          <AlertCircle size={12} className="text-amber-500" /> Nenhum par encontrado
                        </div>
                        <button 
                          onClick={() => handleQuickCreate(item.bank)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg hover:bg-indigo-100 transition-all uppercase"
                        >
                          <Plus size={12} /> Criar Lançamento
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Modal */}
      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criação Rápida de Lançamento"
        onSubmit={handleSalvarNovo}
        fields={[
          { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'receita', label: 'Receita' },
            { value: 'despesa', label: 'Despesa' }
          ]},
          { name: 'descricao', label: 'Descrição', type: 'text', required: true, placeholder: selectedExtrato?.memo },
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Mensalidades', label: 'Mensalidades' },
            { value: 'ADESÃO', label: 'Adesão' },
            { value: 'Serviços', label: 'Serviços' },
            { value: 'Infraestrutura', label: 'Custos Fixos' },
            { value: 'Outros', label: 'Outros' },
          ]},
          { name: 'conta_id', label: 'Conta Bancária', type: 'select', required: true, options: 
            contas.map(c => ({ value: c.id, label: c.nome }))
          },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'pago', label: 'Confirmado/Pago' },
            { value: 'pendente', label: 'Aguardando' }
          ]}
        ]}
      />

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
