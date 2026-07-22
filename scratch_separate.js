const fs = require('fs');

let fin = fs.readFileSync('src/app/(dashboard)/financeiro/page.tsx', 'utf8');

// Copy directly
fs.writeFileSync('src/app/(dashboard)/conciliacao/page.tsx', fin.replace(/const \[activeTab, setActiveTab\] = useState<[^>]+>\('geral'\)/, "const [activeTab, setActiveTab] = useState<'conciliacao' | 'calendario'>('conciliacao')"));

// Modify financeiro
fin = fin.replace(/const \[activeTab, setActiveTab\] = useState<[^>]+>\('geral'\)/, "const [activeTab, setActiveTab] = useState<'geral' | 'receitas' | 'despesas'>('geral')");
fin = fin.replace(/<button onClick=\{\(\) => setActiveTab\('inadimplencia'\)\}.*?<\/button>/, '');
fin = fin.replace(/<button onClick=\{\(\) => setActiveTab\('conciliacao'\)\}.*?<\/button>/, '');
fin = fin.replace(/<button onClick=\{\(\) => setActiveTab\('calendario'\)\}.*?<\/button>/, '');

fin = fin.replace(/plugins: \{ legend:/g, 'plugins: { datalabels: { display: false }, legend:');
fin = fin.replace(/plugins: \{\}, scales:/g, 'plugins: { datalabels: { display: false } }, scales:');
fin = fin.replace(/maintainAspectRatio: false, scales:/g, 'maintainAspectRatio: false, plugins: { datalabels: { display: false } }, scales:');

fs.writeFileSync('src/app/(dashboard)/financeiro/page.tsx', fin);

console.log('Done separation');
