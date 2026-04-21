import { reportStyles } from '../utils/reportStyles';
import { fmtR, MESES } from '../utils/formatters';

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
    comparativo?: any[]; // Dados detalhados de planejamento
  }
}

export function generateReportHtml(options: ReportOptions) {
  const { title, period, treasurer, sections, charts, data } = options;

  const sectionsHtml = sections.map(section => {
    switch (section) {
      case 'dashboard': return buildDashboardSection(data.metrics);
      case 'financeiro': return buildFinanceiroSection(data.financeiro);
      case 'associados': return buildAssociadosSection(data.associados);
      case 'planejamento': return buildPlanejamentoSection(data.comparativo || [], data.metrics);
      case 'projecoes': return buildProjectionsSection(data.metrics);
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
  const receitas = lancamentos.filter(l => l.tipo === 'receita').sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const despesas = lancamentos.filter(l => l.tipo === 'despesa').sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());

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
    ${renderTable(receitas, 'Receitas', '#10b981')}
    ${renderTable(despesas, 'Despesas', '#ef4444')}
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

function buildPlanejamentoSection(comparativo: any[], metrics: any) {
  const totalRevenue = metrics.receitaTotal || 1;
  const expItems = comparativo.filter(c => c.tipo === 'despesa' && c.planejado > 0)
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
      <h3 style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 15px;">Impacto nas Receitas (Top Despesas)</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${expItems.slice(0, 8).map(item => {
          const pct = ((item.planejado / totalRevenue) * 100).toFixed(1);
          return `
            <div class="report-card" style="padding: 15px; margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-bottom: 8px;">
                <span style="color: #1e293b;">${item.categoria}</span>
                <span style="color: #64748b;">${pct}% da Receita</span>
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
    <p style="font-size: 11px; color: #64748b; margin-bottom: 20px;">Visão consolidada de receitas e despesas provisionadas para o ano corrente.</p>
    
    <table>
      <thead>
        <tr>
          <th>Mês</th>
          <th class="text-right">Receita Projetada</th>
          <th class="text-right">Despesa Projetada</th>
          <th class="text-right">Saldo Projetado</th>
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
        Note que o saldo projetado é uma estimativa baseada na concretização integral das receitas previstas e na manutenção do teto de gastos configurado para as despesas.
      </p>
    </div>
  `;
}
