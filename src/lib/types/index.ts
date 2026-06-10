// ─── Tenant (Associação) ───────────────────────────────────────────────────
export interface Tenant {
  id: string
  nome: string
  slug: string
  contabilidade?: string
  logo_url?: string
  plano: 'basico' | 'pro' | 'multi'
  zapsign_token?: string
  cora_id?: string
  cora_cert?: string
  cora_key?: string
  created_at: string
}

// ─── Categorias Padronizadas ───────────────────────────────────────────────
export interface CategoriaConfig {
  id: string
  tenant_id: string
  nome: string
  tipo: TipoLancamento
  created_at: string
}

export interface CategoriaInput extends Omit<CategoriaConfig, 'id' | 'tenant_id' | 'created_at'> {}

// ─── Usuário ───────────────────────────────────────────────────────────────
export interface Usuario {
  id: string
  tenant_id: string
  nome: string
  email: string
  role: 'admin' | 'presidente' | 'vice-presidente' | 'tesoureiro' | 'diretoria' | 'secretaria' | 'viewer'
  created_at: string
}

// ─── Financeiro ────────────────────────────────────────────────────────────
export type TipoLancamento = 'receita' | 'despesa'
export type StatusLancamento = 'pago' | 'aberto' | 'atrasado' | 'parcial' | 'cancelado' | 'em_processamento' | 'abonado'
export type FormaPagamento = 'Dinheiro' | 'PIX' | 'Boleto' | 'Transferência' | 'Cartão' | 'Fundo de Caixa' | undefined

export interface Lancamento {
  id: string
  tenant_id: string
  data: string
  descricao: string
  categoria: string
  tipo: TipoLancamento
  valor: number
  taxa?: number // Taxa bancária vinculada ao lançamento
  status: StatusLancamento
  forma_pagamento?: FormaPagamento
  valor_recebido?: number
  troco_via_pix?: boolean
  recorrencia_ativa?: boolean
  recorrencia_id?: string // ID comum para o grupo de lançamentos recorrentes
  conta_id?: string
  conciliado?: boolean
  data_conciliacao?: string
  banco_transacao_id?: string
  associado_id?: string // ID do associado vinculado (opcional)
  fornecedor_id?: string // ID do fornecedor vinculado (opcional)
  diretor_id?: string // ID do diretor vinculado (opcional)
  competencia_mes?: number // Mês de competência (0-11)
  competencia_ano?: number // Ano de competência
  status_cobranca?: string // Status de cobrança (ex: EM COBRANÇA, NEGOCIADO)
  banco_original_memo?: string // Histórico oculto da transação bancária
  nfse_vinculo?: {
    nfse_id: string
    nfse: {
      numero_nfse: string
      xml_url?: string
    }
  }[]
  is_ec_destino?: boolean // Marcação para encontro de contas (destino)
  id_origem?: string // ID do lançamento de origem (remanejo)
  valor_pago_ec?: number // Valor total recebido via encontro de contas
  conta_debito_id?: string // ID da conta contábil de débito (personalizado)
  conta_credito_id?: string // ID da conta contábil de crédito (personalizado)
  created_at: string
  updated_at: string
}

export interface ContaBancaria {
  id: string
  tenant_id: string
  nome: string // Ex: Bradesco, Cora, Caixa
  tipo: 'corrente' | 'poupanca' | 'caixa_fisico'
  saldo_inicial: number
  created_at: string
}

export interface LancamentoInput extends Omit<Lancamento, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {
  taxa?: number // Campo virtual para cálculo
}

// ─── Associados ────────────────────────────────────────────────────────────
export type StatusAssociado = 'ativo' | 'inativo' | 'inadimplente' | 'pendente' | 'suspenso' | 'abonado'

export interface Associado {
  id: string
  tenant_id: string
  codigo: string
  nome: string
  cpf?: string // CPF ou CNPJ (opcional)
  categoria: string
  email: string
  telefone?: string
  data_ingresso: string
  mensalidade: number
  status: StatusAssociado
  meses_atraso?: number
  ultimo_pagamento?: string
  vencimento_dia?: number // 10 ou 20
  zapsign_doc_token?: string // Token do documento na ZapSign
  zapsign_signers?: any[] // Histórico de signatários
  recorrencia_ativa?: boolean // Se está na cobrança recorrente
  conta_recorrencia?: string // Conta bancária da recorrência
  plano_saude?: string // Ativo, Aguardando Declaração, Não Possui
  termo_status?: string // Enviado ao HGU, Assinatura Pendente
  zapsign_sync_at?: string // Data da última sincronização com ZapSign
  data_assinatura?: string // Data que assinou o documento na ZapSign (Associado desde)
  suspensao_motivo?: string // 1 - Suspensão Por Inadimplência; 2 - Suspensão por Ordem Judicial; 3 - Suspensão por Outro(s) Motivo(s)
  suspensao_data?: string // Data e hora do registro da suspensão
  suspensao_arquivo_url?: string // Link para o PDF de suspensão assinado
  codigo_hgu?: string // Código do plano HGU
  dependentes?: { nome: string, data_nascimento?: string, codigo_hgu?: string, data_inclusao?: string }[] // Lista de dependentes
  data_inclusao_plano?: string // Data de inclusão no plano HGU
  termo_cancelamento_url?: string // Link para o termo assinado
  abono_motivo?: string // Motivo do abono
  abono_usuario?: string // Usuário que autorizou o abono
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
export interface ProLaborePeriodo {
  id: string
  valor: number
  mes_inicio: number // 0-11
  ano_inicio: number
  mes_fim?: number // 0-11
  ano_fim?: number
}

export interface ProLaboreItem {
  id: string
  nome: string
  periodos: ProLaborePeriodo[]
}

export interface CenarioSimulacao {
  id: string
  tenant_id: string
  nome: string
  mes_referencia: number // Mes que estamos simulando no dashboard
  ano_referencia: number
  num_associados: number
  valor_mensalidade: number
  despesas_fixas: number
  despesas_variaveis: number
  folha_pagamento: number // Base (outros funcionários)
  pro_labores: ProLaboreItem[] // Lista dinâmica de diretores com seus períodos
  reserva_meses_alvo: number // Ex: 3 meses
  created_at: string
}

export interface CenarioInput extends Omit<CenarioSimulacao, 'id' | 'tenant_id' | 'created_at'> {
  id?: string
}


// ─── Recrutamento ────────────────────────────────────────────────────────
export type ModeloTrabalho = 'presencial' | 'hibrido' | 'remoto'
export type StatusVaga = 'aberta' | 'analise' | 'encerrada'
export type StatusCandidato = 
  | 'inscrito' 
  | 'escolaridade_validada' 
  | 'entrevista_adm' 
  | 'entrevista_dir' 
  | 'contratacao' 
  | 'banco_talentos' 
  | 'reprovado'

export interface Vaga {
  id: string
  tenant_id: string
  titulo: string
  area: string
  quantidade: number
  modelo: ModeloTrabalho
  carga_horaria: string
  bolsa: number
  beneficios: string
  requisitos_obrigatorios: string
  requisitos_desejaveis: string
  conhecimentos_sistemas: string
  prazo_inscricao: string
  responsavel: string
  status: StatusVaga
  created_at: string
}

export interface Candidato {
  id: string
  tenant_id: string
  vaga_id: string
  
  // Pessoais
  nome: string
  cpf?: string
  rg?: string
  data_nascimento?: string
  endereco?: string
  cidade_estado?: string
  email: string
  telefone?: string
  whatsapp?: string
  linkedin?: string
  curriculo_url?: string
  foto_url?: string
  
  // Acadêmicos
  instituicao?: string
  curso?: string
  semestre?: number
  turno?: string
  previsao_conclusao?: string
  situacao_matricula?: string
  cra?: number
  disponibilidade?: string
  experiencia_anterior?: string
  cursos_complementares?: string
  
  documentos: any[]
  status: StatusCandidato
  
  // Avaliações
  nota_adm?: number
  nota_dir?: number
  nota_final?: number
  parecer_adm?: string
  parecer_dir?: string
  obs_escolaridade?: string
  
  checklist_contratacao: Record<string, boolean>
  
  created_at: string
  updated_at: string
}

export interface RecrutamentoKPIs {
  vagasAbertas: number
  totalCandidatos: number
  taxaAprovacao: number
  tempoMedioContratacao: number
  bancoTalentos: number
  conversaoFinal: number // Currículos recebidos vs Fila de Contratação
}

export interface DiretorPeriodo {
  id: string
  valor: number
  mes_inicio: number
  ano_inicio: number
  mes_fim?: number
  ano_fim?: number
}

export interface Diretor {
  id: string
  tenant_id: string
  nome: string
  cargo: string
  cpf: string | null
  email: string | null
  telefone: string | null
  pro_labore_base: number
  status: 'ativo' | 'inativo'
  endereco?: string | null
  chave_pix?: string | null
  banco_info?: string | null
  created_at: string
  periodos?: DiretorPeriodo[]
}

// ─── API Response ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}


// ─── Gestão de Tarefas ─────────────────────────────────────────────────────
export type PrioridadeTarefa = 'Alta' | 'Média' | 'Baixa'
export type StatusTarefa = 'A Fazer' | 'Em Andamento' | 'Aguardando' | 'Concluído'

export interface Tarefa {
  id: string
  tenant_id: string
  titulo: string
  descricao?: string
  responsavel_id?: string
  associado_id?: string
  status: StatusTarefa
  prioridade: PrioridadeTarefa
  categoria?: string
  prazo?: string
  criado_por?: string
  created_at: string
  updated_at: string
  // Virtual fields for UI
  responsavel_nome?: string
  associado_nome?: string
}

export interface TarefaComentario {
  id: string
  tenant_id: string
  tarefa_id: string
  autor_id?: string
  texto: string
  created_at: string
  // Virtual
  autor_nome?: string
}

export interface ModeloMensagem {
  id: string
  tenant_id: string
  nome: string
  categoria?: string
  texto: string
  variaveis_json: string[]
  criado_por?: string
  created_at: string
  updated_at: string
}

export interface Resolucao {
  id: string
  tenant_id: string
  titulo: string
  categoria?: string
  conteudo: string
  tags_json: string[]
  favorito: boolean
  visualizacoes: number
  criado_por?: string
  created_at: string
  updated_at: string
}
