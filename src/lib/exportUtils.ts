import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Exporta um elemento HTML como PDF tirando um "snapshot" de alta qualidade.
 * @param elementId O ID do container HTML que será exportado.
 * @param filename O nome do arquivo (sem extensão).
 */
export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    // Adiciona uma classe temporária para ajustar estilos para exportação (opcional)
    element.classList.add('exporting-pdf');

    const canvas = await html2canvas(element, {
      scale: 2, // Maior nitidez
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff' // Força fundo branco para evitar artefatos no dark mode
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Calcula dimensões para caber numa folha A4 em modo paisagem
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;
    
    // Mantém a proporção do snapshot
    let finalWidth = pdfWidth;
    let finalHeight = finalWidth / imgRatio;

    // Se a altura for maior que a folha, escala pela altura
    if (finalHeight > pdfHeight) {
      finalHeight = pdfHeight;
      finalWidth = finalHeight * imgRatio;
    }

    // Centraliza horizontalmente e verticalmente
    const marginX = (pdfWidth - finalWidth) / 2;
    const marginY = (pdfHeight - finalHeight) / 2;

    pdf.addImage(imgData, 'JPEG', marginX, marginY, finalWidth, finalHeight);
    pdf.save(`${filename}.pdf`);

  } catch (error) {
    console.error('Failed to export PDF:', error);
  } finally {
    element.classList.remove('exporting-pdf');
  }
}

/**
 * Exporta um array de objetos para um arquivo Excel (.xlsx).
 * @param data Array de dados.
 * @param filename Nome do arquivo (sem extensão).
 * @param sheetName Nome da aba no Excel.
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Dados') {
  if (!data || data.length === 0) {
    console.warn('No data to export.');
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-ajuste simples de largura de colunas baseado nas chaves do primeiro objeto
    const cols = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length, 15) }));
    worksheet['!cols'] = cols;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Failed to export Excel:', error);
  }
}
