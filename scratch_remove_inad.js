const fs = require('fs');

let fin = fs.readFileSync('src/app/(dashboard)/financeiro/page.tsx', 'utf8');
fin = fin.replace(/const \[activeTab, setActiveTab\] = useState<[^>]+>\('geral'\)/, "const [activeTab, setActiveTab] = useState<'geral' | 'receitas' | 'despesas'>('geral')");
fin = fin.replace(/<button onClick=\{\(\) => setActiveTab\('inadimplencia'\)\}.*?<\/button>\s*/, '');
fin = fin.replace(/\{activeTab === 'inadimplencia' && \([\s\S]*?\}\)/, '');
fs.writeFileSync('src/app/(dashboard)/financeiro/page.tsx', fin);

console.log('Removed inadimplencia from financeiro');
