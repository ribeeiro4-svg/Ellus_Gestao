# COMPLEMENTO DO PROMPT — MÓDULO DE PRODUTOS E CONTROLE DE ESTOQUE
## Integrado ao Módulo de Escrituração Fiscal para Associações

> **INSTRUÇÃO:** Este documento é um complemento obrigatório ao prompt principal
> "PROMPT_MODULO_ESCRITURACAO_FISCAL.md". Ambos devem ser lidos e implementados
> em conjunto. O módulo de Estoque depende do módulo Fiscal e os dois compartilham
> dados bidirecionalmente.

---

## PARTE 8 — CADASTRO DE PRODUTOS (ITEM MASTER)

### 8.1 Conceito e Escopo

O cadastro de produtos serve como o **dicionário central** do sistema. Todo item que
aparecer em uma NF-e de compra deve ser identificado neste cadastro — seja criado
automaticamente na importação do XML ou vinculado a um produto já existente. O
cadastro deve suportar os **4 perfis de produto** da associação, cada um com
comportamento diferente no estoque e na contabilidade:

| Tipo | Comportamento no Estoque | Contabilização |
|---|---|---|
| **Material de Consumo** | Entra no estoque, baixa por uso | Despesa no momento do consumo |
| **Item de Distribuição** | Entra no estoque, baixa por distribuição a beneficiário | Despesa social / Atividade-fim |
| **Insumo de Projeto** | Entra no estoque, baixa vinculada a projeto específico | Custo do projeto |
| **Ativo Imobilizado** | NÃO entra no estoque — segue para o Controle de Imobilizado | Ativo Permanente + Depreciação |

> ⚠️ **REGRA CRÍTICA:** Itens classificados como **Ativo Imobilizado** na escrituração
> fiscal (CFOP 1.406 ou destinação "4 — Ativo Imobilizado") **NÃO devem movimentar
> o estoque**. Devem ser encaminhados automaticamente ao módulo de Controle de
> Imobilizado com os dados fiscais (valor de aquisição, data, NF de origem, CNPJ do
> fornecedor) para início da ficha do bem e cálculo de depreciação conforme NBC TG
> 27 / CPC 27.

---

### 8.2 Schema da Tabela de Produtos

```sql
CREATE TABLE produtos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID NOT NULL REFERENCES empresas(id),

  -- Identificação
  codigo_interno        VARCHAR(30) UNIQUE NOT NULL,  -- gerado pelo sistema
  codigo_fornecedor     VARCHAR(60),                  -- cProd da NF-e (pode variar por fornecedor)
  codigo_ean            VARCHAR(14),                  -- código de barras
  descricao             VARCHAR(120) NOT NULL,
  descricao_complementar TEXT,

  -- Classificação fiscal
  ncm                   VARCHAR(8),      -- Nomenclatura Comum do Mercosul
  cest                  VARCHAR(7),      -- Código Especificador da ST
  origem_fiscal         CHAR(1),         -- 0-8 conforme tabela A do CST ICMS
  unidade_medida        VARCHAR(6) NOT NULL,  -- UN, KG, CX, PCT, LT, MT, etc.
  unidade_medida_trib   VARCHAR(6),      -- unidade tributável (pode diferir)

  -- Tipo e destinação padrão
  tipo_produto          VARCHAR(20) NOT NULL,
  -- consumo | distribuicao | insumo_projeto | ativo_imobilizado
  destinacao_padrao     VARCHAR(2),      -- destinação padrão para sugestão na escrituração

  -- Classificação contábil padrão
  conta_contabil_entrada_id  UUID REFERENCES plano_contas(id),
  conta_contabil_estoque_id  UUID REFERENCES plano_contas(id),
  conta_contabil_saida_id    UUID REFERENCES plano_contas(id),
  centro_custo_padrao_id     UUID REFERENCES centros_custo(id),

  -- Controle de estoque
  controla_estoque      BOOLEAN DEFAULT TRUE,
  -- FALSE para ativo imobilizado
  estoque_minimo        NUMERIC(15,4) DEFAULT 0,
  estoque_maximo        NUMERIC(15,4),
  ponto_pedido          NUMERIC(15,4),
  -- quantidade que dispara alerta de reposição

  -- Custo (atualizado automaticamente pelo método CMP)
  custo_medio_ponderado NUMERIC(21,10) DEFAULT 0,
  -- Custo Médio Ponderado — atualizado a cada entrada
  ultimo_custo_compra   NUMERIC(21,10) DEFAULT 0,
  data_ultima_compra    DATE,
  cnpj_ultimo_fornecedor VARCHAR(14),

  -- Rastreabilidade
  controla_lote         BOOLEAN DEFAULT FALSE,
  controla_validade     BOOLEAN DEFAULT FALSE,

  -- Status
  ativo                 BOOLEAN DEFAULT TRUE,
  observacoes           TEXT,

  -- Auditoria
  criado_por            UUID REFERENCES usuarios(id),
  criado_via            VARCHAR(20) DEFAULT 'manual',
  -- manual | importacao_nfe | migracao
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de múltiplos fornecedores por produto
-- (o mesmo produto pode vir de fornecedores diferentes com códigos diferentes)
CREATE TABLE produto_fornecedores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id          UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  cnpj_fornecedor     VARCHAR(14) NOT NULL,
  nome_fornecedor     VARCHAR(60),
  codigo_no_fornecedor VARCHAR(60),  -- cProd que o fornecedor usa na NF-e
  descricao_no_fornecedor VARCHAR(120),
  ncm_declarado       VARCHAR(8),
  cfop_habitual       VARCHAR(4),
  cst_icms_habitual   VARCHAR(3),
  ultimo_preco_compra NUMERIC(21,10),
  data_ultima_compra  DATE,
  UNIQUE(produto_id, cnpj_fornecedor)
);
```

---

### 8.3 Criação Automática de Produtos na Importação da NF-e

Ao importar um XML de NF-e, para cada item (`<det>`) o sistema deve executar
a seguinte lógica de identificação:

```
PARA CADA ITEM DA NF-e:

1. Buscar produto por EAN (cEAN) → se encontrado, vincular
2. Se não: buscar por (CNPJ_emitente + cProd) na tabela produto_fornecedores
3. Se não: buscar por NCM + descrição similar (score ≥ 85%) → sugerir vínculo
4. Se não encontrado:
   → Criar produto AUTOMATICAMENTE com status "pendente_revisão"
   → Pré-preencher: descrição (xProd), NCM, EAN, unidade, código do fornecedor
   → Tipo inferido pela destinação classificada na escrituração
   → Sinalizar visualmente na tela de escrituração: "🆕 Produto novo — revisar cadastro"

APÓS ESCRITURAÇÃO CONFIRMADA:
→ Se produto criado automaticamente: consolidar o cadastro
→ Se produto vinculado manualmente: atualizar produto_fornecedores
→ Lançar movimentação de entrada no estoque (se controla_estoque = TRUE)
```

---

## PARTE 9 — CONTROLE DE ESTOQUE (NÍVEL INTERMEDIÁRIO)

### 9.1 Modelo de Movimentação

O estoque funciona pelo modelo de **Kardex digital**: toda entrada e saída gera um
registro de movimentação, e o saldo e custo médio são calculados de forma acumulada.

#### Método de Custeio: Custo Médio Ponderado (CMP)

Obrigatório para associações conforme **NBC TG 16 / CPC 16 — Estoques**:

```
Fórmula do novo CMP após entrada:

novo_CMP = (saldo_qtd_anterior × CMP_anterior + qtd_entrada × custo_unitario_entrada)
           ÷ (saldo_qtd_anterior + qtd_entrada)

O custo unitário da entrada = (valor_produto + valor_frete + valor_seguro - valor_desconto)
                               ÷ quantidade
                               (rateio proporcional dos acessórios da NF-e)
```

> **Nota fiscal:** O frete, seguro e outras despesas acessórias da NF-e devem ser
> **rateados proporcionalmente** entre os itens (pela proporção do valor de cada
> item sobre o total da nota), compondo o custo de aquisição, conforme determina
> o **CPC 16, parágrafo 10**.

---

### 9.2 Schema das Tabelas de Estoque

```sql
-- Saldo atual por produto (visão consolidada)
CREATE TABLE estoque_saldo (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id),
  produto_id        UUID NOT NULL REFERENCES produtos(id),
  deposito_id       UUID REFERENCES depositos(id),
  -- NULL = estoque único / sem divisão por depósito

  quantidade        NUMERIC(15,4) NOT NULL DEFAULT 0,
  custo_medio       NUMERIC(21,10) NOT NULL DEFAULT 0,
  valor_total       NUMERIC(15,2)
    GENERATED ALWAYS AS (quantidade * custo_medio) STORED,
  data_ultima_mov   DATE,

  UNIQUE(empresa_id, produto_id, deposito_id)
);

-- Movimentações (Kardex)
CREATE TABLE estoque_movimentacoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id),
  produto_id          UUID NOT NULL REFERENCES produtos(id),
  deposito_id         UUID REFERENCES depositos(id),

  -- Tipo e natureza
  tipo_mov            VARCHAR(10) NOT NULL,
  -- ENTRADA | SAIDA | AJUSTE | TRANSFERENCIA
  natureza            VARCHAR(30) NOT NULL,
  -- (ver tabela 9.3 abaixo)

  -- Quantidades e valores
  quantidade          NUMERIC(15,4) NOT NULL,  -- sempre positivo
  custo_unitario      NUMERIC(21,10) NOT NULL,
  custo_total         NUMERIC(15,2)
    GENERATED ALWAYS AS (quantidade * custo_unitario) STORED,

  -- Saldo resultante (snapshot após a movimentação)
  saldo_qtd_antes     NUMERIC(15,4),
  cmp_antes           NUMERIC(21,10),
  saldo_qtd_depois    NUMERIC(15,4),
  cmp_depois          NUMERIC(21,10),

  -- Origem da movimentação (rastreabilidade bidirecional)
  origem_tipo         VARCHAR(20),
  -- nfe_entrada | baixa_consumo | distribuicao | devolucao | ajuste_inventario
  nfe_entrada_id      UUID REFERENCES nfe_entradas(id),
  nfe_item_id         UUID REFERENCES nfe_entradas_itens(id),
  baixa_id            UUID REFERENCES estoque_baixas(id),
  devolucao_id        UUID REFERENCES estoque_devolucoes(id),

  -- Vínculo com projeto/atividade (para saídas)
  projeto_id          UUID REFERENCES projetos(id),
  beneficiario_id     UUID REFERENCES beneficiarios(id),
  -- para distribuições a associados

  -- Observações e auditoria
  historico           VARCHAR(200),
  documento_referencia VARCHAR(60),  -- número da NF, requisição, etc.
  usuario_id          UUID REFERENCES usuarios(id),
  data_movimento      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Requisições/baixas de consumo interno
CREATE TABLE estoque_baixas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id),
  numero_requisicao VARCHAR(20) UNIQUE NOT NULL,  -- gerado automaticamente
  tipo              VARCHAR(20) NOT NULL,
  -- consumo_interno | distribuicao_associado | insumo_projeto
  data_baixa        DATE NOT NULL DEFAULT CURRENT_DATE,
  solicitante_id    UUID REFERENCES usuarios(id),
  aprovador_id      UUID REFERENCES usuarios(id),
  projeto_id        UUID REFERENCES projetos(id),
  beneficiario_id   UUID REFERENCES beneficiarios(id),
  status            VARCHAR(20) DEFAULT 'rascunho',
  -- rascunho | aprovada | atendida | cancelada
  observacoes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE estoque_baixas_itens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baixa_id        UUID NOT NULL REFERENCES estoque_baixas(id) ON DELETE CASCADE,
  produto_id      UUID NOT NULL REFERENCES produtos(id),
  quantidade      NUMERIC(15,4) NOT NULL,
  custo_unitario  NUMERIC(21,10),  -- CMP no momento da baixa
  custo_total     NUMERIC(15,2)
    GENERATED ALWAYS AS (quantidade * custo_unitario) STORED,
  observacao      VARCHAR(200)
);

-- Devoluções a fornecedor
CREATE TABLE estoque_devolucoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id),
  nfe_entrada_id      UUID NOT NULL REFERENCES nfe_entradas(id),
  -- NF-e de compra que originou a devolução
  cnpj_fornecedor     VARCHAR(14) NOT NULL,
  nome_fornecedor     VARCHAR(60),
  data_devolucao      DATE NOT NULL,
  motivo              VARCHAR(200),
  nfe_devolucao_chave VARCHAR(44),  -- chave da NF-e de devolução emitida
  status              VARCHAR(20) DEFAULT 'pendente',
  -- pendente | nfe_emitida | concluida
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE estoque_devolucoes_itens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucao_id    UUID NOT NULL REFERENCES estoque_devolucoes(id) ON DELETE CASCADE,
  produto_id      UUID NOT NULL REFERENCES produtos(id),
  nfe_item_id     UUID REFERENCES nfe_entradas_itens(id),
  quantidade      NUMERIC(15,4) NOT NULL,
  valor_unitario  NUMERIC(21,10),
  motivo_item     VARCHAR(200)
);

-- Depósitos/almoxarifados (estrutura simples para nível intermediário)
CREATE TABLE depositos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id),
  nome          VARCHAR(60) NOT NULL,
  descricao     TEXT,
  responsavel_id UUID REFERENCES usuarios(id),
  ativo         BOOLEAN DEFAULT TRUE
);

-- Beneficiários (para distribuição de itens a associados)
CREATE TABLE beneficiarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id),
  nome          VARCHAR(120) NOT NULL,
  cpf           VARCHAR(11),
  numero_associado VARCHAR(20),
  projeto_id    UUID REFERENCES projetos(id),
  ativo         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 9.3 Tabela de Naturezas de Movimentação

```
ENTRADAS:
  compra_nfe            → Entrada por NF-e de compra (automático pela escrituração)
  devolucao_de_cliente  → Retorno de item distribuído
  ajuste_inventario_mais → Ajuste positivo (acerto de inventário)
  transferencia_entrada → Recebimento de outro depósito

SAÍDAS:
  consumo_interno       → Baixa por uso interno (material de escritório, limpeza, etc.)
  distribuicao_associado → Entrega a associado/beneficiário (com registro do destinatário)
  insumo_projeto        → Saída para uso em projeto específico
  devolucao_fornecedor  → Devolução de mercadoria ao fornecedor (gera NF-e)
  ajuste_inventario_menos → Ajuste negativo (acerto de inventário)
  transferencia_saida   → Envio para outro depósito
```

---

### 9.4 Fluxo de Entrada no Estoque (pela Escrituração Fiscal)

Este é o ponto de integração central entre os dois módulos:

```
GATILHO: Escrituração de NF-e CONFIRMADA (status = "escriturada")

PARA CADA ITEM DA NF-e:
  SE tipo_produto = "ativo_imobilizado":
    → NÃO movimentar estoque
    → Criar ficha no módulo de Imobilizado com:
       valor_aquisicao = custo_item_rateado
       nfe_origem_id   = nfe_entrada_id
       data_aquisicao  = data_emissao_nfe
       cnpj_fornecedor = cnpj_emitente
    → Status: "aguardando_cadastro_imobilizado"

  SENÃO (consumo | distribuicao | insumo_projeto):
    SE produto.controla_estoque = TRUE:
      1. Calcular custo_unitario_rateado:
           custo = (vProd + vFrete_rateado + vSeg_rateado - vDesc_rateado + vOutro_rateado)
                   / quantidade
      2. Calcular novo CMP:
           novo_cmp = (saldo_qtd_atual × cmp_atual + qtd × custo)
                      / (saldo_qtd_atual + qtd)
      3. Inserir em estoque_movimentacoes:
           tipo_mov = "ENTRADA"
           natureza = "compra_nfe"
           nfe_entrada_id, nfe_item_id = referências da nota
      4. Atualizar estoque_saldo:
           quantidade += qtd
           custo_medio = novo_cmp
      5. Atualizar produtos:
           custo_medio_ponderado = novo_cmp
           ultimo_custo_compra   = custo_unitario_rateado
           data_ultima_compra    = data_emissao_nfe

    VERIFICAR alertas de estoque:
      → SE novo saldo > estoque_maximo: ⚠️ "Estoque acima do máximo"
      → SE novo saldo ≤ ponto_pedido:   🔔 "Ponto de pedido atingido"

ROLLBACK:
  SE a escrituração for revertida/reaberta:
    → Estornar automaticamente a movimentação de entrada
    → Recalcular CMP retroativamente para movimentações posteriores
    → Alertar se houve saídas no período (pode gerar saldo negativo)
```

---

## PARTE 10 — TELA DE ESCRITURAÇÃO FISCAL (ATUALIZAÇÃO)

A tela de classificação item a item do Módulo Fiscal (Parte 3.2 do prompt principal)
deve ser **atualizada** para incluir as seguintes colunas adicionais:

| Campo | Comportamento |
|---|---|
| **Produto Vinculado** | Select com busca — vincular o item da NF ao cadastro de produtos. Se não existir, botão "Criar Produto" |
| **Tipo de Produto** | Exibir o tipo do produto vinculado (consumo / distribuição / insumo / imobilizado) |
| **Vai para Estoque?** | Toggle automático baseado no tipo. Para imobilizado, desabilitado e com ícone de "Imobilizado" |
| **Custo Atual (CMP)** | Exibir o CMP atual do produto no estoque e o novo CMP calculado após esta entrada |
| **Saldo Atual** | Quantidade atual em estoque antes desta entrada |
| **Saldo Após** | Saldo projetado após confirmar a escrituração |

### Alerta de Produto Novo

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🆕 PRODUTO NÃO CADASTRADO                                            │
│ "Resma Papel A4 75g" (NCM: 48025590) do fornecedor ABC Distribuidora │
│                                                                       │
│ Este produto foi identificado como novo. Deseja:                      │
│ [Criar novo produto]  [Vincular a produto existente]                  │
│                                                                       │
│ ⚡ Sugestão automática: similar a "Papel A4" já cadastrado (87%)      │
│ [Usar sugestão]                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PARTE 11 — BAIXAS E SAÍDAS DO ESTOQUE

### 11.1 Tela de Requisição de Baixa

Criar uma interface dedicada para registrar as saídas do estoque, com 3 fluxos:

#### Fluxo 1 — Consumo Interno

```
Requisição de Material
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Solicitante: [Select usuário]
Data:        [Date picker]
Destino:     [Select: Setor/Departamento]
Projeto:     [Select projeto — opcional]
Justificativa: [Texto livre]

ITENS:
┌──────────────────┬────────┬──────────┬─────────────┐
│ Produto          │ Saldo  │ Qtd      │ Custo Total │
├──────────────────┼────────┼──────────┼─────────────┤
│ [busca produto]  │ 50 UN  │ [____]   │ R$ ___,__   │
└──────────────────┴────────┴──────────┴─────────────┘
[+ Adicionar item]

Total do consumo: R$ ___,__
[Salvar rascunho]  [Solicitar aprovação]  [Confirmar saída]
```

#### Fluxo 2 — Distribuição a Associados/Beneficiários

```
Distribuição de Itens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Projeto/Ação: [Select projeto]
Data:         [Date picker]
Responsável:  [Select usuário]

BENEFICIÁRIOS E ITENS:
┌──────────────────────┬──────────────┬───────┬──────┐
│ Beneficiário         │ Produto      │ Qtd   │ Custo│
├──────────────────────┼──────────────┼───────┼──────┤
│ [busca beneficiário] │[busca produto│[____] │R$___ │
└──────────────────────┴──────────────┴───────┴──────┘
[+ Adicionar linha]

Gerar comprovante de distribuição: [✓]
[Confirmar distribuição]
```

**O comprovante de distribuição** deve conter: data, nome do beneficiário, CPF,
produto, quantidade, projeto. Este documento é exigido pela **prestação de contas
da associação** e comprova a aplicação dos recursos na atividade-fim.

#### Fluxo 3 — Devolução ao Fornecedor

```
Devolução de Mercadoria
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NF-e de Origem: [busca por emitente ou número]
→ [Emitente: ABC LTDA | NF 000.001.234 | 15/03/2025 | R$ 1.250,00]

ITENS A DEVOLVER:
┌─────────────────┬──────────────┬───────┬────────────────────────┐
│ Produto         │ Qtd Comprada │ Qtd   │ Motivo da Devolução    │
├─────────────────┼──────────────┼───────┼────────────────────────┤
│ Produto XPTO    │ 10 UN        │[____] │ [Avaria | Prazo vencido│
│                 │              │       │  | Divergência | Outro] │
└─────────────────┴──────────────┴───────┴────────────────────────┘

Motivo geral: [Texto livre]
[Registrar devolução]
→ Sistema avisa: "Será necessário emitir NF-e de devolução com CFOP 5.201/6.201"
```

---

## PARTE 12 — RELATÓRIOS DE ESTOQUE

### 12.1 Relatórios Obrigatórios

#### Extrato de Movimentações (Kardex)

Exibir por produto e período:

```
PRODUTO: Resma Papel A4 75g | Cód: 0001 | NCM: 48025590
Período: 01/03/2025 a 31/03/2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Data     Histórico                     E/S   Qtd   CUnit    Saldo   CMP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
01/03    Saldo Inicial                        —     —       20 UN   R$ 25,00
05/03    Compra NF 001234 / ABC LTDA   E    50 UN  R$24,00  70 UN   R$ 24,29
10/03    Consumo Interno REQ-2025-0041  S    10 UN  R$24,29  60 UN   R$ 24,29
22/03    Consumo Interno REQ-2025-0058  S     5 UN  R$24,29  55 UN   R$ 24,29
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SALDO FINAL: 55 UN | CMP: R$ 24,29 | Valor em Estoque: R$ 1.335,95
```

#### Posição de Estoque (Saldo Atual)

Relatório geral com: produto, unidade, saldo atual, CMP, valor total em estoque,
classificação (consumo / distribuição / insumo), alertas de mínimo/máximo.
Exportável em Excel e PDF.

#### Consumo por Projeto

Relatório gerencial mostrando, por projeto, quais materiais foram consumidos,
quantidades e custo total. Essencial para **prestação de contas** a financiadores,
órgãos públicos e assembleia de associados.

#### Distribuições a Beneficiários

Relatório detalhado de todos os itens distribuídos: data, projeto, beneficiário,
produto, quantidade, custo. Serve como **relatório de aplicação de recursos** exigido
pelo **Art. 70 da CF/88** e pelas normativas de entidades que recebem recursos públicos.

---

## PARTE 13 — INTEGRAÇÃO COM O BLOCO H DO SPED (INVENTÁRIO FÍSICO)

### 13.1 Geração do Inventário para o SPED EFD-ICMS/IPI

O **Bloco H** do arquivo SPED registra o inventário físico ao final do período de
apuração (ou quando exigido). Com o estoque controlado pelo sistema, a geração
é automática:

**Registros do Bloco H:**

```
H001 — Abertura do Bloco H
H005 — Totais do Inventário
  → DT_INV: data do inventário (último dia do período)
  → VL_INV: valor total do inventário (soma de saldo × CMP)
  → MOT_INV: 01=No final do período | 02=Na mudança de forma de tributação |
              03=Na solicitação de baixa do cadastro | 04=Na transferência de estoque |
              05=Por determinação dos fiscos

H010 — Um registro por produto com estoque:
  → COD_ITEM: código do produto (ligado ao registro 0200)
  → UNID: unidade de medida
  → QTD: quantidade em estoque na data
  → VL_UNIT: custo médio ponderado (CMP)
  → VL_ITEM: valor total (QTD × VL_UNIT)
  → IND_PROP: 0=Próprio | 1=Terceiros
  → COD_PART: CNPJ do proprietário (se de terceiros)
  → TXT_COMPL: observações

H990 — Encerramento do Bloco H
```

**Regra importante:** conforme o **Guia Prático EFD-ICMS/IPI**, somente devem
compor o Bloco H os produtos que **têm relevância para ICMS e IPI**. Materiais de
consumo sem controle tributário podem ser incluídos com flag de observação.

### 13.2 Inventário Físico Periódico (Contagem)

Implementar funcionalidade de **inventário físico** para reconciliar o estoque
do sistema com a contagem real:

```
FLUXO DE INVENTÁRIO FÍSICO:
1. Gerar planilha de contagem (produto, localização, saldo sistema, saldo contado)
2. Registrar contagem realizada
3. Sistema calcula divergências automaticamente
4. Para cada divergência:
   → Requer justificativa (quebra, extravio, erro de lançamento, furto)
   → Gera ajuste de estoque (positivo ou negativo) com natureza "ajuste_inventario"
5. Após aprovação: atualizar saldos e gerar movimentação de ajuste
6. Exportar para o Bloco H do SPED
```

---

## PARTE 14 — APIS ADICIONAIS (ESTOQUE E PRODUTOS)

```
PRODUTOS:
GET    /api/produtos                       — Listar produtos com filtros
POST   /api/produtos                       — Criar produto
GET    /api/produtos/:id                   — Detalhar produto
PUT    /api/produtos/:id                   — Atualizar produto
GET    /api/produtos/:id/movimentacoes     — Histórico de movimentações (Kardex)
GET    /api/produtos/busca                 — Busca por código, EAN, NCM, descrição
POST   /api/produtos/:id/fornecedor        — Vincular fornecedor ao produto
GET    /api/produtos/alertas               — Produtos abaixo do mínimo / ponto de pedido

ESTOQUE:
GET    /api/estoque/saldos                 — Posição atual de todos os produtos
GET    /api/estoque/saldo/:produto_id      — Saldo específico de um produto
GET    /api/estoque/movimentacoes          — Listagem geral com filtros
POST   /api/estoque/baixas                 — Criar requisição de baixa
PUT    /api/estoque/baixas/:id/aprovar     — Aprovar requisição
PUT    /api/estoque/baixas/:id/confirmar   — Confirmar saída (efetiva movimentação)
POST   /api/estoque/distribuicoes          — Registrar distribuição a beneficiários
POST   /api/estoque/devolucoes             — Registrar devolução a fornecedor
POST   /api/estoque/inventario             — Iniciar inventário físico
PUT    /api/estoque/inventario/:id/ajustar — Aplicar ajustes do inventário

RELATÓRIOS:
GET    /api/relatorios/estoque/posicao     — Posição atual (todos os produtos)
GET    /api/relatorios/estoque/kardex/:id  — Extrato de movimentação de produto
GET    /api/relatorios/estoque/consumo-projeto — Consumo por projeto
GET    /api/relatorios/estoque/distribuicoes   — Distribuições a beneficiários
GET    /api/relatorios/sped/bloco-h        — Dados para o Bloco H do SPED
```

---

## PARTE 15 — DIAGRAMA DE INTEGRAÇÃO GERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                        MÓDULO FISCAL                             │
│                                                                   │
│  [Importar XML NF-e] ──► [Validar] ──► [Classificar Itens]      │
│         │                                      │                  │
│         ▼                                      ▼                  │
│  [Armazenar XML]                   [Escrituração Confirmada]      │
│                                            │                      │
└────────────────────────────────────────────┼──────────────────────┘
                                             │
                    ┌────────────────────────┼──────────────────┐
                    │                        │                   │
                    ▼                        ▼                   ▼
         ┌──────────────────┐    ┌─────────────────┐  ┌──────────────────┐
         │  MÓDULO ESTOQUE  │    │ MÓDULO FINANCEIRO│  │ MÓDULO IMOBILIZADO│
         │                  │    │                  │  │                  │
         │ Entrada no       │    │ Vincular/Criar   │  │ Criar ficha do   │
         │ Kardex           │    │ Conta a Pagar    │  │ bem adquirido    │
         │ Atualizar CMP    │    │ Conciliação      │  │ Depreciaçao      │
         │ Alertas de       │    │ Fiscal-Financ.   │  │ Baixa de ativo   │
         │ estoque mín/máx  │    └─────────────────┘  └──────────────────┘
         │                  │
         │ SAÍDAS:          │         ┌─────────────────────┐
         │ Consumo interno ─┼────────►│   RELATÓRIOS E      │
         │ Distribuição    ─┼────────►│   PRESTAÇÃO DE      │
         │ Devolução       ─┼────────►│   CONTAS            │
         │ Bloco H SPED    ─┼────────►│                     │
         └──────────────────┘         │ • Kardex            │
                                      │ • Consumo/Projeto   │
         ┌──────────────────┐         │ • Distribuições     │
         │  CADASTRO DE     │         │ • Posição Estoque   │
         │  PRODUTOS        │         │ • Bloco H SPED      │
         │                  │         │ • LRE (Livro Reg.   │
         │ Criação automát. │         │   de Entradas)      │
         │ pela NF-e        │         └─────────────────────┘
         │ Múlt. fornec.    │
         │ CMP atualizado   │
         └──────────────────┘
```

---

## PARTE 16 — BASE LEGAL ESPECÍFICA PARA ESTOQUE EM ASSOCIAÇÕES

| Norma | Aplicação no Módulo |
|---|---|
| **NBC TG 16 / CPC 16 — Estoques** | Método de custeio CMP, composição do custo de aquisição com rateio de fretes |
| **NBC TG 27 / CPC 27 — Ativo Imobilizado** | Separação dos bens duráveis do estoque corrente, controle de depreciação |
| **ITG 2002 (R1) — CFC** | Exige segregação dos recursos por finalidade (atividade-fim vs. administrativa), base para o relatório de aplicação de recursos |
| **Art. 70 da Constituição Federal** | Obrigatoriedade de prestação de contas de recursos públicos recebidos — o relatório de distribuição a beneficiários atende a este requisito |
| **Lei nº 13.019/2014 (Marco Regulatório OSC)** | Art. 63 e 64: obrigatoriedade de prestação de contas com demonstração de execução físico-financeira — o relatório de consumo por projeto atende |
| **Ajuste SINIEF 08/1997** | Base para emissão de NF-e de devolução (CFOP 5.201 para devolução dentro do estado, 6.201 para outros estados) |
| **Guia Prático EFD-ICMS/IPI v3.2.2** | Especificações técnicas do Bloco H para geração correta do inventário no SPED |

---

**FIM DO COMPLEMENTO — MÓDULO DE PRODUTOS E ESTOQUE**

*Este documento complementa o PROMPT_MODULO_ESCRITURACAO_FISCAL.md.
Juntos, os dois documentos formam o briefing técnico completo para o
desenvolvimento do sistema de gestão fiscal e patrimonial para a associação.*
