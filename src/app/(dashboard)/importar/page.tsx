'use client'
import React from 'react'
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useProjecao } from '@/lib/hooks/useProjecao'
import { useTenantId } from '@/lib/hooks/useTenantId'
import type { LancamentoInput, AssociadoInput, ProLaboreItem } from '@/lib/types'

export default function ImportPage() {
  const tenantId = useTenantId()
  const { inserirBulk: bulkFinanceiro } = useFinanceiro()
  const { inserirBulk: bulkAssociados } = useAssociados()
  const { cenario, salvarCenario } = useProjecao()
  
  const [loading, setLoading] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  const downloadTemplate = (type: 'financeiro' | 'associados' | 'prolabore') => {
    let data: any[][] = []
    let filename = ''
    
    if (type === 'financeiro') {
      data = [
        ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Forma Pagamento', 'Nome da Conta', 'Recorrência Ativa', 'Valor Recebido', 'Troco via PIX'],
        ['2024-04-01', 'Mensalidade Abril', 'Mensalidade', 'Receita', 150.00, 'Recebido', 'PIX', 'Cora ACPROBEC', 'Sim', 150.00, 'Não'],
        ['2024-04-05', 'Aluguel Escritório', 'Infraestrutura', 'Despesa', 2500.00, 'Pago', 'Transferência', 'Bradesco Principal', 'Sim', 2500.00, 'Não'],
        ['2024-04-10', 'Adesão Novo Membro', 'ADESÃO', 'Receita', 200.00, 'Recebido', 'Dinheiro', 'Caixa Físico', 'Não', 250.00, 'Sim']
      ]
      filename = 'modelo_financeiro_acprobec.xlsx'
    } else if (type === 'associados') {
      data = [
        ['ID', 'Nome', 'CPF / CNPJ', 'Categoria', 'Email', 'Data Ingresso', 'Mensalidade', 'Status'],
        ['1001', 'João da Silva', '12345678901', 'Pleno', 'joao@email.com', '2023-01-10', 150.00, 'Ativo'],
        ['1002', 'Maria Souza', '98765432100', 'Premium', 'maria@email.com', '2023-05-20', 300.00, 'Inadimplente']
      ]
      filename = 'modelo_associados_acprobec.xlsx'
    } else if (type as string === 'prolabore') {
      data = [
        ['Nome do Diretor', 'Valor Mensal', 'Mês Início', 'Ano Início', 'Mês Fim', 'Ano Fim'],
        ['Diretor Presidente', 3000.00, 1, 2024, 6, 2024],
        ['Diretor Presidente', 3500.00, 7, 2024, '', ''],
        ['Diretor Administrativo', 2500.00, 1, 2024, '', '']
      ]
      filename = 'modelo_prolabore_acprobec.xlsx'
    }

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo')
    XLSX.writeFile(wb, filename)
  }

  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const parseExcelDate = (val: any) => {
    if (!val) return new Date().toISOString()
    
    // Se já for uma data do JS
    if (val instanceof Date) return val.toISOString()

    // Se for número (Serial do Excel)
    if (typeof val === 'number') {
      // O Excel conta dias desde 1899-12-30. Diferença para época Unix é 25569 dias.
      return new Date((val - 25569) * 86400 * 1000).toISOString()
    }

    // Se for string DD/MM/YYYY
    if (typeof val === 'string' && val.includes('/')) {
      const parts = val.split('/')
      if (parts.length === 3) {
        const [d, m, y] = parts
        const date = new Date(Number(y), Number(m) - 1, Number(d))
        if (!isNaN(date.getTime())) return date.toISOString()
      }
    }

    // Tenta o parse padrão
    const parsed = new Date(val)
    if (!isNaN(parsed.getTime())) return parsed.toISOString()

    return new Date().toISOString()
  }

  const processData = async (data: any[]) => {
    if (data.length === 0) return
    setLoading(true)
    setFeedback(null)

    try {
      const firstRow = data[0]
      
      // Detecção de tipo baseada nos cabeçalhos
      if ('Recorrência Ativa' in firstRow || 'Valor Recebido' in firstRow) {
        // Financeiro
        const mapped: LancamentoInput[] = data.map(row => ({
          data: parseExcelDate(row.Data),
          descricao: row.Descrição || 'Importado',
          categoria: row.Categoria || 'Geral',
          tipo: String(row.Tipo || 'receita').toLowerCase() as any,
          valor: Number(row.Valor || 0),
          status: String(row.Status || 'aberto').toLowerCase() as any,
          forma_pagamento: row['Forma Pagamento'] || 'PIX',
          valor_recebido: Number(row['Valor Recebido'] || 0),
          troco_via_pix: String(row['Troco via PIX']).toLowerCase() === 'sim',
          recorrencia_ativa: String(row['Recorrência Ativa']).toLowerCase() === 'sim',
          conciliado: false
        }))
        await bulkFinanceiro(mapped)
        setFeedback({ type: 'success', message: `${mapped.length} lançamentos financeiros importados com sucesso!` })
      } 
      else if ('CPF / CNPJ' in firstRow || 'Data Ingresso' in firstRow) {
        // Associados
        const mapped: AssociadoInput[] = data.map(row => ({
          codigo: String(row.ID || Math.floor(Math.random() * 10000)),
          nome: row.Nome,
          cpf: row['CPF / CNPJ'] || '',
          categoria: row.Categoria || 'Pleno',
          email: row.Email || '',
          data_ingresso: parseExcelDate(row['Data Ingresso']),
          mensalidade: Number(row.Mensalidade || 0),
          status: String(row.Status || 'ativo').toLowerCase() as any
        }))
        await bulkAssociados(mapped)
        setFeedback({ type: 'success', message: `${mapped.length} associados cadastrados/atualizados com sucesso!` })
      }
      else if ('Nome do Diretor' in firstRow && 'Mês Início' in firstRow) {
        // Pró-labore
        const grouped = data.reduce((acc: any, row) => {
          const nome = row['Nome do Diretor']
          if (!acc[nome]) acc[nome] = { id: Math.random().toString(), nome, periodos: [] }
          acc[nome].periodos.push({
            id: Math.random().toString(),
            valor: Number(row['Valor Mensal'] || 0),
            mes_inicio: Number(row['Mês Início'] || 1) - 1,
            ano_inicio: Number(row['Ano Início'] || 2024),
            mes_fim: row['Mês Fim'] ? Number(row['Mês Fim']) - 1 : undefined,
            ano_fim: row['Ano Fim'] ? Number(row['Ano Fim']) : undefined
          })
          return acc
        }, {})
        
        const newProLabores: ProLaboreItem[] = Object.values(grouped)
        await salvarCenario({ ...cenario, pro_labores: newProLabores })
        setFeedback({ type: 'success', message: `Quadro de Pró-labore atualizado com ${newProLabores.length} diretores!` })
      } else {
        throw new Error('Modelo de planilha não reconhecido. Use os modelos disponíveis para download.')
      }
    } catch (err: any) {
      console.error(err)
      setFeedback({ type: 'error', message: err.message || 'Erro ao processar arquivo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0]
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0]
    }

    if (file) {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result
          const wb = XLSX.read(bstr, { type: 'binary' })
          const wsname = wb.SheetNames[0]
          const ws = wb.Sheets[wsname]
          const data: any[] = XLSX.utils.sheet_to_json(ws)
          processData(data)
        } catch (err) {
          setFeedback({ type: 'error', message: 'Erro na leitura do arquivo Excel.' })
        }
      }
      reader.readAsBinaryString(file)
    }
  }

  return (
    <div className="dashboard-content animate-in fade-in duration-500 flex flex-col flex-1">
      <div className="page-header mb-8">
        <div>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium">Suba suas planilhas para atualizar o sistema em massa.</p>
        </div>
      </div>

      {feedback && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-xs font-bold">{feedback.message}</p>
          <button onClick={() => setFeedback(null)} className="ml-auto text-[10px] uppercase font-black opacity-50 hover:opacity-100">Fechar</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Templates Download Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="table-card p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Download size={18} />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Modelos Disponíveis</h2>
            </div>
            
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Use nossos modelos padrão para garantir que os dados sejam importados corretamente sem erros de formatação.
            </p>

            <div className="space-y-3 flex-1">
              <button 
                onClick={() => downloadTemplate('financeiro')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-gray-100">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-900">Financeiro</div>
                    <div className="text-[10px] text-gray-400">Receitas e Despesas</div>
                  </div>
                </div>
                <Download size={16} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
              </button>

              <button 
                onClick={() => downloadTemplate('associados')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-900">Associados</div>
                    <div className="text-[10px] text-gray-400">Cadastro de Membros</div>
                  </div>
                </div>
                <Download size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
              </button>

              <button 
                onClick={() => downloadTemplate('prolabore')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-rose-600 shadow-sm border border-gray-100">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-900">Pró-labore</div>
                    <div className="text-[10px] text-gray-400">Períodos da Diretoria</div>
                  </div>
                </div>
                <Download size={16} className="text-gray-300 group-hover:text-rose-600 transition-colors" />
              </button>
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex gap-3">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-800 leading-normal">
                  <strong>Importante:</strong> Não altere os nomes das colunas (cabeçalho) dos modelos para evitar erros de leitura pelo sistema.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <label 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
            className={`table-card p-8 flex flex-col items-center justify-center text-center border-2 border-dashed transition-all bg-gray-50/50 flex-1 cursor-pointer 
              ${isDragging ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 hover:border-emerald-300'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileUpload}
            />
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-emerald-600 mb-6 border border-gray-100 animate-bounce-slow">
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Arraste seus arquivos aqui</h3>
            <p className="text-sm text-gray-500 mb-8 max-w-sm">
              Suporta arquivos .xlsx, .csv e .json. O sistema processará os dados e atualizará o dashboard instantaneamente.
            </p>
            <button 
              onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
              className={`px-8 py-3 bg-[#0e2d22] text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-900/10 hover:-translate-y-0.5 transition-all flex items-center gap-2 ${loading || !tenantId ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading || !tenantId}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  PROCESSANDO...
                </>
              ) : !tenantId ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  IDENTIFICANDO CONTA...
                </>
              ) : 'Selecionar Arquivo'}
            </button>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Validação Automática</div>
                <p className="text-[10px] text-gray-500 mt-1">Dados são conferidos antes da gravação para evitar duplicidade.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Logs de Importação</div>
                <p className="text-[10px] text-gray-500 mt-1">Histórico completo de tudo que foi importado por usuário.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
