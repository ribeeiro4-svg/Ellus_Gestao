const fs = require('fs');
const path = require('path');

const tabs = ['financeiro', 'categorias', 'cobranca', 'mensagens-whatsapp', 'importar'];

const template = (tab) => `import ConfigTabsContent from '@/features/configuracoes/components/ConfigTabsContent'

export default function ConfigPage() {
  return <ConfigTabsContent activeTab="${tab}" />
}
`;

tabs.forEach(tab => {
  const dirPath = path.join('src/app/(dashboard)/configuracoes', tab);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), template(tab));
});

// Update root page
const rootTemplate = `import ConfigTabsContent from '@/features/configuracoes/components/ConfigTabsContent'

export default function ConfigPage() {
  return <ConfigTabsContent activeTab="geral" />
}
`;
fs.writeFileSync('src/app/(dashboard)/configuracoes/page.tsx', rootTemplate);

console.log('Pages created!');
