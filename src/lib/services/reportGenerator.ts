import { reportStyles } from '../utils/reportStyles';
import { fmtR, MESES } from '../utils/formatters';

interface ReportOptions {
  title: string;
  period: string;
  treasurer: string;
  sections: string[];
  charts: Record<string, string>;
  logoUrl?: string;
  data: {
    metrics: any;
    financeiro: any[];
    associados: any[];
    comparativo?: any[]; // Dados detalhados de planejamento
  }
}

export function generateReportHtml({ title, period, treasurer, sections, charts, logoUrl, data }: ReportOptions) {
  const sectionsHtml = sections.map(section => {
    switch (section) {
      case 'dashboard': return buildDashboardSection(data.metrics, charts);
      case 'financeiro': return buildFinanceiroSection(data.financeiro);
      case 'associados': return buildAssociadosSection(data.associados);
      case 'planejamento': return buildPlanejamentoSection(data.comparativo || [], data.metrics);
      case 'projecoes': return buildProjectionsSection(data.metrics);
      case 'projetos': return `<div class="page-divider"></div><h2 class="section-title">Projetos</h2><p>Módulo de projetos em desenvolvimento no relatório.</p>`;
      case 'graficos': return buildChartsSection(charts, true);
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
          <div class="cover-logo" style="${logoUrl ? 'background: transparent; box-shadow: none; width: auto; height: 80px;' : ''}">
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 80px; max-width: 250px; object-fit: contain; border-radius: 12px;" onerror="this.style.display='none'" />` : `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            `}
          </div>
          <h1 class="cover-title">${title}</h1>
          <div class="cover-subtitle">${period}</div>
          <div style="margin-top: 40px; font-weight: bold; opacity: 0.8; font-size: 14px;">Responsável: ${treasurer}</div>
        </div>
        <div class="cover-footer">Documento Gerencial Confidencial — Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>

      <div class="container">
        <div class="report-page-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--slate-100); padding-bottom: 15px; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 40px; border-radius: 6px; object-fit: contain;" onerror="this.style.display='none'" />` : ''}
            <div>
              <h2 style="margin: 0; font-size: 14px; font-weight: 900; color: var(--slate-900); text-transform: uppercase;">${title}</h2>
              <p style="margin: 2px 0 0; font-size: 9px; color: var(--slate-400); font-weight: bold;">${period}</p>
            </div>
          </div>
          <div style="font-size: 9px; color: var(--slate-400); font-weight: bold; text-transform: uppercase;">Responsável: ${treasurer}</div>
        </div>
        ${sectionsHtml}
      </div>
    </body>
    </html>
  `;
}

function buildDashboardSection(metrics: any, charts?: Record<string, string>) {
  const kpis = [
    { label: 'Ingresso Total', value: fmtR(metrics.receitaTotal), color: 'var(--emerald)' },
    { label: 'Dispêndio Total', value: fmtR(metrics.despesasTotais), color: '#ef4444' },
    { label: 'Superávit/Déficit Líquido', value: fmtR(metrics.resultadoPeriodo), color: 'var(--slate-800)' },
    { label: 'Associados Ativos', value: metrics.associadosAtivos, color: 'var(--slate-800)' },
    { label: 'Taxa Recuperada', value: fmtR(metrics.taxasRecuperadas), color: 'var(--emerald)' },
    { label: 'Planejado vs Realizado', value: (metrics.planejamentoStats?.percentual || 0).toFixed(0) + '%', color: 'var(--slate-800)' },
  ];

  const dashboardChartTitles = ['Fluxo Mensal Consolidado', 'Mix da Carteira', 'Pendências ZapSign', 'Atingimento de Metas'];
  const dashboardCharts = charts ? Object.entries(charts).filter(([title]) => dashboardChartTitles.includes(title)) : [];

  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Dashboard Executivo</h2>
    <div class="kpi-grid">
      ${kpis.map(k => `
        <div class="kpi-box">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value" style="color: ${k.color}">${k.value}</div>
        </div>
      `).join('')}
    </div>

    ${dashboardCharts.length > 0 ? `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px;">
        ${dashboardCharts.map(([title, dataUrl]) => `
          <div class="chart-container" style="margin-bottom: 0;">
            <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px;">${title}</div>
            <img src="${dataUrl}" class="chart-img" />
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function buildFinanceiroSection(lancamentos: any[]) {
  const ingressos = lancamentos.filter(l => l.tipo === 'receita').sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const dispendios = lancamentos.filter(l => l.tipo === 'despesa').sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const renderTable = (items: any[], title: string, color: string) => `
    <div style="margin-top: 30px;">
      <h3 style="font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
        <span style="width: 8px; height: 8px; border-radius: 2px; background: ${color};"></span>
        ${title} (${items.length})
      </h3>
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
              <td class="text-right font-bold" style="color: ${l.tipo === 'receita' ? '#10b981' : '#ef4444'}">
                ${l.tipo === 'receita' ? '+' : '-'}${fmtR(l.valor)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Fluxo Financeiro Detalhado</h2>
    ${renderTable(ingressos, 'Ingressos', '#10b981')}
    ${renderTable(dispendios, 'Dispêndios', '#ef4444')}
  `;
}

function buildAssociadosSection(associados: any[]) {
  const ativos = associados.filter(a => (a.status || '').toLowerCase().includes('ativ')).sort((a,b) => a.nome.localeCompare(b.nome));
  const pendentes = associados.filter(a => !(a.status || '').toLowerCase().includes('ativ')).sort((a,b) => a.nome.localeCompare(b.nome));

  const renderTable = (items: any[], title: string) => `
    <div style="margin-top: 30px;">
      <h3 style="font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 15px;">${title} (${items.length})</h3>
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
              <td style="font-weight: bold; color: ${a.status?.toLowerCase().includes('ativ') ? '#10b981' : '#f59e0b'}">${a.status?.toUpperCase()}</td>
              <td>${new Date(a.data_ingresso || a.created_at).toLocaleDateString('pt-BR')}</td>
              <td class="text-right font-bold">${fmtR(a.mensalidade)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Quadro de Associados</h2>
    ${renderTable(ativos, 'Associados Ativos')}
    ${renderTable(pendentes, 'Associados Pendentes e Outros')}
  `;
}

function buildChartsSection(charts: Record<string, string>, skipDashboard = false) {
  const dashboardChartTitles = ['Fluxo Mensal Consolidado', 'Mix da Carteira', 'Pendências ZapSign', 'Atingimento de Metas'];
  const filteredCharts = skipDashboard 
    ? Object.entries(charts).filter(([title]) => !dashboardChartTitles.includes(title))
    : Object.entries(charts);

  if (filteredCharts.length === 0) return '';

  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Análise Gráfica Complementar</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      ${filteredCharts.map(([name, dataUrl]) => `
        <div class="chart-container">
          <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px;">${name}</div>
          <img src="${dataUrl}" class="chart-img" />
        </div>
      `).join('')}
    </div>
  `;
}

function buildPlanejamentoSection(comparativo: any[], metrics: any) {
  const totalIngresso = metrics.receitaTotal || 1;
  const dispItems = comparativo.filter(c => c.tipo === 'despesa' && c.planejado > 0)
    .sort((a,b) => b.planejado - a.planejado);

  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Planejamento e Metas</h2>
    
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 15px;">Comparativo de Metas</h3>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th class="text-right">Meta (Planejado)</th>
            <th class="text-right">Realizado</th>
            <th class="text-right">Desvio</th>
          </tr>
        </thead>
        <tbody>
          ${comparativo.slice(0, 15).map(c => {
            const diff = c.tipo === 'receita' ? (c.realizado - c.planejado) : (c.planejado - c.realizado);
            return `
              <tr>
                <td>${c.categoria}</td>
                <td class="text-right">${fmtR(c.planejado)}</td>
                <td class="text-right">${fmtR(c.realizado)}</td>
                <td class="text-right font-bold" style="color: ${diff >= 0 ? '#10b981' : '#ef4444'}">
                  ${diff > 0 ? '+' : ''}${fmtR(diff)}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div>
      <h3 style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 15px;">Impacto nos Ingressos (Top Dispêndios)</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${dispItems.slice(0, 8).map(item => {
          const pct = ((item.planejado / totalIngresso) * 100).toFixed(1);
          return `
            <div class="report-card" style="padding: 15px; margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-bottom: 8px;">
                <span style="color: #1e293b;">${item.categoria}</span>
                <span style="color: #64748b;">${pct}% do Ingresso</span>
              </div>
              <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${pct}%; background: #10b981;"></div>
              </div>
              <div style="font-size: 10px; font-weight: bold; color: #94a3b8; margin-top: 5px;">${fmtR(item.planejado)}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function buildProjectionsSection(metrics: any) {
  const { recProv, despProv } = metrics;
  
  return `
    <div class="page-divider"></div>
    <h2 class="section-title">Projeções Financeiras</h2>
    <p style="font-size: 11px; color: #64748b; margin-bottom: 20px;">Visão consolidada de ingressos e dispêndios provisionados para o ano corrente.</p>
    
    <table>
      <thead>
        <tr>
          <th>Mês</th>
          <th class="text-right">Ingresso Projetado</th>
          <th class="text-right">Dispêndio Projetado</th>
          <th class="text-right">Superávit/Déficit Projetado</th>
        </tr>
      </thead>
      <tbody>
        ${MESES.map((m, i) => {
          const rp = recProv[i] || 0;
          const dp = despProv[i] || 0;
          const saldo = Math.round((rp - dp) * 100) / 100;
          if (rp === 0 && dp === 0) return '';
          return `
            <tr>
              <td><span style="font-weight: 800; color: #1e293b;">${m}</span></td>
              <td class="text-right text-emerald">${fmtR(rp)}</td>
              <td class="text-right" style="color: #ef4444">${fmtR(dp)}</td>
              <td class="text-right font-bold" style="background: ${saldo >= 0 ? '#f0fdf4' : '#fef2f2'}; border-radius: 8px;">${fmtR(saldo)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="report-card" style="margin-top: 30px; background: #0e2d22; color: white; border: none;">
      <h4 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #10b981;">Análise de Projeção</h4>
      <p style="margin: 0; font-size: 11px; line-height: 1.6; opacity: 0.8;">
        As projeções acima refletem todos os lançamentos em status 'aberto' cadastrados no sistema. 
        Note que o superávit projetado é uma estimativa baseada na concretização integral dos ingressos previstos e na manutenção do teto de gastos configurado para os dispêndios.
      </p>
    </div>
  `;
}
