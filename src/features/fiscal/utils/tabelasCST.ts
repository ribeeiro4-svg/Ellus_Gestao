// Tabelas de CST — ICMS, IPI, PIS/COFINS — conforme legislação brasileira 2026

// ── CST ICMS ──────────────────────────────────────────────────────────────────
export interface CSTItem { codigo: string; descricao: string }

// Tabela A — Origem da Mercadoria
export const CST_ICMS_ORIGEM: CSTItem[] = [
  { codigo: '0', descricao: '0 — Nacional, exceto códigos 3, 4, 5 e 8' },
  { codigo: '1', descricao: '1 — Estrangeira — Importação direta, exceto código 6' },
  { codigo: '2', descricao: '2 — Estrangeira — Adquirida no mercado interno, exceto código 7' },
  { codigo: '3', descricao: '3 — Nacional — Conteúdo de Importação > 40%' },
  { codigo: '4', descricao: '4 — Nacional — Produção em conformidade com PPB' },
  { codigo: '5', descricao: '5 — Nacional — Conteúdo de Importação ≤ 40%' },
  { codigo: '6', descricao: '6 — Estrangeira — Importação direta, sem similar nacional (CAMEX/gás natural)' },
  { codigo: '7', descricao: '7 — Estrangeira — Mercado interno, sem similar nacional (CAMEX/gás natural)' },
  { codigo: '8', descricao: '8 — Nacional — Conteúdo de Importação > 70%' },
]

// Tabela B — Tributação pelo ICMS
export const CST_ICMS_TRIBUTACAO: CSTItem[] = [
  { codigo: '00', descricao: '00 — Tributada integralmente' },
  { codigo: '10', descricao: '10 — Tributada e com cobrança do ICMS por substituição tributária' },
  { codigo: '20', descricao: '20 — Com redução de base de cálculo' },
  { codigo: '30', descricao: '30 — Isenta ou não tributada e com cobrança do ICMS por ST' },
  { codigo: '40', descricao: '40 — Isenta' },
  { codigo: '41', descricao: '41 — Não tributada' },
  { codigo: '50', descricao: '50 — Suspensão' },
  { codigo: '51', descricao: '51 — Diferimento' },
  { codigo: '60', descricao: '60 — ICMS cobrado anteriormente por substituição tributária' },
  { codigo: '70', descricao: '70 — Com redução de BC e cobrança do ICMS por ST' },
  { codigo: '90', descricao: '90 — Outras' },
]

// CSOSN — para emitentes do Simples Nacional (CRT = 1)
export const CSOSN: CSTItem[] = [
  { codigo: '102', descricao: '102 — Tributada pelo Simples Nacional sem permissão de crédito' },
  { codigo: '300', descricao: '300 — Imune' },
  { codigo: '400', descricao: '400 — Não tributada pelo Simples Nacional' },
  { codigo: '500', descricao: '500 — ICMS cobrado anteriormente por ST (Simples Nacional)' },
  { codigo: '900', descricao: '900 — Outros (Simples Nacional)' },
]

// ── CST IPI ───────────────────────────────────────────────────────────────────
export const CST_IPI_ENTRADA: CSTItem[] = [
  { codigo: '00', descricao: '00 — Entrada com recuperação de crédito' },
  { codigo: '01', descricao: '01 — Entrada tributada com alíquota zero' },
  { codigo: '02', descricao: '02 — Entrada isenta' },
  { codigo: '03', descricao: '03 — Entrada não tributada' },
  { codigo: '04', descricao: '04 — Entrada imune' },
  { codigo: '05', descricao: '05 — Entrada com suspensão' },
  { codigo: '49', descricao: '49 — Outras entradas' },
]

// ── CST PIS e COFINS ─────────────────────────────────────────────────────────
export const CST_PIS_COFINS: CSTItem[] = [
  // Operações com Direito a Crédito
  { codigo: '50', descricao: '50 — Operação com Direito a Crédito — Vinculada exclusivamente a Receita Tributada MI' },
  { codigo: '51', descricao: '51 — Operação com Direito a Crédito — Vinculada exclusivamente a Receita Não Tributada MI' },
  { codigo: '52', descricao: '52 — Operação com Direito a Crédito — Vinculada exclusivamente a Receita de Exportação' },
  { codigo: '53', descricao: '53 — Operação com Direito a Crédito — Vinculada a Receitas Tributadas e Não-Tributadas MI' },
  { codigo: '54', descricao: '54 — Operação com Direito a Crédito — Vinculada a Receitas Tributadas MI e Exportação' },
  { codigo: '55', descricao: '55 — Operação com Direito a Crédito — Vinculada a Receitas Não-Tributadas MI e Exportação' },
  { codigo: '56', descricao: '56 — Operação com Direito a Crédito — Vinculada a Receitas Tributadas/Não-Tributadas MI e Exportação' },
  // Crédito Presumido
  { codigo: '60', descricao: '60 — Crédito Presumido — Aquisição vinculada exclusivamente a Receita Tributada MI' },
  { codigo: '61', descricao: '61 — Crédito Presumido — Aquisição vinculada exclusivamente a Receita Não-Tributada MI' },
  { codigo: '62', descricao: '62 — Crédito Presumido — Aquisição vinculada exclusivamente a Receita de Exportação' },
  { codigo: '63', descricao: '63 — Crédito Presumido — Aquisição vinculada a Receitas Tributadas e Não-Tributadas MI' },
  { codigo: '67', descricao: '67 — Crédito Presumido — Outras Operações' },
  // Sem Direito a Crédito
  { codigo: '70', descricao: '70 — Operação de Aquisição sem Direito a Crédito' },
  { codigo: '71', descricao: '71 — Operação de Aquisição com Isenção' },
  { codigo: '72', descricao: '72 — Operação de Aquisição com Suspensão' },
  { codigo: '73', descricao: '73 — Operação de Aquisição a Alíquota Zero' },
  { codigo: '74', descricao: '74 — Operação de Aquisição sem Incidência da Contribuição' },
  { codigo: '75', descricao: '75 — Operação de Aquisição por Substituição Tributária' },
  { codigo: '98', descricao: '98 — Outras Operações de Entrada' },
  { codigo: '99', descricao: '99 — Outras Operações' },
]

// ── Destinação do Item — para Associações ────────────────────────────────────
export const DESTINACOES_ITEM = [
  { codigo: '1', descricao: '1 — Atividade-fim (uso direto no objeto social)', color: 'emerald' },
  { codigo: '2', descricao: '2 — Administrativo/Overhead (uso geral administrativo)', color: 'blue' },
  { codigo: '3', descricao: '3 — Consumo Imediato (materiais de consumo)', color: 'slate' },
  { codigo: '4.1', descricao: '4.1 — Ativo Imobilizado: Máquinas e Equipamentos', color: 'purple' },
  { codigo: '4.2', descricao: '4.2 — Ativo Imobilizado: Veículos', color: 'purple' },
  { codigo: '4.3', descricao: '4.3 — Ativo Imobilizado: Móveis e Utensílios', color: 'purple' },
  { codigo: '4.4', descricao: '4.4 — Ativo Imobilizado: Equipamentos de Informática', color: 'purple' },
  { codigo: '4.5', descricao: '4.5 — Ativo Imobilizado: Edificações e Benfeitorias', color: 'purple' },
  { codigo: '4.9', descricao: '4.9 — Ativo Imobilizado: Outros', color: 'purple' },
  { codigo: '5', descricao: '5 — Manutenção Predial/Infraestrutura', color: 'orange' },
  { codigo: '6', descricao: '6 — Eventos e Projetos Específicos (vincular ao projeto)', color: 'indigo' },
  { codigo: '7', descricao: '7 — Revenda (a associação revende produtos)', color: 'yellow' },
  { codigo: '8', descricao: '8 — Distribuição Gratuita a Beneficiários', color: 'teal' },
  { codigo: '9', descricao: '9 — Uso do Dirigente/Funcionário (monitorar para compliance)', color: 'rose' },
  { codigo: '10', descricao: '10 — Outros (exige justificativa)', color: 'gray' },
]
