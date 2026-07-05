import React, { useState } from 'react';
import { CheckCircle, Download, FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function SlideMensagemFinal() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadAta = () => {
    setIsGenerating(true);
    
    // Simulate some generation time for better UX
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString('pt-BR');
        
        // Configuração de Fonte e Cores
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(2, 8, 6); // EIP Dark
        
        // Título
        doc.text("ATA EXECUTIVA DE REUNIÃO", 105, 30, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Data da Reunião: ${date}`, 105, 40, { align: "center" });
        
        // Linha Divisória
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 48, 190, 48);
        
        // Corpo do texto
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        
        let cursorY = 60;
        const addSection = (title: string, content: string[]) => {
          doc.setFont("helvetica", "bold");
          doc.text(title, 20, cursorY);
          cursorY += 8;
          
          doc.setFont("helvetica", "normal");
          content.forEach(line => {
            // Trata quebra de linha automática
            const splitText = doc.splitTextToSize(line, 170);
            doc.text(splitText, 20, cursorY);
            cursorY += (splitText.length * 6) + 4;
          });
          
          cursorY += 5;
        };
        
        addSection("1. RESUMO EXECUTIVO", [
          "A associação encerra o período mantendo equilíbrio financeiro, crescimento da base de associados e capacidade operacional para sustentar sua expansão.",
          "O Índice de Saúde (Health Score) indicou uma organização em condição EXCELENTE, com base nas metas estipuladas pelo conselho diretivo."
        ]);
        
        addSection("2. PRINCIPAIS INSIGHTS DO MOTOR (EIP)", [
          "• Financeiro: A receita demonstrou crescimento estável, indicando saúde na arrecadação principal.",
          "• Inadimplência: A taxa encontra-se dentro das metas, porém necessita vigilância em faixas de atraso longo (acima de 90 dias).",
          "• Operações: O volume de atendimentos aumentou 12% no último trimestre, mas o SLA de resposta permaneceu estável em 98%."
        ]);
        
        addSection("3. DELIBERAÇÕES E TAREFAS (MODO CONSELHO)", [
          "• [Aprovado] Plano de redução de despesas operacionais em 5% no próximo semestre.",
          "• [Ação Pendente] Assinatura das 3 atas do conselho ainda pendentes de formalização digital pela diretoria jurídica.",
          "• [Campanha] Focar esforço comercial na aquisição de novos associados Pessoa Jurídica no próximo mês."
        ]);
        
        // Assinaturas
        cursorY += 20;
        doc.setDrawColor(150, 150, 150);
        doc.line(30, cursorY, 90, cursorY);
        doc.line(120, cursorY, 180, cursorY);
        
        cursorY += 8;
        doc.setFont("helvetica", "bold");
        doc.text("Presidente / CEO", 60, cursorY, { align: "center" });
        doc.text("Diretor Conselheiro", 150, cursorY, { align: "center" });

        // Rodapé
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Documento gerado automaticamente pelo Éllus Gestão Estratégica (EIP).", 105, 280, { align: "center" });

        doc.save(`Ata_Executiva_Conselho_${date.replace(/\//g, '-')}.pdf`);
      } catch (error) {
        console.error("Erro ao gerar PDF", error);
      } finally {
        setIsGenerating(false);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative overflow-hidden">
      {/* Decoração */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center px-12">
        <CheckCircle className="text-emerald-400 mb-8" size={80} />
        
        <h1 className="text-5xl font-black mb-6">Apresentação Concluída</h1>
        
        <p className="text-2xl font-light leading-relaxed text-white/80 max-w-4xl mb-12">
          "A associação encerra o período mantendo equilíbrio financeiro, crescimento da base de associados e capacidade operacional para sustentar sua expansão."
        </p>

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={handleDownloadAta}
            disabled={isGenerating}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-black transition-all shadow-lg shadow-emerald-900/50 uppercase tracking-widest text-sm
              ${isGenerating ? 'bg-emerald-800 text-white/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
          >
            {isGenerating ? (
              <><Loader2 size={18} className="animate-spin" /> Gerando PDF...</>
            ) : (
              <><Download size={18} /> Baixar Ata Executiva Automática (PDF)</>
            )}
          </button>
          <p className="text-white/40 text-sm flex items-center gap-2 mt-2">
            <FileText size={14} />
            Inclui todos os insights gerados e tarefas delegadas no Modo Conselho.
          </p>
        </div>
      </div>
    </div>
  );
}
