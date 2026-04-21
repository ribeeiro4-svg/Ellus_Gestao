import { reportStyles } from '../utils/reportStyles';
import { fmtR } from '../utils/formatters';

interface ReportOptions {
  title: string;
  period: string;
  treasurer: string;
  sections: string[];
  charts: Record<string, string>; // Base64 images
  data: {
    metrics: any;
    financeiro: any[];
    associados: any[];
  }
}

export function generateReportHtml(options: ReportOptions) {
  const { title, period, treasurer, sections, charts, data } = options;

  const sectionsHtml = sections.map(section => {
    switch (section) {
      case 'dashboard': return buildDashboardSection(data.metrics);
      case 'financeiro': return buildFinanceiroSection(data.financeiro);
      case 'associados': return buildAssociadosSection(data.associados);
      case 'projetos': return `<div class="page-divider"></div><h2 class="section-title">Projetos</h2><p>Módulo de projetos em desenvolvimento no relatório.</p>`;
      case 'graficos': return buildChartsSection(charts);
      default: return '';
    }
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>${reportStyles}</style>
    </head>
    <body>
      <div class="cover">
        <div class="cover-content">
          <div class="cover-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 class="cover-title">${title}</h1>
          <div class="cover-subtitle">${period}</div>
          <div style="margin-top: 40px; font-weight: bold; opacity: 0.8; font-size: 14px;">Responsável: ${treasurer}</div>
        </div>
        <div class="cover-footer">Documento Gerencial Confidencial — Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>

      <div class="container">
        ${sectionsHtml}
      </div>
    </body>
    </html>
  `;
}

function buildDashboardSection(metrics: any) {
  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Dashboard Executivo</h2>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Receita Total</div>
        <div class="kpi-value text-emerald">${fmtR(metrics.receitaTotal)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Despesa Total</div>
        <div class="kpi-value" style="color: #ef4444">${fmtR(metrics.despesaTotal)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Resultado Líquido</div>
        <div class="kpi-value">${fmtR(metrics.saldoTotal)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Associados Ativos</div>
        <div class="kpi-value">${metrics.associadosStats.ativos}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Taxa Recuperada</div>
        <div class="kpi-value text-emerald">${fmtR(metrics.taxaRecuperada)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Planejado vs Realizado</div>
        <div class="kpi-value">${metrics.planejamentoStats.percentual}%</div>
      </div>
    </div>
  `;
}

function buildFinanceiroSection(lancamentos: any[]) {
  // Pegar os 20 últimos para o relatório ou algo similar
  const items = lancamentos.slice(0, 25);
  
  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Fluxo Financeiro Recente</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th class="text-right">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(l => `
          <tr>
            <td>${new Date(l.data).toLocaleDateString('pt-BR')}</td>
            <td>${l.descricao}</td>
            <td>${l.categoria || 'Geral'}</td>
            <td class="text-right font-bold ${l.tipo === 'receita' ? 'text-emerald' : ''}">${l.tipo === 'receita' ? '+' : '-'}${fmtR(l.valor)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function buildAssociadosSection(associados: any[]) {
  const items = associados.slice(0, 20);
  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Quadro de Associados</h2>
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Status</th>
          <th>Ingresso</th>
          <th class="text-right">Mensalidade</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(a => `
          <tr>
            <td>${a.nome}</td>
            <td style="font-weight: bold; color: ${a.status === 'ativo' ? '#10b981' : '#64748b'}">${a.status?.toUpperCase()}</td>
            <td>${new Date(a.data_ingresso || a.created_at).toLocaleDateString('pt-BR')}</td>
            <td class="text-right font-bold">${fmtR(a.mensalidade)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function buildChartsSection(charts: Record<string, string>) {
  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Análise Gráfica</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      ${Object.entries(charts).map(([name, dataUrl]) => `
        <div class="chart-container">
          <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px;">${name}</div>
          <img src="${dataUrl}" class="chart-img" />
        </div>
      `).join('')}
    </div>
  `;
}
