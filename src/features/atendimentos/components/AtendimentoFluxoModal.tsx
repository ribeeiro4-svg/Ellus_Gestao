'use client'
import React, { useState, useEffect } from 'react'
import { X, CheckCircle, FileText, Download, Loader2, AlertCircle, Plus, Trash2, DollarSign, MessageCircle } from 'lucide-react'
import { useAtendimentos } from '@/lib/hooks/useAtendimentos'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { gerarFichaAtendimentoPdf, gerarTermoCienciaPdf } from '../utils/gerarPdfsAtendimento'
import { useUsuarios } from '@/lib/hooks/useUsuarios'
import { useDiretoria } from '@/lib/hooks/useDiretoria'

export default function AtendimentoFluxoModal({ associado, onClose, dadosAlteradosNoCadastro = [] }: { associado: any, onClose: () => void, dadosAlteradosNoCadastro?: string[] }) {
  const { atendimentos, responsaveis, inserir, atualizar, loading: loadingAtendimentos } = useAtendimentos()
  
  const responsaveisAtendimento = responsaveis.filter(r => r.tipo === 'Atendimento Presencial' || !r.tipo)
  const { lancamentos, loading: loadingFin, inserir: inserirLancamento, atualizar: atualizarLancamento, refresh: refreshFin } = useFinanceiro()
  const { contas } = useContas()
  const { usuarios } = useUsuarios()
  const { diretoria } = useDiretoria()
  
  const responsaveisMap = React.useMemo(() => {
    const map = new Map()
    responsaveis.forEach(r => map.set(r.id, r.nome))
    usuarios.forEach(u => map.set(u.id, u.nome))
    diretoria.forEach(d => map.set(d.id, d.nome))
    return map
  }, [responsaveis, usuarios, diretoria])

  // Buscar o atendimento ativo (não concluído/cancelado) do associado
  const atendimentoAtual = [...atendimentos]
    .sort((a, b) => new Date(b.created_at || b.data_agendamento || 0).getTime() - new Date(a.created_at || a.data_agendamento || 0).getTime())
    .find(a => a.associado_id === associado.id && a.status !== 'concluido' && a.status !== 'cancelado')

  const isConcluido = atendimentoAtual?.status === 'concluido'

  const [saving, setSaving] = useState(false)
  const nomeResponsavelAutomatico = responsaveisMap.get(atendimentoAtual?.responsavel_id) || 'Sistema'
  
  const corretores = responsaveis.filter(r => r.tipo === 'Venda do Plano')
  const [corretorId, setCorretorId] = useState(atendimentoAtual?.etapas_concluidas?.corretor_id || '')
  
  const [previsaoHgu, setPrevisaoHgu] = useState(atendimentoAtual?.previsao_inclusao_hgu || '')
  const [pagamentoAdesaoForma, setPagamentoAdesaoForma] = useState(atendimentoAtual?.pagamento_adesao_forma || '')

  const [assinaturaPresencial, setAssinaturaPresencial] = useState(atendimentoAtual?.etapas_concluidas?.assinatura_presencial || false)
  const [declaracaoSaude, setDeclaracaoSaude] = useState(atendimentoAtual?.etapas_concluidas?.declaracao_saude || false)
  const [hasSituacaoEspecialSaude, setHasSituacaoEspecialSaude] = useState(atendimentoAtual?.etapas_concluidas?.hasSituacaoEspecialSaude || false)
  const [textoSituacaoEspecialSaude, setTextoSituacaoEspecialSaude] = useState(atendimentoAtual?.etapas_concluidas?.textoSituacaoEspecialSaude || '')
  
  const [observacaoAtendimento, setObservacaoAtendimento] = useState(atendimentoAtual?.etapas_concluidas?.observacao || '')
  
  const [isTitular, setIsTitular] = useState(atendimentoAtual?.etapas_concluidas?.isTitular ?? true)
  const [nomeTitular, setNomeTitular] = useState(atendimentoAtual?.etapas_concluidas?.nomeTitular || '')
  const [grauParentescoTitular, setGrauParentescoTitular] = useState(atendimentoAtual?.etapas_concluidas?.grauParentescoTitular || '')

  const [checklistTitular, setChecklistTitular] = useState<any>(atendimentoAtual?.checklist_titular || {
    rg: false, cpf: false, sus: false, residencia: false
  })

  const [dependentes, setDependentes] = useState<any[]>(atendimentoAtual?.dependentes || [])

  const hasSigners = associado.zapsign_signers && associado.zapsign_signers.length > 0
  const zapsignOk = hasSigners 
    ? associado.zapsign_signers.every((s: any) => s.status === 'signed')
    : !!associado.data_assinatura
  
  const adesoesPagasOuProcessando = lancamentos.filter(l => 
    l.associado_id === associado.id && 
    (l.categoria?.toUpperCase().includes('ADESÃO') || l.categoria?.toUpperCase().includes('ADESAO') || l.descricao?.toUpperCase().includes('ADESÃO')) &&
    (l.status === 'pago' || l.status === 'em_processamento')
  )
  const adesoesAbertas = lancamentos.filter(l => 
    l.associado_id === associado.id && 
    (l.categoria?.toUpperCase().includes('ADESÃO') || l.categoria?.toUpperCase().includes('ADESAO') || l.descricao?.toUpperCase().includes('ADESÃO')) &&
    (l.status === 'aberto' || l.status === 'atrasado')
  )

  const adesaoLancamento = adesoesPagasOuProcessando[0]
  const adesaoOk = !!adesaoLancamento

  const allDocsOk = checklistTitular.rg && checklistTitular.cpf && checklistTitular.sus && checklistTitular.residencia &&
    dependentes.every(d => d.rg && d.cpf && d.sus && d.residencia)

  const missingDocs = () => {
    const faltam = []
    if (!checklistTitular.rg) faltam.push('RG do Titular')
    if (!checklistTitular.cpf) faltam.push('CPF do Titular')
    if (!checklistTitular.sus) faltam.push('Cartão SUS do Titular')
    if (!checklistTitular.residencia) faltam.push('Comprovante de Residência do Titular')

    dependentes.forEach((d, idx) => {
      const fallback = `Dependente ${d.numero || String(idx + 1).padStart(2, '0')}`
      const depName = d.nome || fallback
      if (!d.rg) faltam.push(`RG do ${depName}`)
      if (!d.cpf) faltam.push(`CPF do ${depName}`)
      if (!d.sus) faltam.push(`Cartão SUS do ${depName}`)
      if (!d.residencia) faltam.push(`Comprovante de Residência do ${depName}`)
    })
    return faltam
  }

  const handleSave = async (gerarPdfType?: 'ficha' | 'termo' | 'concluir') => {
    setSaving(true)
    const payload = {
      associado_id: associado.id,
      previsao_inclusao_hgu: previsaoHgu,
      pagamento_adesao_forma: pagamentoAdesaoForma,
      checklist_titular: checklistTitular,
      dependentes,
      etapas_concluidas: {
        termo_zapsign: zapsignOk,
        adesao_paga: adesaoOk,
        assinatura_presencial: assinaturaPresencial,
        declaracao_saude: declaracaoSaude,
        hasSituacaoEspecialSaude: hasSituacaoEspecialSaude,
        textoSituacaoEspecialSaude: textoSituacaoEspecialSaude,
        observacao: observacaoAtendimento,
        isTitular: isTitular,
        nomeTitular: nomeTitular,
        grauParentescoTitular: grauParentescoTitular,
        corretor_id: corretorId,
        docs_faltantes: missingDocs()
      },
      status: isConcluido ? 'concluido' : (gerarPdfType === 'concluir' ? 'concluido' : (atendimentoAtual?.status || 'em_andamento')),
      data_agendamento: atendimentoAtual?.data_agendamento || new Date().toISOString()
    }

    let resultAtendimento = atendimentoAtual

    if (atendimentoAtual) {
      await atualizar(atendimentoAtual.id, payload)
      resultAtendimento = { ...atendimentoAtual, ...payload, responsavel_nome: nomeResponsavelAutomatico, corretor_nome: corretores.find((c: any) => c.id === corretorId)?.nome }
    } else {
      await inserir(payload)
      resultAtendimento = { ...payload, responsavel_nome: nomeResponsavelAutomatico, corretor_nome: corretores.find((c: any) => c.id === corretorId)?.nome }
    }

    setSaving(false)

    if (gerarPdfType === 'ficha' || gerarPdfType === 'concluir') {
      gerarFichaAtendimentoPdf(associado, resultAtendimento, dadosAlteradosNoCadastro)
    } else if (gerarPdfType === 'termo') {
      gerarTermoCienciaPdf(associado, resultAtendimento)
    }

    if (gerarPdfType === 'concluir') {
      alert('Atendimento concluído com sucesso! A ficha de atendimento foi gerada.')
      onClose()
    } else if (gerarPdfType) {
      alert('PDF gerado com sucesso! Arquivo baixado para impressão em 2 vias.')
    } else {
      alert('Progresso salvo!')
    }
  }

  const addDependente = () => {
    setDependentes([...dependentes, { 
      numero: String(dependentes.length + 1).padStart(2, '0'),
      nome: '', 
      rg: false, 
      cpf: false, 
      sus: false, 
      residencia: false 
    }])
  }

  const removeDependente = (idx: number) => {
    setDependentes(dependentes.filter((_, i) => i !== idx))
  }

  const updateDependente = (idx: number, field: string, value: any) => {
    const newDeps = [...dependentes]
    newDeps[idx][field] = value
    setDependentes(newDeps)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[24px] shadow-2xl w-[60vw] max-h-[97vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl uppercase shadow-inner">
              {(associado.nome || 'A')[0]}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                {associado.nome}
                {isConcluido && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">CONCLUÍDO</span>}
              </h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[1px]">Pipeline de Atendimento</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Coluna Esquerda: Etapas */}
            <div className="flex flex-col gap-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Etapas do Processo</h3>
              
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-0.5 ${zapsignOk ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300'}`}><CheckCircle size={18} /></div>
                <div>
                  <p className={`text-sm font-bold ${zapsignOk ? 'text-slate-800' : 'text-slate-500'}`}>Assinatura Termo ZapSign</p>
                  <p className="text-[10px] text-slate-400">{zapsignOk ? 'Termo preenchido e assinado.' : 'Pendente de assinatura digital.'}</p>
                  {!zapsignOk && hasSigners && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {associado.zapsign_signers
                        .filter((s: any) => s.status !== 'signed' && !s.name.toUpperCase().includes('LEANDRO') && s.sign_url)
                        .map((s: any, idx: number) => {
                          const fone = associado.telefone ? associado.telefone.replace(/\D/g, '') : ''
                          return (
                            <a 
                              key={idx}
                              href={`https://wa.me/${fone}?text=${encodeURIComponent(`Olá ${s.name.split(' ')[0]}, segue o link para assinatura do seu termo de adesão à ACPROBEC:\n\n${s.sign_url}\n\n*Importante:* *A sua permanência no plano de saúde HGU depende desse termo, por isso é necessário que assine o quanto antes.*\n\nAo concluir, nos avise para verificarmos, por gentileza!`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[10px] font-bold rounded-lg transition-colors"
                            >
                              <MessageCircle size={12} />
                              Reenviar para {s.name.split(' ')[0]}
                            </a>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-0.5 ${adesaoOk ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300'}`}><CheckCircle size={18} /></div>
                <div className="flex-1 w-full">
                  <p className={`text-sm font-bold ${adesaoOk ? 'text-slate-800' : 'text-slate-500'}`}>Pagamento da Adesão</p>
                  
                  {adesaoLancamento ? (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Detalhes do Financeiro</p>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs text-slate-500">Descrição:</span>
                          <span className="text-xs font-medium text-slate-700 text-right">{adesaoLancamento.descricao || '--'}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs text-slate-500">Valor:</span>
                          <span className="text-xs font-bold text-emerald-600">
                            {adesaoLancamento.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adesaoLancamento.valor) : '--'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs text-slate-500">Recebido via:</span>
                          <span className="text-xs font-medium text-slate-700">{adesaoLancamento.forma_pagamento || '--'}</span>
                        </div>
                        {adesaoLancamento.conta_id && contas.length > 0 && (
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-xs text-slate-500">Conta:</span>
                            <span className="text-xs font-medium text-slate-700">{contas.find(c => c.id === adesaoLancamento.conta_id)?.nome || '--'}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-200 mt-1">
                          <span className="text-xs text-slate-500">Status Financeiro:</span>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                            adesaoLancamento.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 
                            adesaoLancamento.status === 'em_processamento' ? 'bg-blue-100 text-blue-700' : 
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {adesaoLancamento.status === 'pago' ? 'Pago' : adesaoLancamento.status === 'em_processamento' ? 'Em Processamento' : (adesaoLancamento.status || 'Pendente')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ReceberAdesaoInline associado={associado} contas={contas} inserirLancamento={inserirLancamento} atualizarLancamento={atualizarLancamento} refreshFin={refreshFin} adesoesAbertas={adesoesAbertas} />
                  )}

                  <input 
                    type="text" 
                    placeholder="Observação da forma de pagamento (Opcional)" 
                    value={pagamentoAdesaoForma}
                    onChange={e => setPagamentoAdesaoForma(e.target.value)}
                    disabled={isConcluido}
                    className="mt-2 text-[11px] p-2 border rounded-lg w-full bg-slate-50 disabled:opacity-60"
                  />
                </div>
              </div>

              <label className={`flex items-start gap-3 cursor-pointer group ${isConcluido ? 'pointer-events-none opacity-80' : ''}`}>
                <input type="checkbox" className="mt-1" checked={assinaturaPresencial} onChange={e => setAssinaturaPresencial(e.target.checked)} disabled={isConcluido} />
                <div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Assinatura Presencial do Termo</p>
                  <p className="text-[10px] text-slate-400">Instruções de atendimento, processos e prazos passados.</p>
                </div>
              </label>

              <div className="flex flex-col gap-2">
                <label className={`flex items-start gap-3 cursor-pointer group ${isConcluido ? 'pointer-events-none opacity-80' : ''}`}>
                  <input type="checkbox" className="mt-1" checked={declaracaoSaude} onChange={e => setDeclaracaoSaude(e.target.checked)} disabled={isConcluido} />
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Declaração de Saúde HGU</p>
                    <p className="text-[10px] text-slate-400">Preenchida fisicamente no local.</p>
                  </div>
                </label>

                <div className="ml-7 flex flex-col gap-2">
                  <label className={`flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer ${isConcluido ? 'pointer-events-none opacity-80' : ''}`}>
                    <input type="checkbox" checked={hasSituacaoEspecialSaude} onChange={e => setHasSituacaoEspecialSaude(e.target.checked)} disabled={isConcluido} className="rounded" />
                    Situação Especial para a Declaração
                  </label>
                  
                  {hasSituacaoEspecialSaude && (
                    <textarea 
                      placeholder="Descreva a situação especial da declaração de saúde..."
                      value={textoSituacaoEspecialSaude}
                      onChange={e => setTextoSituacaoEspecialSaude(e.target.value)}
                      disabled={isConcluido}
                      className="text-xs p-2.5 rounded-xl border w-full focus:border-blue-500 outline-none min-h-[80px] bg-amber-50 border-amber-200 resize-none disabled:opacity-70"
                    />
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                 <h4 className="text-[11px] font-black text-slate-600 uppercase">Informações do Atendimento</h4>
                 
                 <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Responsável pela Venda (Corretor)</label>
                   <select
                    value={corretorId}
                    onChange={e => setCorretorId(e.target.value)}
                    disabled={isConcluido}
                    className="text-xs p-3 rounded-xl border w-full focus:border-blue-500 outline-none bg-white text-slate-700 font-medium disabled:opacity-70"
                   >
                     <option value="">Nenhum/Indefinido</option>
                     {corretores.map((r: any) => (
                       <option key={r.id} value={r.id}>{r.nome}</option>
                     ))}
                   </select>
                 </div>

                 <div className="flex flex-col gap-1.5 mt-1">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Responsável pelo Atendimento</label>
                   <div className="text-xs p-3 rounded-xl border w-full bg-white text-slate-700 font-bold border-slate-200">
                     {nomeResponsavelAutomatico}
                   </div>
                 </div>

                 <div className="flex flex-col gap-1.5 mt-1">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previsão Inclusão HGU</label>
                   <input type="text" placeholder="Ex: 01.06.26" value={previsaoHgu} onChange={e => setPrevisaoHgu(e.target.value)} disabled={isConcluido} className="text-xs p-2.5 rounded-xl border w-full focus:border-blue-500 outline-none disabled:opacity-70" />
                 </div>
              </div>
            </div>

            {/* Coluna Direita: Checklist de Documentos */}
            <div className="flex flex-col gap-4 border-l pl-8 border-slate-100">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex justify-between">
                Checklist de Documentos (Xerox)
                {!allDocsOk && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Pendências</span>}
              </h3>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-slate-100 py-1.5 px-3 rounded-md">
                  <p className="text-xs font-bold text-slate-700">TITULAR</p>
                  <label className={`flex items-center gap-1.5 text-[10px] text-slate-600 font-medium cursor-pointer ${isConcluido ? 'pointer-events-none opacity-80' : ''}`}>
                    <input type="checkbox" checked={!isTitular} onChange={e => setIsTitular(!e.target.checked)} disabled={isConcluido} className="rounded" />
                    Associado é Terceiro?
                  </label>
                </div>

                {!isTitular && (
                  <div className="flex flex-col gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <input
                      type="text"
                      placeholder="Nome do Titular do Plano"
                      value={nomeTitular}
                      onChange={e => setNomeTitular(e.target.value)}
                      disabled={isConcluido}
                      className="text-xs p-2 rounded-lg border w-full focus:border-blue-500 outline-none bg-white disabled:opacity-70"
                    />
                    <input
                      type="text"
                      placeholder="Grau de parentesco (Ex: Filho, Cônjuge, etc)"
                      value={grauParentescoTitular}
                      onChange={e => setGrauParentescoTitular(e.target.value)}
                      disabled={isConcluido}
                      className="text-xs p-2 rounded-lg border w-full focus:border-blue-500 outline-none bg-white disabled:opacity-70"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['rg', 'cpf', 'sus', 'residencia'].map((docKey) => (
                    <label key={`titular-${docKey}`} className={`flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200 ${isConcluido ? 'pointer-events-none opacity-80' : ''}`}>
                      <input type="checkbox" checked={checklistTitular[docKey]} onChange={e => setChecklistTitular({...checklistTitular, [docKey]: e.target.checked})} disabled={isConcluido} />
                      {docKey === 'residencia' ? 'Compr. Residência' : docKey.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>

              {dependentes.map((dep, idx) => (
                <div key={idx} className="flex flex-col gap-2 mt-2 pt-4 border-t border-slate-100 border-dashed relative group">
                  {!isConcluido && (
                    <button onClick={() => removeDependente(idx)} className="absolute top-4 right-0 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dependente</span>
                    <input 
                      type="text"
                      value={dep.numero || String(idx + 1).padStart(2, '0')}
                      onChange={e => updateDependente(idx, 'numero', e.target.value)}
                      disabled={isConcluido}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-transparent border-b border-dashed border-slate-300 w-8 text-center outline-none focus:border-blue-500 focus:text-blue-600 transition-colors p-0 disabled:opacity-70"
                      maxLength={3}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Nome do Dependente (Opcional para identificação)" 
                    value={dep.nome} 
                    onChange={e => updateDependente(idx, 'nome', e.target.value)}
                    disabled={isConcluido}
                    className="text-xs p-2 rounded-lg border w-full focus:border-blue-500 outline-none disabled:opacity-70"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['rg', 'cpf', 'sus', 'residencia'].map((docKey) => (
                      <label key={`dep-${idx}-${docKey}`} className={`flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200 ${isConcluido ? 'pointer-events-none opacity-80' : ''}`}>
                        <input type="checkbox" checked={dep[docKey]} onChange={e => updateDependente(idx, docKey, e.target.checked)} disabled={isConcluido} />
                        {docKey === 'residencia' ? 'Compr. Residência' : docKey.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {!isConcluido && (
                <button onClick={addDependente} className="mt-2 text-[10px] uppercase font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 w-fit">
                  <Plus size={12} /> Adicionar Dependente
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Observação do Atendimento</h3>
                <textarea 
                  placeholder="Escreva alguma observação que deve sair na ficha de atendimento..."
                  value={observacaoAtendimento}
                  onChange={e => setObservacaoAtendimento(e.target.value)}
                  disabled={isConcluido}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none min-h-[80px] resize-none bg-slate-50 disabled:opacity-70"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
          {!isConcluido ? (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => handleSave()} disabled={saving} className="btn-secondary text-[10px] uppercase font-black px-5 py-2.5 bg-slate-200 text-slate-700 border-none hover:bg-slate-300 min-w-[100px]">
                  {saving ? <Loader2 size={14} className="animate-spin mx-auto"/> : 'Salvar Progresso'}
                </button>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {!allDocsOk && (
                   <button onClick={() => handleSave('termo')} className="btn-secondary text-[10px] uppercase font-black px-5 py-2.5 flex items-center gap-2 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                     <AlertCircle size={14} />
                     Gerar Termo de Faltas (PDF)
                   </button>
                )}
                
                <button 
                  onClick={() => handleSave('concluir')} 
                  className={`btn-primary text-[10px] uppercase font-black px-5 py-2.5 flex items-center gap-2 ${(!allDocsOk || !assinaturaPresencial || !declaracaoSaude) ? 'opacity-70 bg-slate-400 hover:bg-slate-500' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  title={(!allDocsOk || !assinaturaPresencial || !declaracaoSaude) ? 'Existem etapas pendentes!' : ''}
                >
                  <FileText size={14} />
                  Concluir Atendimento e Liberar Ficha
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-bold text-slate-500">Este atendimento já foi concluído e não pode ser editado.</span>
              <button 
                onClick={() => handleSave('ficha')} 
                className="btn-primary text-[10px] uppercase font-black px-5 py-2.5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                <Download size={14} />
                Baixar Ficha Novamente
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function ReceberAdesaoInline({ associado, contas, inserirLancamento, atualizarLancamento, refreshFin, adesoesAbertas }: { associado: any, contas: any[], inserirLancamento: any, atualizarLancamento: any, refreshFin: any, adesoesAbertas: any[] }) {
  const caixaConta = contas.find((c: any) => c.nome?.toUpperCase().includes('CAIXA'))
  const [showForm, setShowForm] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [contaId, setContaId] = useState(caixaConta ? caixaConta.id : '')
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0])
  const [selectedLancamentoId, setSelectedLancamentoId] = useState<string | null>(adesoesAbertas.length > 0 ? adesoesAbertas[0].id : null)
  const [loading, setLoading] = useState(false)

  const handleReceber = async () => {
    if (!contaId) {
      alert('Selecione a conta para recebimento.')
      return
    }

    setLoading(true)
    
    const selectedConta = contas.find((c: any) => c.id === contaId)
    const isCaixaDinheiro = formaPagamento === 'Dinheiro' && selectedConta?.nome?.toUpperCase().includes('CAIXA')
    const novoStatus = isCaixaDinheiro ? 'pago' : 'em_processamento'

    if (selectedLancamentoId) {
      const res = await atualizarLancamento(selectedLancamentoId, {
        forma_pagamento: formaPagamento,
        conta_id: contaId,
        status: novoStatus
      })
      if (res?.error) {
        alert('Erro ao atualizar lançamento: ' + JSON.stringify(res.error))
        setLoading(false)
        return
      }
    } else {
      const res = await inserirLancamento({
        associado_id: associado.id,
        tipo: 'receita',
        categoria: 'ADESÃO',
        valor: 50,
        descricao: `ADESÃO DE ASSOCIADO - ${associado.nome.toUpperCase()}`,
        forma_pagamento: formaPagamento,
        conta_id: contaId,
        status: novoStatus,
        data: dataPagamento
      })
      if (res?.error) {
        alert('Erro ao criar lançamento: ' + JSON.stringify(res.error))
        setLoading(false)
        return
      }
    }
    
    if (refreshFin) await refreshFin()
    setLoading(false)
    setShowForm(false)
  }

  const msgPix = `O pagamento da sua taxa de adesão à ACPROBEC (R$50,00), pode ser feito via pix:

*PIX - Chave CNPJ:* 64.219.750/0001-31
Associação Colaborativa De Profissionais Liberais, Comercio e Setor de Beleza
Banco: CORA

*Ao concluir, nos encaminhe o comprovante de pagamento nesta conversa para registrar e manter o histórico do processo!*`

  const handleWhatsApp = () => {
    if (!associado.telefone) {
      alert('Associado não possui telefone cadastrado.')
      return
    }
    const num = associado.telefone.replace(/\D/g, '')
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msgPix)}`, '_blank')
  }

  if (!showForm) {
    return (
      <div className="mt-2 flex flex-col gap-2">
        <p className="text-[10px] text-slate-400">Pendente de pagamento / baixa no financeiro.</p>
        <button onClick={() => setShowForm(true)} className="w-fit text-xs bg-emerald-50 text-emerald-600 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
          Registrar Pagamento da Adesão
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col gap-3">
      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest border-b border-amber-200 pb-1">Receber Adesão (R$ 50,00)</p>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-600">Lançamento</label>
        {adesoesAbertas.length > 0 ? (
          <select value={selectedLancamentoId || ''} onChange={e => setSelectedLancamentoId(e.target.value)} className="text-xs p-2 rounded-lg border w-full focus:border-blue-500 outline-none bg-white">
            {adesoesAbertas.map((l: any) => (
              <option key={l.id} value={l.id}>{l.descricao} - Venc: {l.data?.split('-').reverse().join('/')}</option>
            ))}
            <option value="">Lançar Novo (Criar nova cobrança)</option>
          </select>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-lg">Não há lançamentos de adesão em aberto. Será criado um novo.</div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-600">Forma de Pagamento</label>
        <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="text-xs p-2 rounded-lg border w-full focus:border-blue-500 outline-none bg-white">
          <option value="PIX">PIX</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartão de Crédito">Cartão de Crédito</option>
          <option value="Cartão de Débito">Cartão de Débito</option>
          <option value="Boleto">Boleto</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-600">Conta Destino</label>
        <select value={contaId} onChange={e => setContaId(e.target.value)} className="text-xs p-2 rounded-lg border w-full focus:border-blue-500 outline-none bg-white">
          <option value="">Selecione...</option>
          {contas.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-600">Data do Pagamento</label>
        <input 
          type="date" 
          value={dataPagamento}
          onChange={e => setDataPagamento(e.target.value)}
          className="text-xs p-2 rounded-lg border w-full focus:border-blue-500 outline-none bg-white"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-1">
        <button onClick={handleReceber} disabled={loading} className="flex-1 bg-emerald-600 text-white font-bold text-xs py-2 px-3 rounded-lg hover:bg-emerald-700 transition-colors flex justify-center items-center gap-1">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
          Confirmar
        </button>
        
        {formaPagamento === 'PIX' && (
          <button onClick={handleWhatsApp} className="bg-[#25D366] text-white font-bold text-xs py-2 px-3 rounded-lg hover:bg-[#128C7E] transition-colors flex items-center gap-1">
            <MessageCircle size={14} />
            Enviar Chave
          </button>
        )}
        
        <button onClick={() => setShowForm(false)} className="bg-slate-200 text-slate-600 font-bold text-xs py-2 px-3 rounded-lg hover:bg-slate-300 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}
