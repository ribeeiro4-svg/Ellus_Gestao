const fs = require('fs');

const tabPath = 'src/features/configuracoes/components/MensagensWhatsappTab.tsx';
let tabContent = fs.readFileSync(tabPath, 'utf8');

// The new template object to append to the TEMPLATES array
const adesaoTemplate = `  {
    key: 'msg_whatsapp_adesao',
    label: 'Adesão ao Plano',
    icon: <MessageCircle size={20} />,
    color: 'purple',
    description: 'Mensagem enviada quando você clica em "WhatsApp Cobrança" e o sistema identifica que a categoria do lançamento é "Adesão".',
    usedIn: [
      'Módulo Financeiro → Lançamento com categoria "Adesão" → "WhatsApp Cobrança"',
    ],
    variables: [
      { tag: '{{nome}}', description: 'Nome completo do associado', example: 'João da Silva' },
      { tag: '{{descricao}}', description: 'Descrição do lançamento (ex: Adesão)', example: 'Adesão - Junho/2026' },
      { tag: '{{data}}', description: 'Data de vencimento do lançamento', example: '30/06/2026' },
      { tag: '{{valor}}', description: 'Valor do lançamento em reais', example: 'R$ 52,59' },
    ],
    defaultValue: DEFAULT_MSG_ADESAO,
  },
]`;

// Check if already contains adesao key inside array
if (!tabContent.includes("key: 'msg_whatsapp_adesao'")) {
    tabContent = tabContent.replace(
        "    defaultValue: DEFAULT_MSG_HGU,\n  },\n]",
        "    defaultValue: DEFAULT_MSG_HGU,\n  },\n" + adesaoTemplate
    );
}

// Check state keys in case they map differently
// The component is probably doing: `form[template.key]`
// So `msg_whatsapp_cobranca` maps to `cobranca`. Let's check how the state maps:
// "const [form, setForm] = useState<Record<string, string>>({" or something.
// Let's write the file and let's check how state works in the next step.

fs.writeFileSync(tabPath, tabContent, 'utf8');
console.log('Tab updated with TEMPLATE object.');
