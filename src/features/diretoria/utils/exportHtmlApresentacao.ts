import type { ApresentacaoData } from '../hooks/useApresentacaoData'
import type { Meta } from '@/lib/types'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtR(v: number) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(v: number) {
  return v.toFixed(1) + '%'
}

function slideBase(content: string, accent = '#10b981') {
  return `
  <section class="slide" style="background:#040d0a;">
    <div class="hex-bg"></div>
    <div class="slide-inner">${content}</div>
  </section>`
}

function buildCapaSlide(data: ApresentacaoData) {
  return slideBase(`
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:28px;text-align:center;">
      <div style="width:80px;height:80px;border-radius:24px;background:#0e2d22;border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;">
        <img src="${data.tenantLogo}" style="width:52px;height:52px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:6px 16px;border-radius:999px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);">
        <div style="width:6px;height:6px;border-radius:50%;background:#34d399;animation:pulse 2s infinite;"></div>
        <span style="font-size:11px;font-weight:900;color:#34d399;letter-spacing:3px;text-transform:uppercase;">Reunião de Diretoria</span>
      </div>
      <div>
        <h1 style="font-size:80px;font-weight:900;color:#fff;line-height:1;margin:0;">Relatório</h1>
        <h1 style="font-size:80px;font-weight:900;color:#10b981;line-height:1;margin:0;">Gerencial</h1>
        <p style="font-size:20px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:4px;text-transform:uppercase;margin-top:12px;">${MESES_FULL[data.mesAtual]} / ${data.anoAtual}</p>
      </div>
      <p style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.5);letter-spacing:3px;text-transform:uppercase;">${data.tenantNome}</p>
      <div style="display:flex;align-items:center;gap:8px;margin-top:20px;color:rgba(255,255,255,0.15);">
        <div style="width:32px;height:1px;background:rgba(255,255,255,0.15);"></div>
        <span style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Use as setas ou clique para navegar</span>
        <div style="width:32px;height:1px;background:rgba(255,255,255,0.15);"></div>
      </div>
    </div>`)
}

function buildResumoSlide(data: ApresentacaoData) {
  const { kpis } = data
  const isPositivo = kpis.resultadoMes >= 0
  function kpiCard(label: string, val: string, sub: string, borderColor: string) {
    return `<div style="padding:24px;border-radius:24px;background:rgba(255,255,255,0.05);border:1px solid ${borderColor};display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.35);">${label}</p>
      <div style="font-size:44px;font-weight:900;color:#fff;line-height:1;">${val}</div>
      <p style="font-size:11px;color:rgba(255,255,255,0.25);font-weight:600;">${sub}</p>
    </div>`
  }
  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:20px;">
      <div>
        <p class="label-accent" style="color:#10b981;">Resumo Executivo</p>
        <h2 class="slide-title">Saúde da Associação</h2>
        <p class="slide-sub">${MESES_FULL[data.mesAtual]} / ${data.anoAtual}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;">
        ${kpiCard('Saldo em Caixa', fmtR(kpis.saldoCaixa), 'Posição consolidada', 'rgba(16,185,129,0.2)')}
        ${kpiCard('Receita no Mês', fmtR(kpis.receitaMes), 'Valores efetivados', 'rgba(59,130,246,0.2)')}
        ${kpiCard('Taxa de Inadimplência', fmtPct(kpis.inadimplenciaRate), fmtR(kpis.inadimplenciaValor) + ' em aberto', kpis.inadimplenciaRate > 15 ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.2)')}
        ${kpiCard('Associados Ativos', String(kpis.totalAtivos), '+' + kpis.novasAdesoesCount + ' no período', 'rgba(139,92,246,0.2)')}
      </div>
      <div style="padding:20px;border-radius:20px;border:1px solid ${isPositivo ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'};background:${isPositivo ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)'};display:flex;justify-content:space-between;align-items:center;">
        <div>
          <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.35);">Resultado do Período</p>
          <div style="font-size:32px;font-weight:900;color:${isPositivo ? '#10b981' : '#f43f5e'};">${fmtR(kpis.resultadoMes)}</div>
        </div>
        <span style="font-size:36px;">${isPositivo ? '📈' : '📉'}</span>
      </div>
    </div>`)
}

function buildFluxoSlide(data: ApresentacaoData) {
  const { fluxo6Meses } = data
  const maxVal = Math.max(...fluxo6Meses.map(m => Math.max(m.receita, m.despesa)), 1)
  const totalRec = fluxo6Meses.reduce((s, m) => s + m.receita, 0)
  const totalDesp = fluxo6Meses.reduce((s, m) => s + m.despesa, 0)

  function bar(height: number, color: string, label: string) {
    const pct = Math.max((height / maxVal) * 100, 2)
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
      <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);">${height > 0 ? 'R$' + Math.round(height/1000) + 'k' : ''}</div>
      <div style="height:${Math.round(pct * 1.2)}px;width:100%;border-radius:6px;background:${color};min-height:4px;"></div>
    </div>`
  }

  const barsHTML = fluxo6Meses.map(m => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;">
      <div style="display:flex;align-items:flex-end;gap:4px;width:100%;height:130px;">
        ${bar(m.receita, 'rgba(16,185,129,0.7)', m.label)}
        ${bar(m.despesa, 'rgba(251,113,133,0.5)', m.label)}
      </div>
      <span style="font-size:11px;font-weight:900;color:rgba(255,255,255,0.4);">${m.label}</span>
    </div>`).join('')

  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <p class="label-accent" style="color:#10b981;">Financeiro</p>
          <h2 class="slide-title">Fluxo de Caixa</h2>
          <p class="slide-sub">Últimos 6 meses — valores efetivados</p>
        </div>
        <div style="display:flex;gap:16px;">
          <div style="text-align:right;"><p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Entradas</p><div style="font-size:20px;font-weight:900;color:#10b981;">${fmtR(totalRec)}</div></div>
          <div style="width:1px;background:rgba(255,255,255,0.1);"></div>
          <div style="text-align:right;"><p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Saídas</p><div style="font-size:20px;font-weight:900;color:#fb7185;">${fmtR(totalDesp)}</div></div>
        </div>
      </div>
      <div style="flex:1;padding:20px;border-radius:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;align-items:flex-end;gap:16px;height:100%;">${barsHTML}</div>
      </div>
      <div style="display:flex;gap:16px;justify-content:center;">
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:3px;background:rgba(16,185,129,0.7);"></div><span style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:700;">Receitas</span></div>
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:3px;background:rgba(251,113,133,0.5);"></div><span style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:700;">Despesas</span></div>
      </div>
    </div>`)
}

function buildComposicaoSlide(data: ApresentacaoData) {
  const REC_COLORS = ['#10b981','#34d399','#6ee7b7','#a7f3d0','#d1fae5','#065f46']
  const DESP_COLORS = ['#fb7185','#fb923c','#fbbf24','#a78bfa','#38bdf8','#ef4444']

  function donutSection(title: string, items: typeof data.composicaoReceitas, colors: string[]) {
    const total = items.reduce((s, i) => s + i.valor, 0)
    return `<div style="flex:1;padding:24px;border-radius:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
      <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-bottom:16px;">${title}</p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${items.map((item, i) => `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:10px;height:10px;border-radius:50%;background:${colors[i]||'#666'};"></div>
                <span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.6);">${item.categoria}</span>
              </div>
              <span style="font-size:12px;font-weight:900;color:rgba(255,255,255,0.8);">${fmtPct(item.percentual)}</span>
            </div>
            <div style="height:4px;background:rgba(255,255,255,0.08);border-radius:4px;">
              <div style="height:4px;width:${Math.min(item.percentual,100)}%;background:${colors[i]||'#666'};border-radius:4px;"></div>
            </div>
          </div>`).join('')}
        <p style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:8px;text-align:right;">Total: ${fmtR(total)}</p>
      </div>
    </div>`
  }

  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:20px;">
      <div>
        <p class="label-accent" style="color:#10b981;">Financeiro</p>
        <h2 class="slide-title">Composição Financeira</h2>
        <p class="slide-sub">De onde vem e para onde vai o dinheiro</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;">
        ${donutSection('Composição de Receitas', data.composicaoReceitas, REC_COLORS)}
        ${donutSection('Composição de Despesas', data.composicaoDespesas, DESP_COLORS)}
      </div>
    </div>`)
}

function buildInadimplenciaSlide(data: ApresentacaoData) {
  const { kpis } = data
  const rate = Math.min(Math.max(kpis.inadimplenciaRate, 0), 100)
  const isAlarm = rate > 20
  const isWarning = rate > 10 && rate <= 20
  const fillColor = isAlarm ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'
  const statusLabel = isAlarm ? '🔴 Nível Crítico' : isWarning ? '🟡 Atenção' : '🟢 Nível Saudável'

  const R = 80, cx = 100, cy = 100
  const circumference = Math.PI * R
  const offset = circumference - (rate / 100) * circumference
  const svgGauge = `<svg width="200" height="110" viewBox="0 0 200 110" style="display:block;margin:0 auto;">
    <path d="M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}" fill="none" stroke="#1a2e22" stroke-width="14" stroke-linecap="round"/>
    <path d="M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}" fill="none" stroke="${fillColor}" stroke-width="14" stroke-linecap="round"
      stroke-dasharray="${circumference} ${circumference}" stroke-dashoffset="${offset}"/>
    <text x="${cx}" y="${cy-8}" text-anchor="middle" fill="white" font-size="28" font-weight="900">${rate.toFixed(1)}%</text>
    <text x="${cx}" y="${cy+10}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9" font-weight="700" letter-spacing="2">INADIMPLÊNCIA</text>
    <text x="${cx-R-4}" y="${cy+18}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9">0%</text>
    <text x="${cx+R+4}" y="${cy+18}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9">100%</text>
  </svg>`

  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:20px;">
      <div>
        <p class="label-accent" style="color:#f43f5e;">Ponto de Atenção</p>
        <h2 class="slide-title">Inadimplência</h2>
        <p class="slide-sub">Associados com lançamentos em atraso</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px;border-radius:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
          ${svgGauge}
          <div style="padding:6px 20px;border-radius:999px;background:${isAlarm ? 'rgba(244,63,94,0.15)' : isWarning ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'};border:1px solid ${isAlarm ? 'rgba(244,63,94,0.2)' : isWarning ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'};">
            <span style="font-size:11px;font-weight:900;color:${fillColor};text-transform:uppercase;letter-spacing:1px;">${statusLabel}</span>
          </div>
          <div style="text-align:center;">
            <p style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:900;text-transform:uppercase;letter-spacing:1px;">Valor Total em Aberto</p>
            <div style="font-size:22px;font-weight:900;color:#f43f5e;">${fmtR(kpis.inadimplenciaValor)}</div>
          </div>
        </div>
        <div style="padding:24px;border-radius:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
          <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-bottom:16px;">⚠️ Maiores Devedores</p>
          ${kpis.topDevedores.length === 0
            ? '<p style="color:rgba(255,255,255,0.2);font-size:14px;font-weight:700;margin-top:40px;text-align:center;">Nenhuma inadimplência!</p>'
            : kpis.topDevedores.map((dev, i) => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
              <div style="width:24px;height:24px;border-radius:8px;background:${i===0?'rgba(244,63,94,0.2)':'rgba(255,255,255,0.05)'};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:${i===0?'#f43f5e':'rgba(255,255,255,0.4)'};">${i+1}</div>
              <div style="flex:1;">
                <p style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.75);">${dev.nome}</p>
                <p style="font-size:10px;color:rgba(255,255,255,0.3);">${dev.diasAtraso} dias em atraso</p>
              </div>
              <p style="font-size:13px;font-weight:900;color:#f43f5e;">${fmtR(dev.valor)}</p>
            </div>`).join('')}
        </div>
      </div>
    </div>`)
}

function buildAssociadosSlide(data: ApresentacaoData) {
  const { kpis, evolucaoAssociados } = data
  const crescimento = evolucaoAssociados.length >= 2
    ? evolucaoAssociados[evolucaoAssociados.length - 1].ativos - evolucaoAssociados[0].ativos
    : 0
  const maxAtivos = Math.max(...evolucaoAssociados.map(e => e.ativos), 1)

  const linePoints = evolucaoAssociados.map((e, i) => {
    const x = (i / (evolucaoAssociados.length - 1)) * 380 + 10
    const y = 120 - ((e.ativos / maxAtivos) * 100)
    return `${x},${y}`
  }).join(' ')

  const svgLine = evolucaoAssociados.length > 1 ? `<svg width="400" height="130" viewBox="0 0 400 130" style="width:100%;height:130px;">
    <polyline points="${linePoints}" fill="none" stroke="rgba(139,92,246,0.8)" stroke-width="2.5" stroke-linejoin="round"/>
    ${evolucaoAssociados.map((e, i) => {
      const x = (i / (evolucaoAssociados.length - 1)) * 380 + 10
      const y = 120 - ((e.ativos / maxAtivos) * 100)
      return `<circle cx="${x}" cy="${y}" r="4" fill="#8b5cf6"/>
        <text x="${x}" y="${y - 10}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="9">${e.ativos}</text>
        <text x="${x}" y="128" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="9" font-weight="700">${e.label}</text>`
    }).join('')}
  </svg>` : ''

  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <p class="label-accent" style="color:#8b5cf6;">Saúde da Base</p>
          <h2 class="slide-title">Associados</h2>
          <p class="slide-sub">Evolução e saúde da base associativa</p>
        </div>
        <div style="display:flex;gap:12px;">
          <div style="padding:16px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.2);text-align:center;min-width:90px;">
            <div style="font-size:32px;font-weight:900;color:#8b5cf6;">${kpis.totalAtivos}</div>
            <p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Ativos</p>
          </div>
          <div style="padding:16px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(16,185,129,0.2);text-align:center;min-width:90px;">
            <div style="font-size:32px;font-weight:900;color:#10b981;">+${kpis.novasAdesoesCount}</div>
            <p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Novas Adesões</p>
          </div>
          <div style="padding:16px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid ${crescimento >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'};text-align:center;min-width:90px;">
            <div style="font-size:32px;font-weight:900;color:${crescimento >= 0 ? '#10b981' : '#f43f5e'};">${crescimento >= 0 ? '+' : ''}${crescimento}</div>
            <p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Crescimento</p>
          </div>
        </div>
      </div>
      <div style="flex:1;padding:20px;border-radius:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;">
        ${svgLine || '<p style="color:rgba(255,255,255,0.2);">Dados insuficientes para gráfico</p>'}
      </div>
    </div>`)
}

function buildProjecoesSlide(data: ApresentacaoData) {
  const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const maxVal = Math.max(...([] as number[]).concat(
    data.fluxo6Meses.map(m => m.receita),
    data.fluxo6Meses.map(m => m.despesa)
  ), 1)

  // Use fluxo data as proxy for projections table
  const rows = data.fluxo6Meses.map(m => `
    <tr>
      <td>${m.label}</td>
      <td style="color:#10b981;">${fmtR(m.receita)}</td>
      <td style="color:#fb7185;">${fmtR(m.despesa)}</td>
      <td style="color:${m.resultado >= 0 ? '#fbbf24' : '#f43f5e'};">${fmtR(m.resultado)}</td>
    </tr>`).join('')

  const totalRec = data.fluxo6Meses.reduce((s, m) => s + m.receita, 0)
  const totalDesp = data.fluxo6Meses.reduce((s, m) => s + m.despesa, 0)

  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <p class="label-accent" style="color:#3b82f6;">Para Onde Vamos</p>
          <h2 class="slide-title">Projeções e Consolidado</h2>
          <p class="slide-sub">Realizado dos últimos 6 meses</p>
        </div>
        <div style="display:flex;gap:12px;">
          <div style="padding:16px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(16,185,129,0.2);text-align:right;">
            <p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Total Receitas</p>
            <div style="font-size:20px;font-weight:900;color:#10b981;">${fmtR(totalRec)}</div>
          </div>
          <div style="padding:16px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(251,113,133,0.2);text-align:right;">
            <p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Total Despesas</p>
            <div style="font-size:20px;font-weight:900;color:#fb7185;">${fmtR(totalDesp)}</div>
          </div>
        </div>
      </div>
      <div style="flex:1;overflow:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
              <th style="text-align:left;padding:10px;color:rgba(255,255,255,0.4);font-weight:900;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Mês</th>
              <th style="text-align:right;padding:10px;color:rgba(255,255,255,0.4);font-weight:900;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Receita</th>
              <th style="text-align:right;padding:10px;color:rgba(255,255,255,0.4);font-weight:900;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Despesa</th>
              <th style="text-align:right;padding:10px;color:rgba(255,255,255,0.4);font-weight:900;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Resultado</th>
            </tr>
          </thead>
          <tbody style="color:rgba(255,255,255,0.7);font-weight:700;">
            ${data.fluxo6Meses.map(m => `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:10px;font-weight:900;">${m.label}</td>
              <td style="padding:10px;text-align:right;color:#10b981;">${fmtR(m.receita)}</td>
              <td style="padding:10px;text-align:right;color:#fb7185;">${fmtR(m.despesa)}</td>
              <td style="padding:10px;text-align:right;color:${m.resultado >= 0 ? '#fbbf24' : '#f43f5e'};">${fmtR(m.resultado)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`)
}

function buildMetasSlide(data: ApresentacaoData) {
  const metasComPct = data.metas.map(m => ({
    ...m,
    pct: m.valor_meta > 0 ? Math.min((m.valor_realizado / m.valor_meta) * 100, 100) : 0
  }))
  const concluidas = metasComPct.filter(m => m.pct >= 100).length

  function getColor(pct: number, prazo: string) {
    if (pct >= 100) return '#10b981'
    const prazoDate = prazo ? new Date(prazo) : null
    if (prazoDate && prazoDate < new Date() && pct < 100) return '#f43f5e'
    if (pct >= 70) return '#f59e0b'
    return '#6b7280'
  }

  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <p class="label-accent" style="color:#f97316;">Accountability</p>
          <h2 class="slide-title">Metas e OKRs</h2>
          <p class="slide-sub">Progresso das iniciativas estratégicas</p>
        </div>
        <div style="display:flex;gap:12px;">
          <div style="padding:12px 20px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(16,185,129,0.2);text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#10b981;">${concluidas}</div>
            <p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.3);text-transform:uppercase;">Concluídas</p>
          </div>
          <div style="padding:12px 20px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#fff;">${data.metas.length}</div>
            <p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.3);text-transform:uppercase;">Total</p>
          </div>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:12px;overflow:hidden;">
        ${metasComPct.length === 0
          ? '<p style="color:rgba(255,255,255,0.2);text-align:center;margin-top:40px;">Nenhuma meta cadastrada</p>'
          : metasComPct.slice(0, 7).map(meta => {
            const color = getColor(meta.pct, meta.prazo)
            const badge = meta.pct >= 100 ? '✓ Concluída' : (new Date(meta.prazo) < new Date() && meta.pct < 100 ? 'Atrasada' : meta.pct >= 70 ? 'Em Andamento' : 'Iniciada')
            return `<div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <p style="flex:1;font-size:13px;font-weight:900;color:rgba(255,255,255,0.75);">${meta.meta}</p>
                <span style="font-size:9px;font-weight:900;color:${color};background:${color}22;border:1px solid ${color}33;padding:3px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:1px;">${badge}</span>
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:6px;">
                  <div style="height:6px;width:${meta.pct}%;background:${color};border-radius:6px;"></div>
                </div>
                <span style="font-size:11px;font-weight:900;color:rgba(255,255,255,0.5);width:36px;text-align:right;">${meta.pct.toFixed(0)}%</span>
              </div>
              ${meta.prazo ? `<p style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:4px;">${meta.responsavel} · Prazo: ${new Date(meta.prazo).toLocaleDateString('pt-BR')}</p>` : ''}
            </div>`}).join('')}
      </div>
    </div>`)
}

function buildDecisoesSlide() {
  const decisoesSalvas = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem('ellus_decisoes_diretoria') || '[]') } catch { return [] } })()
    : ['Aprovação do orçamento do mês seguinte', 'Revisão da meta de arrecadação', 'Ações de cobrança para inadimplentes']

  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:20px;">
      <div>
        <p class="label-accent" style="color:#38bdf8;">Fechamento com Ação</p>
        <h2 class="slide-title">Decisões & Próximos Passos</h2>
        <p class="slide-sub">Pontos que exigem deliberação da diretoria</p>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:12px;">
        ${decisoesSalvas.length === 0
          ? '<p style="color:rgba(255,255,255,0.2);text-align:center;margin-top:40px;">Nenhum ponto de pauta cadastrado</p>'
          : decisoesSalvas.map((d: string, i: number) => `
          <div style="display:flex;align-items:flex-start;gap:12px;padding:16px;border-radius:18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
            <div style="width:28px;height:28px;border-radius:10px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#38bdf8;flex-shrink:0;">${i+1}</div>
            <p style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.7);line-height:1.5;">${d}</p>
          </div>`).join('')}
      </div>
    </div>`)
}

export function gerarHtmlApresentacao(data: ApresentacaoData): string {
  const slides = [
    buildCapaSlide(data),
    buildResumoSlide(data),
    buildFluxoSlide(data),
    buildComposicaoSlide(data),
    buildInadimplenciaSlide(data),
    buildAssociadosSlide(data),
    buildProjecoesSlide(data),
    buildMetasSlide(data),
    buildDecisoesSlide(),
  ]

  const SLIDE_TITLES = ['Abertura','Resumo Executivo','Fluxo de Caixa','Composição Financeira','Inadimplência','Associados','Projeções','Metas e OKRs','Decisões']

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Apresentação de Diretoria — ${data.tenantNome} — ${MESES_FULL[data.mesAtual]} ${data.anoAtual}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #040d0a; color: #fff; overflow: hidden; height: 100vh; width: 100vw; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes fadeIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
    @keyframes fadeInLeft { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
    .hex-bg { position:absolute;inset:0;opacity:0.18;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1' stroke-opacity='0.4'/%3E%3C/svg%3E");background-size:56px 100px; }
    .slide { position:absolute;inset:0;display:none;overflow:hidden; }
    .slide.active { display:flex; }
    .slide.anim-next { animation: fadeIn 280ms cubic-bezier(0.4,0,0.2,1) both; }
    .slide.anim-prev { animation: fadeInLeft 280ms cubic-bezier(0.4,0,0.2,1) both; }
    .slide-inner { position:relative;z:10;padding:40px 48px;width:100%;height:100%;overflow:hidden; }
    .label-accent { font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;margin-bottom:4px; }
    .slide-title { font-size:36px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1.1; }
    .slide-sub { font-size:13px;color:rgba(255,255,255,0.3);font-weight:600;margin-top:4px; }

    /* Progress bar */
    #progress-bar { position:fixed;top:0;left:0;right:0;z-index:100;display:flex;gap:6px;padding:14px 32px; }
    .prog-seg { height:3px;flex:1;border-radius:3px;background:rgba(255,255,255,0.12);transition:all .4s; }
    .prog-seg.done { background:rgba(16,185,129,0.4); }
    .prog-seg.active { background:#10b981; }

    /* Counter */
    #counter { position:fixed;top:14px;right:32px;z-index:100;font-size:10px;font-weight:900;color:rgba(255,255,255,0.35);letter-spacing:2px; }

    /* Arrows */
    .arrow-btn { position:fixed;top:50%;z-index:100;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);display:flex;align-items:center;justify-content:center;cursor:pointer;transform:translateY(-50%);transition:all .2s;font-size:20px;opacity:0; }
    body:hover .arrow-btn { opacity:1; }
    .arrow-btn:hover { background:rgba(255,255,255,0.15);color:#fff; }
    #btn-prev { left:12px; }
    #btn-next { right:12px; }

    /* Dots */
    #dots { position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:100;display:flex;gap:6px;align-items:center; }
    .dot { border-radius:999px;transition:all .3s;background:rgba(255,255,255,0.2); }
    .dot.active { background:#10b981;width:20px;height:6px; }
    .dot:not(.active) { width:6px;height:6px; }

    /* Controls bar */
    #controls { position:fixed;bottom:40px;right:24px;z-index:100;display:flex;gap:8px;opacity:0;transition:opacity .2s; }
    body:hover #controls { opacity:1; }
    .ctrl-btn { padding:6px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px; }
    .ctrl-btn:hover { background:rgba(255,255,255,0.12);color:#fff; }
  </style>
</head>
<body>
  <!-- Progress -->
  <div id="progress-bar">
    ${SLIDE_TITLES.map((_, i) => `<div class="prog-seg" id="seg-${i}"></div>`).join('')}
  </div>
  <div id="counter">1 / ${slides.length}</div>

  <!-- Arrows -->
  <button class="arrow-btn" id="btn-prev" onclick="prev()">&#8249;</button>
  <button class="arrow-btn" id="btn-next" onclick="next()">&#8250;</button>

  <!-- Controls -->
  <div id="controls">
    <button class="ctrl-btn" onclick="toggleFS()">⛶ Tela Cheia</button>
  </div>

  <!-- Dots -->
  <div id="dots">
    ${SLIDE_TITLES.map((_, i) => `<div class="dot" id="dot-${i}"></div>`).join('')}
  </div>

  <!-- Slides -->
  ${slides.join('\n')}

  <script>
    const total = ${slides.length};
    let cur = 0;
    const sections = document.querySelectorAll('.slide');

    function show(n, dir) {
      sections[cur].classList.remove('active','anim-next','anim-prev');
      cur = Math.max(0, Math.min(n, total - 1));
      const s = sections[cur];
      s.classList.add('active');
      s.classList.remove('anim-next','anim-prev');
      void s.offsetWidth;
      s.classList.add(dir === 'next' ? 'anim-next' : 'anim-prev');
      update();
    }
    function next() { if(cur < total-1) show(cur+1,'next'); }
    function prev() { if(cur > 0) show(cur-1,'prev'); }

    function update() {
      document.getElementById('counter').textContent = (cur+1) + ' / ' + total;
      document.querySelectorAll('.prog-seg').forEach((s,i) => {
        s.classList.toggle('active', i===cur);
        s.classList.toggle('done', i<cur);
      });
      document.querySelectorAll('.dot').forEach((d,i) => d.classList.toggle('active',i===cur));
      document.getElementById('btn-prev').style.visibility = cur===0?'hidden':'visible';
      document.getElementById('btn-next').style.visibility = cur===total-1?'hidden':'visible';
    }

    function toggleFS() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }

    document.addEventListener('keydown', e => {
      if (e.key==='ArrowRight'||e.key===' '){e.preventDefault();next();}
      if (e.key==='ArrowLeft'){e.preventDefault();prev();}
      if (e.key==='f'||e.key==='F') toggleFS();
    });

    // Init
    sections[0].classList.add('active','anim-next');
    update();
  </script>
</body>
</html>`
}

export function downloadHtmlApresentacao(data: ApresentacaoData) {
  const html = gerarHtmlApresentacao(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Apresentacao_Diretoria_${data.tenantNome.replace(/\s+/g,'_')}_${MESES_FULL[data.mesAtual]}_${data.anoAtual}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
