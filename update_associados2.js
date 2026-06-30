const fs = require('fs');

const path = 'c:/ÁUREA TECH - EM DEV/Éllus Gestão Estratégica/Ellus_Gestao/src/features/associados/components/AssociadosTab.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add back useTenant import
content = content.replace(
  "import { useWhatsAppTemplates } from '@/lib/hooks/useWhatsAppTemplates'",
  "import { useWhatsAppTemplates } from '@/lib/hooks/useWhatsAppTemplates'\nimport { useTenant } from '@/lib/hooks/useTenant'"
);

// 2. Add back useTenant hook
content = content.replace(
  "  const { templates } = useWhatsAppTemplates()",
  "  const { templates } = useWhatsAppTemplates()\n  const { tenant } = useTenant()"
);

fs.writeFileSync(path, content, 'utf8');
console.log('AssociadosTab tenant fixed.');
