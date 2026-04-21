export const reportStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  
  :root {
    --navy: #0e2d22;
    --emerald: #10b981;
    --slate-50: #f8fafc;
    --slate-100: #f1f5f9;
    --slate-200: #e2e8f0;
    --slate-400: #94a3b8;
    --slate-500: #64748b;
    --slate-600: #475569;
    --slate-800: #1e293b;
    --slate-900: #0f172a;
  }

  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  
  body {
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    color: var(--slate-800);
    background: #fff;
  }

  .container {
    padding: 40px;
    max-width: 900px;
    margin: 0 auto;
  }

  /* ── CAPA ── */
  .cover {
    height: 297mm;
    background: var(--navy);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    color: white;
    page-break-after: always;
  }

  .cover::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.08'/%3E%3C/svg%3E");
    background-size: 80px 143px;
    z-index: 1;
  }

  .cover-content {
    position: relative;
    z-index: 10;
    text-align: center;
  }

  .cover-logo {
    width: 80px;
    height: 80px;
    background: var(--emerald);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 30px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  }

  .cover-title {
    font-size: 42px;
    font-weight: 900;
    margin: 0;
    letter-spacing: -1px;
    text-transform: uppercase;
  }

  .cover-subtitle {
    font-size: 16px;
    font-weight: 600;
    color: var(--emerald);
    text-transform: uppercase;
    letter-spacing: 3px;
    margin-top: 10px;
  }

  .cover-footer {
    position: absolute;
    bottom: 50px;
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── SECTIONS ── */
  .section-title {
    font-size: 18px;
    font-weight: 900;
    color: var(--slate-900);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 40px 0 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-left: 4px solid var(--emerald);
    padding-left: 15px;
  }

  .page-divider {
    page-break-before: always;
  }

  /* ── KPI GRID ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 30px;
  }

  .kpi-box {
    background: var(--slate-50);
    border: 1px solid var(--slate-100);
    padding: 20px;
    border-radius: 16px;
  }

  .kpi-label {
    font-size: 10px;
    font-weight: 800;
    color: var(--slate-400);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
  }

  .kpi-value {
    font-size: 18px;
    font-weight: 900;
    color: var(--slate-800);
  }

  /* ── TABLES ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin-top: 20px;
  }

  th {
    text-align: left;
    background: var(--slate-50);
    color: var(--slate-500);
    padding: 12px 15px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid var(--slate-100);
  }

  td {
    padding: 12px 15px;
    border-bottom: 1px solid var(--slate-100);
    color: var(--slate-600);
    font-weight: 500;
  }

  .text-right { text-align: right; }
  .font-bold { font-weight: 800; }
  .text-emerald { color: var(--emerald); }

  /* ── CHARTS ── */
  .chart-container {
    background: #fff;
    border: 1px solid var(--slate-100);
    padding: 20px;
    border-radius: 20px;
    margin-bottom: 30px;
  }

  .chart-img {
    width: 100%;
    height: auto;
    border-radius: 10px;
  }

  @media print {
    @page {
      size: A4;
      margin: 0;
    }
  }
`;
