'use client'
import React, { useState } from 'react'
import { XCircle, Download, Upload, ShieldAlert, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/lib/hooks/useTenant'
import jsPDF from 'jspdf'
import { fmtData } from '@/lib/utils/formatters'
import { uploadTermoSuspensaoAction } from '@/app/actions/upload-suspensao'

interface SuspensaoModalProps {
  isOpen: boolean
  onClose: () => void
  associado: any
  onConfirm: (data: any) => Promise<any>
}

const MOTIVOS = [
  'Suspensão Por Inadimplência',
  'Suspensão por Ordem Judicial',
  'Suspensão por Outro(s) Motivo(s)'
]

export default function SuspensaoModal({ isOpen, onClose, associado, onConfirm }: SuspensaoModalProps) {
  const [step, setStep] = useState(1)
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const [dataSuspensao, setDataSuspensao] = useState(() => new Date().toISOString().split('T')[0])
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gerandoPDF, setGerandoPDF] = useState(false)
  
  const sb = createClient()
  const { tenant } = useTenant()

  // Hooks devem ser chamados antes de qualquer return condicional
  if (!isOpen || !associado) return null

  const handleNextStep = () => {
    if (senha !== '19072425') {
      setError('Senha incorreta. Acesso negado.')
      return
    }
    setError('')
    setStep(2)
  }

  const gerarTermo = async () => {
    setGerandoPDF(true)
    try {
      const doc = new jsPDF()
      const dateStr = fmtData(dataSuspensao + 'T12:00:00')
      
      let logoY = 15
      let startY = 45

      // Inserir logo se disponível
      if (tenant?.logo_url) {
        try {
          const response = await fetch(tenant.logo_url)
          const blob = await response.blob()
          const reader = new FileReader()
          await new Promise<void>((resolve) => {
            reader.onload = (e) => {
              const imgData = e.target?.result as string
              const imgType = blob.type.includes('png') ? 'PNG' : 'JPEG'
              doc.addImage(imgData, imgType, 80, logoY, 50, 20, undefined, 'FAST')
              resolve()
            }
            reader.readAsDataURL(blob)
          })
          startY = 50
        } catch {
          // Se falhar o carregamento do logo, continua sem ele
        }
      }
      
      // Título Centralizado
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('COMUNICADO DE SUSPENSÃO:', 105, startY, { align: 'center' })
      
      // Corpo do texto
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      
      const margin = 20
      let cursorY = startY + 18
      
      // Assunto
      doc.setFont('helvetica', 'bold')
      const assunto = motivo === 'Suspensão Por Inadimplência' 
        ? 'Assunto: Suspensão de Plano de Saúde e Vínculo Associativo por Inadimplência'
        : `Assunto: ${motivo}`
      doc.text(assunto, margin, cursorY)
      cursorY += 15
      
      // Saudação
      doc.setFont('helvetica', 'normal')
      doc.text(`Prezada(o) Sr(a). ${associado.nome},`, margin, cursorY)
      cursorY += 10
      
      // Parágrafo 1
      const motivoText = motivo === 'Suspensão Por Inadimplência' ? 'motivo de inadimplência' : motivo.toLowerCase()
      const p1 = `A ACPROBEC, Associação Colaborativa de Profissionais Liberais, Comércio e Setor da Beleza, por meio deste, informa que o plano de saúde vinculado ao Hospital HGU, bem como o vínculo associativo junto à ACPROBEC, encontram-se atualmente suspensos por ${motivoText}.`
      const p1Lines = doc.splitTextToSize(p1, 170)
      doc.text(p1Lines, margin, cursorY)
      cursorY += (p1Lines.length * 6) + 5
      
      // Parágrafo 2
      const p2 = `Para regularização e reativação do plano de saúde HGU e do vínculo com a associação, faz-se necessário retornar o nosso contato através do número de telefone administrativo: (87) 9 8125 – 6590, para verificar as pendências financeiras com o HGU e a ACPROBEC.`
      const p2Lines = doc.splitTextToSize(p2, 170)
      doc.text(p2Lines, margin, cursorY)
      cursorY += (p2Lines.length * 6) + 5
      
      // Parágrafo 3
      const p3 = `Sem mais para o momento, permanecemos à disposição para quaisquer esclarecimentos.`
      const p3Lines = doc.splitTextToSize(p3, 170)
      doc.text(p3Lines, margin, cursorY)
      cursorY += (p3Lines.length * 6) + 10
      
      // Assinatura ACPROBEC
      doc.text('Atenciosamente,', margin, cursorY)
      cursorY += 6
      doc.text('ACPROBEC - Associação Colaborativa de Profissionais Liberais, Comércio e Setor da', margin, cursorY)
      cursorY += 6
      doc.text('Beleza', margin, cursorY)
      
      const fileName = `acprobec - Comunicado de Suspensao - ${associado.nome} - ${dateStr.replace(/\//g, '.')}.pdf`
      doc.save(fileName)
    } finally {
      setGerandoPDF(false)
    }
  }

  const handleConfirmar = async () => {
    if (!file) {
      setError('Por favor, faça o upload do termo assinado antes de prosseguir.')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('tenantId', associado.tenant_id)
      formData.append('associadoId', associado.id)
      formData.append('file', file)

      const result = await uploadTermoSuspensaoAction(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      if (!result.signedUrl) {
        throw new Error('URL do documento não retornou corretamente.')
      }
        
      const suspensaoData = {
        status: 'suspenso',
        suspensao_motivo: motivo,
        suspensao_data: new Date(dataSuspensao + 'T12:00:00').toISOString(),
        suspensao_arquivo_url: result.signedUrl
      }
      
      const res = await onConfirm(suspensaoData)
      if (res?.error) {
         throw new Error(`Erro ao atualizar associado: ${res.error}`)
      }
      
      // Fecha o modal de suspensão e reseta o estado
      onClose()
      setStep(1)
      setSenha('')
      setFile(null)
      setDataSuspensao(new Date().toISOString().split('T')[0])
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar a suspensão.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-3">
             <ShieldAlert className="text-red-600" size={24} />
             <div>
               <h3 className="text-lg font-black text-red-700 tracking-tight">Acionar Suspensão</h3>
               <p className="text-xs font-bold text-red-500/80 uppercase tracking-widest">{associado.nome}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
           {error && (
             <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold flex items-start gap-3">
               <AlertTriangle size={18} className="shrink-0 mt-0.5" />
               <p>{error}</p>
             </div>
           )}

           {step === 1 ? (
             <div className="space-y-5">
               <div className="flex flex-col gap-2">
                 <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">Motivo da Suspensão</label>
                 <select 
                   value={motivo} 
                   onChange={e => setMotivo(e.target.value)}
                   className="w-full bg-slate-50 border-none px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 ring-red-500/10 transition-all"
                 >
                   {MOTIVOS.map((m, i) => (
                     <option key={i} value={m}>{i + 1} - {m}</option>
                   ))}
                 </select>
               </div>

               <div className="flex flex-col gap-2">
                 <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">Data da Suspensão</label>
                 <div className="relative">
                   <input 
                     type="date"
                     value={dataSuspensao}
                     onChange={e => setDataSuspensao(e.target.value)}
                     className="w-full bg-slate-50 border-none px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 ring-red-500/10 transition-all"
                   />
                   {dataSuspensao !== new Date().toISOString().split('T')[0] && (
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full">Retroativo</span>
                   )}
                 </div>
               </div>

               <div className="flex flex-col gap-2">
                 <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">Senha de Autorização</label>
                 <input 
                   type="password"
                   placeholder="Insira a senha de autorização"
                   value={senha}
                   onChange={e => setSenha(e.target.value)}
                   className="w-full bg-slate-50 border-none px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 ring-red-500/10 transition-all"
                 />
               </div>

               <button 
                 onClick={handleNextStep}
                 className="w-full py-4 mt-2 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
               >
                 Prosseguir para Suspensão
               </button>
             </div>
           ) : (
             <div className="space-y-6">
                <div className="flex flex-col items-center p-6 bg-slate-50 rounded-[24px] border border-slate-100 gap-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Download size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">1. Gerar Termo</h4>
                    <p className="text-xs text-slate-500 mt-1">Baixe o termo de suspensão preenchido para assinatura digital.</p>
                  </div>
                  <button 
                    onClick={gerarTermo}
                    disabled={gerandoPDF}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md disabled:opacity-60"
                  >
                    {gerandoPDF ? <><Loader2 size={14} className="animate-spin" /> Gerando...</> : <><Download size={14} /> Baixar Termo em PDF</>}
                  </button>
                </div>

                <div className="flex flex-col items-center p-6 bg-slate-50 rounded-[24px] border border-slate-100 gap-4 text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <Upload size={24} />
                  </div>
                  <div className="w-full">
                    <h4 className="text-sm font-black text-slate-800 mb-1">2. Upload do Arquivo Assinado</h4>
                    <p className="text-xs text-slate-500 mb-4">Anexe o termo de suspensão assinado pelo associado.</p>
                    
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-emerald-500 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {file ? (
                                <div className="flex items-center gap-2 text-emerald-600">
                                   <CheckCircle2 size={20} />
                                   <span className="text-xs font-bold">{file.name}</span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 mb-2 text-slate-400" />
                                    <p className="text-xs text-slate-500 font-bold">Clique para selecionar o PDF</p>
                                </>
                            )}
                        </div>
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleConfirmar}
                    disabled={isSubmitting}
                    className="flex-1 flex justify-center items-center gap-2 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Confirmar Suspensão
                  </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
