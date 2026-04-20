'use client'
import React, { useState } from 'react'
import { 
  X, 
  Check, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  FileText, 
  ClipboardList,
  AlertCircle,
  Star,
  Download,
  ExternalLink
} from 'lucide-react'
import type { Candidato } from '@/lib/types'
import { useCandidatos } from '@/lib/hooks/useCandidatos'

interface DossierProps {
  candidato: Candidato
  onClose: () => void
}

export default function CandidatoDossier({ candidato, onClose }: DossierProps) {
  const { atualizar, calcularResultado } = useCandidatos()
  const [activeTab, setActiveTab ] = useState<'pessoal' | 'academico' | 'avaliacao' | 'contratacao'>('pessoal')
  const [loading, setLoading] = useState(false)

  // Local state for scores to show real-time calculation
  const [scores, setScores] = useState({
    nota_adm: candidato.nota_adm || 0,
    nota_dir: candidato.nota_dir || 0
  })

  const resultado = calcularResultado(scores.nota_adm, scores.nota_dir)

  const handleUpdate = async (field: string, value: any) => {
    setLoading(true)
    await atualizar(candidato.id, { [field]: value })
    setLoading(false)
  }

  const handleSaveScores = async () => {
    setLoading(true)
    await atualizar(candidato.id, { 
      nota_adm: scores.nota_adm, 
      nota_dir: scores.nota_dir 
    })
    setLoading(false)
  }

  const handleChecklist = async (key: string, value: boolean) => {
    const newChecklist = { ...candidato.checklist_contratacao, [key]: value }
    await atualizar(candidato.id, { checklist_contratacao: newChecklist })
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-[650px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-8 bg-[#0e2d22] text-white shrink-0">
          <div className="flex justify-between items-start mb-6">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white/40 overflow-hidden">
                   {candidato.foto_url ? <img src={candidato.foto_url} className="w-full h-full object-cover" /> : <User size={28} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{candidato.nome}</h2>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[2px]">{candidato.status.replace('_', ' ')}</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
               <X size={24} />
             </button>
          </div>

          <div className="flex gap-1">
             {['pessoal', 'academico', 'avaliacao', 'contratacao'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    activeTab === tab ? 'bg-white text-[#0e2d22] shadow-lg' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {tab}
                </button>
             ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'pessoal' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <Section title="Dados de Contato" icon={<User size={16} />}>
                  <InfoRow label="Email" value={candidato.email} />
                  <InfoRow label="Telefone" value={candidato.telefone} />
                  <InfoRow label="WhatsApp" value={candidato.whatsapp} />
                  <InfoRow label="LinkedIn" value={candidato.linkedin} isLink />
               </Section>
               <Section title="Documentos" icon={<FileText size={16} />}>
                  <div className="grid grid-cols-2 gap-4">
                     <DocCard label="Currículo" url={candidato.curriculo_url} />
                     <DocCard label="Documentos Pessoais" url={candidato.documentos?.[0]} />
                  </div>
               </Section>
            </div>
          )}

          {activeTab === 'academico' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Section title="Formação" icon={<GraduationCap size={16} />}>
                   <InfoRow label="Instituição" value={candidato.instituicao} />
                   <InfoRow label="Curso" value={candidato.curso} />
                   <InfoRow label="Semestre" value={candidato.semestre?.toString()} />
                   <InfoRow label="Turno" value={candidato.turno} />
                   <InfoRow label="CRA / Média" value={candidato.cra?.toString()} />
                </Section>
                <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 flex flex-col gap-4">
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Validação Escolaridade</h4>
                   <textarea 
                     placeholder="Observações da validação..."
                     value={candidato.obs_escolaridade || ''}
                     onChange={(e) => handleUpdate('obs_escolaridade', e.target.value)}
                     className="w-full h-32 p-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:border-emerald-500/20 transition-all resize-none"
                   />
                   <div className="flex gap-3 mt-2">
                      <button 
                        onClick={() => handleUpdate('status', 'escolaridade_validada')}
                        className="flex-1 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-600 transition-all border border-emerald-600/10"
                      >
                        Aprovar Escolaridade
                      </button>
                      <button 
                         onClick={() => handleUpdate('status', 'reprovado')}
                         className="px-6 py-3 bg-white text-rose-500 text-[10px] font-black uppercase rounded-xl border border-rose-100 hover:bg-rose-50 transition-all"
                      >
                        Reprovar
                      </button>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'avaliacao' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[2px] mb-4 flex items-center gap-2">
                        <ClipboardList size={14} /> Entrevista Adm
                      </h4>
                      <input 
                        type="number" min="0" max="10"
                        value={scores.nota_adm}
                        onChange={(e) => setScores(s => ({ ...s, nota_adm: Number(e.target.value) }))}
                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl text-center text-2xl font-black text-slate-800 outline-none focus:border-indigo-400 transition-all"
                      />
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100">
                      <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[2px] mb-4 flex items-center gap-2">
                        <ShieldCheck size={14} /> Entrevista Diretoria
                      </h4>
                      <input 
                        type="number" min="0" max="10"
                        value={scores.nota_dir}
                        onChange={(e) => setScores(s => ({ ...s, nota_dir: Number(e.target.value) }))}
                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl text-center text-2xl font-black text-slate-800 outline-none focus:border-amber-400 transition-all"
                      />
                   </div>
                </div>

                {resultado && (
                   <div className={`p-8 rounded-[32px] border ${resultado.temConflito ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'} transition-all`}>
                      <div className="flex justify-between items-center mb-6">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Nota Final Ponderada (40/60)</p>
                            <h3 className={`text-4xl font-black mt-2 ${resultado.temConflito ? 'text-rose-600' : 'text-emerald-700'}`}>{resultado.notaFinal.toFixed(1)}</h3>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Sugerido</p>
                            <h4 className={`text-sm font-black uppercase mt-2 ${resultado.temConflito ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {resultado.statusSugerido.replace('_', ' ')}
                            </h4>
                         </div>
                      </div>

                      {resultado.temConflito && (
                         <div className="flex items-start gap-3 p-4 bg-white/60 rounded-2xl border border-rose-200 text-rose-700">
                            <AlertCircle size={18} className="shrink-0" />
                            <p className="text-[11px] font-bold leading-relaxed">
                               **Atenção**: Divergência alta entre avaliadores (&gt;3 pts) ou nota individual crítica detectada. Recomendado realizar uma terceira avaliação para consenso.
                            </p>
                         </div>
                      )}

                      <button 
                         onClick={handleSaveScores}
                         disabled={loading}
                         className="w-full mt-6 py-4 bg-[#0e2d22] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#163d2f] transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/10"
                      >
                        <Star size={16} fill="currentColor" />
                        Finalizar Avaliação e Atribuir Status
                      </button>
                   </div>
                )}
             </div>
          )}

          {activeTab === 'contratacao' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100">
                   <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-6 flex items-center gap-3">
                      <ClipboardList size={18} /> Checklist de Admissão
                   </h4>
                   <div className="grid grid-cols-1 gap-3">
                      {Object.keys(candidato.checklist_contratacao || {}).map((item) => (
                         <div 
                           key={item}
                           onClick={() => handleChecklist(item, !candidato.checklist_contratacao[item])}
                           className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                             candidato.checklist_contratacao[item] ? 'bg-white border-emerald-500 text-emerald-700' : 'bg-white/40 border-slate-100 text-slate-400'
                           }`}
                         >
                            <span className="text-[11px] font-bold uppercase tracking-tight">{item.replace('_', ' ')}</span>
                            {candidato.checklist_contratacao[item] ? <Check size={16} strokeWidth={4} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
          {icon} {title}
       </h4>
       <div className="grid grid-cols-1 gap-2">
          {children}
       </div>
    </div>
  )
}

function InfoRow({ label, value, isLink }: { label: string; value?: string; isLink?: boolean }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-center p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
       <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
       {isLink ? (
         <a href={value} target="_blank" className="text-[11px] font-black text-emerald-600 hover:underline flex items-center gap-1.5 uppercase tracking-tighter">
            Ver Link <ExternalLink size={10} />
         </a>
       ) : (
         <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter truncate max-w-[200px]">{value}</span>
       )}
    </div>
  )
}

function DocCard({ label, url }: { label: string; url?: string }) {
  return (
    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3">
       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
       <button 
         disabled={!url}
         onClick={() => window.open(url, '_blank')}
         className={`h-10 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
           url ? 'bg-[#0e2d22] text-white' : 'bg-slate-100 text-slate-300'
         }`}
       >
          <Download size={12} /> {url ? 'Baixar' : 'Pendente'}
       </button>
    </div>
  )
}
