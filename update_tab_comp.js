const fs = require('fs');

const tabPath = 'src/features/configuracoes/components/MensagensWhatsappTab.tsx';
let tabContent = fs.readFileSync(tabPath, 'utf8');

tabContent = tabContent.replace(
  "  const getValue = (key: 'msg_whatsapp_cobranca' | 'msg_whatsapp_hgu', defaultVal: string): string => {\n    if (key === 'msg_whatsapp_cobranca') return templates.cobranca\n    if (key === 'msg_whatsapp_hgu') return templates.hgu\n    return defaultVal\n  }",
  "  const getValue = (key: 'msg_whatsapp_cobranca' | 'msg_whatsapp_hgu' | 'msg_whatsapp_adesao', defaultVal: string): string => {\n    if (key === 'msg_whatsapp_cobranca') return templates.cobranca || defaultVal\n    if (key === 'msg_whatsapp_hgu') return templates.hgu || defaultVal\n    if (key === 'msg_whatsapp_adesao') return templates.adesao || defaultVal\n    return defaultVal\n  }"
);

tabContent = tabContent.replace(
  "  const handleSave = async (key: string, value: string) => {\n    const codigo = key === 'msg_whatsapp_cobranca' ? 'MSG_WHATSAPP_COBRANCA' : 'MSG_WHATSAPP_HGU'\n    await atualizar(codigo, value)\n  }",
  "  const handleSave = async (key: string, value: string) => {\n    let codigo = ''\n    if (key === 'msg_whatsapp_cobranca') codigo = 'MSG_WHATSAPP_COBRANCA'\n    else if (key === 'msg_whatsapp_hgu') codigo = 'MSG_WHATSAPP_HGU'\n    else if (key === 'msg_whatsapp_adesao') codigo = 'MSG_WHATSAPP_ADESAO'\n    if (codigo) await atualizar(codigo, value)\n  }"
);

fs.writeFileSync(tabPath, tabContent, 'utf8');
console.log('Main component updated.');
