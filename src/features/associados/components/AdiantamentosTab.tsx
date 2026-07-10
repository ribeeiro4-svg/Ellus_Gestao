'use client'
import { useState } from 'react'
import { useAdiantamentos } from '@/lib/hooks/useAdiantamentos'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { Adiantamento, StatusAdiantamento } from '@/lib/types'
import { fmtR } from '@/lib/utils/formatters'
import { Plus, Settings, Printer, CheckCircle, XCircle, CreditCard } from 'lucide-react'
import AdiantamentoFormModal from './AdiantamentoFormModal'
import { ImprimirRecibo, ImprimirGuia } from './PrintAdiantamento'
import DataTable from '@/components/ui/DataTable'

const STATUS_COLORS: Record<string, string> = {
  'SOLICITADO': 'bg-gray-100 text-gray-700',
  'APROVADO': 'bg-blue-100 text-blue-700',
  'PAGO': 'bg-green-100 text-green-700',
  'DESCONTADO': 'bg-purple-100 text-purple-700',
  'RECUSADO': 'bg-red-100 text-red-700',
  'CANCELADO': 'bg-orange-100 text-orange-700'
}

export default function AdiantamentosTab() {
  const { adiantamentos, loading, config, atualizarStatus, efetuarPagamentoFinanceiro } = useAdiantamentos()
  const { diretoria } = useDiretoria()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAdiantamento, setSelectedAdiantamento] = useState<Adiantamento | null>(null)

  const handlePrintGuia = (item: Adiantamento) => {
    const diretor = diretoria.find(d => d.id === item.diretor_id)
    ImprimirGuia(item, diretor)
  }

  const handlePrintRecibo = (item: Adiantamento) => {
    const diretor = diretoria.find(d => d.id === item.diretor_id)
    ImprimirRecibo(item, diretor)
  }

  const handleAprovar = async (item: Adiantamento) => {
    if (confirm('Aprovar esta solicitação?')) {
      await atualizarStatus(item.id, 'APROVADO')
    }
  }

  const handlePagar = async (item: Adiantamento) => {
    if (confirm('Deseja gerar o lançamento financeiro e marcar como PAGO?')) {
      // Simplificado - o ideal seria um modal para escolher a conta bancária
      const result = await efetuarPagamentoFinanceiro(item, '') 
      if (result.error) alert('Erro ao efetuar pagamento')
    }
  }

  const handleDescontar = async (item: Adiantamento) => {
    if (confirm('Marcar este adiantamento como já DESCONTADO da folha?')) {
      await atualizarStatus(item.id, 'DESCONTADO')
    }
  }

  const columns = [
    {
      key: 'numero',
      header: 'Nº',
      render: (item: Adiantamento) => <span className="font-mono text-xs font-bold text-slate-500">#{String(item.numero).padStart(4, '0')}</span>
    },
    {
      key: 'diretor_nome',
      header: 'Diretor',
      render: (item: Adiantamento) => <span className="font-bold text-slate-700">{item.diretor_nome || '-'}</span>
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (item: Adiantamento) => <span className="text-xs font-bold uppercase tracking-wider">{item.tipo}</span>
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (item: Adiantamento) => <span className="font-bold text-emerald-600">{fmtR(item.valor)}</span>
    },
    {
      key: 'data_solicitacao',
      header: 'Solicitação',
      render: (item: Adiantamento) => <span className="text-sm">{new Date(item.data_solicitacao).toLocaleDateString('pt-BR')}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Adiantamento) => {
        const status = item.status
        return (
          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
            {status}
          </span>
        )
      }
    },
    {
      key: 'acoes',
      header: 'Ações',
      render: (item: Adiantamento) => {
        return (
          <div className="flex gap-2 items-center justify-end">
            {item.status === 'SOLICITADO' && (
              <>
                <button onClick={() => handleAprovar(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Aprovar">
                  <CheckCircle size={14} />
                </button>
                <button onClick={() => atualizarStatus(item.id, 'RECUSADO')} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Recusar">
                  <XCircle size={14} />
                </button>
              </>
            )}
            {item.status === 'APROVADO' && (
              <button onClick={() => handlePagar(item)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Efetuar Pagamento">
                <CreditCard size={14} />
              </button>
            )}
            {item.status === 'PAGO' && (
              <button onClick={() => handleDescontar(item)} className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-lg hover:bg-purple-100 uppercase" title="Descontar da Folha">
                Descontar
              </button>
            )}

            <button onClick={() => handlePrintGuia(item)} className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-200 ml-2" title="Imprimir Guia">
              <Printer size={14} />
            </button>
            {(item.status === 'PAGO' || item.status === 'DESCONTADO') && (
              <button onClick={() => handlePrintRecibo(item)} className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-200" title="Imprimir Recibo">
                <Printer size={14} />
              </button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CreditCard className="text-emerald-600" size={28} />
            Adiantamentos & Empréstimos
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1 ml-10">Solicitação, aprovação e integração financeira.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-50 text-slate-600 px-4 py-2.5 rounded-2xl font-bold text-xs hover:bg-slate-100 transition-all shadow-sm flex items-center gap-2 border border-slate-200">
            <Settings size={16} /> Configurações
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} /> Nova Solicitação
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-6">
        <DataTable columns={columns} data={adiantamentos} loading={loading} />
      </div>

      <AdiantamentoFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        diretoria={diretoria}
        config={config}
      />
    </div>
  )
}
