export interface PopItem {
  id: string
  codigo: string
  titulo: string
  modulo: string
  icone: string
  cor: string
  objetivo: string
  responsavel: string
  periodicidade: string
  passos: string[]
  alertas: string[]
  referencias: string[]
}

export const POPS: PopItem[] = [
  {
    id: 'pop-01',
    codigo: 'POP-01',
    titulo: 'Leitura e Interpretação do Painel de KPIs',
    modulo: 'Dashboard / Resumo',
    icone: 'BarChart3',
    cor: 'emerald',
    objetivo: 'Orientar o usuário na análise dos indicadores chave de desempenho (KPIs) apresentados no painel principal, garantindo uma compreensão clara da saúde financeira e operacional da organização.',
    responsavel: 'Gestores e Diretoria',
    periodicidade: 'Diária / Semanal',
    passos: [
      'Acesse a aba "Dashboard" ou "Resumo" no menu principal.',
      'Selecione o mês e o ano desejados no filtro no canto superior da tela.',
      'Analise os Cards de Resumo: Receitas, Despesas, Saldo Operacional, Inadimplência.',
      'Verifique os gráficos de evolução temporal para identificar tendências.',
      'Utilize os filtros de regime (Caixa vs Competência) para análises específicas de fluxo ou de provisões.'
    ],
    alertas: [
      'O Regime de Caixa considera apenas lançamentos com status "Pago" ou conciliados.',
      'A inadimplência é calculada com base na data de vencimento (Regime de Competência).'
    ],
    referencias: ['Guia de Indicadores Financeiros']
  },
  {
    id: 'pop-02',
    codigo: 'POP-02',
    titulo: 'Lançamento de Receitas e Despesas',
    modulo: 'Financeiro',
    icone: 'Wallet',
    cor: 'emerald',
    objetivo: 'Padronizar o processo de registro manual de movimentações financeiras, assegurando a correta categorização e alocação de recursos.',
    responsavel: 'Equipe Financeira',
    periodicidade: 'Diária',
    passos: [
      'Acesse o módulo "Financeiro".',
      'Clique no botão "+ Novo Lançamento".',
      'Preencha os campos obrigatórios: Descrição, Valor, Data, Categoria e Conta.',
      'Selecione o Tipo (Receita ou Despesa) e o Status (Pendente, Pago, etc.).',
      'Anexe comprovantes (se aplicável) e clique em "Salvar".'
    ],
    alertas: [
      'Sempre anexe o comprovante de pagamento para despesas.',
      'Certifique-se de escolher a Categoria correta para evitar erros nos relatórios gerenciais.'
    ],
    referencias: ['Plano de Categorias Financeiras']
  },
  {
    id: 'pop-03',
    codigo: 'POP-03',
    titulo: 'Conciliação Bancária OFX',
    modulo: 'Financeiro',
    icone: 'RefreshCw',
    cor: 'emerald',
    objetivo: 'Garantir que os saldos do sistema correspondam exatamente aos saldos das contas bancárias através da importação e conferência de extratos OFX.',
    responsavel: 'Equipe Financeira / Tesouraria',
    periodicidade: 'Diária / Semanal',
    passos: [
      'Exporte o arquivo OFX do internet banking da instituição financeira.',
      'No sistema, acesse "Financeiro" e clique em "Conciliação OFX".',
      'Selecione a conta bancária correspondente e faça o upload do arquivo OFX.',
      'O sistema tentará fazer o "match" automático. Revise as sugestões.',
      'Para transações não encontradas, crie um novo lançamento ou vincule manualmente.',
      'Confirme as conciliações e verifique se o saldo final bate com o extrato.'
    ],
    alertas: [
      'Não processe o mesmo arquivo OFX duas vezes para evitar duplicidade de lançamentos.',
      'Lançamentos conciliados não podem ser excluídos facilmente.'
    ],
    referencias: ['Manual do Internet Banking']
  },
  {
    id: 'pop-04',
    codigo: 'POP-04',
    titulo: 'Fechamento e Estorno de Lançamentos',
    modulo: 'Financeiro',
    icone: 'FileCheck',
    cor: 'emerald',
    objetivo: 'Estabelecer as regras para finalizar o processamento financeiro de um período e os procedimentos para correções (estornos).',
    responsavel: 'Gestor Financeiro',
    periodicidade: 'Mensal',
    passos: [
      'Acesse o módulo de "Fechamento Mensal".',
      'Selecione o mês e ano desejados.',
      'O sistema validará pendências (Lançamentos não pagos, não conciliados).',
      'Resolva as pendências ou mova-as para o mês seguinte.',
      'Clique em "Fechar Período".',
      'Para estornar um lançamento num período fechado, solicite a reabertura do mês ou faça um lançamento de ajuste no mês corrente.'
    ],
    alertas: [
      'Um mês fechado bloqueia a edição, exclusão ou criação de lançamentos com data dentro daquele mês.',
      'Apenas Administradores podem reabrir meses.'
    ],
    referencias: ['Política de Fechamento Contábil']
  },
  {
    id: 'pop-05',
    codigo: 'POP-05',
    titulo: 'Definição e Acompanhamento de Metas',
    modulo: 'Planejamento',
    icone: 'Target',
    cor: 'indigo',
    objetivo: 'Cadastrar metas financeiras mensais e anuais por categoria para orientar o acompanhamento orçamentário.',
    responsavel: 'Diretoria / Gestão',
    periodicidade: 'Anual / Mensal',
    passos: [
      'Acesse "Planejamento" > "Metas".',
      'Defina o Orçamento Total planejado para o período.',
      'Distribua as metas pelas diferentes Categorias de Receitas e Despesas.',
      'Acompanhe o painel de Realizado vs Orçado ao longo do mês.'
    ],
    alertas: [
      'As metas não alteram os lançamentos reais, servem apenas como referência e base para alertas no Dashboard.'
    ],
    referencias: ['Planejamento Estratégico Anual']
  },
  {
    id: 'pop-06',
    codigo: 'POP-06',
    titulo: 'Simulador Financeiro',
    modulo: 'Planejamento',
    icone: 'Activity',
    cor: 'indigo',
    objetivo: 'Utilizar a ferramenta de simulação para prever o impacto de novos custos, contratações ou investimentos no fluxo de caixa.',
    responsavel: 'Gestor Financeiro / Diretoria',
    periodicidade: 'Sob demanda',
    passos: [
      'Acesse "Planejamento" > "Simulador".',
      'Insira os dados base (Caixa Inicial, Receita e Despesa Mensal).',
      'Adicione "Novos Impactos" (ex: Contratação, Nova despesa fixa).',
      'Verifique o gráfico de projeção de saldo e o cálculo de meses de reserva (Runway).'
    ],
    alertas: [
      'O simulador trabalha com dados projetados e não afeta os relatórios reais do Dashboard.'
    ],
    referencias: []
  },
  {
    id: 'pop-07',
    codigo: 'POP-07',
    titulo: 'Análise Histórica',
    modulo: 'Planejamento',
    icone: 'TrendingUp',
    cor: 'indigo',
    objetivo: 'Gerar relatórios de evolução ao longo de múltiplos anos e meses para identificar sazonalidade e tendências de longo prazo.',
    responsavel: 'Gestão Estratégica',
    periodicidade: 'Semestral / Anual',
    passos: [
      'Acesse "Planejamento" > "Análise Histórica".',
      'Selecione o intervalo de anos desejado.',
      'Avalie os gráficos de crescimento de receitas e despesas.',
      'Utilize os dados para basear o planejamento orçamentário do ano seguinte.'
    ],
    alertas: [
      'Certifique-se de que todos os meses do período analisado já passaram por "Fechamento Mensal" para garantir a integridade dos dados.'
    ],
    referencias: []
  },
  {
    id: 'pop-08',
    codigo: 'POP-08',
    titulo: 'Processo de Fechamento e Reabertura',
    modulo: 'Fechamento Mensal',
    icone: 'Lock',
    cor: 'red',
    objetivo: 'Garantir a imutabilidade dos dados financeiros passados, evitando alterações acidentais em balanços já auditados.',
    responsavel: 'Gestão Financeira / Auditoria',
    periodicidade: 'Mensal',
    passos: [
      'Acesse o módulo "Fechamento Mensal".',
      'Confira o checklist automático do sistema (Inadimplência, Lançamentos em aberto).',
      'Bloqueie o mês clicando em "Fechar Mês".',
      'Para reabrir, um Administrador (Perfil 1) deve acessar o módulo, justificar a abertura e confirmar.'
    ],
    alertas: [
      'Reabrir um mês previamente fechado é uma ação sensível e será registrada nos logs de Auditoria do sistema.'
    ],
    referencias: ['POP-04']
  },
  {
    id: 'pop-09',
    codigo: 'POP-09',
    titulo: 'Cadastro de Associados',
    modulo: 'Gestão de Vidas',
    icone: 'Users',
    cor: 'amber',
    objetivo: 'Manter a base de associados / clientes atualizada com informações de contato, documentos e dados de faturamento.',
    responsavel: 'Secretaria / Atendimento',
    periodicidade: 'Diária',
    passos: [
      'Acesse "Gestão de Vidas" > "Associados".',
      'Clique em "+ Novo Associado".',
      'Preencha os Dados Pessoais (Nome, CPF/CNPJ, E-mail, Telefone).',
      'Preencha os Dados de Endereço.',
      'Defina o Status (Ativo, Inativo, Suspenso) e Salve.'
    ],
    alertas: [
      'O CPF/CNPJ é utilizado como chave única, evite duplicidades.',
      'Mudanças no e-mail afetam o envio de cobranças e faturas.'
    ],
    referencias: ['Política de Privacidade (LGPD)']
  },
  {
    id: 'pop-10',
    codigo: 'POP-10',
    titulo: 'Gestão de Fornecedores',
    modulo: 'Gestão de Vidas',
    icone: 'ShoppingCart',
    cor: 'amber',
    objetivo: 'Cadastrar e gerenciar dados de fornecedores e parceiros comerciais.',
    responsavel: 'Compras / Administrativo',
    periodicidade: 'Conforme necessidade',
    passos: [
      'Acesse "Gestão de Vidas" > "Fornecedores".',
      'Clique em "+ Novo Fornecedor".',
      'Insira as informações comerciais, CNPJ, Razão Social e contatos financeiros.',
      'Vincule os lançamentos de despesa no Financeiro a este fornecedor.'
    ],
    alertas: [
      'Fornecedores inativos não aparecerão na lista de seleção ao criar novas despesas.'
    ],
    referencias: []
  },
  {
    id: 'pop-11',
    codigo: 'POP-11',
    titulo: 'Gestão de Diretoria',
    modulo: 'Gestão de Vidas',
    icone: 'ShieldCheck',
    cor: 'amber',
    objetivo: 'Registrar membros do conselho, diretoria e cargos executivos com seus mandatos e histórico.',
    responsavel: 'Governança',
    periodicidade: 'Anual (ou a cada eleição)',
    passos: [
      'Acesse "Gestão de Vidas" > "Diretoria".',
      'Clique em "+ Novo Membro".',
      'Associe o membro a um Associado existente (opcional).',
      'Defina o Cargo, Data de Posse e Data de Fim de Mandato.'
    ],
    alertas: [
      'Mantenha os mandatos atualizados para controle de assinaturas legais.'
    ],
    referencias: ['Estatuto Social']
  },
  {
    id: 'pop-12',
    codigo: 'POP-12',
    titulo: 'Registro e Agendamento',
    modulo: 'Atendimentos',
    icone: 'Calendar',
    cor: 'amber',
    objetivo: 'Organizar os serviços prestados, consultas ou reuniões agendadas.',
    responsavel: 'Recepção / Atendimento',
    periodicidade: 'Diária',
    passos: [
      'Acesse "Atendimentos e Agendamentos".',
      'Clique no calendário na data desejada ou no botão "Novo".',
      'Selecione o Associado/Cliente, tipo de serviço, horário e profissional responsável.',
      'Atualize o status (Agendado, Realizado, Cancelado, Falta).'
    ],
    alertas: [
      'Atendimentos podem gerar integração automática de cobrança dependendo da regra configurada.'
    ],
    referencias: []
  },
  {
    id: 'pop-13',
    codigo: 'POP-13',
    titulo: 'Acompanhamento de Projetos',
    modulo: 'Metas e Projetos',
    icone: 'Target',
    cor: 'blue',
    objetivo: 'Monitorar a execução do planejamento estratégico, criando projetos e medindo seu avanço.',
    responsavel: 'Gerentes de Projeto / PMO',
    periodicidade: 'Semanal',
    passos: [
      'Acesse "Metas e Projetos".',
      'Crie um "Novo Projeto" e defina o Escopo, Orçamento e Prazos.',
      'Crie "Entregas" (Milestones) dentro do projeto.',
      'Atualize o percentual de conclusão (%) periodicamente.'
    ],
    alertas: [
      'Projetos com prazo vencido e menos de 100% de conclusão aparecerão em vermelho no dashboard.'
    ],
    referencias: ['Metodologia de Gestão de Projetos']
  },
  {
    id: 'pop-14',
    codigo: 'POP-14',
    titulo: 'Gestão de Tarefas',
    modulo: 'Gestão de Tarefas',
    icone: 'ClipboardList',
    cor: 'blue',
    objetivo: 'Organizar o fluxo de trabalho operacional no modelo Kanban (A Fazer, Fazendo, Feito).',
    responsavel: 'Todos os Usuários',
    periodicidade: 'Diária',
    passos: [
      'Acesse "Gestão de Tarefas".',
      'No quadro Kanban, clique em "Adicionar Tarefa" na coluna desejada.',
      'Descreva a tarefa, atribua a um colaborador e defina prazo de entrega.',
      'Arraste o cartão entre as colunas conforme o progresso (Drag & Drop).'
    ],
    alertas: [
      'Tarefas atrasadas terão indicadores visuais para priorização.'
    ],
    referencias: []
  },
  {
    id: 'pop-15',
    codigo: 'POP-15',
    titulo: 'Controle de Bens',
    modulo: 'Bens Duráveis',
    icone: 'Briefcase',
    cor: 'blue',
    objetivo: 'Controlar o inventário e patrimônio da organização.',
    responsavel: 'Administrativo / TI',
    periodicidade: 'Sempre que houver aquisição ou baixa',
    passos: [
      'Acesse "Bens Duráveis".',
      'Cadastre um Novo Bem (ex: Notebook, Móveis, Veículos).',
      'Informe valor de aquisição, data, número de série/tombamento e localização.',
      'Registre manutenções ou a baixa do bem quando não for mais utilizado.'
    ],
    alertas: [
      'Não exclua bens baixados, mantenha-os no sistema com status "Baixado/Vendido" para histórico patrimonial.'
    ],
    referencias: ['Política de Patrimônio']
  },
  {
    id: 'pop-16',
    codigo: 'POP-16',
    titulo: 'Processo Seletivo',
    modulo: 'Recrutamento',
    icone: 'Users',
    cor: 'purple',
    objetivo: 'Gerenciar vagas e triagem de candidatos.',
    responsavel: 'Recursos Humanos',
    periodicidade: 'Sob demanda',
    passos: [
      'Acesse "Recrutamento".',
      'Crie uma Nova Vaga especificando requisitos e salário.',
      'Adicione os candidatos recebidos ao pipeline da vaga.',
      'Avance os candidatos pelas etapas (Triagem, Entrevista, Teste, Contratado).'
    ],
    alertas: [
      'Dados de candidatos não selecionados devem seguir as regras de retenção da LGPD.'
    ],
    referencias: []
  },
  {
    id: 'pop-17',
    codigo: 'POP-17',
    titulo: 'Registro de Notas Fiscais',
    modulo: 'Escrituração Fiscal',
    icone: 'FileText',
    cor: 'slate',
    objetivo: 'Assegurar que todas as receitas e despesas possuam sua respectiva nota fiscal escriturada e vinculada.',
    responsavel: 'Depto. Fiscal / Contábil',
    periodicidade: 'Diária / Semanal',
    passos: [
      'Acesse "Escrituração Fiscal".',
      'Verifique os lançamentos pendentes de nota fiscal.',
      'Faça o upload do XML ou informe a Chave de Acesso da nota correspondente.',
      'Verifique os impostos retidos calculados pelo sistema.'
    ],
    alertas: [
      'O fechamento do mês exige que todas as transações sujeitas a nota fiscal estejam regularizadas.'
    ],
    referencias: ['Manual de NFSe']
  },
  {
    id: 'pop-18',
    codigo: 'POP-18',
    titulo: 'Plano de Contas',
    modulo: 'Contabilidade',
    icone: 'BookOpen',
    cor: 'slate',
    objetivo: 'Manter a correspondência entre as categorias gerenciais e o plano de contas contábil.',
    responsavel: 'Contabilidade',
    periodicidade: 'Na criação de novas categorias',
    passos: [
      'Acesse "Configurações" > "Categorias e Mapeamento" ou a aba Contábil.',
      'Edite a categoria desejada.',
      'Vincule a Categoria (ex: "Aluguel") à Conta Contábil correspondente (ex: "3.1.2 - Despesas com Aluguel").',
      'Certifique-se de preencher a "Terminologia ITG 2002".'
    ],
    alertas: [
      'O mapeamento incorreto gera relatórios contábeis incorretos que afetam a Demonstração de Resultados (DRE).'
    ],
    referencias: ['Norma ITG 2002']
  },
  {
    id: 'pop-19',
    codigo: 'POP-19',
    titulo: 'Gestão de Categorias',
    modulo: 'Configurações',
    icone: 'Settings',
    cor: 'slate',
    objetivo: 'Criar, editar ou desativar categorias de receita e despesa do sistema.',
    responsavel: 'Administrador / Gestor',
    periodicidade: 'Sob demanda',
    passos: [
      'Acesse "Configurações" > "Categorias e Mapeamento".',
      'Visualize o uso de cada categoria (Quantos lançamentos vinculados).',
      'Utilize a ferramenta de Transferência caso queira mesclar duas categorias repetidas.',
      'Para excluir, a categoria precisa ter 0 lançamentos (Uso: 0).'
    ],
    alertas: [
      'Evite criar categorias extremamente específicas (ex: "Café Pilão"). Prefira categorias agrupadoras (ex: "Copa e Cozinha").'
    ],
    referencias: []
  },
  {
    id: 'pop-20',
    codigo: 'POP-20',
    titulo: 'Contas Bancárias',
    modulo: 'Configurações',
    icone: 'CreditCard',
    cor: 'slate',
    objetivo: 'Gerenciar as contas, caixas físicos e integrações (API) ativas no sistema.',
    responsavel: 'Administrador / Tesouraria',
    periodicidade: 'Na abertura/fechamento de contas',
    passos: [
      'Acesse "Configurações" > "Contas Bancárias".',
      'Cadastre a Nova Conta informando Banco, Agência e Saldo Inicial.',
      'Para integrações como Cora, verifique as chaves e certificados na aba específica.',
      'O Saldo Inicial define a base de cálculo para todas as projeções daquela conta.'
    ],
    alertas: [
      'Não exclua contas que já possuem movimentação. Apenas inative-as.'
    ],
    referencias: []
  },
  {
    id: 'pop-21',
    codigo: 'POP-21',
    titulo: 'Controle de Acessos',
    modulo: 'Configurações',
    icone: 'Shield',
    cor: 'slate',
    objetivo: 'Cadastrar colaboradores, criar Perfis (Roles) e delegar permissões de acesso (RBAC).',
    responsavel: 'Administrador (Perfil 1)',
    periodicidade: 'Na entrada/saída de funcionários',
    passos: [
      'Acesse "Configurações" > "Controle de Acessos".',
      'Na aba "Perfis de Acesso", crie um novo perfil (ex: "Assistente Financeiro") e marque o que ele pode (Ver, Criar, Editar, Excluir) em cada módulo.',
      'Na aba "Colaboradores", crie o login do funcionário e associe ao perfil recém-criado.',
      'Para desativar um funcionário, basta inativar o colaborador (não precisa excluir).'
    ],
    alertas: [
      'Nunca compartilhe credenciais do Perfil "Administrador Master" (Perfil ID 1), pois ele tem passe livre em todos os bloqueios do sistema.',
      'Ao bloquear uma permissão de "Ver" em um módulo, o menu lateral também desaparecerá para aquele perfil.'
    ],
    referencias: ['Política de Segurança da Informação']
  },
  {
    id: 'pop-22',
    codigo: 'POP-22',
    titulo: 'Suspensão de Associado e Benefícios',
    modulo: 'Cobrança / Inadimplência',
    icone: 'UserX',
    cor: 'red',
    objetivo: 'Aplicar a regra de suspensão estatutária para associados inadimplentes a partir de 90 dias de atraso, cancelando o acesso aos benefícios da associação (incluindo Plano de Saúde).',
    responsavel: 'Tesouraria',
    periodicidade: 'Diária (ao identificar D+90+)',
    passos: [
      'Acesse "Financeiro" > aba "Inadimplência".',
      'Localize o associado que atingiu ou ultrapassou 90 dias de atraso (badge vermelho escuro - CRÍTICO).',
      'Clique no botão "Acionar Cobrança" para abrir o painel lateral.',
      'Na tela de nova ação, confirme a etapa "Suspensão". O sistema gerará o texto formal baseado no art. 57 do Código Civil e no Estatuto Social.',
      'Envie o comunicado de suspensão via E-mail e Carta para o associado.',
      'Comunique imediatamente a operadora do Plano de Saúde (ex: HGU) sobre a exclusão/suspensão do associado.',
      'A reativação do associado só deve ser feita mediante quitação integral ou assinatura de acordo de parcelamento.'
    ],
    alertas: [
      'Não realizar a comunicação no prazo correto gera custos indevidos para a associação junto à operadora de saúde.',
      'O associado continua devendo os valores em atraso (com multa e juros) mesmo após a suspensão.'
    ],
    referencias: ['Estatuto Social', 'ACPROBEC_modulo_cobranca_especificacao_tecnica']
  }
]
