const fs = require('fs');
let file = fs.readFileSync('src/features/configuracoes/components/ConfigTabsContent.tsx', 'utf8');
file = file.replace(/import ConfigHeader.*?\n/, '');
fs.writeFileSync('src/features/configuracoes/components/ConfigTabsContent.tsx', file);
