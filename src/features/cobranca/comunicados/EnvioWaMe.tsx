'use client'
import React, { useState, useEffect } from 'react'
import { Associado } from '@/lib/types'
import { ComunicadoTemplate, ComunicadoHistorico } from '@/lib/hooks/useComunicados'
import { Send, Smartphone, Loader2, Info } from 'lucide-react'
import { fmtR } from '@/lib/utils/formatters'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'

interface EnvioWaMeProps {
  selectedAssociados: Associado[]
  template?: ComunicadoTemplate
  onLogEnvio: (envio: Partial<ComunicadoHistorico>) => Promise<any>
}

export default function EnvioWaMe({ selectedAssociados, template, onLogEnvio }: EnvioWaMeProps) {
  const { currentUser } = useCurrentUser()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSending, setIsSending] = useState(false)

  // Reset index quando mudar a seleção ou o template
  useEffect(() => {
    setCurrentIndex(0)
    setIsSending(false)
  }, [selectedAssociados, template])

  const substituirVariaveis = (texto: string, assoc: Associado) => {
    if (!texto) return ''
    let msg = texto
    msg = msg.replace(/{NOME}/g, assoc.nome || '')
    msg = msg.replace(/{PRIMEIRO_NOME}/g, (assoc.nome || '').split(' ')[0])
    msg = msg.replace(/{CPF}/g, assoc.cpf || '')
    msg = msg.replace(/{PLANO}/g, assoc.categoria || '')
    msg = msg.replace(/{STATUS}/g, (assoc.status || '').toUpperCase())
    msg = msg.replace(/{VENCIMENTO}/g, assoc.vencimento_dia ? `dia ${assoc.vencimento_dia}` : '')
    msg = msg.replace(/{VALOR}/g, assoc.mensalidade ? fmtR(assoc.mensalidade) : '')
    msg = msg.replace(/{LINK_PAGAMENTO}/g, '[LINK]') // Pode ser substituído futuramente por um gerador de link
    msg = msg.replace(/{TELEFONE}/g, assoc.telefone || '')
    msg = msg.replace(/{DATA_ATUAL}/g, new Date().toLocaleDateString('pt-BR'))
    return msg
  }

  const limparTelefone = (tel?: string) => {
    if (!tel) return ''
    const t = tel.replace(/\D/g, '')
    // Assume DDI 55 se não tiver
    if (t.length === 10 || t.length === 11) return `55${t}`
    return t
  }

  const handleLogAndNext = () => {
    if (!template || currentIndex >= selectedAssociados.length) return

    const assoc = selectedAssociados[currentIndex]
    const num = limparTelefone(assoc.telefone)
    const msg = substituirVariaveis(template.conteudo, assoc)
    
    // Registrar log em background
    onLogEnvio({
      associado_id: assoc.id,
      associado_nome: assoc.nome || 'Sem nome',
      associado_telefone: assoc.telefone || 'Sem telefone',
      template_id: template.id,
      template_nome: template.nome || 'Sem template',
      conteudo_enviado: msg || '',
      canal: 'whatsapp_wame',
      status: num ? 'enviado' : 'falha_sem_telefone',
      usuario_nome: currentUser?.nome || currentUser?.email || 'Sistema',
      usuario_email: currentUser?.email || ''
    }).then(res => {
      if (res && res.error) {
        console.error('Erro ao registrar log:', res.error)
      }
    })

    setCurrentIndex(prev => prev + 1)
  }

  const handleSendAll = () => {
    // Como a API oficial não é usada, o ideal é o usuário clicar um a um, 
    // ou automatizar abrir abas (o que o navegador bloqueia por popup blocker).
    // O ideal é usar o fluxo de "Próximo".
    alert('O envio via wa.me exige que você confirme a mensagem no WhatsApp.\n\nPara múltiplos envios, use o botão "Enviar para o Próximo" e feche a aba após confirmar o envio, até concluir todos.')
  }

  // Preview para o primeiro ou atual associado
  const previewAssoc = selectedAssociados[currentIndex] || selectedAssociados[0]
  const previewMsg = previewAssoc && template ? substituirVariaveis(template.conteudo, previewAssoc) : ''
  const previewNum = previewAssoc ? limparTelefone(previewAssoc.telefone) : ''
  const waUrl = previewNum ? `https://api.whatsapp.com/send?phone=${previewNum}&text=${encodeURIComponent(previewMsg)}` : '#'

  if (selectedAssociados.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400">
        <Smartphone size={32} className="mb-3 opacity-20" />
        <p className="text-xs font-bold uppercase tracking-widest">Nenhum associado selecionado</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400">
        <Send size={32} className="mb-3 opacity-20" />
        <p className="text-xs font-bold uppercase tracking-widest">Selecione um template para enviar</p>
      </div>
    )
  }

  const progress = Math.round((currentIndex / selectedAssociados.length) * 100)
  const isFinished = currentIndex >= selectedAssociados.length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-emerald-600">
          <Send size={18} />
          <h3 className="font-bold text-sm uppercase tracking-wider">Disparo WhatsApp</h3>
        </div>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
          {currentIndex} / {selectedAssociados.length}
        </span>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {isFinished ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-emerald-500 bg-emerald-50 rounded-xl border border-emerald-100">
            <Send size={32} className="mb-3" />
            <p className="text-sm font-bold uppercase tracking-wider text-center">Todos os disparos iniciados!</p>
            <p className="text-xs text-emerald-600/70 text-center mt-2">Verifique o histórico para ver os logs de envio.</p>
            <button
               onClick={() => setCurrentIndex(0)}
               className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm uppercase tracking-wider transition-colors"
            >
              Reiniciar
            </button>
          </div>
        ) : (
          <>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="flex flex-col gap-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Próximo envio:</p>
              <p className="text-sm font-medium text-slate-800">{previewAssoc?.nome}</p>
              <p className="text-xs font-mono text-slate-600">{previewAssoc?.telefone || 'Telefone não cadastrado'}</p>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Pré-visualização da Mensagem</label>
              <div className="bg-[#EFEAE2] p-4 rounded-xl border border-[#D1D7DB] flex-1 relative shadow-inner">
                <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-slate-800 whitespace-pre-wrap font-sans max-w-[90%]">
                  {previewMsg}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 mt-auto">
              <div className="flex items-start gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <Info size={14} className="text-amber-500 mt-0.5 flex-none" />
                <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                  O envio via wa.me abre uma nova aba para cada associado. Você precisará clicar em "Enviar" no seu WhatsApp Web ou App. O sistema registrará automaticamente o log de início do disparo.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSendAll}
                  className="flex-1 px-3 py-3 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Como automatizar?
                </button>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!previewNum) {
                      e.preventDefault()
                      alert(`O associado ${previewAssoc?.nome} não possui um telefone válido cadastrado.`)
                      handleLogAndNext() // Registra a falha e pula
                    } else {
                      handleLogAndNext()
                    }
                  }}
                  className={`flex-1 px-3 py-3 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-md shadow-emerald-500/20 transition-colors uppercase tracking-wider flex items-center justify-center gap-2 ${!previewAssoc?.telefone ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Send size={14} />
                  Enviar Próximo
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
