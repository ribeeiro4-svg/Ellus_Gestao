const fs = require('fs');
const path = require('path');

const pagePath = 'src/app/(dashboard)/configuracoes/page.tsx';
const destPath = 'src/features/configuracoes/components/ConfigTabsContent.tsx';

let content = fs.readFileSync(pagePath, 'utf8');

// Modificar a assinatura
content = content.replace('export default function ConfigPage() {', 'export default function ConfigTabsContent({ activeTab }: { activeTab: string }) {');

// Remover useState do activeTab
content = content.replace(/const \[activeTab, setActiveTab\] = useState<TabType>\('geral'\)/, '');
content = content.replace(/const \[activeTab, setActiveTab\] = useState<any>\('geral'\)/, '');

// Remover o useEffect que muda activeTab
content = content.replace(/useEffect\(\(\) => \{\n\s*if \(\!loadingPerms && \!podeVerConfig && \!isAdmin\) \{\n\s*setActiveTab\('minha-conta'\)\n\s*\}\n\s*\}, \[podeVerConfig, isAdmin, loadingPerms\]\)/, '');

// Remover o Header (linhas 363 a 398 aproximadamente)
const headerStart = content.indexOf('{/* Header Centralizado - Estilo Hub Premium */}');
const geralStart = content.indexOf("{activeTab === 'geral'");
if (headerStart !== -1 && geralStart !== -1) {
  // Acha a div pai do header
  const divHeaderStart = content.lastIndexOf('<div', headerStart);
  content = content.substring(0, divHeaderStart) + content.substring(geralStart);
}

fs.mkdirSync(path.dirname(destPath), { recursive: true });
fs.writeFileSync(destPath, content);

console.log('ConfigTabsContent.tsx created!');
