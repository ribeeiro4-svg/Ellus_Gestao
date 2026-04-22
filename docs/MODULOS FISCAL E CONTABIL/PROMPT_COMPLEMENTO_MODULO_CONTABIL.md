# COMPLEMENTO DO PROMPT — MÓDULO CONTÁBIL
## Escrituração Contábil Completa e Integrada para Associações sem Fins Lucrativos
### Integrado aos Módulos: Fiscal (NF-e) | Financeiro | Estoque | Imobilizado

> **INSTRUÇÃO:** Este documento é o Complemento 3 do sistema. Deve ser lido e
> implementado em conjunto com:
> - PROMPT_MODULO_ESCRITURACAO_FISCAL.md (Complemento 1)
> - PROMPT_COMPLEMENTO_PRODUTOS_ESTOQUE.md (Complemento 2)
>
> O Módulo Contábil é o **núcleo central** de todo o sistema. Todos os outros
> módulos geram lançamentos contábeis que alimentam este módulo automaticamente.

---

## PARTE 17 — BASE LEGAL E NORMATIVA CONTÁBIL

### 17.1 Normas Obrigatórias para Associações

A contabilidade da associação é regida por um conjunto específico de normas que
**diferem substancialmente** das empresas comerciais. O sistema deve implementar
rigorosamente cada uma delas:

| Norma | Órgão | Aplicação no Sistema |
|---|---|---|
| **ITG 2002 (R1)** | CFC — Res. 1.409/2012 rev. 2015 | Norma-mãe: critérios de avaliação, reconhecimento, estrutura das demonstrações e notas explicativas para entidades sem fins lucrativos |
| **NBC TG 00 (R2)** | CPC | Estrutura conceitual — define ativos, passivos, receitas, despesas, reconhecimento e mensuração |
| **NBC TG 16 / CPC 16** | CPC | Estoques — custo médio ponderado, composição do custo |
| **NBC TG 27 / CPC 27** | CPC | Ativo imobilizado — reconhecimento, depreciação |
| **NBC TG 07 (R2) / CPC 07** | CPC | Subvenções governamentais — tratamento de convênios, grants e recursos públicos |
| **NBC TG 03 / CPC 03** | CPC | Demonstração dos fluxos de caixa |
| **NBC TG 26 / CPC 26** | CPC | Apresentação das demonstrações contábeis |
| **IN RFB nº 2.003/2021** | Receita Federal | Obrigatoriedade da ECD para imunes/isentas com ingressos > R$ 4,8 milhões |
| **Decreto nº 6.022/2007** | Governo Federal | Institui o SPED (base legal da ECD) |
| **Art. 14, III do CTN** | Congresso Nacional | Exige escrituração completa como requisito para manutenção da imunidade/isenção |
| **Código Civil, Arts. 1.179–1.195** | Congresso Nacional | Obrigatoriedade de escrituração contábil para pessoas jurídicas |

### 17.2 Terminologia Específica — Associação ≠ Empresa Comercial

**CRÍTICO:** O sistema jamais deve usar terminologia empresarial para associações.
O não cumprimento desta regra pode comprometer o reconhecimento da imunidade
tributária pela Receita Federal, conforme interpretação do Art. 14 do CTN.

| ❌ Terminologia Empresarial | ✅ Terminologia Correta para Associação |
|---|---|
| Lucro / Prejuízo | **Superávit / Déficit** |
| Patrimônio Líquido | **Patrimônio Social** |
| Capital Social | **Patrimônio Social Inicial** ou **Fundo Patrimonial** |
| Sócios / Acionistas | **Associados** |
| DRE — Demonstração do Resultado | **DSD — Demonstração do Superávit ou Déficit do Exercício** |
| DLPA / DMPL | **DMPS — Demonstração das Mutações do Patrimônio Social** |
| Receita Bruta de Vendas | **Ingressos** (cotizações, doações, subvenções, etc.) |
| Distribuição de Dividendos | **Inaplicável** (proibido pela natureza jurídica) |

---

## PARTE 18 — PLANO DE CONTAS PARA ASSOCIAÇÕES (ITG 2002 R1)

### 18.1 Estrutura do Plano de Contas

O plano de contas deve ser **hierárquico**, com no mínimo 5 níveis e suporte a até 7,
seguindo a estrutura:

```
NÍVEL 1 — Grupo        (ex: 1 — ATIVO)
NÍVEL 2 — Subgrupo     (ex: 1.1 — ATIVO CIRCULANTE)
NÍVEL 3 — Conta        (ex: 1.1.1 — Disponibilidades)
NÍVEL 4 — Subconta     (ex: 1.1.1.01 — Caixa)
NÍVEL 5 — Analítica    (ex: 1.1.1.01.001 — Caixa Sede)
NÍVEL 6 — Subanálise   (ex: 1.1.1.01.001.001 — Caixa Projeto X)
```

Contas do tipo **Sintética** (grupos) = apenas totalizam. Só recebem lançamentos as
contas **Analíticas** (último nível).

---

### 18.2 Plano de Contas Completo — Grupo 1: ATIVO

```
1 ATIVO
│
├─ 1.1 ATIVO CIRCULANTE
│   │
│   ├─ 1.1.1 DISPONIBILIDADES
│   │   ├─ 1.1.1.01 Caixa
│   │   │   └─ 1.1.1.01.001 Caixa Geral
│   │   │   └─ 1.1.1.01.002 Caixa Pequenas Despesas (Fundo Fixo)
│   │   ├─ 1.1.1.02 Bancos — Conta Movimento
│   │   │   └─ 1.1.1.02.001 Banco [Nome] Ag. [XX] C/C [XXXXX]  ← uma conta por C/C
│   │   ├─ 1.1.1.03 Bancos — Conta Aplicação Financeira
│   │   │   └─ 1.1.1.03.001 Aplicação [Nome Banco] — CDB/LCI/LCA
│   │   └─ 1.1.1.04 Bancos — Conta Poupança
│   │       └─ 1.1.1.04.001 Poupança [Nome Banco]
│   │
│   ├─ 1.1.2 DIREITOS REALIZÁVEIS A CURTO PRAZO
│   │   ├─ 1.1.2.01 Contas a Receber — Mensalidades Associados
│   │   │   └─ 1.1.2.01.001 Mensalidades a Receber — Correntes
│   │   │   └─ 1.1.2.01.002 Mensalidades a Receber — Vencidas (até 90 dias)
│   │   │   └─ 1.1.2.01.003 Mensalidades a Receber — Vencidas (acima 90 dias)
│   │   ├─ 1.1.2.02 Contas a Receber — Convênios e Parcerias
│   │   │   └─ 1.1.2.02.001 Convênios com Órgãos Públicos Federais
│   │   │   └─ 1.1.2.02.002 Convênios com Órgãos Públicos Estaduais
│   │   │   └─ 1.1.2.02.003 Convênios com Órgãos Públicos Municipais
│   │   │   └─ 1.1.2.02.004 Parcerias com Entidades Privadas
│   │   ├─ 1.1.2.03 Contas a Receber — Doações Comprometidas
│   │   ├─ 1.1.2.04 Contas a Receber — Subvenções a Receber
│   │   ├─ 1.1.2.05 Adiantamentos a Funcionários
│   │   ├─ 1.1.2.06 Adiantamentos a Fornecedores
│   │   ├─ 1.1.2.07 Impostos a Recuperar
│   │   │   └─ 1.1.2.07.001 IRRF a Recuperar (sobre aplicações financeiras)
│   │   │   └─ 1.1.2.07.002 PIS/COFINS a Recuperar (se houver)
│   │   └─ 1.1.2.08 Outros Direitos a Receber
│   │
│   ├─ 1.1.3 ESTOQUES
│   │   ├─ 1.1.3.01 Estoque de Materiais de Consumo
│   │   │   └─ 1.1.3.01.001 Material de Escritório
│   │   │   └─ 1.1.3.01.002 Material de Limpeza e Higiene
│   │   │   └─ 1.1.3.01.003 Material de Manutenção
│   │   ├─ 1.1.3.02 Estoque de Itens para Distribuição
│   │   │   └─ 1.1.3.02.001 Itens para Distribuição — Projeto [Nome]
│   │   ├─ 1.1.3.03 Estoque de Insumos de Projetos
│   │   └─ 1.1.3.04 Provisão para Perdas em Estoques (saldo credor)
│   │
│   └─ 1.1.4 DESPESAS DO EXERCÍCIO SEGUINTE (ANTECIPADAS)
│       ├─ 1.1.4.01 Seguros Antecipados a Apropriar
│       ├─ 1.1.4.02 Aluguéis Antecipados a Apropriar
│       └─ 1.1.4.03 Assinaturas e Licenças Antecipadas
│
├─ 1.2 ATIVO NÃO CIRCULANTE
│   │
│   ├─ 1.2.1 REALIZÁVEL A LONGO PRAZO
│   │   ├─ 1.2.1.01 Depósitos Caução e Garantias
│   │   ├─ 1.2.1.02 Direitos Creditórios de Longo Prazo
│   │   └─ 1.2.1.03 Aplicações Financeiras de Longo Prazo
│   │
│   ├─ 1.2.2 INVESTIMENTOS
│   │   ├─ 1.2.2.01 Participações em Outras Entidades
│   │   └─ 1.2.2.02 Imóveis para Renda
│   │
│   ├─ 1.2.3 IMOBILIZADO
│   │   ├─ 1.2.3.01 Terrenos
│   │   │   └─ 1.2.3.01.001 Terreno [Endereço/Matrícula]
│   │   ├─ 1.2.3.02 Edificações
│   │   │   └─ 1.2.3.02.001 Edificação — Sede Social
│   │   │   └─ 1.2.3.02.002 Edificação — Unidade [Nome]
│   │   ├─ 1.2.3.03 Móveis e Utensílios
│   │   ├─ 1.2.3.04 Equipamentos de Informática
│   │   ├─ 1.2.3.05 Equipamentos e Máquinas
│   │   ├─ 1.2.3.06 Veículos
│   │   ├─ 1.2.3.07 Instalações
│   │   ├─ 1.2.3.08 Benfeitorias em Imóveis de Terceiros
│   │   └─ 1.2.3.09 Depreciação Acumulada (saldo credor)
│   │       └─ 1.2.3.09.001 Dep. Acum. — Edificações
│   │       └─ 1.2.3.09.002 Dep. Acum. — Móveis e Utensílios
│   │       └─ 1.2.3.09.003 Dep. Acum. — Equip. Informática
│   │       └─ 1.2.3.09.004 Dep. Acum. — Equipamentos e Máquinas
│   │       └─ 1.2.3.09.005 Dep. Acum. — Veículos
│   │       └─ 1.2.3.09.006 Dep. Acum. — Instalações
│   │
│   └─ 1.2.4 INTANGÍVEL
│       ├─ 1.2.4.01 Softwares e Licenças Perpétuas
│       ├─ 1.2.4.02 Marcas e Patentes
│       └─ 1.2.4.03 Amortização Acumulada (saldo credor)
```

---

### 18.3 Plano de Contas Completo — Grupo 2: PASSIVO

```
2 PASSIVO
│
├─ 2.1 PASSIVO CIRCULANTE
│   │
│   ├─ 2.1.1 OBRIGAÇÕES COM FORNECEDORES
│   │   ├─ 2.1.1.01 Fornecedores — Compras a Pagar
│   │   │   └─ 2.1.1.01.001 Fornecedores Nacionais
│   │   │   └─ 2.1.1.01.002 Fornecedores — Importações
│   │   └─ 2.1.1.02 Adiantamentos de Clientes / Associados
│   │
│   ├─ 2.1.2 OBRIGAÇÕES TRABALHISTAS E PREVIDENCIÁRIAS
│   │   ├─ 2.1.2.01 Salários e Ordenados a Pagar
│   │   ├─ 2.1.2.02 Férias a Pagar
│   │   ├─ 2.1.2.03 13º Salário a Pagar
│   │   ├─ 2.1.2.04 Provisão de Férias + Encargos
│   │   ├─ 2.1.2.05 Provisão de 13º Salário + Encargos
│   │   ├─ 2.1.2.06 FGTS a Recolher
│   │   ├─ 2.1.2.07 INSS a Recolher — Parte Empregado
│   │   ├─ 2.1.2.08 INSS a Recolher — Parte Empregador
│   │   ├─ 2.1.2.09 Imposto de Renda Retido na Fonte — Folha
│   │   └─ 2.1.2.10 Outros Encargos a Recolher (PIS s/ Folha, etc.)
│   │
│   ├─ 2.1.3 OBRIGAÇÕES FISCAIS E TRIBUTÁRIAS
│   │   ├─ 2.1.3.01 IRRF a Recolher — Serviços de Terceiros (PJ)
│   │   ├─ 2.1.3.02 IRRF a Recolher — Serviços de Terceiros (PF)
│   │   ├─ 2.1.3.03 ISS Retido a Recolher
│   │   ├─ 2.1.3.04 CSLL Retida a Recolher
│   │   ├─ 2.1.3.05 PIS Retido a Recolher (sobre pagamentos a PJ)
│   │   ├─ 2.1.3.06 COFINS Retida a Recolher
│   │   └─ 2.1.3.07 Simples Nacional a Recolher (se enquadrado)
│   │
│   ├─ 2.1.4 EMPRÉSTIMOS E FINANCIAMENTOS — CP
│   │   ├─ 2.1.4.01 Empréstimos Bancários — Curto Prazo
│   │   └─ 2.1.4.02 Financiamentos a Pagar — Parcelas CP
│   │
│   └─ 2.1.5 OUTRAS OBRIGAÇÕES — CP
│       ├─ 2.1.5.01 Aluguéis a Pagar
│       ├─ 2.1.5.02 Energia, Água e Telecomunicações a Pagar
│       ├─ 2.1.5.03 Receitas de Convênios — Apropriação Futura
│       │   (recursos recebidos antecipadamente, ainda não gastos)
│       ├─ 2.1.5.04 Recursos de Projetos a Aplicar
│       │   (saldo de convênios com destinação específica)
│       └─ 2.1.5.05 Outras Obrigações Diversas
│
├─ 2.2 PASSIVO NÃO CIRCULANTE
│   ├─ 2.2.1 EMPRÉSTIMOS E FINANCIAMENTOS — LP
│   │   ├─ 2.2.1.01 Empréstimos Bancários — Longo Prazo
│   │   └─ 2.2.1.02 Financiamentos a Pagar — Parcelas LP
│   └─ 2.2.2 OUTRAS OBRIGAÇÕES — LP
│       └─ 2.2.2.01 Depósitos Caução Recebidos
│
└─ 2.3 PATRIMÔNIO SOCIAL
    ├─ 2.3.1 PATRIMÔNIO SOCIAL — FUNDOS
    │   ├─ 2.3.1.01 Fundo Patrimonial (capital inicial e doações ao patrimônio)
    │   ├─ 2.3.1.02 Fundo de Reserva
    │   └─ 2.3.1.03 Fundo de Destinação Específica
    │       (recursos com restrição de uso — doações, subvenções vinculadas)
    │
    ├─ 2.3.2 SUPERÁVITS/DÉFICITS ACUMULADOS
    │   ├─ 2.3.2.01 Superávits Acumulados de Exercícios Anteriores
    │   └─ 2.3.2.02 Déficits Acumulados de Exercícios Anteriores
    │
    └─ 2.3.3 RESULTADO DO EXERCÍCIO (conta transitória)
        └─ 2.3.3.01 Superávit/Déficit do Exercício Atual
            (zerada no encerramento anual e transferida para 2.3.2)
```

---

### 18.4 Plano de Contas — Grupos 3 e 4: INGRESSOS (RECEITAS)

> **Importante:** Para associações, o termo correto é **"INGRESSOS"**, não receitas.
> Conforme a ITG 2002 (R1), os ingressos devem ser classificados por natureza.

```
3 INGRESSOS
│
├─ 3.1 INGRESSOS DAS ATIVIDADES PRÓPRIAS (ATIVIDADE-FIM)
│   ├─ 3.1.1 Contribuições de Associados
│   │   ├─ 3.1.1.01 Mensalidades de Associados — Adimplentes
│   │   ├─ 3.1.1.02 Anuidades de Associados
│   │   ├─ 3.1.1.03 Taxas de Inscrição / Admissão
│   │   └─ 3.1.1.04 Contribuições Extraordinárias
│   │
│   ├─ 3.1.2 Doações e Subvenções Recebidas
│   │   ├─ 3.1.2.01 Doações de Pessoas Físicas
│   │   ├─ 3.1.2.02 Doações de Pessoas Jurídicas
│   │   ├─ 3.1.2.03 Doações de Entidades Internacionais
│   │   ├─ 3.1.2.04 Subvenções Governamentais Federais
│   │   │   (conforme NBC TG 07 — reconhecer quando atendidas as condições)
│   │   ├─ 3.1.2.05 Subvenções Governamentais Estaduais
│   │   ├─ 3.1.2.06 Subvenções Governamentais Municipais
│   │   └─ 3.1.2.07 Patrocínios
│   │
│   ├─ 3.1.3 Ingressos de Convênios e Contratos
│   │   ├─ 3.1.3.01 Receitas de Convênios — Federais
│   │   ├─ 3.1.3.02 Receitas de Convênios — Estaduais
│   │   ├─ 3.1.3.03 Receitas de Convênios — Municipais
│   │   └─ 3.1.3.04 Receitas de Contratos de Gestão (OSS)
│   │
│   ├─ 3.1.4 Ingressos de Serviços e Eventos
│   │   ├─ 3.1.4.01 Receitas de Cursos e Capacitações
│   │   ├─ 3.1.4.02 Receitas de Eventos e Congressos
│   │   ├─ 3.1.4.03 Receitas de Publicações e Materiais
│   │   └─ 3.1.4.04 Receitas de Serviços Prestados (atividade estatutária)
│   │
│   └─ 3.1.5 Ingressos do Trabalho Voluntário (ITG 2002 R1, item 14)
│       └─ 3.1.5.01 Receitas de Trabalho Voluntário — Valor Justo
│           (contrapartida de 4.1.X.01 — Despesas de Trabalho Voluntário)
│
├─ 3.2 INGRESSOS DAS ATIVIDADES ADMINISTRATIVAS / AUXILIARES
│   ├─ 3.2.1 Receitas Financeiras
│   │   ├─ 3.2.1.01 Rendimentos de Aplicações Financeiras
│   │   ├─ 3.2.1.02 Juros Ativos — Recebidos de Associados
│   │   ├─ 3.2.1.03 Descontos Obtidos em Compras
│   │   └─ 3.2.1.04 Variação Cambial Ativa
│   │
│   ├─ 3.2.2 Receitas Patrimoniais
│   │   ├─ 3.2.2.01 Aluguéis Recebidos
│   │   └─ 3.2.2.02 Rendimentos de Imóveis
│   │
│   └─ 3.2.3 Receitas Diversas
│       ├─ 3.2.3.01 Recuperação de Despesas de Exercícios Anteriores
│       ├─ 3.2.3.02 Indenizações e Seguros Recebidos
│       └─ 3.2.3.03 Outros Ingressos Eventuais
│
└─ 3.3 DEDUÇÕES DOS INGRESSOS (saldo devedor — reduzem o total)
    ├─ 3.3.1.01 Devoluções de Mensalidades
    └─ 3.3.1.02 Cancelamentos Concedidos
```

---

### 18.5 Plano de Contas — Grupo 4: DESPESAS

```
4 DESPESAS
│
├─ 4.1 DESPESAS DAS ATIVIDADES PRÓPRIAS (ATIVIDADE-FIM / PROJETOS)
│   │   ← Estas contas devem ser replicadas por projeto/programa
│   │
│   ├─ 4.1.1 Despesas com Pessoal — Atividade-Fim
│   │   ├─ 4.1.1.01 Salários e Ordenados
│   │   ├─ 4.1.1.02 Encargos Sociais (FGTS, INSS patronal)
│   │   ├─ 4.1.1.03 13º Salário
│   │   ├─ 4.1.1.04 Férias
│   │   ├─ 4.1.1.05 Vale-Transporte
│   │   ├─ 4.1.1.06 Vale-Alimentação / Refeição
│   │   ├─ 4.1.1.07 Plano de Saúde e Assistência Médica
│   │   ├─ 4.1.1.08 Pró-Labore (dirigentes com contrato)
│   │   └─ 4.1.1.09 Trabalho Voluntário — Valor Justo (ITG 2002 R1)
│   │
│   ├─ 4.1.2 Despesas com Materiais — Atividade-Fim
│   │   ├─ 4.1.2.01 Materiais Consumidos — Projetos
│   │   ├─ 4.1.2.02 Itens Distribuídos a Beneficiários
│   │   └─ 4.1.2.03 Materiais de Apoio a Eventos
│   │
│   ├─ 4.1.3 Despesas com Serviços de Terceiros — Atividade-Fim
│   │   ├─ 4.1.3.01 Serviços Técnicos e Especializados (PJ)
│   │   ├─ 4.1.3.02 Honorários e Consultorias (PF)
│   │   ├─ 4.1.3.03 Transporte e Logística de Projetos
│   │   └─ 4.1.3.04 Contratações Diretas para Projetos
│   │
│   └─ 4.1.4 Despesas Diversas — Atividade-Fim
│       ├─ 4.1.4.01 Viagens e Hospedagens — Projetos
│       ├─ 4.1.4.02 Locação de Espaços e Equipamentos
│       ├─ 4.1.4.03 Comunicação e Divulgação
│       └─ 4.1.4.04 Despesas de Capacitação e Formação
│
├─ 4.2 DESPESAS ADMINISTRATIVAS (OVERHEAD)
│   ├─ 4.2.1 Despesas com Pessoal — Administrativo
│   │   (mesma estrutura de 4.1.1 — subcontas replicadas)
│   │
│   ├─ 4.2.2 Despesas Operacionais
│   │   ├─ 4.2.2.01 Aluguéis e Locações
│   │   ├─ 4.2.2.02 Energia Elétrica
│   │   ├─ 4.2.2.03 Água e Esgoto
│   │   ├─ 4.2.2.04 Telefonia e Internet
│   │   ├─ 4.2.2.05 Material de Escritório Consumido
│   │   ├─ 4.2.2.06 Material de Limpeza Consumido
│   │   ├─ 4.2.2.07 Correios e Malote
│   │   ├─ 4.2.2.08 Combustíveis e Lubrificantes
│   │   ├─ 4.2.2.09 Manutenção de Equipamentos
│   │   ├─ 4.2.2.10 Manutenção de Veículos
│   │   └─ 4.2.2.11 Manutenção de Imóveis
│   │
│   ├─ 4.2.3 Despesas com Serviços Profissionais
│   │   ├─ 4.2.3.01 Honorários Contábeis
│   │   ├─ 4.2.3.02 Honorários Jurídicos
│   │   ├─ 4.2.3.03 Auditoria Externa
│   │   ├─ 4.2.3.04 Serviços de TI e Sistemas
│   │   └─ 4.2.3.05 Outras Consultorias Administrativas
│   │
│   ├─ 4.2.4 Despesas Tributárias
│   │   ├─ 4.2.4.01 ISS s/ Serviços (se não imune)
│   │   ├─ 4.2.4.02 IPTU (se não imune)
│   │   ├─ 4.2.4.03 IOF — Operações Financeiras
│   │   └─ 4.2.4.04 Taxas e Emolumentos Diversos
│   │
│   └─ 4.2.5 Depreciações e Amortizações
│       ├─ 4.2.5.01 Depreciação — Edificações (taxa 4% a.a.)
│       ├─ 4.2.5.02 Depreciação — Móveis e Utensílios (10% a.a.)
│       ├─ 4.2.5.03 Depreciação — Equip. Informática (20% a.a.)
│       ├─ 4.2.5.04 Depreciação — Equipamentos e Máquinas (10% a.a.)
│       ├─ 4.2.5.05 Depreciação — Veículos (20% a.a.)
│       └─ 4.2.5.06 Amortização — Intangíveis
│
├─ 4.3 DESPESAS FINANCEIRAS
│   ├─ 4.3.1.01 Juros Passivos — Empréstimos e Financiamentos
│   ├─ 4.3.1.02 Tarifas e IOF Bancários
│   ├─ 4.3.1.03 Descontos Concedidos em Mensalidades
│   ├─ 4.3.1.04 Multas e Juros Pagos
│   └─ 4.3.1.05 Variação Cambial Passiva
│
└─ 4.4 OUTRAS DESPESAS
    ├─ 4.4.1.01 Perdas em Estoques
    ├─ 4.4.1.02 Perdas em Créditos Incobráveis (PDD)
    ├─ 4.4.1.03 Baixas de Ativo Imobilizado
    └─ 4.4.1.04 Despesas Eventuais Diversas
```

---

## PARTE 19 — LANÇAMENTOS CONTÁBEIS AUTOMÁTICOS (INTEGRAÇÕES)

Esta é a inteligência central do módulo. Cada evento nos outros módulos
deve gerar lançamentos contábeis automaticamente, sem intervenção manual.

### 19.1 Lançamentos Gerados pela Escrituração Fiscal (NF-e Confirmada)

```
EVENTO: NF-e de Compra Escriturada e Confirmada
════════════════════════════════════════════════

LANÇAMENTO 1 — Compra de Material de Consumo:
  D: 1.1.3.01.001 Estoque — Material de Escritório     R$ XXX,XX
  C: 2.1.1.01.001 Fornecedores — [Nome Emitente]        R$ XXX,XX
  Histórico: "Compra NF [série]-[número] | [Nome Emitente] | CNPJ [XX] | [Data]"

LANÇAMENTO 2 — Compra de Imobilizado:
  D: 1.2.3.04.001 Equip. Informática — [Descrição bem]  R$ XXX,XX
  C: 2.1.1.01.001 Fornecedores — [Nome Emitente]        R$ XXX,XX
  Histórico: "Aquisição NF [série]-[número] | [Bem] | [Emitente] | [Data]"

LANÇAMENTO 3 — Compra com Impostos Retidos (IRRF, PIS, COFINS retidos):
  D: 4.2.3.XX     Despesa com Serviços                  R$ XXX,XX (valor bruto)
  C: 2.1.3.01     IRRF a Recolher                       R$   X,XX
  C: 2.1.3.05     PIS Retido a Recolher                 R$   X,XX
  C: 2.1.3.06     COFINS Retida a Recolher               R$   X,XX
  C: 2.1.1.01.001 Fornecedores                          R$ XXX,XX (valor líquido)

LANÇAMENTO 4 — Rateio de Frete sobre Compras:
  D: 1.1.3.XX     Estoque (contas dos itens, proporcional) R$ X,XX
  C: 2.1.1.01.001 Fornecedores (já incluso no total da NF)
  Histórico: "Rateio de frete NF [número] — CPC 16"
```

### 19.2 Lançamentos Gerados pelo Módulo Financeiro

```
EVENTO: Pagamento de Fornecedor Confirmado
═══════════════════════════════════════════
  D: 2.1.1.01.001 Fornecedores — [Nome]                 R$ XXX,XX
  C: 1.1.1.02.001 Banco [Nome] C/C [XXXXX]              R$ XXX,XX
  Histórico: "Pgto NF [número] | [Fornecedor] | [Banco] Ag. [X] | [Data]"

EVENTO: Recebimento de Mensalidade de Associado
════════════════════════════════════════════════
  D: 1.1.1.02.001 Banco [Nome]                          R$ XXX,XX
  C: 1.1.2.01.001 Mensalidades a Receber               R$ XXX,XX
  C: 3.1.1.01     Mensalidades de Associados (se à vista) R$ XXX,XX
  Histórico: "Receb. mensalidade | Assoc. [Nome] | Ref. [Mês/Ano] | [Data]"

EVENTO: Recebimento de Convênio/Subvenção
═══════════════════════════════════════════
  D: 1.1.1.02.001 Banco [Nome]                          R$ XXX,XX
  C: 2.1.5.04     Recursos de Projetos a Aplicar        R$ XXX,XX
  Histórico: "Receb. convênio [Número] | [Órgão] | [Projeto] | [Data]"
  → Ao aplicar o recurso: D: 2.1.5.04 → C: 3.1.3.01 (reconhecimento da receita)

EVENTO: Pagamento de Despesas (contas a pagar diversas)
════════════════════════════════════════════════════════
  D: 4.2.2.01     Despesa [Natureza]                    R$ XXX,XX
  C: 1.1.1.02.001 Banco [Nome]                          R$ XXX,XX
  Histórico: "Pgto [Tipo despesa] | [Fornecedor/Beneficiário] | [Período] | [Data]"
```

### 19.3 Lançamentos Gerados pelo Módulo de Estoque

```
EVENTO: Baixa de Consumo Interno Confirmada
════════════════════════════════════════════
  D: 4.2.2.05     Material de Escritório Consumido       R$ XXX,XX
  C: 1.1.3.01.001 Estoque — Material de Escritório       R$ XXX,XX
  Histórico: "Baixa consumo REQ-[Número] | [Setor] | [Data] | CMP R$X,XX"

EVENTO: Distribuição a Beneficiários Confirmada
════════════════════════════════════════════════
  D: 4.1.2.02     Itens Distribuídos a Beneficiários     R$ XXX,XX
  C: 1.1.3.02.001 Estoque — Itens para Distribuição      R$ XXX,XX
  Histórico: "Distribuição [Projeto] | [Qtd] itens | [Beneficiário] | [Data]"

EVENTO: Devolução a Fornecedor Confirmada
══════════════════════════════════════════
  D: 2.1.1.01.001 Fornecedores                           R$ XXX,XX
  C: 1.1.3.XX     Estoque                                R$ XXX,XX
  Histórico: "Devolução NF [número] | [Fornecedor] | [Motivo] | [Data]"
```

### 19.4 Lançamentos Periódicos Automáticos (Mensais)

```
EVENTO: Cálculo Mensal de Depreciação (automático, todo dia 1 do mês seguinte)
═════════════════════════════════════════════════════════════════════════════════
  Para cada bem no imobilizado:
  D: 4.2.5.0X     Depreciação — [Tipo de Bem]            R$ X,XX
  C: 1.2.3.09.0X  Depreciação Acumulada — [Tipo de Bem]  R$ X,XX
  Histórico: "Depreciação [Bem] | [Mês/Ano] | Taxa [X%a.a.] | CPC 27"

EVENTO: Apropriação Mensal de Seguros e Despesas Antecipadas
══════════════════════════════════════════════════════════════
  D: 4.2.X.X      Despesa [Seguro / Aluguel / etc.]      R$ X,XX
  C: 1.1.4.0X     Despesas Antecipadas a Apropriar       R$ X,XX
  Histórico: "Apropriação competência [Mês/Ano] | [Apólice/Contrato]"

EVENTO: Provisão de Férias e 13º (mensal — 1/12 do valor estimado)
════════════════════════════════════════════════════════════════════
  D: 4.1.1.04     Férias                                 R$ X,XX
  D: 4.1.1.03     13º Salário                             R$ X,XX
  C: 2.1.2.04     Provisão de Férias + Encargos           R$ X,XX
  C: 2.1.2.05     Provisão de 13º Salário + Encargos      R$ X,XX

EVENTO: Encerramento do Exercício (31/12)
══════════════════════════════════════════
  1. Transferir saldo de todas as contas de INGRESSOS (3.X) → 2.3.3.01
  2. Transferir saldo de todas as contas de DESPESAS (4.X) → 2.3.3.01
  3. Apurar Superávit ou Déficit em 2.3.3.01
  4. Transferir 2.3.3.01 → 2.3.2.01 (Superávits Acumulados) ou 2.3.2.02 (Déficits)
```

---

## PARTE 20 — LIVRO DIÁRIO (ESCRITURAÇÃO)

### 20.1 Interface de Lançamentos Manuais

Além dos lançamentos automáticos, o módulo deve oferecer uma **tela de lançamento
manual** para o contador realizar ajustes, provisões e lançamentos não cobertos
pelas automações:

```
┌─────────────────────────────────────────────────────────────────────┐
│ NOVO LANÇAMENTO CONTÁBIL                                             │
├─────────────────────────────────────────────────────────────────────┤
│ Data:       [__/__/____]    Nº Lançamento: LCT-2025-0001 (auto)     │
│ Competência:[__/__/____]    Tipo: ● Normal ○ Estorno ○ Provisão     │
│                                                                       │
│ PARTIDAS:                                                             │
│ ┌────────┬─────────────────────────────────┬─────────┬──────────┐   │
│ │ D/C    │ Conta Contábil                   │ Valor   │ Centro   │   │
│ ├────────┼─────────────────────────────────┼─────────┼──────────┤   │
│ │ DÉBITO │ [4.2.2.02 — Energia Elétrica]   │ 850,00  │ [Admin]  │   │
│ │ CRÉDITO│ [1.1.1.02.001 — Banco Bradesco]  │ 850,00  │ —        │   │
│ └────────┴─────────────────────────────────┴─────────┴──────────┘   │
│ [+ Adicionar Partida]                                                 │
│                                                                       │
│ Histórico: [___________________________________________________]     │
│ Documento: [_____________]  Projeto: [___________]                   │
│                                                                       │
│ ✅ Débitos: R$ 850,00 = Créditos: R$ 850,00 — Lançamento BALANCEADO │
│ [Salvar Rascunho]  [Confirmar Lançamento]                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Regras de validação obrigatórias:**
- Débitos ≠ Créditos → bloquear confirmação com alerta
- Lançamento em conta sintética → bloquear com alerta
- Período já fechado → bloquear com alerta (exige reabertura)
- Lançamento sem histórico → alertar (pode bloquear ou apenas avisar, configurável)
- Lançamento em data futura → alertar

### 20.2 Estorno de Lançamentos

- Ao estornar um lançamento, criar automaticamente o lançamento inverso
- Manter referência cruzada entre o lançamento original e o estorno
- Nunca excluir um lançamento confirmado — apenas estornar
- Registrar no log de auditoria: quem estornou, quando, motivo

---

## PARTE 21 — DEMONSTRAÇÕES CONTÁBEIS

### 21.1 Balancete de Verificação

O balancete deve ser gerado para qualquer período (diário, mensal, acumulado),
com as seguintes colunas e opções:

```
BALANCETE DE VERIFICAÇÃO — [NOME DA ASSOCIAÇÃO]
CNPJ: XX.XXX.XXX/XXXX-XX | Período: [01/01/YYYY a 31/01/YYYY]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Código │ Conta                           │ Saldo Ant. │ Débitos  │ Créditos │ Saldo Atual
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1      │ ATIVO                           │ 500.000,00 │...       │...       │ 520.000,00
1.1    │ ATIVO CIRCULANTE                │ 150.000,00 │...       │...       │ 165.000,00
1.1.1  │ DISPONIBILIDADES                │  80.000,00 │...       │...       │  85.000,00
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAIS │                                 │ X.XXX.XX   │X.XXX.XX  │X.XXX.XX  │ X.XXX.XX
(Total Débitos DEVE = Total Créditos — se diferente: ERRO CRÍTICO)
```

**Opções de geração:**
- Nível de detalhe: Sintético (grupos) / Analítico (todas as contas) / Por nível (1 a 7)
- Filtro por centro de custo
- Filtro por projeto
- Incluir/excluir contas zeradas
- Formato de exportação: PDF, Excel, CSV

### 21.2 Balanço Patrimonial (BP)

Estrutura conforme **NBC TG 26 e ITG 2002 (R1)**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[NOME DA ASSOCIAÇÃO]
BALANÇO PATRIMONIAL — Em 31 de dezembro de [AAAA]
(Em Reais)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATIVO                               [Ano X]      [Ano X-1]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ATIVO CIRCULANTE
  Disponibilidades                  XXX.XXX      XXX.XXX
    Caixa e Equivalentes de Caixa   XXX.XXX      XXX.XXX
    Aplicações Financeiras          XXX.XXX      XXX.XXX
  Créditos e Direitos a Receber     XXX.XXX      XXX.XXX
    Mensalidades a Receber          XXX.XXX      XXX.XXX
    Convênios a Receber             XXX.XXX      XXX.XXX
  Estoques                          XXX.XXX      XXX.XXX
  Despesas Antecipadas              XXX.XXX      XXX.XXX
TOTAL DO ATIVO CIRCULANTE         X.XXX.XXX    X.XXX.XXX

ATIVO NÃO CIRCULANTE
  Realizável a Longo Prazo           XX.XXX       XX.XXX
  Imobilizado                       XXX.XXX      XXX.XXX
    (–) Depreciação Acumulada       (XX.XXX)     (XX.XXX)
  Intangível                         XX.XXX       XX.XXX
TOTAL DO ATIVO NÃO CIRCULANTE       XXX.XXX      XXX.XXX

TOTAL DO ATIVO                    X.XXX.XXX    X.XXX.XXX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASSIVO E PATRIMÔNIO SOCIAL         [Ano X]      [Ano X-1]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSIVO CIRCULANTE
  Fornecedores                       XX.XXX       XX.XXX
  Obrigações Trabalhistas            XX.XXX       XX.XXX
  Obrigações Fiscais e Tributárias    X.XXX        X.XXX
  Recursos de Projetos a Aplicar     XX.XXX       XX.XXX
  Outras Obrigações                   X.XXX        X.XXX
TOTAL DO PASSIVO CIRCULANTE          XX.XXX       XX.XXX

PASSIVO NÃO CIRCULANTE
  Empréstimos e Financiamentos       XX.XXX       XX.XXX
TOTAL DO PASSIVO NÃO CIRC.           XX.XXX       XX.XXX

PATRIMÔNIO SOCIAL
  Fundo Patrimonial                 XXX.XXX      XXX.XXX
  Fundo de Reserva                   XX.XXX       XX.XXX
  Superávits/Déficits Acumulados     XX.XXX       XX.XXX
  Superávit/Déficit do Exercício     XX.XXX       XX.XXX
TOTAL DO PATRIMÔNIO SOCIAL         XXX.XXX      XXX.XXX

TOTAL PASSIVO + PATRIMÔNIO SOCIAL X.XXX.XXX    X.XXX.XXX
(Deve ser idêntico ao TOTAL DO ATIVO — se não: ERRO CRÍTICO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As notas explicativas são parte integrante destas demonstrações contábeis.
```

### 21.3 DSD — Demonstração do Superávit ou Déficit do Exercício

> ⚠️ **Nunca chamar de "DRE"** no contexto de associações.
> O nome correto conforme a ITG 2002 (R1) é **Demonstração do Superávit ou
> Déficit do Exercício** — abreviada como **DSD**.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[NOME DA ASSOCIAÇÃO]
DEMONSTRAÇÃO DO SUPERÁVIT OU DÉFICIT DO EXERCÍCIO
Exercícios findos em 31 de dezembro de [AAAA] e [AAAA-1]
(Em Reais)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                                          [Ano X]    [Ano X-1]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INGRESSOS DAS ATIVIDADES PRÓPRIAS
  Contribuições de Associados            XXX.XXX    XXX.XXX
  Doações e Subvenções Recebidas         XXX.XXX    XXX.XXX
  Ingressos de Convênios                 XXX.XXX    XXX.XXX
  Ingressos de Serviços e Eventos         XX.XXX     XX.XXX
  Trabalho Voluntário (ITG 2002 R1)       XX.XXX     XX.XXX
  (–) Deduções de Ingressos              (X.XXX)    (X.XXX)
TOTAL DE INGRESSOS DAS ATIV. PRÓPRIAS  X.XXX.XXX  X.XXX.XXX

DESPESAS DAS ATIVIDADES PRÓPRIAS
  Despesas com Pessoal                  (XXX.XXX)  (XXX.XXX)
    incl. Trabalho Voluntário           (XX.XXX)   (XX.XXX)
  Despesas com Materiais                (XXX.XXX)  (XXX.XXX)
  Distribuição a Beneficiários          (XXX.XXX)  (XXX.XXX)
  Serviços de Terceiros                  (XX.XXX)   (XX.XXX)
  Outras Despesas das Ativ. Próprias     (XX.XXX)   (XX.XXX)
TOTAL DESPESAS DAS ATIV. PRÓPRIAS    (X.XXX.XXX)(X.XXX.XXX)

SUPERÁVIT/(DÉFICIT) DAS ATIVIDADES
PRÓPRIAS                               ±XXX.XXX   ±XXX.XXX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INGRESSOS ADMINISTRATIVOS E FINANCEIROS
  Receitas Financeiras                   XX.XXX     XX.XXX
  Receitas Patrimoniais (Aluguéis)        X.XXX      X.XXX
  Outras Receitas Diversas               X.XXX      X.XXX
TOTAL INGRESSOS ADMIN./FINANCEIROS       XX.XXX     XX.XXX

DESPESAS ADMINISTRATIVAS
  Pessoal Administrativo                (XX.XXX)   (XX.XXX)
  Despesas Operacionais                 (XX.XXX)   (XX.XXX)
  Serviços Profissionais                 (X.XXX)    (X.XXX)
  Depreciações e Amortizações            (X.XXX)    (X.XXX)
  Despesas Tributárias                   (X.XXX)    (X.XXX)
TOTAL DESPESAS ADMINISTRATIVAS         (XX.XXX)   (XX.XXX)

DESPESAS FINANCEIRAS                    (X.XXX)    (X.XXX)

SUPERÁVIT/(DÉFICIT) DO EXERCÍCIO       ±XXX.XXX   ±XXX.XXX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 21.4 DMPS — Demonstração das Mutações do Patrimônio Social

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEMONSTRAÇÃO DAS MUTAÇÕES DO PATRIMÔNIO SOCIAL — [AAAA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        Fundo    Fundo    Superávit/   Total
                       Patrim.  Reserva  Déf. Acum.   Patr.Soc.
─────────────────────────────────────────────────────────────────
Saldo em 31/12/Ano X-1  XXX.XXX  XX.XXX   XX.XXX       X.XXX.XXX
Superávit do Exercício       —       —    XXX.XXX         XXX.XXX
Destinação ao Fundo Res.     —   X.XXX    (X.XXX)              —
Outras variações            —       —         —               —
Saldo em 31/12/Ano X    XXX.XXX  XX.XXX   XX.XXX       X.XXX.XXX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 21.5 DFC — Demonstração dos Fluxos de Caixa (Método Direto)

Conforme **NBC TG 03 / CPC 03**, as associações devem apresentar a DFC pelo
**método direto** (recomendado pela ITG 2002 R1 para facilitar a transparência):

```
DEMONSTRAÇÃO DOS FLUXOS DE CAIXA — [AAAA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ATIVIDADES OPERACIONAIS
  Recebimentos de associados (mensalidades)     XXX.XXX
  Recebimentos de convênios e subvenções        XXX.XXX
  Recebimentos de doações                        XX.XXX
  Pagamentos a fornecedores                    (XXX.XXX)
  Pagamentos a empregados                      (XXX.XXX)
  Pagamentos de encargos e obrigações            (X.XXX)
  Outros recebimentos operacionais               XX.XXX
  Outros pagamentos operacionais                (XX.XXX)
CAIXA LÍQUIDO DAS ATIV. OPERACIONAIS          ±XXX.XXX

ATIVIDADES DE INVESTIMENTO
  Aquisição de imobilizado                      (XX.XXX)
  Aplicações financeiras (líquido)              (XX.XXX)
  Vendas de ativo imobilizado                     X.XXX
CAIXA LÍQUIDO DAS ATIV. DE INVESTIMENTO       ±XX.XXX

ATIVIDADES DE FINANCIAMENTO
  Empréstimos recebidos                          XX.XXX
  Pagamentos de empréstimos                     (XX.XXX)
CAIXA LÍQUIDO DAS ATIV. DE FINANCIAMENTO      ±XX.XXX

VARIAÇÃO LÍQUIDA DO CAIXA                     ±XXX.XXX
CAIXA INICIAL                                  XXX.XXX
CAIXA FINAL                                    XXX.XXX
```

> A DFC deve ser gerada **automaticamente** a partir dos lançamentos de
> movimentação em contas de disponibilidades (1.1.1.X), classificando cada
> lançamento por natureza de atividade conforme tabela de-para configurável.

---

## PARTE 22 — DEMONSTRAÇÃO POR PROJETO (ESPECÍFICA PARA ASSOCIAÇÕES)

Esta demonstração não é exigida pelas normas contábeis gerais, mas é
**obrigatória na prática** para associações que recebem recursos de convênios,
pois é exigida pelos **financiadores** e pelo **Marco Regulatório das OSC
(Lei nº 13.019/2014)**:

```
DEMONSTRAÇÃO DE EXECUÇÃO FÍSICO-FINANCEIRA
Projeto: [Nome do Projeto] | Convênio: [Número]
Período: [DD/MM/AAAA a DD/MM/AAAA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rubrica             Aprovado     Executado   Saldo     %Exec.
─────────────────────────────────────────────────────────
Pessoal             XX.XXX       XX.XXX      X.XXX      85%
Materiais           XX.XXX       XX.XXX      X.XXX      92%
Serviços            XX.XXX       XX.XXX      X.XXX      70%
Diárias e Viagens    X.XXX        X.XXX        XXX      60%
─────────────────────────────────────────────────────────
TOTAL              XXX.XXX      XXX.XXX     XX.XXX      82%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPROVANTES VINCULADOS: [Link para NF-e, folhas de pagamento, etc.]
```

---

## PARTE 23 — GERAÇÃO DO ARQUIVO ECD (SPED CONTÁBIL)

### 23.1 Obrigatoriedade para Associações

Conforme o **Art. 3º da IN RFB nº 2.003/2021**, a associação é obrigada a
entregar a ECD quando seus **ingressos totais** (receitas, doações, convênios,
subvenções, auxílios) **superarem R$ 4.800.000,00** no ano-calendário. O sistema
deve monitorar e alertar quando o acumulado se aproximar deste limite.

**Prazo de entrega:** último dia útil de **junho** do ano seguinte.

### 23.2 Registros do Arquivo ECD

```
BLOCO 0: Abertura e Identificação
  0000 — Abertura do arquivo
  0001 — Abertura do bloco 0
  0007 — Informações dos auditores independentes (se houver)
  0020 — Identificação da entidade empresarial
  0150 — Tabela de cadastro do participante
  0990 — Encerramento do bloco 0

BLOCO I: Lançamentos Contábeis (Livro Diário)
  I001 — Abertura do bloco I
  I010 — Identificação do livro
  I012 — Livros auxiliares e registros de inventário
  I015 — Identificação dos períodos e saldos iniciais
  I020 — Identificação das contas do plano de contas
  I050 — Plano de contas
  I051 — Plano de contas referencial da Receita Federal
  I052 — Relação de contas analíticas X contas de referência
  I075 — Tabela de histórico padronizado
  I100 — Centro de custos
  I150 — Saldos das contas contábeis por período
  I155 — Detalhamento de saldos (por conta analítica)
  I200 — Lançamentos contábeis
  I250 — Partidas dos lançamentos
  I350 — Informações das contas patrimoniais e de resultado
  I500 — Identificação de documento hábil (quando exigido)
  I510 — Detalhamento do documento hábil
  I550 — Resumo diário de lançamentos por conta
  I555 — Detalhe dos documentos das contas de resultado
  I990 — Encerramento do bloco I

BLOCO J: Demonstrações Contábeis
  J001 — Abertura do bloco J
  J005 — Identificação da demonstração e período
  J100 — Plano de contas do balanço patrimonial (BP)
  J150 — Plano de contas da DSD (Demonstração Superávit/Déficit)
  J210 — Plano de contas da DMPS
  J800 — Outras informações
  J801 — Detalhamento de outras informações
  J930 — Identificação e assinatura dos signatários
  J990 — Encerramento do bloco J

BLOCO K: Conglomerados (se aplicável)
BLOCO 9: Controle e Encerramento
  9001, 9900, 9990, 9999
```

### 23.3 Vinculação ao Plano de Contas Referencial da RFB

O sistema deve manter a **tabela de contas referenciais** da Receita Federal e
permitir que o contador faça o DE-PARA entre o plano de contas da associação e
o plano referencial, conforme exigido no registro **I052** da ECD.

O plano referencial vigente está disponível no portal SPED:
`http://sped.rfb.gov.br/pasta/show/1569`

---

## PARTE 24 — SCHEMA DO BANCO DE DADOS CONTÁBIL

```sql
-- Plano de Contas
CREATE TABLE plano_contas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID NOT NULL REFERENCES empresas(id),
  codigo                VARCHAR(30) NOT NULL,
  codigo_reduzido       VARCHAR(10),
  descricao             VARCHAR(120) NOT NULL,
  nivel                 INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 7),
  conta_pai_id          UUID REFERENCES plano_contas(id),
  tipo                  VARCHAR(12) NOT NULL,
  -- sintetica | analitica
  natureza              VARCHAR(10) NOT NULL,
  -- devedora | credora
  classificacao         VARCHAR(20) NOT NULL,
  -- ativo | passivo | patrimonio_social | ingresso | despesa
  grupo_bp              VARCHAR(20),
  -- ativo_circulante | ativo_nao_circulante |
  -- passivo_circulante | passivo_nao_circulante | patrimonio_social
  grupo_dsd             VARCHAR(30),
  -- ingresso_atividade_propria | despesa_atividade_propria |
  -- ingresso_financeiro | despesa_administrativa | despesa_financeira
  codigo_referencial_rfb VARCHAR(30),
  -- código do plano referencial da Receita Federal para ECD
  aceita_lancamentos    BOOLEAN DEFAULT TRUE,
  -- FALSE para contas sintéticas
  ativa                 BOOLEAN DEFAULT TRUE,
  UNIQUE(empresa_id, codigo)
);

-- Centros de Custo e Projetos
CREATE TABLE centros_custo (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id),
  codigo      VARCHAR(20) NOT NULL,
  descricao   VARCHAR(80) NOT NULL,
  tipo        VARCHAR(20) DEFAULT 'administrativo',
  -- atividade_fim | administrativo | projeto | evento
  projeto_id  UUID REFERENCES projetos(id),
  ativo       BOOLEAN DEFAULT TRUE,
  UNIQUE(empresa_id, codigo)
);

-- Projetos e Convênios
CREATE TABLE projetos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id         UUID NOT NULL REFERENCES empresas(id),
  codigo             VARCHAR(20) NOT NULL,
  nome               VARCHAR(120) NOT NULL,
  tipo               VARCHAR(20),
  -- convenio_federal | convenio_estadual | convenio_municipal |
  -- patrocinio | projeto_proprio | contrato_gestao
  numero_convenio    VARCHAR(60),
  orgao_financiador  VARCHAR(120),
  cnpj_financiador   VARCHAR(14),
  data_inicio        DATE,
  data_termino       DATE,
  valor_total_aprovado NUMERIC(15,2),
  status             VARCHAR(20) DEFAULT 'ativo',
  -- ativo | encerrado | suspenso | em_prestacao_contas
  conta_contabil_receita_id UUID REFERENCES plano_contas(id),
  conta_contabil_despesa_id UUID REFERENCES plano_contas(id),
  observacoes        TEXT
);

-- Períodos Contábeis
CREATE TABLE periodos_contabeis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id),
  competencia     DATE NOT NULL,
  tipo            VARCHAR(10) NOT NULL DEFAULT 'mensal',
  -- mensal | trimestral | anual
  status          VARCHAR(20) DEFAULT 'aberto',
  -- aberto | em_escrituracao | fechado | ecd_transmitida
  data_fechamento TIMESTAMPTZ,
  usuario_fechou  UUID REFERENCES usuarios(id),
  UNIQUE(empresa_id, competencia)
);

-- Lançamentos Contábeis (Livro Diário)
CREATE TABLE lancamentos_contabeis (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id),
  numero_lancamento VARCHAR(20) UNIQUE NOT NULL,  -- LCT-AAAA-NNNNN
  data_lancamento   DATE NOT NULL,
  data_competencia  DATE NOT NULL,
  tipo              VARCHAR(20) DEFAULT 'normal',
  -- normal | estorno | provisao | encerramento | ajuste | abertura
  historico         VARCHAR(255) NOT NULL,
  documento_tipo    VARCHAR(20),
  -- nfe | boleto | recibo | contrato | folha | manual | etc.
  documento_numero  VARCHAR(60),
  -- origem para rastreabilidade bidirecional
  origem_tipo       VARCHAR(30),
  -- nfe_entrada | pagamento | recebimento | folha | baixa_estoque |
  -- depreciacao | provisao | encerramento | manual
  origem_id         UUID,
  -- id do registro de origem (nfe_entradas.id, pagamentos.id, etc.)
  projeto_id        UUID REFERENCES projetos(id),
  status            VARCHAR(20) DEFAULT 'confirmado',
  -- rascunho | confirmado | estornado
  estorno_do_id     UUID REFERENCES lancamentos_contabeis(id),
  usuario_id        UUID REFERENCES usuarios(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Partidas dos Lançamentos (linhas débito/crédito)
CREATE TABLE lancamentos_partidas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id     UUID NOT NULL REFERENCES lancamentos_contabeis(id)
                    ON DELETE CASCADE,
  conta_id          UUID NOT NULL REFERENCES plano_contas(id),
  tipo_partida      CHAR(1) NOT NULL CHECK (tipo_partida IN ('D','C')),
  -- D = Débito, C = Crédito
  valor             NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  centro_custo_id   UUID REFERENCES centros_custo(id),
  historico_partida VARCHAR(255),
  ordem             INTEGER NOT NULL  -- ordem dentro do lançamento
);

-- Constraint: soma débitos = soma créditos por lançamento
-- Implementar via trigger ou validação na camada de aplicação

-- Saldos Mensais (cache para performance)
CREATE TABLE saldos_contas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id),
  conta_id        UUID NOT NULL REFERENCES plano_contas(id),
  competencia     DATE NOT NULL,
  saldo_anterior  NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_debitos   NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_creditos  NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_atual     NUMERIC(15,2)
    GENERATED ALWAYS AS (
      CASE WHEN (SELECT natureza FROM plano_contas pc
                 WHERE pc.id = conta_id) = 'devedora'
           THEN saldo_anterior + total_debitos - total_creditos
           ELSE saldo_anterior + total_creditos - total_debitos
      END
    ) STORED,
  UNIQUE(empresa_id, conta_id, competencia)
);

-- Regras de Lançamentos Automáticos (configurável pelo contador)
CREATE TABLE regras_lancamento_automatico (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID NOT NULL REFERENCES empresas(id),
  nome                  VARCHAR(80) NOT NULL,
  evento_gatilho        VARCHAR(50) NOT NULL,
  -- nfe_confirmada_consumo | nfe_confirmada_imobilizado |
  -- pagamento_fornecedor | recebimento_mensalidade |
  -- baixa_estoque | depreciacao_mensal | etc.
  condicao_json         JSONB,
  -- condições adicionais: tipo_produto, destinacao, etc.
  conta_debito_id       UUID REFERENCES plano_contas(id),
  conta_credito_id      UUID REFERENCES plano_contas(id),
  historico_padrao      VARCHAR(255),
  ativa                 BOOLEAN DEFAULT TRUE
);
```

---

## PARTE 25 — APIS ADICIONAIS (CONTÁBIL)

```
PLANO DE CONTAS:
GET    /api/contabil/plano-contas              — Listar contas com filtros e hierarquia
POST   /api/contabil/plano-contas              — Criar nova conta
PUT    /api/contabil/plano-contas/:id          — Editar conta
DELETE /api/contabil/plano-contas/:id          — Desativar conta (nunca excluir se tiver saldo)

LANÇAMENTOS:
GET    /api/contabil/lancamentos               — Listar com filtros (data, conta, projeto, tipo)
POST   /api/contabil/lancamentos               — Criar lançamento manual
GET    /api/contabil/lancamentos/:id           — Detalhar lançamento com partidas
POST   /api/contabil/lancamentos/:id/estornar  — Estornar lançamento

PERÍODOS:
GET    /api/contabil/periodos                  — Listar períodos e status
POST   /api/contabil/periodos/:id/fechar       — Fechar período contábil
POST   /api/contabil/periodos/:id/reabrir      — Reabrir (com justificativa e log)
POST   /api/contabil/periodos/encerrar-exercicio — Encerramento anual (lançamentos automáticos)

DEMONSTRAÇÕES:
GET    /api/contabil/balancete                 — Gerar balancete (params: período, nível, centro_custo)
GET    /api/contabil/balanco-patrimonial       — Gerar BP (params: data_base, comparativo)
GET    /api/contabil/dsd                       — Gerar DSD (params: período, comparativo)
GET    /api/contabil/dmps                      — Gerar DMPS (params: ano)
GET    /api/contabil/dfc                       — Gerar DFC método direto (params: período)
GET    /api/contabil/por-projeto/:projeto_id   — Demonstração financeira por projeto

RAZÃO E LIVRO DIÁRIO:
GET    /api/contabil/razao/:conta_id           — Razão analítico da conta (params: período)
GET    /api/contabil/diario                    — Livro diário (params: período)

ECD:
POST   /api/contabil/ecd/gerar                 — Gerar arquivo ECD para o exercício
GET    /api/contabil/ecd/validar               — Validar consistências antes da geração
GET    /api/contabil/ecd/status                — Status da última geração/transmissão
```

---

## PARTE 26 — INTELIGÊNCIA E AUTOMAÇÕES DO MÓDULO CONTÁBIL

### 26.1 Assistente de Lançamentos (Sugestão por IA)

O módulo deve implementar um motor de sugestão de contas:

- Ao digitar o histórico do lançamento, sugerir as contas de débito e crédito
  com base em lançamentos semelhantes já realizados (busca por similaridade de texto)
- Aprender com as confirmações do contador, aumentando a confiança das sugestões
- Para lançamentos recorrentes (mensalidades, aluguel, folha), criar
  **lançamentos modelo** que podem ser executados com um clique

### 26.2 Alertas e Indicadores Automáticos

O sistema deve gerar alertas proativos:

```
🔴 CRÍTICO — Desbalanceamento detectado: total débitos ≠ total créditos no período
🔴 CRÍTICO — Conta do Ativo com saldo credor anormal (exceto depreciações)
🔴 CRÍTICO — Conta do Passivo com saldo devedor anormal
⚠️ ATENÇÃO  — Ingressos acumulados R$ X.XXX.XXX — Limite ECD: R$ 4.800.000
⚠️ ATENÇÃO  — Saldo negativo em Disponibilidades (Caixa/Banco)
⚠️ ATENÇÃO  — Período anterior com lançamentos pendentes de confirmação
⚠️ ATENÇÃO  — Depreciação não lançada para o mês [Mês/Ano]
⚠️ ATENÇÃO  — Projeto [Nome] com 90% do orçamento executado
🔵 INFO     — Provisão de férias e 13º calculada — aguarda lançamento
🔵 INFO     — Vencimento da ECD: [Data] — [X] dias restantes
```

### 26.3 Dashboard Contábil

```
┌────────────────────────────────────────────────────────────────┐
│ PAINEL CONTÁBIL — [Nome Associação] | [Mês/Ano]                │
├──────────────────┬─────────────────┬──────────────────────────┤
│ TOTAL INGRESSOS  │ TOTAL DESPESAS  │ SUPERÁVIT/(DÉFICIT)       │
│ R$ X.XXX.XXX     │ R$ X.XXX.XXX    │ R$ ±XXX.XXX              │
│ vs mês ant: ▲15% │ vs mês ant: ▼3% │ Acumulado ano: R$ XXX.XXX │
├──────────────────┴─────────────────┴──────────────────────────┤
│ POSIÇÃO PATRIMONIAL                                            │
│ Ativo Total: R$ X.XXX.XXX | Passivo: R$ XXX.XXX               │
│ Patrimônio Social: R$ X.XXX.XXX                               │
├────────────────────────────────────────────────────────────────┤
│ DISPONIBILIDADES                                               │
│ Caixa: R$ X.XXX | Bancos: R$ XXX.XXX | Aplicações: R$ XXX.XXX │
│ Total: R$ XXX.XXX                                              │
├────────────────────────────────────────────────────────────────┤
│ LANÇAMENTOS DO MÊS        │ PROJETOS EM EXECUÇÃO              │
│ Automáticos: 145          │ Projeto A: 82% executado          │
│ Manuais: 12               │ Projeto B: 45% executado          │
│ Pendentes: 3 ⚠️            │ Projeto C: 100% ✅ encerrado     │
└────────────────────────────────────────────────────────────────┘
```

---

## PARTE 27 — DIAGRAMA DE INTEGRAÇÃO COMPLETO DO SISTEMA

```
╔═══════════════════════════════════════════════════════════════════╗
║              NÚCLEO CONTÁBIL (MÓDULO CONTÁBIL)                    ║
║                                                                   ║
║  Plano de Contas  │  Livro Diário  │  Balancetes  │  ECD          ║
║  DSD (Superávit)  │  DMPS          │  DFC          │  Razão        ║
╚═════════════════════════════╦═════════════════════════════════════╝
                              ║ RECEBE LANÇAMENTOS AUTOMÁTICOS DE:
         ┌────────────────────╬────────────────────────────────┐
         │                    │                                │
         ▼                    ▼                                ▼
╔════════════════╗  ╔════════════════════╗  ╔════════════════════════╗
║ MÓDULO FISCAL  ║  ║ MÓDULO FINANCEIRO  ║  ║  MÓDULO ESTOQUE        ║
║                ║  ║                   ║  ║                        ║
║ NF-e de compra ║  ║ Pagamentos         ║  ║ Baixa de consumo       ║
║ ↓              ║  ║ Recebimentos       ║  ║ Distribuição benef.    ║
║ D: Estoque/Desp║  ║ ↓                  ║  ║ Devolução fornec.      ║
║ C: Fornecedores║  ║ D/C: Caixa/Banco  ║  ║ ↓                      ║
║                ║  ║ D/C: Obrigações   ║  ║ D: Despesas            ║
║ [Complemento 1]║  ║ D/C: Ingressos    ║  ║ C: Estoques            ║
╚════════════════╝  ╚════════════════════╝  ╚════════════════════════╝
         │                    │                                │
         └────────────────────┼────────────────────────────────┘
                              ▼
╔═══════════════════════════════════════════════════════════════════╗
║              MÓDULO IMOBILIZADO (INTEGRADO)                       ║
║                                                                   ║
║  Entrada do bem (via NF-e) → D: Imobilizado / C: Fornecedores    ║
║  Depreciação mensal (auto) → D: Desp. Depreciação / C: Dep.Acum. ║
║  Baixa do bem → D: Dep.Acum. + D: Perda / C: Imobilizado         ║
╚═══════════════════════════════════════════════════════════════════╝

SAÍDAS FINAIS DO SISTEMA:
  ├── EFD-ICMS/IPI (SPED Fiscal) ← do Módulo Fiscal
  ├── ECD (SPED Contábil) ← do Módulo Contábil
  ├── ECF (Escrituração Contábil Fiscal) ← integra ECD
  ├── Balanço Patrimonial (para Assembleia Anual — Cód. Civil Art. 1.078)
  ├── DSD — Superávit/Déficit (para Assembleia)
  ├── DFC — Fluxo de Caixa (transparência e gestão)
  ├── Demonstração por Projeto (para prestação de contas a financiadores)
  └── Relatórios Gerenciais (para a diretoria)
```

---

## PARTE 28 — RESUMO DAS BASES LEGAIS UTILIZADAS NESTE MÓDULO

| Legislação/Norma | Aplicação Específica |
|---|---|
| **ITG 2002 (R1) — CFC Res. 1.409/2012** | Critérios de avaliação, reconhecimento, estrutura das demonstrações contábeis para associações. Nomenclatura: superávit, patrimônio social, ingressos |
| **NBC TG 26 / CPC 26** | Apresentação das demonstrações contábeis |
| **NBC TG 03 / CPC 03** | Demonstração dos Fluxos de Caixa |
| **NBC TG 07 (R2) / CPC 07** | Subvenções e convênios governamentais — reconhecimento quando atendidas as condições |
| **NBC TG 16 / CPC 16** | Estoques — custo médio ponderado |
| **NBC TG 27 / CPC 27** | Ativo imobilizado — depreciação |
| **Código Civil — Arts. 1.179 a 1.195** | Obrigatoriedade da escrituração comercial (livro diário e razão) |
| **CTN, Art. 14, III** | Escrituração regular como requisito para manutenção de imunidade/isenção tributária |
| **IN RFB nº 2.003/2021** | Obrigatoriedade e limites da ECD para imunes/isentas |
| **Decreto nº 6.022/2007** | Institui o SPED — base legal da ECD |
| **Lei nº 13.019/2014 (MROSC)** | Marco Regulatório das OSC — exige demonstração de execução físico-financeira por projeto para convênios com poder público |
| **CF/88, Art. 70** | Prestação de contas de recursos públicos |

---

**FIM DO COMPLEMENTO 3 — MÓDULO CONTÁBIL**

*Este documento, em conjunto com PROMPT_MODULO_ESCRITURACAO_FISCAL.md e
PROMPT_COMPLEMENTO_PRODUTOS_ESTOQUE.md, forma o briefing técnico COMPLETO
para o desenvolvimento do sistema integrado de gestão fiscal, patrimonial e
contábil para associações sem fins lucrativos — em conformidade com toda a
legislação brasileira vigente em 2025/2026.*
