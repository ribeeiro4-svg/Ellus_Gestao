/**
 * Utilitários para cálculos do Módulo de Cobrança — ACPROBEC
 * Baseado em: docs/modulo-cobrancas/ACPROBEC_templates_mensagens_cobranca.md
 */

export function calcularDiasAtraso(vencimento: string | Date): number {
  if (!vencimento) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVencimento = new Date(vencimento);
  dataVencimento.setHours(0, 0, 0, 0);

  if (hoje > dataVencimento) {
    const diffTime = hoje.getTime() - dataVencimento.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
}

export function calcularTotalAtualizado(
  valorOriginal: number,
  diasAtraso: number,
  multaPerc: number = 2.0,
  jurosMensalPerc: number = 1.0
): {
  principal: number;
  multa: number;
  juros: number;
  total: number;
} {
  const multa = valorOriginal * (multaPerc / 100);
  const jurosDiario = jurosMensalPerc / 30;
  const juros = valorOriginal * (jurosDiario / 100) * diasAtraso;

  const round = (num: number) => Math.round(num * 100) / 100;

  return {
    principal: round(valorOriginal),
    multa: round(multa),
    juros: round(juros),
    total: round(valorOriginal + multa + juros),
  };
}

/**
 * Mapa oficial de etapas baseado nos dias de atraso.
 * Referência: ACPROBEC_templates_mensagens_cobranca.md — Resumo por etapa
 */
export interface EtapaCobranca {
  codigo: string;     // ex: "2A"
  etapa: string;      // ex: "reforco"
  label: string;      // ex: "Reforço inicial (D+8 a D+15)"
  canal: string;      // ex: "whatsapp"
  urgencia: 'baixa' | 'media' | 'alta' | 'critica' | 'positivo';
}

export function determinarEtapaPorDias(diasAtraso: number): EtapaCobranca {
  if (diasAtraso >= 90)  return { codigo: '5B', etapa: 'suspensao',           label: 'Suspensão efetivada (D+90+)',         canal: 'whatsapp', urgencia: 'critica' };
  if (diasAtraso >= 74)  return { codigo: '4B', etapa: 'ultimo_aviso',        label: 'Último aviso (D+74)',                 canal: 'whatsapp', urgencia: 'critica' };
  if (diasAtraso >= 61)  return { codigo: '4A', etapa: 'pre_notificacao',      label: 'Notificação extrajudicial (D+67)',    canal: 'carta',    urgencia: 'alta'    };
  if (diasAtraso >= 44)  return { codigo: '3B', etapa: 'formal',              label: 'Reforço formal (D+44)',               canal: 'whatsapp', urgencia: 'alta'    };
  if (diasAtraso >= 31)  return { codigo: '3A', etapa: 'formal',              label: 'Carta formal (D+37)',                 canal: 'email',    urgencia: 'media'   };
  if (diasAtraso >= 16)  return { codigo: '2B', etapa: 'reforco',             label: 'Reforço tardio (D+16 a D+30)',        canal: 'whatsapp', urgencia: 'media'   };
  if (diasAtraso >= 8)   return { codigo: '2A', etapa: 'reforco',             label: 'Reforço inicial (D+8 a D+15)',        canal: 'whatsapp', urgencia: 'media'   };
  if (diasAtraso >= 4)   return { codigo: '1B', etapa: 'lembrete',            label: 'Lembrete reforçado (D+4 a D+7)',      canal: 'whatsapp', urgencia: 'baixa'   };
  return                          { codigo: '1A', etapa: 'lembrete',            label: 'Lembrete simples (D+1 a D+3)',        canal: 'whatsapp', urgencia: 'baixa'   };
}

/** Mantido para compatibilidade com código existente */
export function determinarProximaEtapa(
  diasAtraso: number,
  _diasParaSuspensao: number = 90
): { etapa: string; label: string; urgencia: string } {
  const e = determinarEtapaPorDias(diasAtraso);
  return { etapa: e.etapa, label: e.label, urgencia: e.urgencia };
}

export function formatarValorBR(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calcularDataSuspensao(
  vencimentoMaisAntigo: string | Date,
  diasParaSuspensao: number = 90
): string {
  const data = new Date(vencimentoMaisAntigo);
  data.setDate(data.getDate() + diasParaSuspensao);
  return data.toLocaleDateString('pt-BR');
}

export function calcularDiasRestantes(
  diasAtraso: number,
  diasParaSuspensao: number = 90
): number {
  return Math.max(0, diasParaSuspensao - diasAtraso);
}

/**
 * Substitui todas as variáveis {{...}} no template pelo valor real.
 * Suporta todas as variáveis documentadas em ACPROBEC_templates_mensagens_cobranca.md
 */
export function gerarTextoMensagem(
  templateText: string,
  dados: {
    nome?: string;
    nome_completo?: string;
    mes_ano?: string;
    meses_abertos?: string;
    qtd_mensalidades?: number | string;
    valor_original?: number;
    valor_multa?: number;
    valor_juros?: number;
    valor_total?: number;
    dias_atraso?: number;
    dias_restantes?: number;
    data_suspensao?: string;
    data_vencimento?: string;
    data_hoje?: string;
    nome_associacao?: string;
    contato_tesouraria?: string;
    nome_tesoureiro?: string;
    matricula?: string;
    cidade?: string;
    numero_parcela?: number | string;
    total_parcelas?: number | string;
    data_vencimento_parcela?: string;
    valor_parcela?: number;
    // legado
    mesAno?: string;
    valorOriginal?: number;
    valorAtualizado?: number;
    multa?: number;
    juros?: number;
    diasAtraso?: number;
    diasParaSuspensao?: number;
    contatoTesouraria?: string;
    nomeAssociacao?: string;
    multa_perc?: number;
    juros_perc?: number;
  }
): string {
  const hoje = new Date().toLocaleDateString('pt-BR');

  // Normaliza campos legados para os novos nomes
  const d = {
    nome:                  dados.nome || '',
    nome_completo:         dados.nome_completo || dados.nome || '',
    mes_ano:               dados.mes_ano || dados.mesAno || '',
    meses_abertos:         dados.meses_abertos || dados.mes_ano || dados.mesAno || '',
    qtd_mensalidades:      String(dados.qtd_mensalidades ?? ''),
    valor_original:        formatarValorBR(dados.valor_original ?? dados.valorOriginal ?? 0),
    valor_multa:           formatarValorBR(dados.valor_multa ?? dados.multa ?? 0),
    valor_juros:           formatarValorBR(dados.valor_juros ?? dados.juros ?? 0),
    valor_total:           formatarValorBR(dados.valor_total ?? dados.valorAtualizado ?? 0),
    dias_atraso:           String(dados.dias_atraso ?? dados.diasAtraso ?? 0),
    dias_restantes:        String(dados.dias_restantes ?? ''),
    data_suspensao:        dados.data_suspensao || '',
    data_vencimento:       dados.data_vencimento || '',
    data_hoje:             dados.data_hoje || hoje,
    nome_associacao:       dados.nome_associacao || dados.nomeAssociacao || '',
    contato_tesouraria:    dados.contato_tesouraria || dados.contatoTesouraria || '',
    nome_tesoureiro:       dados.nome_tesoureiro || 'Tesoureiro(a)',
    matricula:             dados.matricula || '',
    cidade:                dados.cidade || '',
    numero_parcela:        String(dados.numero_parcela ?? ''),
    total_parcelas:        String(dados.total_parcelas ?? ''),
    data_vencimento_parcela: dados.data_vencimento_parcela || '',
    valor_parcela:         formatarValorBR(dados.valor_parcela ?? 0),
    // legado direto
    mesAno:                dados.mes_ano || dados.mesAno || '',
    valorOriginal:         formatarValorBR(dados.valor_original ?? dados.valorOriginal ?? 0),
    valorAtualizado:       formatarValorBR(dados.valor_total ?? dados.valorAtualizado ?? 0),
    multa:                 formatarValorBR(dados.valor_multa ?? dados.multa ?? 0),
    juros:                 formatarValorBR(dados.valor_juros ?? dados.juros ?? 0),
    diasAtraso:            String(dados.dias_atraso ?? dados.diasAtraso ?? 0),
    diasParaSuspensao:     String(dados.diasParaSuspensao ?? 90),
    contatoTesouraria:     dados.contato_tesouraria || dados.contatoTesouraria || '',
    nomeAssociacao:        dados.nome_associacao || dados.nomeAssociacao || '',
    multa_perc:            String(dados.multa_perc ?? 2),
    juros_perc:            String(dados.juros_perc ?? 1),
  };

  let texto = templateText;
  for (const [key, value] of Object.entries(d)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    texto = texto.replace(regex, String(value));
  }
  return texto;
}

/** Lista de todos os templates disponíveis para o seletor manual no Drawer */
export const TODOS_TEMPLATES: Array<{ codigo: string; titulo: string; etapa: string; canal: string; dias: string }> = [
  { codigo: '1A', titulo: 'Lembrete simples',           etapa: 'lembrete',              canal: 'whatsapp', dias: 'D+1 a D+3'  },
  { codigo: '1B', titulo: 'Lembrete reforçado',         etapa: 'lembrete',              canal: 'whatsapp', dias: 'D+4 a D+7'  },
  { codigo: '2A', titulo: 'Reforço inicial',            etapa: 'reforco',               canal: 'whatsapp', dias: 'D+8 a D+15' },
  { codigo: '2B', titulo: 'Reforço tardio',             etapa: 'reforco',               canal: 'whatsapp', dias: 'D+16 a D+30'},
  { codigo: '3A', titulo: 'Carta formal',               etapa: 'formal',                canal: 'email',    dias: 'D+37'       },
  { codigo: '3B', titulo: 'Reforço formal',             etapa: 'formal',                canal: 'whatsapp', dias: 'D+44'       },
  { codigo: '4A', titulo: 'Notif. extrajudicial',       etapa: 'pre_notificacao',       canal: 'carta',    dias: 'D+67'       },
  { codigo: '4B', titulo: 'Último aviso',               etapa: 'ultimo_aviso',          canal: 'whatsapp', dias: 'D+74'       },
  { codigo: '5A', titulo: 'Suspensão — carta',          etapa: 'suspensao',             canal: 'email',    dias: 'D+90'       },
  { codigo: '5B', titulo: 'Suspensão — WhatsApp',       etapa: 'suspensao',             canal: 'whatsapp', dias: 'D+90'       },
  { codigo: '6A', titulo: 'Reativação — quitação',      etapa: 'reativacao',            canal: 'whatsapp', dias: 'Pós-pgto'   },
  { codigo: '6B', titulo: 'Reativação — acordo',        etapa: 'reativacao',            canal: 'whatsapp', dias: 'Pós-acordo' },
  { codigo: '7A', titulo: 'Parcela a vencer',           etapa: 'acompanhamento_acordo', canal: 'whatsapp', dias: '-3 dias'    },
  { codigo: '7B', titulo: 'Parcela em atraso',          etapa: 'acompanhamento_acordo', canal: 'whatsapp', dias: 'Atraso'     },
];
