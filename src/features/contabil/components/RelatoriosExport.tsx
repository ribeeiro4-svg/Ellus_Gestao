import React from 'react'
import { FileText, Printer, Book, Building2, Target, FileBarChart, BookOpen } from 'lucide-react'
import Balancete from './Balancete'
import Demonstracoes from './Demonstracoes'
import DFC from './DFC'
import LivroDiario from './LivroDiario'
import LivroRazao from './LivroRazao'
import Imobilizado from './Imobilizado'
import ExecucaoRubrica from './ExecucaoRubrica'
import { useTenant } from '@/lib/hooks/useTenant'

export default function RelatoriosExport({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  const { tenant } = useTenant()
  
  const handleImprimir = (id: string, titulo: string) => {
    const conteudo = document.getElementById(id)
    if (!conteudo) {
      alert(`O relatório "${titulo}" está sendo processado. Por favor, aguarde um segundo e tente novamente.`)
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
            
            .header { background-color: #0b2218; display: flex; align-items: center; justify-content: flex-start; padding: 25px 35px; margin-bottom: 30px; border-radius: 12px; }
            .header-logo { max-height: 45px; margin-right: 20px; border-radius: 8px; object-fit: contain; }
            .header-info { text-align: left; }
            .header h1 { margin: 0; font-size: 20px; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; }
            .header p { margin: 6px 0 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: 700; }
            .bg-slate-50, .bg-indigo-50, .bg-blue-50, .bg-emerald-50, .bg-rose-50, .bg-amber-50 { background-color: #f8fafc !important; }
            .indent { padding-left: 30px !important; }
            
            .footer { margin-top: 60px; background-color: #ffffff; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; padding-bottom: 20px; font-weight: 600; letter-spacing: 0.5px; }
            .footer-logo { height: 50px; margin-bottom: 10px; }
            
            button, .no-print, .actions, select, .flex-wrap { display: none !important; }
            
            @media print { 
              @page { size: A4 landscape; margin: 1cm; } 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .bg-slate-50, .bg-indigo-50, .bg-blue-50, .bg-emerald-50, .bg-rose-50, .bg-amber-50 { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${tenant?.logo_url ? `<img src="${tenant.logo_url}" class="header-logo" onerror="this.style.display='none'" />` : ''}
            <div class="header-info">
              <h1>${tenant?.nome || 'Associação'}</h1>
              <p>${titulo.toUpperCase()} | CONFORMIDADE ITG 2002 (R1) | RELATÓRIO OFICIAL</p>
            </div>
          </div>
          <div style="zoom: 0.9">
            ${conteudo.innerHTML}
          </div>
          <div class="footer">
            <img src="/ellos_logo_v2.svg" class="footer-logo" onerror="this.style.display='none'" /><br/>
            Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} pelo sistema Éllos Gestão
          </div>
        </body>
      </html>
    `)
    janela.document.close()
    setTimeout(() => {
      janela.print()
      janela.close()
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { id: 'diario-print', title: 'Livro Diário', desc: 'Livro de escrituração cronológica e sistemática', icon: Book },
          { id: 'razao-print', title: 'Livro Razão', desc: 'Razão analítico contendo saldos e movimentos', icon: BookOpen },
          { id: 'bal-print', title: 'Balancete Patrimonial', desc: 'Verificação de débitos, créditos e saldos atuais', icon: FileBarChart },
          { id: 'bp-print', title: 'Balanço Patrimonial', desc: 'Demonstração da posição financeira e patrimonial', icon: FileText },
          { id: 'dsd-print', title: 'Demonstração de Superávit', desc: 'DSD — Resultado das atividades do período', icon: FileText },
          { id: 'dfc-print', title: 'Fluxo de Caixa (DFC)', desc: 'Movimentação financeira pelo método direto', icon: FileText },
          { id: 'imob-print', title: 'Registro de Imobilizado', desc: 'Controle de bens, tombamento e depreciação', icon: Building2 },
          { id: 'mrosc-print', title: 'MROSC / Projetos', desc: 'Execução de rubricas e prestação de contas', icon: Target },
        ].map((rel, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all mb-4">
                <rel.icon size={20} />
              </div>
              <h4 className="text-sm font-black text-slate-800 mb-1">{rel.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium mb-6">{rel.desc}</p>
            </div>
            
            <button 
              onClick={() => handleImprimir(rel.id, rel.title)}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Printer size={12} />
              Emitir Relatório
            </button>
          </div>
        ))}
      </div>

      <div className="hidden pointer-events-none opacity-0 overflow-hidden h-0">
        <div id="diario-print"><LivroDiario lancHook={lancHook} planoHook={planoHook} /></div>
        <div id="razao-print"><LivroRazao lancHook={lancHook} planoHook={planoHook} /></div>
        <div id="bal-print"><Balancete lancHook={lancHook} planoHook={planoHook} /></div>
        <div id="bp-print"><Demonstracoes lancHook={lancHook} planoHook={planoHook} initialTab="bp" /></div>
        <div id="dsd-print"><Demonstracoes lancHook={lancHook} planoHook={planoHook} initialTab="dsd" /></div>
        <div id="dfc-print"><DFC lancHook={lancHook} planoHook={planoHook} /></div>
        <div id="imob-print"><Imobilizado planoHook={planoHook} /></div>
        <div id="mrosc-print"><ExecucaoRubrica lancHook={lancHook} /></div>
      </div>

      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
        <span className="text-xl">📄</span>
        <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
          Este painel permite a emissão direta dos relatórios oficiais em formato PDF. 
          Certifique-se de que os dados foram conferidos no Livro Diário antes de gerar os documentos finais para prestação de contas.
        </p>
      </div>
    </div>
  )
}
