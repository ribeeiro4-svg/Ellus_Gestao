'use client'
import React, { useState, useMemo } from 'react'
import { Lock, X, AlertTriangle, FileText, Send, Loader2 } from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useCancelamentos } from '@/lib/hooks/useCancelamentos'
import { efetivarCancelamentoAction } from '@/app/actions/cancelamento'
import { getMensagemCancelamento } from '../utils/mensagemCancelamento'

interface CancelamentoModalProps {
  associado: any
  onClose: () => void
}

export default function CancelamentoModal({ associado, onClose }: CancelamentoModalProps) {
  const [senhaInput, setSenhaInput] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [erroSenha, setErroSenha] = useState(false)
  
  const { lancamentos, loading: loadingFin, refresh: refreshFin } = useFinanceiro()
  const { registrarCancelamento } = useCancelamentos()
  
  const [fileTermo, setFileTermo] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [cancelamentoEfetuado, setCancelamentoEfetuado] = useState(false)

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (senhaInput === '19072425') {
      setAutenticado(true)
      setErroSenha(false)
    } else {
      setErroSenha(true)
    }
  }

  // Filtrar lançamentos (mensalidade ou adesão) atrasados e vincendos no mês atual
  const debitos = useMemo(() => {
    if (!autenticado) return { atrasados: [], vincendos: [], total: 0 }
    
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    const filtroBase = lancamentos.filter(l => 
      l.associado_id === associado.id && 
      (l.status === 'aberto' || l.status === 'atrasado') &&
      l.tipo === 'receita'
    )

    const atrasados = filtroBase.filter(l => {
      if (l.status === 'atrasado') return true
      if (l.data) {
        const v = new Date(l.data + 'T12:00:00Z')
        return v < hoje && l.status !== 'pago'
      }
      return false
    })

    const vincendos = filtroBase.filter(l => {
      if (l.data) {
        const v = new Date(l.data + 'T12:00:00Z')
        return v >= hoje && v.getMonth() === mesAtual && v.getFullYear() === anoAtual
      }
      return false
    })

    const total = [...atrasados, ...vincendos].reduce((acc, l) => acc + (Number(l.valor) || 0), 0)

    return { atrasados, vincendos, total }
  }, [lancamentos, associado.id, autenticado])

  const termoZapsignAssinadoUrl = associado.zapsign_signers?.find((s: any) => s.status === 'signed')?.sign_url || null

  const handleWhatsApp = () => {
    const phoneStr = associado.telefone ? associado.telefone.replace(/\D/g, '') : ''
    const phone = phoneStr.startsWith('55') ? phoneStr : `55${phoneStr}`

    const todosDebitos = [...debitos.atrasados, ...debitos.vincendos]
    const pendencias = todosDebitos.length > 0
      ? {
          itens: todosDebitos.map(l => ({
            descricao: l.descricao || '',
            valor: Number(l.valor) || 0,
            data: l.data || '',
            tipo: debitos.atrasados.some((a: any) => a.id === l.id) ? 'atrasado' as const : 'vincendo' as const,
          })),
          total: debitos.total,
        }
      : undefined

    const msg = getMensagemCancelamento(associado.nome || '', pendencias)

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    onClose()
  }

  const fmtR = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const fmtDate = (d: string) => {
    return d
  }

  const handleEfetivar = async () => {
    if (!fileTermo) {
      alert('Por favor, selecione o Termo de Cancelamento assinado (PDF).')
      return
    }

    setIsUploading(true)
    setUploadProgress('Fazendo upload do termo...')

    try {
      const formData = new FormData()
      formData.append('associadoId', associado.id)
      formData.append('file', fileTermo)

      setUploadProgress('Processando cancelamento...')

      const res = await efetivarCancelamentoAction(formData)

      if (res.error) {
        throw new Error(res.error)
      }

      // Registrar no histórico de cancelamentos
      registrarCancelamento({
        associado_id: associado.id,
        nome: associado.nome,
        cpf: associado.cpf || '',
        valor_pendente: debitos.total,
        termo_url: res.termoUrl
      })

      setUploadProgress('Cancelamento Efetivado com sucesso!')
      setCancelamentoEfetuado(true)
      refreshFin() // Atualizar financeiro para remover os abertos
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (err: any) {
      alert(`Erro ao efetivar cancelamento: ${err.message}`)
      setIsUploading(false)
      setUploadProgress('')
    }
  }

  if (!autenticado) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 text-center mb-2">Acesso Restrito</h2>
          <p className="text-xs text-slate-500 text-center mb-6">Insira a senha de segurança para prosseguir com o cancelamento.</p>
          
          <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
            <input 
              type="password" 
              placeholder="Senha de segurança"
              value={senhaInput}
              onChange={e => setSenhaInput(e.target.value)}
              className={`w-full p-3 rounded-xl border outline-none text-center tracking-[0.5em] font-bold ${erroSenha ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 focus:border-red-500'}`}
              autoFocus
            />
            {erroSenha && <span className="text-[10px] text-red-500 font-bold text-center -mt-2">Senha incorreta.</span>}
            
            <div className="flex gap-2 w-full mt-2">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 text-white hover:bg-red-700">
                Validar
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-red-600 p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Solicitação de Cancelamento</h2>
              <p className="text-xs text-red-200 font-medium">Análise de Vínculo e Débitos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-red-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Info Associado */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase">{associado.nome}</h3>
              <p className="text-xs text-slate-500">CPF: {associado.cpf || 'Não informado'} | Tel: {associado.telefone || '--'}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Vencimento Mensal: Dia {associado.vencimento_dia || '10'}</p>
            </div>
            {termoZapsignAssinadoUrl ? (
              <a href={termoZapsignAssinadoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap">
                <FileText size={16} />
                Ver Termo Assinado
              </a>
            ) : (
              <span className="flex items-center gap-2 bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
                <FileText size={16} />
                Sem Termo Assinado
              </span>
            )}
          </div>

          {/* Débitos */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">Pendências Financeiras (Atrasados + Mês do Cancelamento)</h4>
            
            {loadingFin ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="animate-spin text-slate-300 mb-2" size={24}/>
                <p className="text-xs text-slate-500">Buscando financeiro...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {[...debitos.atrasados, ...debitos.vincendos].length === 0 ? (
                  <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-2xl text-center">
                    <p className="text-sm font-bold">Nenhuma pendência financeira encontrada.</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                      {[...debitos.atrasados, ...debitos.vincendos].map(l => {
                        const isAtrasado = debitos.atrasados.some(a => a.id === l.id)
                        return (
                          <div key={l.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">{l.descricao}</span>
                              <span className="text-[10px] text-slate-500">Vencimento: {fmtDate(l.data || '')}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-sm font-black text-red-600">{fmtR(l.valor)}</span>
                              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${isAtrasado ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isAtrasado ? 'Atrasado' : 'Vincendo'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between mt-2">
                      <span className="text-xs font-black text-red-800 uppercase">Soma de Pendências</span>
                      <span className="text-lg font-black text-red-700">{fmtR(debitos.total)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col gap-4">
          <p className="text-[10px] text-slate-500 text-center">Ao clicar em Enviar Solicitação, apenas a mensagem padrão será enviada via WhatsApp. O histórico de cancelamento será registrado ao Efetivar o Cancelamento.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wide">
              Anexar Termo de Cancelamento (PDF) <span className="text-red-500">*</span>
            </label>
            <input 
              type="file" 
              accept="application/pdf"
              onChange={(e) => setFileTermo(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 transition-all cursor-pointer"
              disabled={isUploading || cancelamentoEfetuado}
            />
            <p className="text-[10px] text-slate-400 mt-2">Obrigatório para efetivar o cancelamento. Somente arquivos PDF.</p>
          </div>

          {cancelamentoEfetuado ? (
            <div className="bg-emerald-50 text-emerald-700 py-3 rounded-xl text-center text-sm font-black uppercase tracking-wider border border-emerald-200">
              Cancelamento Concluído!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button 
                onClick={handleWhatsApp}
                className="w-full flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-200"
                disabled={isUploading}
              >
                <Send size={16} />
                Enviar Solicitação (WhatsApp)
              </button>

              <button 
                onClick={handleEfetivar}
                disabled={!fileTermo || isUploading}
                className={`w-full flex justify-center items-center gap-2 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md ${!fileTermo || isUploading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'}`}
              >
                {isUploading ? (
                  <><Loader2 size={16} className="animate-spin" /> {uploadProgress}</>
                ) : (
                  <><AlertTriangle size={16} /> Efetivar Cancelamento</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
