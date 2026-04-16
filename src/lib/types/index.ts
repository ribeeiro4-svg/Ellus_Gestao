// ─── Tenant (Associação) ───────────────────────────────────────────────────
export interface Tenant {
  id: string
  nome: string
  slug: string
  contabilidade?: string
  logo_url?: string
  plano: 'basico' | 'pro' | 'multi'
  created_at: string
}

// ─── Usuário ───────────────────────────────────────────────────────────────
export interface Usuario {
  id: string
  tenant_id: string
  nome: string
  email: string
  role: 'admin' | 'tesoureiro' | 'viewer'
  created_at: string
}

// ─── Financeiro ────────────────────────────────────────────────────────────
export type TipoLancamento = 'receita' | 'despesa'
export type StatusLancamento = 'pago' | 'aberto' | 'parcial' | 'cancelado'
export type FormaPagamento = 'Dinheiro' | 'PIX' | 'Boleto' | 'Transferência' | 'Cartão' | undefined

export interface Lancamento {
  id: string
  tenant_id: string
  data: string
  descricao: string
  categoria: string
  tipo: TipoLancamento
  valor: number
  status: StatusLancamento
  forma_pagamento?: FormaPagamento
  created_at: string
  updated_at: string
}

export interface LancamentoInput extends Omit<Lancamento, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {}

// ─── Associados ────────────────────────────────────────────────────────────
export type StatusAssociado = 'ativo' | 'inativo' | 'inadimplente'

export interface Associado {
  id: string
  tenant_id: string
  codigo: string
  nome: string
  categoria: string
  email: string
  telefone?: string
  data_ingresso: string
  mensalidade: number
  status: StatusAssociado
  meses_atraso?: number
  ultimo_pagamento?: string
  created_at: string
  updated_at: string
}

export interface AssociadoInput extends Omit<Associado, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {}

// ─── Metas ─────────────────────────────────────────────────────────────────
export type StatusMeta = 'atingida' | 'em_andamento' | 'nao_iniciada'

export interface Meta {
  id: string
  tenant_id: string
  meta: string
  responsavel: string
  prazo: string
  valor_meta: number
  valor_realizado: number
  unidade?: string
  status: StatusMeta
  created_at: string
  updated_at: string
}

export interface MetaInput extends Omit<Meta, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {}

// ─── Projetos ──────────────────────────────────────────────────────────────
export type StatusProjeto = 'concluido' | 'em_andamento' | 'planejado' | 'atrasado' | 'cancelado'

export interface Projeto {
  id: string
  tenant_id: string
  projeto: string
  responsavel: string
  data_inicio: string
  prazo: string
  orcamento: number
  gasto: number
  status: StatusProjeto
  descricao?: string
  created_at: string
  updated_at: string
}

export interface ProjetoInput extends Omit<Projeto, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {}

// ─── Dashboard KPIs ────────────────────────────────────────────────────────
export interface DashboardKPIs {
  receitaTotal: number
  despesaTotal: number
  resultado: number
  assocAtivos: number
  assocInadimplentes: number
  pctMetasAtingidas: number
  margemLiquida: number
  totalEmAberto: number
}

// ─── Evolução Mensal ───────────────────────────────────────────────────────
export interface EvolucaoMensal {
  mes: number // 0-11
  label: string
  receita: number
  despesa: number
  resultado: number
  margem: number
  assocAtivos: number
  assocInadimplentes: number
}

// ─── Importação ────────────────────────────────────────────────────────────
export type TipoImportacao = 'financeiro' | 'associados' | 'metas' | 'projetos'

export interface ImportacaoResult {
  tipo: TipoImportacao
  total: number
  inseridos: number
  erros: string[]
}

// ─── Orçamentos (Planejado vs Realizado) ──────────────────────────────────
export interface Orcamento {
  id: string
  tenant_id: string
  mes: number // 0-11
  ano: number
  categoria: string
  tipo: TipoLancamento
  valor_planejado: number
  created_at: string
}

export interface OrcamentoInput extends Omit<Orcamento, 'id' | 'tenant_id' | 'created_at'> {}

// ─── Simulador de Cenários ────────────────────────────────────────────────
export interface ProLaboreItem {
  id: string
  nome: string
  valor: number
}

export interface CenarioSimulacao {
  id: string
  tenant_id: string
  nome: string
  num_associados: number
  valor_mensalidade: number
  despesas_fixas: number
  despesas_variaveis: number
  folha_pagamento: number // Base (outros funcionários)
  pro_labores: ProLaboreItem[] // Lista dinâmica de diretores
  reserva_meses_alvo: number // Ex: 3 meses
  created_at: string
}

export interface CenarioInput extends Omit<CenarioSimulacao, 'id' | 'tenant_id' | 'created_at'> {}

// ─── API Response ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

