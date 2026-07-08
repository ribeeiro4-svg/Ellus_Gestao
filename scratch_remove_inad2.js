const fs = require('fs');

let fin = fs.readFileSync('src/app/(dashboard)/financeiro/page.tsx', 'utf8');
fin = fin.replace(/activeTab === 'inadimplencia'/g, 'false');
fs.writeFileSync('src/app/(dashboard)/financeiro/page.tsx', fin);
