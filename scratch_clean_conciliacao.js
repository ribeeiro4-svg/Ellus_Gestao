const fs = require('fs');

let conc = fs.readFileSync('src/app/(dashboard)/conciliacao/page.tsx', 'utf8');

// Title
conc = conc.replace(/<h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-0\.5">Fluxo de Caixa<\/h1>/, '<h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-0.5">Conciliação Bancária</h1>');
conc = conc.replace(/<p className="text-\[9px\] font-extrabold text-slate-400 uppercase tracking-widest">Gestão Financeira Unificada — ACPROBEC<\/p>/, '<p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Importação OFX, Cora e Sincronização Fiscal</p>');

// Remove unrelated tabs
conc = conc.replace(/<button onClick=\{\(\) => setActiveTab\('geral'\)\}.*?<\/button>\s*/, '');
conc = conc.replace(/<button onClick=\{\(\) => setActiveTab\('receitas'\)\}.*?<\/button>\s*/, '');
conc = conc.replace(/<button onClick=\{\(\) => setActiveTab\('despesas'\)\}.*?<\/button>\s*/, '');
conc = conc.replace(/<button onClick=\{\(\) => setActiveTab\('inadimplencia'\)\}.*?<\/button>\s*/, '');

// Remove FinancialKpiGrid completely
// We can use a regex that matches <FinancialKpiGrid up to /> or we can just replace a large block.
// Since it's multiline, let's match <FinancialKpiGrid[\\s\\S]*?/>
conc = conc.replace(/<FinancialKpiGrid[\s\S]*?\/>\s*/, '');

// Strip the activeTab blocks for geral, receitas, despesas, inadimplencia
conc = conc.replace(/\{activeTab === 'geral' && \([\s\S]*?\}\)\s*/, '');
conc = conc.replace(/\{activeTab === 'inadimplencia' && \([\s\S]*?\}\)\s*/, '');

// Remove DataTable for geral
conc = conc.replace(/<div className="flex flex-wrap items-center gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">[\s\S]*?<\/CrudModal>/, '</CrudModal>');
conc = conc.replace(/<DataTable[\s\S]*?\/>/, ''); // just in case

fs.writeFileSync('src/app/(dashboard)/conciliacao/page.tsx', conc);
console.log('Conciliacao page cleaned up');
