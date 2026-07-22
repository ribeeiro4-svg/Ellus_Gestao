const fs = require('fs');

// ---------------------------------------------------------
// Update useWhatsAppTemplates.ts
// ---------------------------------------------------------
const hookPath = 'src/lib/hooks/useWhatsAppTemplates.ts';
let hookContent = fs.readFileSync(hookPath, 'utf8');

hookContent = hookContent.replace(
  "import { DEFAULT_MSG_COBRANCA, DEFAULT_MSG_HGU } from '@/features/configuracoes/components/MensagensWhatsappTab'",
  "import { DEFAULT_MSG_COBRANCA, DEFAULT_MSG_HGU, DEFAULT_MSG_ADESAO } from '@/features/configuracoes/components/MensagensWhatsappTab'"
);

hookContent = hookContent.replace(
  "  const [templates, setTemplates] = useState<{ cobranca: string; hgu: string }>({",
  "  const [templates, setTemplates] = useState<{ cobranca: string; hgu: string; adesao?: string }>({"
);

hookContent = hookContent.replace(
  "    cobranca: DEFAULT_MSG_COBRANCA,\n    hgu: DEFAULT_MSG_HGU\n  })",
  "    cobranca: DEFAULT_MSG_COBRANCA,\n    hgu: DEFAULT_MSG_HGU,\n    adesao: DEFAULT_MSG_ADESAO\n  })"
);

fs.writeFileSync(hookPath, hookContent, 'utf8');
console.log('Hook updated again.');
