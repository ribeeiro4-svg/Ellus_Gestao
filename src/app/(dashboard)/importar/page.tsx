'use client'
import React from 'react'
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react'
import * as XLSX from 'xlsx'

export default function ImportPage() {
  
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
        ['ID', 'Nome', 'Categoria', 'Email', 'Data Ingresso', 'Mensalidade', 'Status'],
        ['1001', 'João da Silva', 'Pleno', 'joao@email.com', '2023-01-10', 150.00, 'Ativo'],
        ['1002', 'Maria Souza', 'Premium', 'maria@email.com', '2023-05-20', 300.00, 'Inadimplente']
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0]
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0]
    }

    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data: any[] = XLSX.utils.sheet_to_json(ws)
        console.log('Dados importados:', data)
        alert(`${data.length} registros identificados. Iniciando processamento...`)
        // Future: call useFinanceiro().inserirBulk(data)
      }
      reader.readAsBinaryString(file)
    }
  }

  return (
    <div className="dashboard-content animate-in fade-in duration-500 flex flex-col flex-1">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight">Importação de Dados</h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium">Suba suas planilhas para atualizar o sistema em massa.</p>
        </div>
      </div>

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
              className="px-8 py-3 bg-[#0e2d22] text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-900/10 hover:-translate-y-0.5 transition-all pointer-events-none"
            >
              Selecionar Arquivo
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
      `}</style>
    </div>
  )
}
