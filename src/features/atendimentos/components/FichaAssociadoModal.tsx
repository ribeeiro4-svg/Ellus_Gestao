'use client'
import React, { useState } from 'react'
import { X, User, Phone, Mail, CreditCard, Calendar, CheckCircle, Save, ArrowRight } from 'lucide-react'
import { useAssociados } from '@/lib/hooks/useAssociados'

interface FichaAssociadoModalProps {
  associado: any
  onClose: () => void
  onProceed: (associadoAtualizado: any, dadosAlterados: string[]) => void
}

const CAMPOS_LABELS: Record<string, string> = {
  nome: 'Nome',
  cpf: 'CPF',
  email: 'E-mail',
  telefone: 'Telefone',
  categoria: 'Categoria',
  plano_saude: 'Plano de Saúde',
  status: 'Status',
  vencimento_dia: 'Dia de Vencimento',
  mensalidade: 'Mensalidade (R$)',
}

export default function FichaAssociadoModal({ associado, onClose, onProceed }: FichaAssociadoModalProps) {
  const { atualizar } = useAssociados()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Campos editáveis
  const [nome, setNome] = useState(associado.nome || '')
  const [cpf, setCpf] = useState(associado.cpf || '')
  const [email, setEmail] = useState(associado.email || '')
  const [telefone, setTelefone] = useState(associado.telefone || '')
  const [categoria, setCategoria] = useState(associado.categoria || '')
  const [planoSaude, setPlanoSaude] = useState(associado.plano_saude || '')
  const [vencimentoDia, setVencimentoDia] = useState(String(associado.vencimento_dia || '10'))
  const [mensalidade, setMensalidade] = useState(String(associado.mensalidade || ''))

  const detectarAlteracoes = () => {
    const alterados: string[] = []
    if (nome !== (associado.nome || '')) alterados.push(CAMPOS_LABELS.nome)
    if (cpf !== (associado.cpf || '')) alterados.push(CAMPOS_LABELS.cpf)
    if (email !== (associado.email || '')) alterados.push(CAMPOS_LABELS.email)
    if (telefone !== (associado.telefone || '')) alterados.push(CAMPOS_LABELS.telefone)
    if (categoria !== (associado.categoria || '')) alterados.push(CAMPOS_LABELS.categoria)
    if (planoSaude !== (associado.plano_saude || '')) alterados.push(CAMPOS_LABELS.plano_saude)
    if (vencimentoDia !== String(associado.vencimento_dia || '10')) alterados.push(CAMPOS_LABELS.vencimento_dia)
    if (mensalidade !== String(associado.mensalidade || '')) alterados.push(CAMPOS_LABELS.mensalidade)
    return alterados
  }

  const temAlteracoes = detectarAlteracoes().length > 0

  const handleSaveAndProceed = async () => {
    const alterados = detectarAlteracoes()
    setSaving(true)

    if (alterados.length > 0) {
      await atualizar(associado.id, {
        nome,
        cpf,
        email,
        telefone,
        categoria,
        plano_saude: planoSaude,
        vencimento_dia: Number(vencimentoDia),
        mensalidade: Number(mensalidade),
      })
    }

    setSaving(false)
    setSaved(true)

    setTimeout(() => {
      const associadoAtualizado = {
        ...associado,
        nome,
        cpf,
        email,
        telefone,
        categoria,
        plano_saude: planoSaude,
        vencimento_dia: Number(vencimentoDia),
        mensalidade: Number(mensalidade),
      }
      onProceed(associadoAtualizado, alterados)
    }, 500)
  }

  const handleSkip = () => {
    onProceed(associado, [])
  }

  const inputCls = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
  const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #0e2d22 0%, #1d4f3e 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <User size={20} className="text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">Ficha do Associado</h2>
              <p className="text-[11px] text-emerald-300 font-medium">Confirme e atualize os dados cadastrais antes de prosseguir</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-6 flex flex-col gap-5">

          {/* Info de status */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shrink-0" style={{ background: 'linear-gradient(135deg, #1d4f3e, #2d8c6f)' }}>
              {(nome || 'A')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-sm">{nome}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  associado.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' :
                  associado.status === 'inadimplente' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{associado.status || 'Sem status'}</span>
                <span className="text-[11px] text-slate-400 font-medium">Cód: {associado.codigo || '--'}</span>
              </div>
            </div>
          </div>

          {/* Campos editáveis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}><User size={10} className="inline mr-1" />Nome Completo</label>
              <input className={inputCls} value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
            </div>

            <div>
              <label className={labelCls}><CreditCard size={10} className="inline mr-1" />CPF</label>
              <input className={inputCls} value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>

            <div>
              <label className={labelCls}><Phone size={10} className="inline mr-1" />Telefone</label>
              <input className={inputCls} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>

            <div className="col-span-2">
              <label className={labelCls}><Mail size={10} className="inline mr-1" />E-mail</label>
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>

            <div>
              <label className={labelCls}>Categoria</label>
              <input className={inputCls} value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Categoria" />
            </div>

            <div>
              <label className={labelCls}>Plano de Saúde</label>
              <select className={inputCls} value={planoSaude} onChange={e => setPlanoSaude(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="Ativo">Ativo</option>
                <option value="Aguardando Declaração">Aguardando Declaração</option>
                <option value="Não Possui">Não Possui</option>
              </select>
            </div>

            <div>
              <label className={labelCls}><Calendar size={10} className="inline mr-1" />Vencimento (Dia)</label>
              <select className={inputCls} value={vencimentoDia} onChange={e => setVencimentoDia(e.target.value)}>
                <option value="10">Dia 10</option>
                <option value="20">Dia 20</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Mensalidade (R$)</label>
              <input className={inputCls} type="number" step="0.01" value={mensalidade} onChange={e => setMensalidade(e.target.value)} placeholder="0,00" />
            </div>
          </div>

          {/* Aviso de alterações detectadas */}
          {temAlteracoes && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-amber-500 text-lg shrink-0">⚠️</span>
              <div>
                <p className="text-xs font-black text-amber-700 uppercase tracking-wide">Alterações detectadas</p>
                <p className="text-[11px] text-amber-600 mt-0.5">
                  Os seguintes campos foram modificados e serão salvos: <strong>{detectarAlteracoes().join(', ')}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center gap-3 bg-slate-50/60">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wide hover:bg-slate-100 transition-colors"
          >
            Pular e Continuar sem Alterações
          </button>
          <button
            onClick={handleSaveAndProceed}
            disabled={saving || saved}
            className="flex-1 py-3 rounded-xl text-white text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #1d4f3e, #2d8c6f)' }}
          >
            {saved ? (
              <><CheckCircle size={14} /> Salvo! Abrindo Atendimento...</>
            ) : saving ? (
              <><span className="animate-spin">⏳</span> Salvando...</>
            ) : temAlteracoes ? (
              <><Save size={14} /> Salvar Alterações e Atender</>
            ) : (
              <><ArrowRight size={14} /> Confirmar e Atender</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
