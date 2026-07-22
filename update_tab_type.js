const fs = require('fs');

const tabPath = 'src/features/configuracoes/components/MensagensWhatsappTab.tsx';
let tabContent = fs.readFileSync(tabPath, 'utf8');

tabContent = tabContent.replace(
  "  key: 'msg_whatsapp_cobranca' | 'msg_whatsapp_hgu'",
  "  key: 'msg_whatsapp_cobranca' | 'msg_whatsapp_hgu' | 'msg_whatsapp_adesao'"
);

fs.writeFileSync(tabPath, tabContent, 'utf8');
console.log('TemplateConfig fixed.');
