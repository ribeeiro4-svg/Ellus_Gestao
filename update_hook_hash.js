const fs = require('fs');

const hookPath = 'src/lib/hooks/useWhatsAppTemplates.ts';
let hookContent = fs.readFileSync(hookPath, 'utf8');

const replacement = `const getHash = (str: string) => {
  let h = 0;
  for(let i=0; i<str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(36).substring(0, 4).toUpperCase();
};

export function useWhatsAppTemplates() {
  const tenantId = useTenantId()
  const sb = createClient()
  const [templates, setTemplates] = useState<{ cobranca: string; hgu: string; adesao: string }>({
    cobranca: DEFAULT_MSG_COBRANCA,
    hgu: DEFAULT_MSG_HGU,
    adesao: DEFAULT_MSG_ADESAO
  })
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    
    const prefix = getHash(tenantId)
    const codeCob = \`\${prefix}_COB\`
    const codeHgu = \`\${prefix}_HGU\`
    const codeAde = \`\${prefix}_ADE\`

    const { data, error } = await sb.from('cobranca_templates')
      .select('codigo, texto')
      .in('codigo', [codeCob, codeHgu, codeAde])
      .eq('tenant_id', tenantId)

    if (data) {
      const cobranca = data.find(d => d.codigo === codeCob)?.texto || DEFAULT_MSG_COBRANCA
      const hgu = data.find(d => d.codigo === codeHgu)?.texto || DEFAULT_MSG_HGU
      const adesao = data.find(d => d.codigo === codeAde)?.texto || DEFAULT_MSG_ADESAO
      setTemplates({ cobranca, hgu, adesao })
    }
    setLoading(false)
  }, [tenantId, sb])`;

// Replace from export function down to setLoading(false)
const regex = /export function useWhatsAppTemplates\(\) \{[\s\S]*?setLoading\(false\)\n  \}, \[tenantId, sb\]\)/;
hookContent = hookContent.replace(regex, replacement);

const updateReplacement = `const atualizar = async (codigoReq: 'MSG_WHATSAPP_COBRANCA' | 'MSG_WHATSAPP_HGU' | 'MSG_WHATSAPP_ADESAO', texto: string) => {
    if (!tenantId) return { error: 'Sem tenant' }
    
    const prefix = getHash(tenantId)
    const codigo = codigoReq === 'MSG_WHATSAPP_COBRANCA' ? \`\${prefix}_COB\` : codigoReq === 'MSG_WHATSAPP_HGU' ? \`\${prefix}_HGU\` : \`\${prefix}_ADE\`

    // Check if exists
    const { data: existing } = await sb.from('cobranca_templates')`;

const updateRegex = /const atualizar = async \(codigo: 'MSG_WHATSAPP_COBRANCA' \| 'MSG_WHATSAPP_HGU' \| 'MSG_WHATSAPP_ADESAO', texto: string\) => \{\n    if \(!tenantId\) return \{ error: 'Sem tenant' \}\n    \n    \/\/ Check if exists\n    const \{ data: existing \} = await sb.from\('cobranca_templates'\)/;

hookContent = hookContent.replace(updateRegex, updateReplacement);

fs.writeFileSync(hookPath, hookContent, 'utf8');
console.log('Hook updated!');
