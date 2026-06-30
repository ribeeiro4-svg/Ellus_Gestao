const fs = require('fs');

const path = 'c:/ÁUREA TECH - EM DEV/Éllus Gestão Estratégica/Ellus_Gestao/src/features/associados/components/AssociadosTab.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Swap useTenant for useWhatsAppTemplates
content = content.replace(
  "import { useTenant } from '@/lib/hooks/useTenant'",
  "import { useWhatsAppTemplates } from '@/lib/hooks/useWhatsAppTemplates'\nimport { DEFAULT_MSG_HGU } from '@/features/configuracoes/components/MensagensWhatsappTab'"
);

// 2. Replace hook call
content = content.replace(
  "  const { tenant } = useTenant()",
  "  const { templates } = useWhatsAppTemplates()"
);

// 3. Replace message
const oldMsg = `    const msg = \`Olá, \${associado.nome}. Tudo bem? 

Passando para informar que seu plano HGU SAÚDE já está ativo via ACPROBEC.

TITULAR/RESPONSÁVEL: \${associado.nome}
CÓDIGO MATRÍCULA PLANO HGU: \${associado.codigo_hgu || 'Sem código'}

DEPENDENTES REGISTRADOS:
\${depsText}

*O HGU não está mais emitindo carteirinha física no momento. Salve este código para informar quando for utilizar os serviços do plano.

Toda e qualquer dúvida relacionada ao plano HGU, devem ser tratadas diretamente nos contatos abaixo:

📞 Contatos HGU Saúde

MARCAÇÃO DENTRO DAS INSTALAÇÕES HGU: (87) 3866-8282
OUVIDORIA HGU: (87) 3866-8259
OPERADORA HGU: (87) 3866-8250
WHATSAPP DA OPERADORA: 873866-8251
HGU HOSPITAL: (87) 3866-8751
---------

GUIA MÉDICO REDE CREDENCIADA

👨⚕️Acesse os locais de atendimento e especialistas da rede credenciada HGU Saúde através do link abaixo:
https://www.acprobec.com.br/#rede-hgu

Att;
Diretoria / Secretaria ACPROBEC\``;

const newMsg = `    const templateHgu = templates.hgu || DEFAULT_MSG_HGU;
    const msg = templateHgu
      .replace(/\\{\\{nome\\}\\}/g, associado.nome || '')
      .replace(/\\{\\{codigo_hgu\\}\\}/g, associado.codigo_hgu || 'Sem código')
      .replace(/\\{\\{dependentes\\}\\}/g, depsText);`;

content = content.replace(oldMsg, newMsg);

fs.writeFileSync(path, content, 'utf8');
console.log('Associados updated.');
