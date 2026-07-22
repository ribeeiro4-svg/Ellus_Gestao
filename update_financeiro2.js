const fs = require('fs');

const path = 'c:/ÁUREA TECH - EM DEV/Éllus Gestão Estratégica/Ellus_Gestao/src/app/(dashboard)/financeiro/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace using regex
content = content.replace(/const \{ currentUser \} = useCurrentUser\(\)\s+const searchParams = useSearchParams\(\)/, 
"const { currentUser } = useCurrentUser()\n  const { templates } = useWhatsAppTemplates()\n  const searchParams = useSearchParams()");

fs.writeFileSync(path, content, 'utf8');
console.log('Financeiro hook updated.');
