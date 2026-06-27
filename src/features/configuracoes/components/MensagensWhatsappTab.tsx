'use client'
import React, { useState, useRef, useCallback } from 'react'
import { useWhatsAppTemplates } from '@/lib/hooks/useWhatsAppTemplates'
import { MessageCircle, RefreshCw, Save, Info, Eye, Pencil, CheckCircle2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Templates padrão (exatamente o que os botões usam hoje)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MSG_ADESAO = `Olá, {{nome}}! Tudo bem?

Passando para confirmar e agradecer sua adesão ao nosso plano!

Aqui estão os detalhes do seu pagamento de adesão:

📄 *"{{descricao}}"*

Se já tiver pago, nos encaminha o comprovante de pagamento.😊
Caso contrário, estou à disposição para enviar o boleto ou ajudar no que for preciso.`

export const DEFAULT_MSG_COBRANCA = `Olá, {{nome}}! Tudo bem?

Passando rapidinho pra te avisar que temos um ou mais boletos em aberto:

📄 *"{{descricao}}"*

Se já tiver pago, desconsidera essa mensagem e nos encaminha o comprovante de pagamento.😊
Caso contrário, posso te reenviar o boleto ou te ajudar com o que precisar!`

export const DEFAULT_MSG_HGU = `Olá, {{nome}}. Tudo bem? 

Passando para informar que seu plano HGU SAÚDE já está ativo via ACPROBEC.

TITULAR/RESPONSÁVEL: {{nome}}
CÓDIGO MATRÍCULA PLANO HGU: {{codigo_hgu}}

DEPENDENTES REGISTRADOS:
{{dependentes}}

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

👨‍⚕️Acesse os locais de atendimento e especialistas da rede credenciada HGU Saúde através do link abaixo:
https://www.acprobec.com.br/#rede-hgu

Att;
Diretoria / Secretaria ACPROBEC`

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface TemplateConfig {
  key: 'msg_whatsapp_cobranca' | 'msg_whatsapp_hgu' | 'msg_whatsapp_adesao'
  label: string
  icon: React.ReactNode
  color: string
  description: string
  usedIn: string[]
  variables: { tag: string; description: string; example: string }[]
  defaultValue: string
}

const TEMPLATES: TemplateConfig[] = [
  {
    key: 'msg_whatsapp_cobranca',
    label: 'Cobrança de Mensalidade',
    icon: <MessageCircle size={20} />,
    color: 'emerald',
    description: 'Mensagem enviada quando você clica em "WhatsApp Cobrança" no menu de ações de um lançamento na aba Receitas do Módulo Financeiro.',
    usedIn: [
      'Módulo Financeiro → Aba Receitas → Menu de Ações → "WhatsApp Cobrança"',
    ],
    variables: [
      { tag: '{{nome}}', description: 'Nome completo do associado', example: 'João da Silva' },
      { tag: '{{descricao}}', description: 'Descrição do lançamento (ex: Mensalidade)', example: 'Mensalidade - Junho/2026' },
      { tag: '{{data}}', description: 'Data de vencimento do lançamento', example: '30/06/2026' },
      { tag: '{{valor}}', description: 'Valor do lançamento em reais', example: 'R$ 52,59' },
    ],
    defaultValue: DEFAULT_MSG_COBRANCA,
  },
  {
    key: 'msg_whatsapp_hgu',
    label: 'Informativo Plano HGU',
    icon: <MessageCircle size={20} />,
    color: 'blue',
    description: 'Mensagem enviada quando você clica no botão de WhatsApp HGU na listagem de Associados (botão de envio do código de matrícula do plano HGU Saúde).',
    usedIn: [
      'Módulo Associados → Tabela de Associados → Botão WhatsApp HGU',
    ],
    variables: [
      { tag: '{{nome}}', description: 'Nome completo do associado', example: 'Maria Aparecida' },
      { tag: '{{codigo_hgu}}', description: 'Código de matrícula HGU do associado', example: '12345-00' },
      { tag: '{{dependentes}}', description: 'Lista de dependentes com nome e código', example: 'Carlos Silva - 12345-01\nAna Silva - 12345-02' },
    ],
    defaultValue: DEFAULT_MSG_HGU,
  },
  {
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
]

// ─────────────────────────────────────────────────────────────────────────────
// Substituição de variáveis para preview
// ─────────────────────────────────────────────────────────────────────────────
function applyPreview(template: string, variables: { tag: string; example: string }[]) {
  let result = template
  variables.forEach(v => {
    result = result.replace(new RegExp(v.tag.replace(/[{}]/g, '\\$&'), 'g'), `*${v.example}*`)
  })
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Card de edição de cada template
// ─────────────────────────────────────────────────────────────────────────────
function TemplateCard({
  config,
  value,
  onSave,
}: {
  config: TemplateConfig
  value: string
  onSave: (key: string, value: string) => Promise<void>
}) {
  const [text, setText] = useState(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDirty = text !== value

  const handleInsertVariable = useCallback((tag: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newText = text.substring(0, start) + tag + text.substring(end)
    setText(newText)
    // Reposition cursor after inserted tag
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
  }, [text])

  const handleSave = async () => {
    setSaving(true)
    await onSave(config.key, text)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    if (confirm('Deseja restaurar o texto padrão? O texto atual será perdido.')) {
      setText(config.defaultValue)
    }
  }

  const colorClasses = {
    emerald: {
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
      badge: 'bg-emerald-50 text-emerald-700',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      btnOutline: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
      focus: 'focus:border-emerald-400 focus:ring-emerald-100',
      previewBg: 'bg-emerald-50/50',
    },
    blue: {
      border: 'border-blue-100',
      iconBg: 'bg-blue-50 text-blue-600',
      chip: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
      badge: 'bg-blue-50 text-blue-700',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
      btnOutline: 'border-blue-200 text-blue-600 hover:bg-blue-50',
      focus: 'focus:border-blue-400 focus:ring-blue-100',
      previewBg: 'bg-blue-50/50',
    },
  }[config.color] ?? {}

  const preview = applyPreview(text, config.variables)
  const charCount = text.length

  return (
    <div className={`bg-white rounded-[28px] border ${colorClasses.border} shadow-xl shadow-slate-200/30 overflow-hidden`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClasses.iconBg}`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-800 tracking-tight">{config.label}</h3>
            <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed">{config.description}</p>

            {/* Where it's used */}
            <div className="mt-3 flex flex-col gap-1.5">
              {config.usedIn.map((loc, i) => (
                <div key={i} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${colorClasses.badge}`}>
                  <Info size={10} />
                  {loc}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Variables chips */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Variáveis disponíveis — clique para inserir no editor
          </label>
          <div className="flex flex-wrap gap-2">
            {config.variables.map(v => (
              <button
                key={v.tag}
                type="button"
                onClick={() => handleInsertVariable(v.tag)}
                title={`${v.description} (ex: ${v.example})`}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${colorClasses.chip}`}
              >
                {v.tag}
                <span className="ml-1.5 opacity-60 font-medium normal-case">→ {v.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle editor / preview */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${!showPreview ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Pencil size={10} /> Editar
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${showPreview ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Eye size={10} /> Preview com exemplos
          </button>
          <span className="ml-auto text-[10px] text-slate-400 font-medium">{charCount} caracteres</span>
        </div>

        {/* Editor */}
        {!showPreview ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            rows={12}
            spellCheck={false}
            className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-mono text-slate-700 outline-none focus:ring-4 focus:ring-offset-0 resize-y transition-all leading-relaxed ${colorClasses.focus}`}
            placeholder="Digite o texto da mensagem aqui..."
          />
        ) : (
          <div className={`rounded-2xl p-5 border border-slate-100 ${colorClasses.previewBg}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Prévia da mensagem (variáveis substituídas por exemplos)
            </p>
            <pre className="text-[12px] font-sans text-slate-700 whitespace-pre-wrap leading-relaxed">
              {preview}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses.btn}`}
          >
            {saving ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : saved ? (
              <CheckCircle2 size={13} />
            ) : (
              <Save size={13} />
            )}
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Mensagem'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all ${colorClasses.btnOutline}`}
          >
            <RefreshCw size={11} /> Restaurar Padrão
          </button>
          {isDirty && (
            <span className="text-[10px] text-orange-500 font-bold ml-auto animate-pulse">
              Alterações não salvas
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal da aba
// ─────────────────────────────────────────────────────────────────────────────
export default function MensagensWhatsappTab() {
  const { templates, atualizar, loading } = useWhatsAppTemplates()

  const getValue = (key: 'msg_whatsapp_cobranca' | 'msg_whatsapp_hgu' | 'msg_whatsapp_adesao', defaultVal: string): string => {
    if (key === 'msg_whatsapp_cobranca') return templates.cobranca || defaultVal
    if (key === 'msg_whatsapp_hgu') return templates.hgu || defaultVal
    if (key === 'msg_whatsapp_adesao') return templates.adesao || defaultVal
    return defaultVal
  }

  const handleSave = async (key: string, value: string) => {
    let codigo: 'MSG_WHATSAPP_COBRANCA' | 'MSG_WHATSAPP_HGU' | 'MSG_WHATSAPP_ADESAO' | '' = ''
    if (key === 'msg_whatsapp_cobranca') codigo = 'MSG_WHATSAPP_COBRANCA'
    else if (key === 'msg_whatsapp_hgu') codigo = 'MSG_WHATSAPP_HGU'
    else if (key === 'msg_whatsapp_adesao') codigo = 'MSG_WHATSAPP_ADESAO'
    if (codigo !== '') await atualizar(codigo, value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm font-bold uppercase tracking-widest">Carregando configurações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Intro banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-2xl p-5 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
          <MessageCircle size={20} />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-800 tracking-tight">Central de Mensagens WhatsApp</h2>
          <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed max-w-3xl">
            Edite abaixo os textos enviados via WhatsApp pelo sistema. Cada card mostra exatamente <strong>qual botão</strong> utiliza aquela mensagem.
            Use as variáveis disponíveis (ex: <code className="bg-white px-1 rounded text-emerald-700 font-mono text-[11px]">{'{{nome}}'}</code>) para personalizar automaticamente com dados do associado.
            Clique em <strong>"Preview com exemplos"</strong> para ver como ficará antes de salvar.
          </p>
        </div>
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {TEMPLATES.map(config => (
          <TemplateCard
            key={config.key}
            config={config}
            value={getValue(config.key, config.defaultValue)}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  )
}
