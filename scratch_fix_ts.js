const fs = require('fs');

// Sidebar
let side = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
side = side.replace(/,\r?\n\s*AlertTriangle(?=\r?\n\s*\} from 'lucide-react')/, '');
fs.writeFileSync('src/components/layout/Sidebar.tsx', side);

// Financeiro
let fin = fs.readFileSync('src/app/(dashboard)/financeiro/page.tsx', 'utf8');
fin = fin.replace(/\{activeTab === 'calendario' && \([\s\S]*?\}\)/, '');
fin = fin.replace(/\{activeTab === 'conciliacao' && \([\s\S]*?\}\)/, '');
fs.writeFileSync('src/app/(dashboard)/financeiro/page.tsx', fin);

// Conciliacao
let conc = fs.readFileSync('src/app/(dashboard)/conciliacao/page.tsx', 'utf8');
conc = conc.replace(/const \[activeTab, setActiveTab\] = useState<'conciliacao' \| 'calendario'>\('conciliacao'\)/, "const [activeTab, setActiveTab] = useState<'geral' | 'receitas' | 'despesas' | 'inadimplencia' | 'conciliacao' | 'relatorios' | 'calendario'>('conciliacao')");
fs.writeFileSync('src/app/(dashboard)/conciliacao/page.tsx', conc);

console.log('Fixed');
