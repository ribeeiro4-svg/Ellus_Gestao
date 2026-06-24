'use client'
import React, { useState, useEffect } from 'react'
import { Loader2, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'

interface Template {
  id: string;
  codigo: string;
  etapa: string;
  canal: string;
  dias_min: number;
  dias_max: number;
  tom: string;
  titulo: string;
  texto: string;
}

const TOM_BADGES: Record<string, string> = {
  amigavel: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  cordial:  'bg-blue-50 text-blue-600 border-blue-100',
  formal:   'bg-slate-100 text-slate-600 border-slate-200',
  juridico: 'bg-purple-50 text-purple-600 border-purple-100',
  urgente:  'bg-red-50 text-red-600 border-red-100',
  positivo: 'bg-teal-50 text-teal-600 border-teal-100',
  lembrete: 'bg-amber-50 text-amber-600 border-amber-100',
  alerta:   'bg-orange-50 text-orange-600 border-orange-100',
}

export default function ConfigCobrancaTab() {
  const [config, setConfig] = useState<any>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingTpl, setSavingTpl] = useState<string | null>(null)

  const { editar, isAdmin } = usePermissions('cobrancas')

  useEffect(() => {
    Promise.all([
      fetch('/api/cobranca/config').then(r => r.json()).catch(() => ({})),
      fetch('/api/cobranca/config/templates').then(r => r.json()).catch(() => [])
    ]).then(([conf, tpls]) => {
      if (conf && !conf.error) {
        setConfig(conf)
      } else if (conf?.error) {
        console.error('[ConfigCobrancaTab] Erro ao carregar config:', conf.error)
        setConfig({})
      } else {
        setConfig({})
      }
      setTemplates(Array.isArray(tpls) ? tpls : [])
      setLoading(false)
    })
  }, [])

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/cobranca/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const json = await res.json()
      if (!res.ok || json?.error) {
        alert('Erro ao salvar: ' + (json?.error || `HTTP ${res.status}`))
      } else {
        setConfig(json)
        alert('Parâmetros salvos com sucesso!')
      }
    } catch (err: any) {
      alert('Erro de conexão: ' + err.message)
    }
    setSaving(false)
  }

  const handleSaveTemplate = async (tpl: Template) => {
    setSavingTpl(tpl.codigo)
    try {
      const res = await fetch(`/api/cobranca/config/templates/${tpl.codigo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: tpl.texto })
      })
      const json = await res.json()
      if (!res.ok || json?.error) {
        alert('Erro ao salvar template ' + tpl.codigo + ': ' + (json?.error || `HTTP ${res.status}`))
      } else {
        alert(`Template ${tpl.codigo} salvo com sucesso!`)
      }
    } catch (err: any) {
      alert('Erro de conexão: ' + err.message)
    }
    setSavingTpl(null)
  }

  const updateTemplateTexto = (codigo: string, texto: string) => {
    setTemplates(prev => prev.map(t => t.codigo === codigo ? { ...t, texto } : t))
  }

  if (loading) return (
    <div className="flex justify-center items-center p-16">
      <Loader2 className="animate-spin text-emerald-600" size={28} />
    </div>
  )

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">

      {/* Parâmetros financeiros */}
      <div className="table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px] mb-8 flex items-center gap-3">
          <span className="w-2 h-6 bg-emerald-500 rounded-full inline-block" />
          Parâmetros Financeiros de Cobrança
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { key: 'multa_moratoria_perc',   label: 'Multa Moratória (%)',        type: 'number', step: '0.1', hint: 'Ex: 2 = 2% sobre o valor em atraso' },
            { key: 'juros_mora_mensal_perc', label: 'Juros de Mora (% a.m.)',     type: 'number', step: '0.1', hint: 'Ex: 1 = 1% ao mês proporcional ao dia' },
            { key: 'dias_para_suspensao',    label: 'Dias p/ Suspensão',          type: 'number', step: '1',   hint: 'Padrão: 90 dias (art. 57 Código Civil)' },
            { key: 'contato_tesouraria',     label: 'Contato Tesouraria',         type: 'text',   step: '',    hint: 'WhatsApp/telefone exibido nas mensagens' },
            { key: 'nome_tesoureiro',        label: 'Nome do Tesoureiro(a)',      type: 'text',   step: '',    hint: 'Assinatura nos templates formais' },
            { key: 'cidade',                 label: 'Cidade/UF',                  type: 'text',   step: '',    hint: 'Ex: Petrolina-PE (para cartas formais)' },
          ].map(field => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
              <input
                type={field.type}
                step={field.step || undefined}
                value={config?.[field.key] ?? ''}
                onChange={e => setConfig({ ...config, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/40 outline-none transition-all"
              />
              {field.hint && <p className="text-[9px] text-slate-400 font-bold">{field.hint}</p>}
            </div>
          ))}
        </div>

        {(editar || isAdmin) && (
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="mt-8 px-8 py-4 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-95"
          >
            {saving ? 'Salvando...' : 'Salvar Parâmetros'}
          </button>
        )}
      </div>

      {/* Templates de mensagens */}
      <div className="table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="mb-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-3 mb-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block" />
            Templates de Mensagens ({templates.length})
          </h2>
          <p className="text-[11px] text-slate-400 font-bold max-w-xl">
            Cada template é selecionado automaticamente pelo número de dias de atraso do associado. 
            As variáveis <code className="bg-slate-100 px-1 rounded text-slate-600">{'{{nome}}'}</code> são substituídas pelos dados reais no momento do envio.
          </p>
        </div>

        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-3xl">
              <p className="text-xs text-slate-400 italic">Nenhum template encontrado. Execute o migration SQL para criar os dados padrão.</p>
              <code className="text-[10px] bg-slate-100 px-3 py-1 rounded mt-2 inline-block font-mono text-slate-600">npx supabase db push</code>
            </div>
          ) : (
            templates.map(tpl => {
              const isOpen = expandedId === tpl.codigo
              const tomClass = TOM_BADGES[tpl.tom] || TOM_BADGES.formal
              return (
                <div key={tpl.codigo} className={`rounded-3xl border transition-all ${isOpen ? 'border-indigo-100 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                  <button
                    onClick={() => setExpandedId(isOpen ? null : tpl.codigo)}
                    className="w-full flex items-center gap-4 p-5 text-left"
                  >
                    <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-black shrink-0">
                      {tpl.codigo}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-700 truncate">{tpl.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${tomClass}`}>{tpl.tom}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{tpl.canal}</span>
                        {tpl.dias_max > 0 && (
                          <span className="text-[9px] font-bold text-slate-300">D+{tpl.dias_min} → D+{tpl.dias_max}</span>
                        )}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                      <textarea
                        value={tpl.texto}
                        onChange={e => updateTemplateTexto(tpl.codigo, e.target.value)}
                        className="w-full h-48 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-mono text-slate-700 outline-none focus:border-indigo-400/40 transition-all resize-none leading-relaxed"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[9px] text-slate-400 font-bold max-w-sm">
                          Variáveis: {`{{nome}}, {{nome_completo}}, {{mes_ano}}, {{meses_abertos}}, {{qtd_mensalidades}}, {{valor_original}}, {{valor_multa}}, {{valor_juros}}, {{valor_total}}, {{dias_atraso}}, {{dias_restantes}}, {{data_suspensao}}, {{contato_tesouraria}}, {{nome_tesoureiro}}, {{cidade}}, {{data_hoje}}, {{nome_associacao}}, {{matricula}}`}
                        </p>
                        {(editar || isAdmin) && (
                          <button
                            onClick={() => handleSaveTemplate(tpl)}
                            disabled={savingTpl === tpl.codigo}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-sm shrink-0 ml-4"
                          >
                            <Save size={12} />
                            {savingTpl === tpl.codigo ? 'Salvando...' : 'Salvar'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
