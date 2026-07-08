const fs = require('fs');

let fin = fs.readFileSync('src/app/(dashboard)/financeiro/page.tsx', 'utf8');
fin = fin.replace(/activeTab === 'calendario'/g, 'false');
fin = fin.replace(/activeTab === 'conciliacao'/g, 'false');
fs.writeFileSync('src/app/(dashboard)/financeiro/page.tsx', fin);

if (fs.existsSync('src/features/configuracoes/components/ConfigTabsContent.tsx')) {
    fs.unlinkSync('src/features/configuracoes/components/ConfigTabsContent.tsx');
}
