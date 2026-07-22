import type { ApresentacaoData } from '../hooks/useApresentacaoData'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtR(v: number) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(v: number) {
  return v.toFixed(1) + '%'
}

function trendBadge(variacao: number, reverseColors = false) {
  if (!isFinite(variacao) || isNaN(variacao) || variacao === 0) {
    return `<span style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1);padding:4px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">— 0%</span>`
  }
  const isPositive = variacao > 0
  const isGood = reverseColors ? !isPositive : isPositive
  const color = isGood ? '#10b981' : '#f43f5e'
  const bg = isGood ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'
  const icon = isPositive ? '↗' : '↘'
  return `<span style="font-size:14px;font-weight:900;color:${color};background:${bg};padding:4px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">${icon} ${Math.abs(variacao).toFixed(1)}%</span>`
}

// Icons
const ICONS = {
  trendingUp: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>`,
  trendingDown: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>`,
  alert: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  clipboard: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h6"></path><path d="M9 10h6"></path><path d="M9 18h6"></path></svg>`
}

function slideBase(content: string) {
  return `
  <section class="slide" style="background:#040d0a;">
    <div class="hex-bg animate-parallax"></div>
    <div class="slide-inner">${content}</div>
  </section>`
}

function buildCapaSlide(data: ApresentacaoData) {
  return slideBase(`
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:32px;text-align:center;">
      <div style="width:100px;height:100px;border-radius:28px;background:#0e2d22;border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 48px rgba(16,185,129,0.25);">
        <img src="${data.tenantLogo}" style="width:64px;height:64px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:8px 20px;border-radius:999px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.25);">
        <div style="width:8px;height:8px;border-radius:50%;background:#34d399;animation:pulse 2s infinite;"></div>
        <span style="font-size:14px;font-weight:900;color:#34d399;letter-spacing:3px;text-transform:uppercase;">Reunião de Diretoria</span>
      </div>
      <div>
        <h1 style="font-size:96px;font-weight:900;color:#fff;line-height:1;margin:0;">Relatório</h1>
        <h1 style="font-size:96px;font-weight:900;color:#10b981;line-height:1;margin:0;">Gerencial</h1>
        <p style="font-size:24px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:4px;text-transform:uppercase;margin-top:16px;">${MESES_FULL[data.mesAtual]} / ${data.anoAtual}</p>
      </div>
      <p style="font-size:18px;font-weight:900;color:rgba(255,255,255,0.7);letter-spacing:3px;text-transform:uppercase;">${data.tenantNome}</p>
    </div>`)
}

function buildResumoSlide(data: ApresentacaoData) {
  const { kpis } = data
  const isPositivo = kpis.resultadoMes >= 0
  
  function kpiCard(label: string, val: number, prefix: string, suffix: string, decimals: number, sub: string, borderColor: string, trendHtml: string) {
    return `<div style="padding:28px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid ${borderColor};display:flex;flex-direction:column;gap:16px;position:relative;overflow:hidden;" class="card-hover">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <p style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.6);">${label}</p>
        ${trendHtml}
      </div>
      <div style="font-size:52px;font-weight:900;color:#fff;line-height:1;"><span class="count-up" data-val="${val}" data-prefix="${prefix}" data-suffix="${suffix}" data-decimals="${decimals}">0</span></div>
      <p style="font-size:15px;color:rgba(255,255,255,0.5);font-weight:600;">${sub}</p>
    </div>`
  }
  
  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:24px;">
      <div>
        <p class="label-accent" style="color:#10b981;">Resumo Executivo</p>
        <h2 class="slide-title">Saúde da Associação</h2>
        <p class="slide-sub">${MESES_FULL[data.mesAtual]} / ${data.anoAtual}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;">
        ${kpiCard('Saldo em Caixa', kpis.saldoCaixa, 'R$ ', '', 2, 'Posição consolidada', 'rgba(16,185,129,0.3)', '')}
        ${kpiCard('Receita no Mês', kpis.receitaMes, 'R$ ', '', 2, 'Valores efetivados', 'rgba(59,130,246,0.3)', trendBadge(kpis.variacaoReceita, false))}
        ${kpiCard('Taxa de Inadimplência', kpis.inadimplenciaRate, '', '%', 1, fmtR(kpis.inadimplenciaValor) + ' em aberto', kpis.inadimplenciaRate > 15 ? 'rgba(244,63,94,0.4)' : 'rgba(245,158,11,0.3)', trendBadge(kpis.variacaoInadimplencia, true))}
        ${kpiCard('Associados Ativos', kpis.totalAtivos, '', '', 0, '+' + kpis.novasAdesoesCount + ' no período', 'rgba(139,92,246,0.3)', trendBadge(kpis.variacaoAtivos, false))}
      </div>
      <div style="padding:24px;border-radius:24px;border:1px solid ${isPositivo ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'};background:${isPositivo ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'};display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="display:flex;align-items:center;gap:16px;">
            <p style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.7);">Resultado do Período</p>
            ${trendBadge(kpis.variacaoResultado, false)}
          </div>
          <div style="font-size:40px;font-weight:900;color:${isPositivo ? '#10b981' : '#f43f5e'}; margin-top:8px;"><span class="count-up" data-val="${kpis.resultadoMes}" data-prefix="R$ " data-suffix="" data-decimals="2">0</span></div>
        </div>
        <div style="width:64px;height:64px;border-radius:16px;background:${isPositivo?'rgba(16,185,129,0.25)':'rgba(244,63,94,0.25)'};color:${isPositivo?'#10b981':'#f43f5e'};display:flex;align-items:center;justify-content:center;">
          ${isPositivo ? ICONS.trendingUp : ICONS.trendingDown}
        </div>
      </div>
    </div>`)
}

function buildFluxoSlide(data: ApresentacaoData) {
  const { fluxo6Meses } = data
  const maxVal = Math.max(...fluxo6Meses.map(m => Math.max(m.receita, m.despesa)), 1)
  const totalRec = fluxo6Meses.reduce((s, m) => s + m.receita, 0)
  const totalDesp = fluxo6Meses.reduce((s, m) => s + m.despesa, 0)

  const barsHTML = fluxo6Meses.map((m, i) => {
    const rPct = Math.max((m.receita / maxVal) * 100, 2)
    const dPct = Math.max((m.despesa / maxVal) * 100, 2)
    return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;flex:1;">
      <div style="display:flex;align-items:flex-end;gap:6px;width:100%;height:200px;position:relative;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;height:100%;justify-content:flex-end;">
          <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.7);">${m.receita > 0 ? 'R$' + Math.round(m.receita/1000) + 'k' : ''}</div>
          <svg width="100%" height="${rPct}%" preserveAspectRatio="none" viewBox="0 0 100 100" class="svg-bar" style="animation-delay:${i*0.1}s">
            <rect x="0" y="0" width="100" height="100" fill="rgba(16,185,129,0.85)" rx="8"></rect>
          </svg>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;height:100%;justify-content:flex-end;">
          <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.7);">${m.despesa > 0 ? 'R$' + Math.round(m.despesa/1000) + 'k' : ''}</div>
          <svg width="100%" height="${dPct}%" preserveAspectRatio="none" viewBox="0 0 100 100" class="svg-bar" style="animation-delay:${i*0.1+0.05}s">
            <rect x="0" y="0" width="100" height="100" fill="rgba(251,113,133,0.75)" rx="8"></rect>
          </svg>
        </div>
      </div>
      <span style="font-size:15px;font-weight:900;color:rgba(255,255,255,0.7);">${m.label}</span>
    </div>`
  }).join('')

  return slideBase(`
    <style>
      .svg-bar { transform-origin:bottom; animation: scaleYUp 0.8s cubic-bezier(0.4,0,0.2,1) both; border-radius:8px; }
      @keyframes scaleYUp { from { transform: scaleY(0); } to { transform: scaleY(1); } }
    </style>
    <div style="display:flex;flex-direction:column;height:100%;gap:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <p class="label-accent" style="color:#10b981;">Financeiro</p>
          <h2 class="slide-title">Fluxo de Caixa</h2>
          <p class="slide-sub">Últimos 6 meses — valores efetivados</p>
        </div>
        <div style="display:flex;gap:20px;">
          <div style="text-align:right;"><p style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Entradas</p><div style="font-size:28px;font-weight:900;color:#10b981;"><span class="count-up" data-val="${totalRec}" data-prefix="R$ " data-decimals="0">0</span></div></div>
          <div style="width:2px;background:rgba(255,255,255,0.15);"></div>
          <div style="text-align:right;"><p style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Saídas</p><div style="font-size:28px;font-weight:900;color:#fb7185;"><span class="count-up" data-val="${totalDesp}" data-prefix="R$ " data-decimals="0">0</span></div></div>
        </div>
      </div>
      <div style="flex:1;padding:24px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
        <div style="display:flex;align-items:flex-end;gap:20px;height:100%;">${barsHTML}</div>
      </div>
      <div style="display:flex;gap:24px;justify-content:center;">
        <div style="display:flex;align-items:center;gap:8px;"><div style="width:16px;height:16px;border-radius:4px;background:rgba(16,185,129,0.85);"></div><span style="font-size:14px;color:rgba(255,255,255,0.8);font-weight:700;">Receitas</span></div>
        <div style="display:flex;align-items:center;gap:8px;"><div style="width:16px;height:16px;border-radius:4px;background:rgba(251,113,133,0.75);"></div><span style="font-size:14px;color:rgba(255,255,255,0.8);font-weight:700;">Despesas</span></div>
      </div>
    </div>`)
}

function buildComposicaoSlide(data: ApresentacaoData) {
  const REC_COLORS = ['#10b981','#34d399','#6ee7b7','#a7f3d0','#d1fae5','#065f46']
  const DESP_COLORS = ['#fb7185','#fb923c','#fbbf24','#a78bfa','#38bdf8','#ef4444']

  function donutSection(title: string, items: typeof data.composicaoReceitas, colors: string[]) {
    const total = items.reduce((s, i) => s + i.valor, 0)
    return `<div style="flex:1;padding:28px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
      <p style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.6);margin-bottom:20px;">${title}</p>
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${items.map((item, i) => `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:14px;height:14px;border-radius:50%;background:${colors[i]||'#666'};"></div>
                <span style="font-size:16px;font-weight:700;color:rgba(255,255,255,0.85);">${item.categoria}</span>
              </div>
              <span style="font-size:16px;font-weight:900;color:rgba(255,255,255,0.9);">${fmtPct(item.percentual)}</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.12);border-radius:6px;overflow:hidden;">
              <div class="anim-w" style="height:6px;width:${Math.min(item.percentual,100)}%;background:${colors[i]||'#666'};border-radius:6px;transition:width 1s cubic-bezier(0.4,0,0.2,1);--end-w:${Math.min(item.percentual,100)}%;"></div>
            </div>
          </div>`).join('')}
        <p style="font-size:14px;color:rgba(255,255,255,0.6);margin-top:12px;text-align:right;">Total: <span class="count-up" data-val="${total}" data-prefix="R$ " data-decimals="2">0</span></p>
      </div>
    </div>`
  }

  return slideBase(`
    <style>
      .slide:not(.active) .anim-w { width:0 !important; }
      .slide.active .anim-w { width:var(--end-w) !important; }
    </style>
    <div style="display:flex;flex-direction:column;height:100%;gap:24px;">
      <div>
        <p class="label-accent" style="color:#10b981;">Financeiro</p>
        <h2 class="slide-title">Composição Financeira</h2>
        <p class="slide-sub">De onde vem e para onde vai o dinheiro</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;">
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
  const statusLabel = isAlarm ? 'Nível Crítico' : isWarning ? 'Atenção' : 'Nível Saudável'

  const R = 90, cx = 110, cy = 110
  const circumference = Math.PI * R
  const offset = circumference - (rate / 100) * circumference
  const svgGauge = `<svg width="220" height="120" viewBox="0 0 220 120" style="display:block;margin:0 auto;">
    <path d="M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}" fill="none" stroke="#1a2e22" stroke-width="18" stroke-linecap="round"/>
    <path class="gauge-anim" d="M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}" fill="none" stroke="${fillColor}" stroke-width="18" stroke-linecap="round"
      stroke-dasharray="${circumference} ${circumference}" stroke-dashoffset="${circumference}" style="--target-offset:${offset}; transition: stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1);"/>
    <text x="${cx}" y="${cy-10}" text-anchor="middle" fill="white" font-size="34" font-weight="900"><tspan class="count-up" data-val="${rate}" data-suffix="%" data-decimals="1">0%</tspan></text>
    <text x="${cx}" y="${cy+14}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="12" font-weight="700" letter-spacing="2">INADIMPLÊNCIA</text>
    <text x="${cx-R-6}" y="${cy+22}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="12">0%</text>
    <text x="${cx+R+6}" y="${cy+22}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="12">100%</text>
  </svg>`

  return slideBase(`
    <style>
      .slide:not(.active) .gauge-anim { stroke-dashoffset: 282.7 !important; }
      .slide.active .gauge-anim { stroke-dashoffset: var(--target-offset) !important; }
    </style>
    <div style="display:flex;flex-direction:column;height:100%;gap:24px;">
      <div>
        <p class="label-accent" style="color:#f43f5e;">Ponto de Atenção</p>
        <h2 class="slide-title">Inadimplência</h2>
        <p class="slide-sub">Associados com lançamentos em atraso</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:28px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
          ${svgGauge}
          <div style="display:flex;align-items:center;gap:8px;padding:8px 24px;border-radius:999px;background:${isAlarm ? 'rgba(244,63,94,0.15)' : isWarning ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'};border:1px solid ${isAlarm ? 'rgba(244,63,94,0.3)' : isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'};">
            <div style="width:8px;height:8px;border-radius:50%;background:${fillColor};animation:pulse 2s infinite;"></div>
            <span style="font-size:14px;font-weight:900;color:${fillColor};text-transform:uppercase;letter-spacing:1px;">${statusLabel}</span>
          </div>
          <div style="text-align:center;">
            <p style="font-size:13px;color:rgba(255,255,255,0.6);font-weight:900;text-transform:uppercase;letter-spacing:1px;">Valor Total em Aberto</p>
            <div style="font-size:32px;font-weight:900;color:#f43f5e;"><span class="count-up" data-val="${kpis.inadimplenciaValor}" data-prefix="R$ " data-decimals="2">0</span></div>
          </div>
        </div>
        <div style="padding:28px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
            <div style="color:#f43f5e;">${ICONS.alert}</div>
            <p style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.7);">Maiores Devedores</p>
          </div>
          ${kpis.topDevedores.length === 0
            ? '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.4);font-size:16px;font-weight:700;">Nenhuma inadimplência!</div>'
            : kpis.topDevedores.map((dev, i) => `
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
              <div style="width:32px;height:32px;border-radius:10px;background:${i===0?'rgba(244,63,94,0.2)':'rgba(255,255,255,0.1)'};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:${i===0?'#f43f5e':'rgba(255,255,255,0.7)'};">${i+1}</div>
              <div style="flex:1;">
                <p style="font-size:16px;font-weight:900;color:rgba(255,255,255,0.9);">${dev.nome}</p>
                <p style="font-size:13px;color:rgba(255,255,255,0.6);">${dev.diasAtraso} dias em atraso</p>
              </div>
              <p style="font-size:18px;font-weight:900;color:#f43f5e;">${fmtR(dev.valor)}</p>
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

  const svgLine = evolucaoAssociados.length > 1 ? `<svg width="400" height="130" viewBox="0 0 400 130" style="width:100%;height:200px;" preserveAspectRatio="none">
    <polyline points="${linePoints}" fill="none" stroke="rgba(139,92,246,0.9)" stroke-width="3" stroke-linejoin="round" class="svg-path-anim" style="--len:1000;stroke-dasharray:1000;"/>
    ${evolucaoAssociados.map((e, i) => {
      const x = (i / (evolucaoAssociados.length - 1)) * 380 + 10
      const y = 120 - ((e.ativos / maxAtivos) * 100)
      return `<circle cx="${x}" cy="${y}" r="6" fill="#8b5cf6" class="fade-in-node" style="animation-delay:${i*0.1}s"/>
        <text class="fade-in-node" style="animation-delay:${i*0.1}s" x="${x}" y="${y - 14}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="12">${e.ativos}</text>
        <text class="fade-in-node" style="animation-delay:${i*0.1}s" x="${x}" y="128" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="12" font-weight="700">${e.label}</text>`
    }).join('')}
  </svg>` : ''

  return slideBase(`
    <style>
      .slide:not(.active) .svg-path-anim { stroke-dashoffset: 1000 !important; }
      .slide.active .svg-path-anim { stroke-dashoffset: 0 !important; transition: stroke-dashoffset 1.5s ease-in-out; }
      .slide:not(.active) .fade-in-node { opacity: 0; }
      .slide.active .fade-in-node { animation: fadeIn 0.4s ease-out forwards; }
    </style>
    <div style="display:flex;flex-direction:column;height:100%;gap:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <p class="label-accent" style="color:#8b5cf6;">Saúde da Base</p>
          <h2 class="slide-title">Associados</h2>
          <p class="slide-sub">Evolução e saúde da base associativa</p>
        </div>
        <div style="display:flex;gap:16px;">
          <div style="padding:20px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(139,92,246,0.3);text-align:center;min-width:140px;">
            <div style="font-size:40px;font-weight:900;color:#8b5cf6;"><span class="count-up" data-val="${kpis.totalAtivos}" data-decimals="0">0</span></div>
            <p style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Ativos</p>
          </div>
          <div style="padding:20px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(16,185,129,0.3);text-align:center;min-width:140px;">
            <div style="font-size:40px;font-weight:900;color:#10b981;">+<span class="count-up" data-val="${kpis.novasAdesoesCount}" data-decimals="0">0</span></div>
            <p style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Novas Adesões</p>
          </div>
          <div style="padding:20px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid ${crescimento >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'};text-align:center;min-width:140px;">
            <div style="font-size:40px;font-weight:900;color:${crescimento >= 0 ? '#10b981' : '#f43f5e'};">${crescimento >= 0 ? '+' : ''}<span class="count-up" data-val="${crescimento}" data-decimals="0">0</span></div>
            <p style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Crescimento</p>
          </div>
        </div>
      </div>
      <div style="flex:1;padding:24px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;">
        ${svgLine || '<p style="color:rgba(255,255,255,0.4);font-size:16px;">Dados insuficientes para gráfico</p>'}
      </div>
    </div>`)
}

function buildProjecoesSlide(data: ApresentacaoData) {
  const totalRec = data.fluxo6Meses.reduce((s, m) => s + m.receita, 0)
  const totalDesp = data.fluxo6Meses.reduce((s, m) => s + m.despesa, 0)

  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <p class="label-accent" style="color:#3b82f6;">Para Onde Vamos</p>
          <h2 class="slide-title">Projeções e Consolidado</h2>
          <p class="slide-sub">Realizado dos últimos 6 meses</p>
        </div>
        <div style="display:flex;gap:16px;">
          <div style="padding:20px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(16,185,129,0.3);text-align:right;">
            <p style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Total Receitas</p>
            <div style="font-size:28px;font-weight:900;color:#10b981;"><span class="count-up" data-val="${totalRec}" data-prefix="R$ " data-decimals="2">0</span></div>
          </div>
          <div style="padding:20px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(251,113,133,0.3);text-align:right;">
            <p style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Total Despesas</p>
            <div style="font-size:28px;font-weight:900;color:#fb7185;"><span class="count-up" data-val="${totalDesp}" data-prefix="R$ " data-decimals="2">0</span></div>
          </div>
        </div>
      </div>
      <div style="flex:1;overflow:auto;padding:24px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
        <table style="width:100%;border-collapse:collapse;font-size:16px;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.2);">
              <th style="text-align:left;padding:12px;color:rgba(255,255,255,0.6);font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Mês</th>
              <th style="text-align:right;padding:12px;color:rgba(255,255,255,0.6);font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Receita</th>
              <th style="text-align:right;padding:12px;color:rgba(255,255,255,0.6);font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Despesa</th>
              <th style="text-align:right;padding:12px;color:rgba(255,255,255,0.6);font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Resultado</th>
            </tr>
          </thead>
          <tbody style="color:rgba(255,255,255,0.85);font-weight:700;">
            ${data.fluxo6Meses.map(m => `<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
              <td style="padding:16px 12px;font-weight:900;">${m.label}</td>
              <td style="padding:16px 12px;text-align:right;color:#10b981;">${fmtR(m.receita)}</td>
              <td style="padding:16px 12px;text-align:right;color:#fb7185;">${fmtR(m.despesa)}</td>
              <td style="padding:16px 12px;text-align:right;color:${m.resultado >= 0 ? '#fbbf24' : '#f43f5e'};">${fmtR(m.resultado)}</td>
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

  const metasParaExibir = metasComPct.length > 0 ? metasComPct.slice(0, 7) : [
    { meta: "Exemplo: Reduzir inadimplência em 5%", pct: 80, prazo: new Date(Date.now() + 86400000*30).toISOString(), responsavel: "Diretoria" },
    { meta: "Exemplo: Captação de 20 novos associados", pct: 45, prazo: new Date(Date.now() + 86400000*15).toISOString(), responsavel: "Marketing" },
  ]
  const emptyStateNotice = metasComPct.length === 0 ? `<div style="padding:12px;background:rgba(255,255,255,0.1);border-radius:12px;text-align:center;font-size:14px;font-weight:700;color:rgba(255,255,255,0.7);margin-bottom:16px;">Visualizando metas de exemplo. Cadastre metas no módulo 'Estratégia'.</div>` : ''

  return slideBase(`
    <style>
      .slide:not(.active) .anim-w { width:0 !important; }
      .slide.active .anim-w { width:var(--end-w) !important; transition: width 1.5s cubic-bezier(0.4,0,0.2,1); }
    </style>
    <div style="display:flex;flex-direction:column;height:100%;gap:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <p class="label-accent" style="color:#f97316;">Accountability</p>
          <h2 class="slide-title">Metas e OKRs</h2>
          <p class="slide-sub">Progresso das iniciativas estratégicas</p>
        </div>
        <div style="display:flex;gap:16px;">
          <div style="padding:16px 24px;border-radius:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(16,185,129,0.3);text-align:center;">
            <div style="font-size:36px;font-weight:900;color:#10b981;"><span class="count-up" data-val="${concluidas}" data-decimals="0">0</span></div>
            <p style="font-size:12px;font-weight:900;color:rgba(255,255,255,0.6);text-transform:uppercase;">Concluídas</p>
          </div>
          <div style="padding:16px 24px;border-radius:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);text-align:center;">
            <div style="font-size:36px;font-weight:900;color:#fff;"><span class="count-up" data-val="${data.metas.length}" data-decimals="0">0</span></div>
            <p style="font-size:12px;font-weight:900;color:rgba(255,255,255,0.6);text-transform:uppercase;">Total</p>
          </div>
        </div>
      </div>
      ${emptyStateNotice}
      <div style="flex:1;display:flex;flex-direction:column;gap:16px;overflow:hidden;">
        ${metasParaExibir.map((meta: any) => {
            const color = getColor(meta.pct, meta.prazo)
            const badge = meta.pct >= 100 ? '✓ Concluída' : (meta.prazo && new Date(meta.prazo) < new Date() && meta.pct < 100 ? 'Atrasada' : meta.pct >= 70 ? 'Em Andamento' : 'Iniciada')
            return `<div style="padding:20px;border-radius:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
              <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
                <p style="flex:1;font-size:16px;font-weight:900;color:rgba(255,255,255,0.9);">${meta.meta}</p>
                <span style="font-size:13px;font-weight:900;color:${color};background:${color}22;border:1px solid ${color}33;padding:4px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:1px;">${badge}</span>
              </div>
              <div style="display:flex;align-items:center;gap:16px;">
                <div style="flex:1;height:8px;background:rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;">
                  <div class="anim-w" style="height:8px;width:0%;background:${color};border-radius:8px;--end-w:${meta.pct}%;"></div>
                </div>
                <span style="font-size:15px;font-weight:900;color:rgba(255,255,255,0.7);width:44px;text-align:right;"><span class="count-up" data-val="${meta.pct}" data-decimals="0">0</span>%</span>
              </div>
              ${meta.prazo ? `<p style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:8px;font-weight:600;">${meta.responsavel || 'Sem responsável'} · Prazo: ${new Date(meta.prazo).toLocaleDateString('pt-BR')}</p>` : ''}
            </div>`}).join('')}
      </div>
    </div>`)
}

function buildDecisoesSlide() {
  const decisoesSalvas = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem('ellus_decisoes_diretoria') || '[]') } catch { return [] } })()
    : []
  
  const decisoes = decisoesSalvas.length > 0 ? decisoesSalvas : [
    'Aprovação do orçamento do mês seguinte',
    'Revisão da meta de arrecadação',
    'Ações de cobrança para inadimplentes'
  ]

  return slideBase(`
    <div style="display:flex;flex-direction:column;height:100%;gap:24px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;color:#38bdf8;margin-bottom:8px;">
          ${ICONS.clipboard}
          <p class="label-accent" style="margin:0;">Fechamento com Ação</p>
        </div>
        <h2 class="slide-title">Decisões & Próximos Passos</h2>
        <p class="slide-sub">Pontos que exigem deliberação da diretoria</p>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:16px;">
        ${decisoes.map((d: string, i: number) => `
          <div style="display:flex;align-items:flex-start;gap:16px;padding:24px;border-radius:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
            <div style="width:36px;height:36px;border-radius:12px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.25);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#38bdf8;flex-shrink:0;">${i+1}</div>
            <p style="font-size:18px;font-weight:700;color:rgba(255,255,255,0.85);line-height:1.6;">${d}</p>
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
    @keyframes fadeIn { from{opacity:0;transform:scale(0.98)} to{opacity:1;transform:scale(1)} }
    @keyframes fadeInLeft { from{opacity:0;transform:translateX(-60px)} to{opacity:1;transform:translateX(0)} }
    @keyframes fadeInRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
    @keyframes parallaxBg { 0%{background-position:0 0} 100%{background-position:-56px -100px} }
    .hex-bg { position:absolute;inset:-100px;opacity:0.25;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1' stroke-opacity='0.6'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1' stroke-opacity='0.5'/%3E%3C/svg%3E");background-size:56px 100px; }
    .animate-parallax { animation: parallaxBg 30s linear infinite; }
    .slide { position:absolute;inset:0;display:none;overflow:hidden; }
    .slide.active { display:flex; }
    .slide.anim-next { animation: fadeInRight 350ms cubic-bezier(0.4,0,0.2,1) both; }
    .slide.anim-prev { animation: fadeInLeft 350ms cubic-bezier(0.4,0,0.2,1) both; }
    .slide-inner { position:relative;z-index:10;padding:50px 60px;width:100%;height:100%;overflow:hidden; }
    .label-accent { font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:3px;margin-bottom:6px; }
    .slide-title { font-size:46px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1.1; }
    .slide-sub { font-size:16px;color:rgba(255,255,255,0.5);font-weight:600;margin-top:6px; }

    /* Hover effects */
    .card-hover { transition: transform 0.2s, background 0.2s; }
    .card-hover:hover { transform: translateY(-4px); background: rgba(255,255,255,0.09); }

    /* Progress bar */
    #progress-bar { position:fixed;top:0;left:0;right:0;z-index:100;display:flex;gap:8px;padding:16px 40px; }
    .prog-seg { height:4px;flex:1;border-radius:4px;background:rgba(255,255,255,0.2);transition:all .4s; }
    .prog-seg.done { background:rgba(16,185,129,0.5); }
    .prog-seg.active { background:#10b981; }

    /* Counter */
    #counter { position:fixed;top:16px;right:40px;z-index:100;font-size:13px;font-weight:900;color:rgba(255,255,255,0.6);letter-spacing:2px; }

    /* Arrows */
    .arrow-btn { position:fixed;top:50%;z-index:100;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;cursor:pointer;transform:translateY(-50%);transition:all .2s;font-size:24px;opacity:0; }
    body:hover .arrow-btn { opacity:1; }
    .arrow-btn:hover { background:rgba(255,255,255,0.25);color:#fff; }
    #btn-prev { left:16px; }
    #btn-next { right:16px; }

    /* Dots */
    #dots { position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:100;display:flex;gap:8px;align-items:center; }
    .dot { border-radius:999px;transition:all .3s;background:rgba(255,255,255,0.3); }
    .dot.active { background:#10b981;width:24px;height:8px; }
    .dot:not(.active) { width:8px;height:8px; }

    /* Controls bar */
    #controls { position:fixed;bottom:48px;right:32px;z-index:100;display:flex;gap:10px;opacity:0;transition:opacity .2s; }
    body:hover #controls { opacity:1; }
    .ctrl-btn { padding:8px 16px;border-radius:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);font-size:12px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px; }
    .ctrl-btn:hover { background:rgba(255,255,255,0.2);color:#fff; }
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

    // Simple easeOutCubic
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function animateCountUp(slide) {
      const els = slide.querySelectorAll('.count-up');
      els.forEach(el => {
        const target = parseFloat(el.getAttribute('data-val'));
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const dec = parseInt(el.getAttribute('data-decimals')) || 0;
        
        let start = null;
        const dur = 800; // ms
        
        function step(ts) {
          if(!start) start = ts;
          const prog = Math.min((ts - start) / dur, 1);
          const val = target * easeOut(prog);
          el.textContent = prefix + val.toLocaleString('pt-BR', {minimumFractionDigits:dec, maximumFractionDigits:dec}) + suffix;
          if(prog < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }

    function show(n, dir) {
      sections[cur].classList.remove('active','anim-next','anim-prev');
      cur = Math.max(0, Math.min(n, total - 1));
      const s = sections[cur];
      s.classList.add('active');
      s.classList.remove('anim-next','anim-prev');
      void s.offsetWidth;
      s.classList.add(dir === 'next' ? 'anim-next' : 'anim-prev');
      update();
      animateCountUp(s);
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
    animateCountUp(sections[0]);
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
