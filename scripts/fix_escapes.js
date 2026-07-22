const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(path, content);
};

fixFile('src/features/conciliacao/components/CalendarioConciliacao.tsx');
fixFile('src/features/conciliacao/components/CalendarioNotaDrawer.tsx');
console.log('Fixed files');
