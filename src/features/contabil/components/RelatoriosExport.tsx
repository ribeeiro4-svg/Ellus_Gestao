'use client'
import React from 'react'
import { FileText, Printer, FileSpreadsheet } from 'lucide-react'

export default function RelatoriosExport({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  
  const imprimirRelatorio = (titulo: string, idElemento: string) => {
    const conteudo = document.getElementById(idElemento)
    if (!conteudo) return

    const janela = window.open('', '', 'width=900,height=700')
    if (!janela) return

    janela.document.write(`
      <html>
        <head>
          <title>${titulo} — ACPROBEC</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 800; color: #475569; text-transform: uppercase; font-size: 10px; }
            .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 20px; color: #1e293b; }
            .header p { margin: 5px 0 0; font-size: 12px; color: #64748b; font-weight: bold; }
            .total { font-weight: 800; background-color: #f1f5f9; }
            .text-right { text-align: right; }
            .indent { padding-left: 30px; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ASSOCIACAO COMUNITARIA PROBEC — ACPROBEC</h1>
            <p>${titulo.toUpperCase()}</p>
            <p style="font-size: 10px; font-weight: normal;">Emitido em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          ${conteudo.innerHTML}
          <div style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #94a3b8;">
            Relatório gerado automaticamente pelo Sistema Inovacont ACPROBEC — Conformidade ITG 2002 (R1)
          </div>
        </body>
      </html>
    `)
    janela.document.close()
    setTimeout(() => {
      janela.print()
      janela.close()
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { id: 'bp-print', title: 'Balanço Patrimonial', desc: 'Posição financeira (Ativo vs Passivo)', icon: FileText },
          { id: 'dsd-print', title: 'Demonstração de Superávit', desc: 'DSD — Resultado do Exercício', icon: FileText },
          { id: 'dfc-print', title: 'Fluxo de Caixa (DFC)', desc: 'Movimentação líquida de disponibilidades', icon: FileText },
        ].map((rel, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all mb-4">
              <rel.icon size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-800 mb-1">{rel.title}</h4>
            <p className="text-[10px] text-slate-400 font-medium mb-6">{rel.desc}</p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => alert('Dica: Selecione a aba do relatório desejado abaixo antes de imprimir para garantir que os dados estejam carregados.')}
                className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={12} />
                IMPRIMIR PDF
              </button>
              <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                <FileSpreadsheet size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Instrução */}
      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
        <span className="text-xl">📄</span>
        <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
          Para gerar os relatórios em PDF, navegue até a aba correspondente (Ex: Balancete ou Demonstrações) e use o botão de impressão lá disponível. 
          Este painel centraliza o acesso aos layouts oficiais de prestação de contas.
        </p>
      </div>
    </div>
  )
}
