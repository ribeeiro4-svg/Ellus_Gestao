import React from 'react'
import { formatCpfCnpj, formatAssociadoDesde, formatFullDate } from '../../utils/formatarDadosFicha'
import { fmtR } from '@/lib/utils/formatters'
import { Phone, CheckCircle2, Clock } from 'lucide-react'

interface FichaAbaDadosCadastraisProps {
  associado: any
}

export default function FichaAbaDadosCadastrais({ associado }: FichaAbaDadosCadastraisProps) {
  if (!associado) return null

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{title}</h3>
        <div className="h-px bg-slate-100 flex-1" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
        {children}
      </div>
    </div>
  )

  const InfoField = ({ label, value, icon, badge }: { label: string, value: any, icon?: React.ReactNode, badge?: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
      <div className="flex items-center gap-2">
        {icon && <div className="text-emerald-500">{icon}</div>}
        <span className="text-sm font-black text-slate-800">{value || '--'}</span>
        {badge}
      </div>
    </div>
  )

  const desdeStr = formatAssociadoDesde(associado.data_assinatura || associado.data_ingresso)

  return (
    <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Section title="Identificação">
        <InfoField label="Nome Completo" value={associado.nome} />
        <InfoField label="CPF / CNPJ" value={formatCpfCnpj(associado.cpf)} />
        <InfoField label="E-mail" value={associado.email} />
        <InfoField label="Data de Associação" value={`Associado desde ${desdeStr}`} />
        <InfoField label="Plano de Saúde" value={associado.plano_saude} />
      </Section>

      <Section title="Dados do HGU Saúde">
        <InfoField label="Código HGU Titular" value={associado.codigo_hgu || 'Sem código'} />
        <InfoField label="Data de Inclusão no Plano" value={associado.data_inclusao_plano ? new Date(associado.data_inclusao_plano + 'T12:00:00Z').toLocaleDateString('pt-BR') : '--'} />
        
        <div className="md:col-span-2 p-6 bg-emerald-50/50 rounded-[32px] border border-emerald-100 space-y-4">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Dependentes Registrados ({Array.isArray(associado.dependentes) ? associado.dependentes.length : 0})</p>
          <div className="space-y-3">
            {Array.isArray(associado.dependentes) && associado.dependentes.length > 0 ? (
              associado.dependentes.map((dep: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-bold text-slate-700">{dep.nome}</span>
                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    CÓD: {dep.codigo_hgu || '--'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs font-medium text-slate-400 italic text-center py-4">Nenhum dependente registrado no HGU.</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Dados Financeiros">
        <InfoField label="Dia de Vencimento" value={`DIA ${associado.vencimento_dia || 10}`} />
        <InfoField label="Valor da Mensalidade" value={fmtR(associado.mensalidade)} />
        <InfoField label="Recorrência" value={associado.recorrencia_ativa ? 'ATIVA' : 'NÃO'} />
        <InfoField label="Conta de Recebimento" value={associado.conta_recorrencia} />
      </Section>

      <Section title="Status e Assinaturas">
        <InfoField 
          label="Termo Assinado" 
          value={associado.termo_status} 
          badge={
            <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${associado.termo_status === 'Enviado ao HGU' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {associado.termo_status === 'Enviado ao HGU' ? 'Assinado' : 'Pendente'}
            </div>
          }
        />
        <InfoField label="Sincronizado em" value={formatFullDate(associado.zapsign_sync_at)} />
        
        {/* Lista de Assinaturas */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signatários Digitais</p>
          <div className="space-y-3">
            {(associado.zapsign_signers || []).map((s: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${s.status === 'signed' || s.signed_at ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <CheckCircle2 size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{s.name}</span>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${s.status === 'signed' || s.signed_at ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {(s.status === 'signed' || s.signed_at) ? 'Assinado' : 'Pendente'}
                </span>
              </div>
            ))}
            {(associado.zapsign_signers || []).length === 0 && (
              <p className="text-xs font-medium text-slate-400 italic text-center py-4">Nenhuma assinatura registrada.</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Contato">
        <InfoField 
          label="WhatsApp" 
          value={associado.telefone} 
          icon={<Phone size={14} />} 
          badge={
            associado.telefone && (
              <a 
                href={`https://wa.me/${associado.telefone.replace(/\D/g, '')}`} 
                target="_blank"
                className="ml-2 p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
              >
                <Phone size={12} />
              </a>
            )
          }
        />
      </Section>
    </div>
  )
}
