import React from 'react'
import { FileText, Printer, FileSpreadsheet, Loader2 } from 'lucide-react'
import Balancete from './Balancete'
import Demonstracoes from './Demonstracoes'
import DFC from './DFC'

export default function RelatoriosExport({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  
  const handleImprimir = (id: string, titulo: string) => {
    const conteudo = document.getElementById(id)
    if (!conteudo) {
      alert(`O relatório "${titulo}" ainda não foi carregado ou não está disponível para impressão direta deste painel.`)
      return
    }

    const janela = window.open('', '_blank')
    if (!janela) {
      alert('Bloqueio de pop-up detectado!')
      return
    }

    janela.document.write(`
      <html>
        <head>
          <title>${titulo} — ACPROBEC</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: left; }
            .text-right { text-align: right; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: 700; }
            .bg-slate-50, .bg-indigo-50, .bg-blue-50, .bg-emerald-50, .bg-rose-50, .bg-amber-50 { background-color: #f8fafc !important; }
            .indent { padding-left: 30px !important; }
            .footer { margin-top: 40px; text-align: right; font-size: 9px; color: #94a3b8; }
            @media print { @page { size: A4; margin: 1.5cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACPROBEC — ${titulo.toUpperCase()}</h1>
            <p>CONFORMIDADE ITG 2002 (R1) | RELATÓRIO OFICIAL</p>
          </div>
          ${conteudo.innerHTML}
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | Inovacont ACPROBEC</div>
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
          { id: 'bal-print', title: 'Balancete Patrimonial', desc: 'Verificação de débitos e créditos', icon: FileText },
          { id: 'mrosc-print', title: 'MROSC / Projetos', desc: 'Execução de rubricas por centro de custo', icon: FileText },
        ].map((rel, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all mb-4">
              <rel.icon size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-800 mb-1">{rel.title}</h4>
            <p className="text-[10px] text-slate-400 font-medium mb-6">{rel.desc}</p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleImprimir(rel.id, rel.title)}
                className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={12} />
                IMPRIMIR AGORA
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Renderização Oculta para Captura de Dados */}
      <div className="hidden">
        <div id="bp-print">
          <Demonstracoes lancHook={lancHook} planoHook={planoHook} initialTab="bp" />
        </div>
        <div id="dsd-print">
          <Demonstracoes lancHook={lancHook} planoHook={planoHook} initialTab="dsd" />
        </div>
        <div id="dfc-print">
          <DFC lancHook={lancHook} planoHook={planoHook} />
        </div>
        <div id="bal-print">
          <Balancete lancHook={lancHook} planoHook={planoHook} />
        </div>
        {/* MROSC e Imobilizado exigem seleções complexas ou hooks específicos que podem quebrar se renderizados ocultos sem props ideais */}
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
