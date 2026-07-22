const fs = require('fs');

const path = 'c:/ÁUREA TECH - EM DEV/Éllus Gestão Estratégica/Ellus_Gestao/src/app/(dashboard)/financeiro/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  "import { useTenantId } from '@/lib/hooks/useTenantId'",
  "import { useTenantId } from '@/lib/hooks/useTenantId'\nimport { useWhatsAppTemplates } from '@/lib/hooks/useWhatsAppTemplates'\nimport { DEFAULT_MSG_COBRANCA } from '@/features/configuracoes/components/MensagensWhatsappTab'"
);

// 2. Add hook
content = content.replace(
  "  const tenantId = useTenantId()\n  const { currentUser } = useCurrentUser()\n  const searchParams = useSearchParams()",
  "  const tenantId = useTenantId()\n  const { currentUser } = useCurrentUser()\n  const { templates } = useWhatsAppTemplates()\n  const searchParams = useSearchParams()"
);

// 3. Replace message
const oldMsg = "const msg = `Olá, ${nomeCompleto}! Tudo bem?\\n\\nPassando rapidinho pra te avisar que temos um ou mais boletos em aberto:\\n\\n${emojiDocument} *\"${itemDescricao}\"*\\n\\nSe já tiver pago, desconsidera essa mensagem e nos encaminha o comprovante de pagamento.${emojiSmile}\\nCaso contrário, posso te reenviar o boleto ou te ajudar com o que precisar!`;";

const newMsg = `const templateCobranca = templates.cobranca || DEFAULT_MSG_COBRANCA;
                  const valorStr = \`R$ \${(i.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\`;
                  const msg = templateCobranca
                    .replace(/\\{\\{nome\\}\\}/g, nomeCompleto)
                    .replace(/\\{\\{descricao\\}\\}/g, itemDescricao)
                    .replace(/\\{\\{data\\}\\}/g, dataFormatada)
                    .replace(/\\{\\{valor\\}\\}/g, valorStr)
                    .replace(/📄/g, emojiDocument)
                    .replace(/😊/g, emojiSmile);`;

content = content.replace(oldMsg, newMsg);

fs.writeFileSync(path, content, 'utf8');
console.log('Financeiro updated.');
