const fs = require('fs');

// ---------------------------------------------------------
// 1. Update useWhatsAppTemplates.ts
// ---------------------------------------------------------
const hookPath = 'src/lib/hooks/useWhatsAppTemplates.ts';
let hookContent = fs.readFileSync(hookPath, 'utf8');

hookContent = hookContent.replace(
  "export interface WhatsAppTemplates {\n  cobranca?: string\n  hgu?: string\n}",
  "export interface WhatsAppTemplates {\n  cobranca?: string\n  hgu?: string\n  adesao?: string\n}"
);

hookContent = hookContent.replace(
  "      const tpls: WhatsAppTemplates = {}",
  "      const tpls: WhatsAppTemplates = {}"
);

hookContent = hookContent.replace(
  "      data.forEach(item => {\n        if (item.codigo === 'MSG_WHATSAPP_COBRANCA') tpls.cobranca = item.texto\n        if (item.codigo === 'MSG_WHATSAPP_HGU') tpls.hgu = item.texto\n      })",
  "      data.forEach(item => {\n        if (item.codigo === 'MSG_WHATSAPP_COBRANCA') tpls.cobranca = item.texto\n        if (item.codigo === 'MSG_WHATSAPP_HGU') tpls.hgu = item.texto\n        if (item.codigo === 'MSG_WHATSAPP_ADESAO') tpls.adesao = item.texto\n      })"
);

hookContent = hookContent.replace(
  "    if (updates.cobranca !== undefined) upserts.push({ tenant_id: tenantId, codigo: 'MSG_WHATSAPP_COBRANCA', texto: updates.cobranca })\n    if (updates.hgu !== undefined) upserts.push({ tenant_id: tenantId, codigo: 'MSG_WHATSAPP_HGU', texto: updates.hgu })",
  "    if (updates.cobranca !== undefined) upserts.push({ tenant_id: tenantId, codigo: 'MSG_WHATSAPP_COBRANCA', texto: updates.cobranca })\n    if (updates.hgu !== undefined) upserts.push({ tenant_id: tenantId, codigo: 'MSG_WHATSAPP_HGU', texto: updates.hgu })\n    if (updates.adesao !== undefined) upserts.push({ tenant_id: tenantId, codigo: 'MSG_WHATSAPP_ADESAO', texto: updates.adesao })"
);

fs.writeFileSync(hookPath, hookContent, 'utf8');
console.log('Hook updated.');


// ---------------------------------------------------------
// 2. Update MensagensWhatsappTab.tsx
// ---------------------------------------------------------
const tabPath = 'src/features/configuracoes/components/MensagensWhatsappTab.tsx';
let tabContent = fs.readFileSync(tabPath, 'utf8');

tabContent = tabContent.replace(
  "export const DEFAULT_MSG_COBRANCA",
  "export const DEFAULT_MSG_ADESAO = `Olá, {{nome}}! Tudo bem?\n\nPassando para confirmar e agradecer sua adesão ao nosso plano!\n\nAqui estão os detalhes do seu pagamento de adesão:\n\n📄 *\"{{descricao}}\"*\n\nSe já tiver pago, nos encaminha o comprovante de pagamento.😊\nCaso contrário, estou à disposição para enviar o boleto ou ajudar no que for preciso.`\n\nexport const DEFAULT_MSG_COBRANCA"
);

tabContent = tabContent.replace(
  "  const [form, setForm] = useState({\n    cobranca: '',\n    hgu: ''\n  })",
  "  const [form, setForm] = useState({\n    cobranca: '',\n    hgu: '',\n    adesao: ''\n  })"
);

tabContent = tabContent.replace(
  "      setForm({\n        cobranca: templates.cobranca || '',\n        hgu: templates.hgu || ''\n      })",
  "      setForm({\n        cobranca: templates.cobranca || '',\n        hgu: templates.hgu || '',\n        adesao: templates.adesao || ''\n      })"
);

// We need to inject the block for Adesao
const adesaoBlock = `          {/* TEMPLATE DE ADESÃO */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand('adesao')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Mensagem de Adesão</h3>
                  <p className="text-xs text-slate-500">Usada quando a categoria do lançamento é "Adesão"</p>
                </div>
              </div>
              <button type="button" className="text-slate-400 hover:text-slate-600">
                {expanded === 'adesao' ? <Eye className="w-5 h-5 text-indigo-500" /> : <Pencil className="w-5 h-5" />}
              </button>
            </div>
            {expanded === 'adesao' && (
              <div className="p-5">
                <div className="mb-3 flex items-start gap-2 text-xs text-indigo-600 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Variáveis disponíveis:</strong><br/>
                    <code className="bg-indigo-100/50 px-1 py-0.5 rounded text-indigo-700">{\`{{nome}}\`}</code> = Nome do associado<br/>
                    <code className="bg-indigo-100/50 px-1 py-0.5 rounded text-indigo-700">{\`{{descricao}}\`}</code> = Descrição ou categoria do lançamento + data<br/>
                    <code className="bg-indigo-100/50 px-1 py-0.5 rounded text-indigo-700">{\`{{data}}\`}</code> = Data de vencimento do lançamento<br/>
                    <code className="bg-indigo-100/50 px-1 py-0.5 rounded text-indigo-700">{\`{{valor}}\`}</code> = Valor formatado (ex: R$ 50,00)
                  </p>
                </div>
                <textarea
                  className="w-full min-h-[160px] p-3 text-sm text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors resize-y"
                  value={form.adesao}
                  onChange={e => handleChange('adesao', e.target.value)}
                  placeholder={DEFAULT_MSG_ADESAO}
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleReset('adesao')}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Restaurar padrão
                  </button>
                </div>
              </div>
            )}
          </div>\n\n`;

tabContent = tabContent.replace(
  "          {/* TEMPLATE DE COBRANÇA PADRÃO */}",
  adesaoBlock + "          {/* TEMPLATE DE COBRANÇA PADRÃO */}"
);

fs.writeFileSync(tabPath, tabContent, 'utf8');
console.log('Tab updated.');


// ---------------------------------------------------------
// 3. Update financeiro/page.tsx
// ---------------------------------------------------------
const finPath = 'src/app/(dashboard)/financeiro/page.tsx';
let finContent = fs.readFileSync(finPath, 'utf8');

finContent = finContent.replace(
  "import { DEFAULT_MSG_COBRANCA } from '@/features/configuracoes/components/MensagensWhatsappTab'",
  "import { DEFAULT_MSG_COBRANCA, DEFAULT_MSG_ADESAO } from '@/features/configuracoes/components/MensagensWhatsappTab'"
);

const oldLogic = `                  const templateCobranca = templates.cobranca || DEFAULT_MSG_COBRANCA;
                  const valorStr = \`R$ \${(i.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\`;
                  const msg = templateCobranca`;

const newLogic = `                  let templateCobranca = templates.cobranca || DEFAULT_MSG_COBRANCA;
                  if (i.categoria && i.categoria.toLowerCase().includes('adesão') || i.categoria && i.categoria.toLowerCase().includes('adesao')) {
                    templateCobranca = templates.adesao || DEFAULT_MSG_ADESAO;
                  }
                  
                  const valorStr = \`R$ \${(i.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\`;
                  const msg = templateCobranca`;

finContent = finContent.replace(oldLogic, newLogic);

fs.writeFileSync(finPath, finContent, 'utf8');
console.log('Financeiro updated.');
