const fs = require('fs');

// 1. Fix hook
const hookPath = 'src/lib/hooks/useWhatsAppTemplates.ts';
let hookContent = fs.readFileSync(hookPath, 'utf8');

hookContent = hookContent.replace(
  "codigo: 'MSG_WHATSAPP_COBRANCA' | 'MSG_WHATSAPP_HGU'",
  "codigo: 'MSG_WHATSAPP_COBRANCA' | 'MSG_WHATSAPP_HGU' | 'MSG_WHATSAPP_ADESAO'"
);

fs.writeFileSync(hookPath, hookContent, 'utf8');


// 2. Fix tab
const tabPath = 'src/features/configuracoes/components/MensagensWhatsappTab.tsx';
let tabContent = fs.readFileSync(tabPath, 'utf8');

tabContent = tabContent.replace(
  "  const handleSave = async (key: string, value: string) => {\n    let codigo = ''\n    if (key === 'msg_whatsapp_cobranca') codigo = 'MSG_WHATSAPP_COBRANCA'\n    else if (key === 'msg_whatsapp_hgu') codigo = 'MSG_WHATSAPP_HGU'\n    else if (key === 'msg_whatsapp_adesao') codigo = 'MSG_WHATSAPP_ADESAO'\n    if (codigo) await atualizar(codigo, value)\n  }",
  "  const handleSave = async (key: string, value: string) => {\n    let codigo: 'MSG_WHATSAPP_COBRANCA' | 'MSG_WHATSAPP_HGU' | 'MSG_WHATSAPP_ADESAO' | '' = ''\n    if (key === 'msg_whatsapp_cobranca') codigo = 'MSG_WHATSAPP_COBRANCA'\n    else if (key === 'msg_whatsapp_hgu') codigo = 'MSG_WHATSAPP_HGU'\n    else if (key === 'msg_whatsapp_adesao') codigo = 'MSG_WHATSAPP_ADESAO'\n    if (codigo !== '') await atualizar(codigo, value)\n  }"
);

fs.writeFileSync(tabPath, tabContent, 'utf8');
console.log('Fixed TS typing for atualizar.');
