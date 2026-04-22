# PROMPT TÉCNICO — MÓDULO DE ESCRITURAÇÃO FISCAL PARA ASSOCIAÇÕES
## (Para uso como instrução completa a outra IA desenvolvedora)

---

> **CONTEXTO DO SISTEMA:**
> Você é um engenheiro de software sênior com especialização em sistemas tributários brasileiros, direito fiscal, contabilidade para entidades do terceiro setor e integração de sistemas ERP/SaaS. Você deve desenvolver um módulo completo de **Escrituração Fiscal** para uma plataforma SaaS de gestão voltada a **Associações sem fins lucrativos** (terceiro setor), integrando-se ao módulo financeiro já existente. O módulo deve ser robusto, inteligente, legalmente embasado e capaz de atender todas as exigências do Fisco brasileiro vigentes em 2025/2026.

---

## PARTE 1 — CONTEXTO JURÍDICO E TRIBUTÁRIO (BASE LEGAL OBRIGATÓRIA)

### 1.1 Natureza Jurídica da Entidade

A entidade usuária é uma **Associação sem fins lucrativos**, regida pelo:

- **Código Civil Brasileiro — Lei nº 10.406/2002**, Arts. 53 a 61 (definição e obrigações das associações)
- **Código Tributário Nacional (CTN) — Lei nº 5.172/1966**, Art. 14, inciso III: obrigatoriedade de manter escrituração completa de receitas e despesas em livros com formalidades legais
- **Constituição Federal de 1988**, Art. 150, VI, "c": imunidade tributária, que **não dispensa** o cumprimento de obrigações acessórias
- **Instrução Normativa ITG 2002 (R1) do CFC**: norma específica de contabilidade para entidades sem fins lucrativos

### 1.2 Obrigações Acessórias da Associação Perante o Fisco

Mesmo com imunidade/isenção tributária, a associação está obrigada a:

| Obrigação | Base Legal | Periodicidade |
|---|---|---|
| ECD — Escrituração Contábil Digital | IN RFB nº 1.774/2017 | Anual |
| ECF — Escrituração Contábil Fiscal | IN RFB nº 1.422/2013 | Anual |
| DCTF — Declaração de Débitos e Créditos Tributários | IN RFB nº 2.005/2021 | Mensal |
| EFD-ICMS/IPI (se contribuinte) | Ato COTEPE/ICMS nº 44/2018 e alterações | Mensal |
| Escrituração de NF-e de compras | CONFAZ / SINIEF | Contínua |
| Conservação de documentos fiscais | CTN, Art. 195 | 5 anos mínimo |

### 1.3 Sobre a EFD-ICMS/IPI — O Core da Escrituração de Entradas

A **Escrituração Fiscal Digital (EFD-ICMS/IPI)** é parte integrante do **SPED — Sistema Público de Escrituração Digital**, instituído pelo **Decreto nº 6.022, de 22/01/2007**. O leiaute vigente para 2026 é o **Layout 020**, regido pelo **Ato COTEPE/ICMS nº 79/2025**, com as atualizações trazidas pelo Guia Prático versão **3.2.2** (publicado em março de 2026, com vigência retroativa a janeiro/2026).

**Para NF-e Modelo 55 de entradas (compras), os registros obrigatórios são:**

- **Bloco 0:** Abertura, Identificação e Referências
  - `0000` — Abertura do arquivo
  - `0100` — Dados do contabilista
  - `0150` — Tabela de cadastro do participante (emitentes)
  - `0190` — Identificação das unidades de medida
  - `0200` — Tabela de identificação do item (produtos)
  - `0400` — Tabela de natureza da operação / prestação
  - `0450` — Tabela de informações complementares do documento fiscal

- **Bloco C:** Documentos Fiscais I — Mercadorias (ICMS/IPI)
  - `C100` — Nota Fiscal / NF-e / NFC-e (cabeçalho da nota)
  - `C110` — Informações complementares da NF
  - `C120` — Complemento para operações de importação
  - `C170` — Itens do documento fiscal (UM REGISTRO POR ITEM)
  - `C180` — Complemento de ICMS-ST retido anteriormente (se houver)
  - `C190` — Registro analítico do documento (totalizador por CST/CFOP/Alíquota)
  - `C195` — Observações do lançamento fiscal

- **Bloco E:** Apuração do ICMS e IPI
  - `E100` e subsequentes: período de apuração
  - `E110` — Apuração do ICMS — Operações Próprias

- **Bloco H:** Inventário Físico (quando aplicável)

- **Bloco 9:** Controle e Encerramento do Arquivo

---

## PARTE 2 — ESPECIFICAÇÕES TÉCNICAS DO MÓDULO

### 2.1 Arquitetura Geral

O módulo deve ser construído como um **submódulo independente** dentro do SaaS, com banco de dados próprio (tabelas novas) mas com **integração direta via API interna** com o módulo financeiro existente. Utilize arquitetura **MVC ou similar**, com separação clara entre camadas de:

- **Importação e Parsing** (leitura do XML da NF-e)
- **Escrituração e Classificação Fiscal** (regras de negócio fiscal)
- **Integração Financeira** (consulta de pagamentos ao emitente)
- **Geração de Relatórios e Exportação SPED**
- **Auditoria e Rastreabilidade**

### 2.2 Stack Tecnológica Sugerida

- **Backend:** Node.js (Express) ou Python (FastAPI/Django) — a IA deve usar a mesma linguagem do SaaS existente
- **Parser XML:** biblioteca nativa de parsing XML (DOMParser, xml2js, lxml, etc.)
- **Banco de Dados:** PostgreSQL (preferencial) ou MySQL, com schema fiscal separado
- **Frontend:** React.js ou Vue.js, com suporte a upload drag-and-drop e tabelas editáveis
- **Exportação SPED:** Geração de arquivo TXT no formato pipe-delimited (`|campo|campo|`)

---

## PARTE 3 — FUNCIONALIDADES DETALHADAS (REQUISITOS COMPLETOS)

### 3.1 — IMPORTAÇÃO DO XML DA NF-e MODELO 55

#### 3.1.1 Upload e Validação

- Aceitar arquivos `.xml` via **upload unitário** ou **importação em lote (múltiplos arquivos)**
- Aceitar também **arquivo ZIP** contendo múltiplos XMLs de NF-e
- **Validar a estrutura do XML** conforme o **Manual de Orientação ao Contribuinte (MOC) da NF-e**, versão vigente (atualmente v4.0.1 ou superior), antes de processar
- Verificar o **namespace** do XML: `http://www.portalfiscal.inf.br/nfe`
- Verificar a **chave de acesso** da NF-e (44 dígitos): validar o dígito verificador com algoritmo módulo 11
- Verificar se a NF-e já foi importada anteriormente (controle de duplicidade por chave de acesso)
- Exibir resumo do arquivo antes da confirmação de importação: emitente, número NF, data emissão, valor total, quantidade de itens

#### 3.1.2 Campos a Extrair do XML (mapeamento obrigatório)

**Do nó `<ide>` (Identificação da NF-e):**
```
cUF, cNF, natOp, mod (deve ser 55), serie, nNF, dhEmi, dhSaiEnt,
tpNF (0=entrada, 1=saída), idDest, cMunFG, tpImp, tpEmis, tpAmb,
finNFe, indFinal, indPres, procEmi, verProc
```

**Do nó `<emit>` (Emitente):**
```
CNPJ ou CPF, xNome, xFant, enderEmit (xLgr, nro, xCpl, xBairro,
cMun, xMun, UF, CEP, cPais, xPais, fone), IE, IEST, IM, CNAE, CRT
```

**Do nó `<dest>` (Destinatário = a própria Associação):**
```
CNPJ, xNome, enderDest, IE, indIEDest, email
```

**Do nó `<det>` — repete por item (CRÍTICO — UM REGISTRO POR ITEM):**
```
nItem, cProd, cEAN, xProd, NCM, CEST, indEscala, CNPJFab,
cBenef, EXTIPI, CFOP, uCom, qCom, vUnCom, vProd,
cEANTrib, uTrib, qTrib, vUnTrib, vFrete, vSeg, vDesc, vOutro,
indTot, xPed, nItemPed, nFCI, rastro (lote, qLote, dFab, dVal, cAgreg)
```

**Impostos por item — nó `<imposto>`:**
```xml
ICMS: orig, CST (ou CSOSN para Simples), modBC, vBC, pICMS, vICMS,
      modBCST, pMVAST, pRedBCST, vBCST, pICMSST, vICMSST,
      vICMSDeson, motDesICMS, pFCPST, vFCPST, vFCP
IPI:  clEnq, CNPJProd, cSelo, qSelo, cEnq, CST, vBC, qUnid, vUnid, pIPI, vIPI
PIS:  CST, vBC, pPIS, vPIS ou qBCProd, vAliqProd
COFINS: CST, vBC, pCOFINS, vCOFINS ou qBCProd, vAliqProd
```

**Do nó `<total>` (Totais da NF):**
```
vBC, vICMS, vICMSDeson, vFCPST, vBCST, vST, vFCPSTRet, vProd,
vFrete, vSeg, vDesc, vII, vIPI, vIPIDevol, vPIS, vCOFINS,
vOutro, vNF, vTotTrib
```

**Do nó `<transp>` (Transporte):**
```
modFrete (0=Emitente, 1=Destinatário, 2=Terceiros, 3=Próprio/Rem,
4=Próprio/Dest, 9=Sem frete), transporta (CNPJ/CPF, xNome, IE, xEnder, xMun, UF)
```

**Do nó `<cobr>` (Cobrança — para integração com financeiro):**
```
fat (nFat, vOrig, vDesc, vLiq), dup[] (nDup, dVenc, vDup)
```

**Do nó `<infAdic>` (Informações Adicionais):**
```
infAdFisco, infCpl (observações para escrituração)
```

---

### 3.2 — ESCRITURAÇÃO ITEM A ITEM (CORAÇÃO DO MÓDULO)

Esta é a funcionalidade mais crítica. Após a importação, o sistema deve apresentar uma **tela de escrituração** onde o usuário classificará cada item da nota.

#### 3.2.1 Interface de Escrituração por Item

Exibir uma **grade/tabela editável** com uma linha por item da NF-e, contendo:

**Colunas de visualização (read-only, vindas do XML):**
- Nº Item
- Código do Produto (cProd)
- Descrição do Produto (xProd)
- NCM
- CFOP (da NF-e — referência)
- Quantidade / Unidade
- Valor Unitário
- Valor Total do Item
- CST ICMS (da NF-e)
- CST PIS (da NF-e)
- CST COFINS (da NF-e)

**Colunas editáveis pelo usuário (classificação fiscal):**

| Campo | Tipo | Descrição |
|---|---|---|
| **CFOP de Escrituração** | Select com busca | CFOP correto para a operação da associação (pode diferir do CFOP do emitente) |
| **CST ICMS** | Select | Código de Situação Tributária do ICMS (ver tabela abaixo) |
| **CST IPI** | Select | Código de Situação Tributária do IPI |
| **CST PIS** | Select | CST do PIS (tabela A e B) |
| **CST COFINS** | Select | CST do COFINS (tabela A e B) |
| **Destinação do Item** | Select múltiplo | Uso na atividade-fim, uso administrativo, consumo imediato, ativo imobilizado, revenda (ver detalhe abaixo) |
| **Centro de Custo** | Select | Vínculo ao plano de contas da associação |
| **Conta Contábil** | Select com busca | Código da conta contábil para lançamento |
| **Obs. Fiscal** | Texto | Observações para o registro C195 do SPED |
| **Aproveitamento de Crédito** | Toggle (Sim/Não) | Se a associação tem direito a aproveitamento do ICMS/IPI/PIS/COFINS |
| **Motivo de Não Aproveitamento** | Select (se Não) | Imunidade, isenção, uso pessoal, etc. |

#### 3.2.2 Tabela de CFOP para Entradas em Associação (com descrição completa)

Implementar tabela de CFOP filtrável com pelo menos os seguintes, priorizando entradas:

```
1.101 — Compra para industrialização ou produção rural
1.102 — Compra para comercialização
1.111 — Compra para industrialização de mercadoria recebida anteriormente
1.116 — Compra para industrialização originada de encomenda para recebimento futuro
1.120 — Compra para industrialização, em venda à ordem, já recebida do vendedor remetente
1.121 — Compra para industrialização, sob contrato, já recebida do vendedor remetente
1.122 — Compra para comercialização, em venda à ordem, já recebida do vendedor remetente
1.201 — Devolução de venda de produção do estabelecimento
1.202 — Devolução de venda de mercadoria adquirida ou recebida de terceiros
1.251 — Compra de energia elétrica para distribuição ou comercialização
1.252 — Compra de energia elétrica por estabelecimento industrial
1.253 — Compra de energia elétrica por estabelecimento comercial
1.254 — Compra de energia elétrica por estabelecimento de prestador de serviço de transporte
1.255 — Compra de energia elétrica para consumo por demanda contratada
1.256 — Compra de energia elétrica para utilização no sistema de transporte de distribuição
1.301 — Aquisição de serviço de comunicação para execução de serviço da mesma natureza
1.302 — Aquisição de serviço de comunicação por estabelecimento industrial
1.303 — Aquisição de serviço de comunicação por estabelecimento comercial
1.351 — Aquisição de serviço de transporte para execução de serviço da mesma natureza
1.352 — Aquisição de serviço de transporte por estabelecimento industrial
1.353 — Aquisição de serviço de transporte por estabelecimento comercial
1.354 — Aquisição de serviço de transporte por estabelecimento de prestador de serviço de transporte
1.355 — Aquisição de serviço de transporte para utilização na prestação de serviço ao asociado
1.401 — Compras para o ativo permanente/imobilizado
1.403 — Compra de mercadoria para uso e consumo
1.406 — Compra de bem para o ativo imobilizado originada de encomenda para recebimento futuro
1.407 — Compra de mercadoria para uso ou consumo originada de encomenda para recebimento futuro
1.408 — Transferência de bem do ativo imobilizado
1.409 — Transferência de mercadoria para uso ou consumo
1.501 — Entrada de mercadoria recebida com fim específico de exportação
1.503 — Entrada decorrente de devolução de produto remetido para industrialização, por conta e ordem do adquirente originário, quando a remessa e o retorno ocorrerem em estados diferentes
1.504 — Entrada decorrente de devolução de mercadoria remetida para industrialização e não aplicada no referido processo
1.651 — Compra de combustível ou lubrificante para industrialização
1.652 — Compra de combustível ou lubrificante para comercialização
1.653 — Compra de combustível ou lubrificante por consumidor ou usuário final
2.101 a 2.653 — (Correspondentes interestaduais dos CFOPs acima)
3.101 a 3.653 — (Correspondentes de importação)
```

#### 3.2.3 Tabela de CST ICMS (Tabela A — Origem + Tabela B — Tributação)

```
TABELA A (Origem):
0 — Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8
1 — Estrangeira – Importação direta, exceto a indicada no código 6
2 — Estrangeira – Adquirida no mercado interno, exceto a indicada no código 7
3 — Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40% (quarenta por cento)
4 — Nacional, cuja produção tenha sido feita em conformidade com os processos produtivos básicos (PPB)
5 — Nacional, mercadoria ou bem com Conteúdo de Importação inferior ou igual a 40%
6 — Estrangeira – Importação direta, sem similar nacional, constante em lista de Resolução CAMEX e gás natural
7 — Estrangeira – Adquirida no mercado interno, sem similar nacional, constante em lista de Resolução CAMEX e gás natural
8 — Nacional, mercadoria ou bem com Conteúdo de Importação superior a 70% (setenta por cento)

TABELA B (Tributação ICMS):
00 — Tributada integralmente
10 — Tributada e com cobrança do ICMS por substituição tributária
20 — Com redução de base de cálculo
30 — Isenta ou não tributada e com cobrança do ICMS por substituição tributária
40 — Isenta
41 — Não tributada
50 — Suspensão
51 — Diferimento
60 — ICMS cobrado anteriormente por substituição tributária
70 — Com redução de base de cálculo e cobrança do ICMS por substituição tributária
90 — Outras
```

#### 3.2.4 Tabela de CST IPI

```
ENTRADAS:
00 — Entrada com recuperação de crédito
01 — Entrada tributada com alíquota zero
02 — Entrada isenta
03 — Entrada não tributada
04 — Entrada imune
05 — Entrada com suspensão
49 — Outras entradas

SAÍDAS:
50 — Saída tributada
51 — Saída tributada com alíquota zero
52 — Saída isenta
53 — Saída não tributada
54 — Saída imune
55 — Saída com suspensão
99 — Outras saídas
```

#### 3.2.5 Tabela de CST PIS e COFINS

```
TABELA A (Operações com Direito a Crédito):
50 — Operação com Direito a Crédito – Vinculada Exclusivamente a Receita Tributada no Mercado Interno
51 — Operação com Direito a Crédito – Vinculada Exclusivamente a Receita Não Tributada no Mercado Interno
52 — Operação com Direito a Crédito – Vinculada Exclusivamente a Receita de Exportação
53 — Operação com Direito a Crédito – Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno
54 — Operação com Direito a Crédito – Vinculada a Receitas Tributadas no Mercado Interno e de Exportação
55 — Operação com Direito a Crédito – Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação
56 — Operação com Direito a Crédito – Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno e de Exportação
60 — Crédito Presumido – Operação de Aquisição Vinculada Exclusivamente a Receita Tributada no Mercado Interno
61 — Crédito Presumido – Operação de Aquisição Vinculada Exclusivamente a Receita Não-Tributada no Mercado Interno
62 — Crédito Presumido – Operação de Aquisição Vinculada Exclusivamente a Receita de Exportação
63 — Crédito Presumido – Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno
64 — Crédito Presumido – Operação de Aquisição Vinculada a Receitas Tributadas no Mercado Interno e de Exportação
65 — Crédito Presumido – Operação de Aquisição Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação
66 — Crédito Presumido – Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno e de Exportação
67 — Crédito Presumido – Outras Operações
70 — Operação de Aquisição sem Direito a Crédito
71 — Operação de Aquisição com Isenção
72 — Operação de Aquisição com Suspensão
73 — Operação de Aquisição a Alíquota Zero
74 — Operação de Aquisição sem Incidência da Contribuição
75 — Operação de Aquisição por Substituição Tributária
98 — Outras Operações de Entrada
99 — Outras Operações
```

#### 3.2.6 Destinação do Item — Classificação Específica para Associação

Este campo é fundamental para a transparência fiscal e contábil da associação:

```
1 — Atividade-fim (uso direto na realização do objeto social da associação)
2 — Administrativo/Overhead (uso geral administrativo)
3 — Consumo Imediato (materiais de consumo — não ativam imobilizado)
4 — Ativo Imobilizado (bem de uso duradouro — ativar no imobilizado)
5 — Manutenção Predial/Infraestrutura
6 — Eventos e Projetos Específicos (vincular ao projeto)
7 — Revenda (se a associação revender produtos)
8 — Distribuição Gratuita a Beneficiários
9 — Uso do Dirigente/Funcionário (monitorar para compliance)
10 — Outros (exige justificativa textual)
```

---

### 3.3 — FUNCIONALIDADES DE INTELIGÊNCIA DO MÓDULO

#### 3.3.1 Sugestão Automática de Classificação (Machine Learning / Regras)

O módulo deve implementar um **motor de sugestão** que aprende com classificações anteriores:

- Ao importar uma NF-e de um emitente já cadastrado, sugerir automaticamente o CFOP e CST com base no histórico de classificações anteriores para produtos com o mesmo NCM ou mesmo cProd
- Criar uma **tabela de memorização fiscal** no banco: `(cnpj_emitente, ncm, cfop_sugerido, cst_icms_sugerido, destinacao_sugerida, confianca)`
- Exibir a sugestão com indicador visual de confiança (ex: 🟢 Alta, 🟡 Média, 🔴 Nova)
- Permitir que o usuário confirme ou altere a sugestão
- Ao confirmar, atualizar a confiança da regra no banco

#### 3.3.2 Alertas e Validações Automáticas em Tempo Real

Implementar um conjunto de **regras de validação e alerta** exibidas enquanto o usuário preenche a escrituração:

```
ALERTAS OBRIGATÓRIOS:
⚠️ CFOP informado não é compatível com operação de entrada (CFOPs de saída: 5xxx, 6xxx, 7xxx)
⚠️ NCM do produto exige CST IPI específico para o setor da associação
⚠️ Produto com CEST informado — verificar obrigatoriedade de ST
⚠️ Emitente optante pelo Simples Nacional (CRT=1) — usar CSOSN ao invés de CST ICMS regular
⚠️ Nota com CFOP de importação (3xxx) sem informação de DI no C120
⚠️ Destinação "Ativo Imobilizado" selecionada — necessário cadastrar bem no controle de imobilizado
⚠️ CST PIS/COFINS 70-75 selecionado — crédito não aproveitável, confirmar
⚠️ Divergência entre o valor do ICMS destacado na NF e o valor calculado pela alíquota
⚠️ NF-e com situação "Cancelada" na SEFAZ — não deve ser escriturada (verificar autorização)
⚠️ Duplicidade: nota com esta chave de acesso já foi escriturada no período
⚠️ Data de emissão fora do período de apuração selecionado
```

#### 3.3.3 Consulta Automática à Sintegra/SEFAZ (opcional, via API)

- Consultar a **situação da NF-e na SEFAZ** via WebService antes de escriturar (validar se está "Autorizada")
- Exibir: chave de acesso, situação (Autorizada, Cancelada, Denegada, Inutilizada), data/hora autorização
- Armazenar o protocolo de autorização no registro da nota

---

### 3.4 — INTEGRAÇÃO COM O MÓDULO FINANCEIRO

Esta é uma integração crítica. O módulo fiscal deve consultar o financeiro existente para:

#### 3.4.1 Vinculação de Pagamentos

Ao exibir uma NF-e para escrituração, o sistema deve **consultar automaticamente** o módulo financeiro por:

```
Parâmetros de busca:
- CNPJ do emitente da NF-e
- Período: data de emissão ±30 dias (configurável)
- Valor: valor da NF-e ±5% (tolerância para descontos/juros)
- Número de NF (se registrado no financeiro)
```

**Resultado esperado na tela de escrituração:**
```
┌──────────────────────────────────────────────────────────┐
│ 💰 FINANCEIRO — Pagamentos para [NOME DO FORNECEDOR]      │
├──────────────────────────────────────────────────────────┤
│ ✅ Encontrado: Pagamento R$ 1.250,00 em 15/03/2025        │
│    Conta: Fornecedores | Centro de Custo: Administrativo  │
│    Status: PAGO | Banco: Bradesco CC 1234-5               │
│    [Vincular a esta NF-e] [Ver detalhes]                  │
├──────────────────────────────────────────────────────────┤
│ ⚠️ Parcela em aberto: R$ 620,00 venc. 30/04/2025          │
│    [Ver no Financeiro]                                    │
└──────────────────────────────────────────────────────────┘
```

#### 3.4.2 Criação Automática de Conta a Pagar (se não existir)

- Se não houver pagamento/conta a pagar para o emitente no financeiro, oferecer botão **"Criar Conta a Pagar no Financeiro"**
- Pré-preencher o lançamento financeiro com os dados da NF-e: fornecedor, valor, vencimento (das duplicatas `<dup>` do XML), número da NF
- Ao criar, vincular o registro financeiro ao registro fiscal (FK bidirecional)

#### 3.4.3 Status de Conciliação Fiscal-Financeira

Cada NF-e escriturada deve ter um campo de **status de conciliação**:

```
🟡 Pendente — Não há pagamento vinculado
🟢 Conciliada — Pagamento(s) vinculado(s) e valor coincide
🔵 Parcialmente Conciliada — Parte do valor pago
🔴 Divergência — Valor pago difere do valor fiscal
```

---

### 3.5 — GESTÃO E CONTROLE DAS NOTAS ESCRITURADAS

#### 3.5.1 Painel Principal (Dashboard de Escrituração)

Exibir:
- Total de NF-e importadas no período selecionado
- Notas pendentes de escrituração (aguardando classificação)
- Notas escrituradas (completas)
- Notas com alertas/inconsistências
- Total de ICMS, IPI, PIS, COFINS destacados no período
- Total de créditos aproveitáveis identificados
- Gráfico de entradas por CFOP
- Gráfico de entradas por emitente (Top 10)
- Alerta de notas próximas ao prazo de escrituração

#### 3.5.2 Livro de Registro de Entradas (LRE)

Gerar relatório em formato de **Livro de Registro de Entradas** (conforme AJUSTE SINIEF 02/1983 e suas alterações), contendo:

- Numeração sequencial de lançamentos
- Data de entrada
- Número e série da NF
- CNPJ / Nome do emitente
- UF do emitente
- Código do produto / NCM
- CFOP
- CST
- Valor contábil
- Base de cálculo ICMS
- Alíquota ICMS
- Valor ICMS
- Valor IPI
- Valor isento / outros
- Observações

O relatório deve ser **exportável em PDF e Excel**.

#### 3.5.3 Controle de Períodos de Apuração

- O módulo deve trabalhar com conceito de **período de apuração** (mês/ano)
- Cada período pode estar em status: `Aberto`, `Em escrituração`, `Fechado`, `Transmitido`
- Ao **fechar um período**, bloquear edições nas notas daquele mês
- Implementar **reabertura de período** com log de auditoria (quem reabriu, quando, por quê)

---

### 3.6 — GERAÇÃO DE ARQUIVO SPED EFD-ICMS/IPI

#### 3.6.1 Geração do Arquivo

O módulo deve ser capaz de gerar o arquivo TXT no padrão EFD-ICMS/IPI para posterior validação no **PVA (Programa Validador e Assinador)** da Receita Federal.

**Formato do arquivo:**
```
|TIPO_REGISTRO|CAMPO1|CAMPO2|...|CAMPO_N|
```

**Exemplo para registro C100:**
```
|C100|0|0|1|55|001|000001234|01/03/2025|01/03/2025|12.345,00|0,00|0,00|1000,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|123456789012345678901234567890123456789012345|0|0|0|
```

**Exemplo para registro C170 (item):**
```
|C170|1|0001|Produto XPTO|5,000|UN|250,0000|1250,00|0,00|0,00|0,00|0,00|1250,00|1403|90|00|20,00|1250,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|
```

**Registros a gerar (mínimo obrigatório para entradas NF-e modelo 55):**
```
0000, 0001, 0005, 0100, 0150, 0190, 0200, 0400, 0450, 0990
C001, C100, C110, C170, C190, C195, C990
E001, E100, E110, E990
H001, H990 (se houver inventário)
9001, 9900, 9990, 9999
```

#### 3.6.2 Validações Pré-Geração

Antes de gerar o arquivo SPED, o sistema deve executar:
- Verificar se todos os itens de todas as notas do período estão classificados (CFOP, CST preenchidos)
- Verificar se os totais do Bloco C batem com os totais do Bloco E
- Verificar unicidade dos registros 0150 (um por CNPJ de participante)
- Verificar unicidade dos registros 0200 (um por código de produto)
- Gerar relatório de inconsistências antes de liberar o arquivo

---

### 3.7 — MODELO DE BANCO DE DADOS (SCHEMA SUGERIDO)

```sql
-- Tabela principal da NF-e
CREATE TABLE nfe_entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  periodo_apuracao DATE NOT NULL, -- primeiro dia do mês
  chave_acesso VARCHAR(44) UNIQUE NOT NULL,
  numero_nf VARCHAR(9) NOT NULL,
  serie VARCHAR(3),
  data_emissao DATE NOT NULL,
  data_entrada DATE,
  cnpj_emitente VARCHAR(14) NOT NULL,
  nome_emitente VARCHAR(60),
  uf_emitente CHAR(2),
  crt_emitente CHAR(1), -- 1=Simples, 2=Simples Excesso, 3=Normal
  valor_produtos NUMERIC(15,2),
  valor_frete NUMERIC(15,2) DEFAULT 0,
  valor_seguro NUMERIC(15,2) DEFAULT 0,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  valor_ipi NUMERIC(15,2) DEFAULT 0,
  valor_total NUMERIC(15,2) NOT NULL,
  valor_icms NUMERIC(15,2) DEFAULT 0,
  valor_pis NUMERIC(15,2) DEFAULT 0,
  valor_cofins NUMERIC(15,2) DEFAULT 0,
  nat_operacao VARCHAR(60),
  inf_complementar TEXT,
  xml_original TEXT, -- XML completo armazenado
  status_escrituracao VARCHAR(20) DEFAULT 'pendente',
  -- pendente | em_andamento | escriturada | com_inconsistencia
  status_conciliacao VARCHAR(20) DEFAULT 'pendente',
  -- pendente | conciliada | parcial | divergencia
  status_sefaz VARCHAR(20), -- autorizada | cancelada | denegada
  protocolo_autorizacao VARCHAR(60),
  financeiro_lancamento_id UUID REFERENCES lancamentos_financeiros(id),
  observacoes_fiscais TEXT,
  usuario_escriturou UUID REFERENCES usuarios(id),
  data_escrituracao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens da NF-e
CREATE TABLE nfe_entradas_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_entrada_id UUID NOT NULL REFERENCES nfe_entradas(id) ON DELETE CASCADE,
  numero_item INTEGER NOT NULL,
  codigo_produto VARCHAR(60),
  codigo_ean VARCHAR(14),
  descricao_produto VARCHAR(120) NOT NULL,
  ncm VARCHAR(8),
  cest VARCHAR(7),
  cfop_nfe VARCHAR(4), -- CFOP que consta na NF-e (do emitente)
  cfop_escrituracao VARCHAR(4), -- CFOP classificado pelo usuário
  unidade_comercial VARCHAR(6),
  quantidade NUMERIC(15,4),
  valor_unitario NUMERIC(21,10),
  valor_produto NUMERIC(15,2),
  valor_frete NUMERIC(15,2) DEFAULT 0,
  valor_seguro NUMERIC(15,2) DEFAULT 0,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  valor_outro NUMERIC(15,2) DEFAULT 0,
  -- ICMS
  orig_icms CHAR(1),
  cst_icms VARCHAR(3),
  mod_bc_icms CHAR(1),
  valor_bc_icms NUMERIC(15,2),
  aliq_icms NUMERIC(5,2),
  valor_icms NUMERIC(15,2),
  valor_bc_st NUMERIC(15,2),
  aliq_icms_st NUMERIC(5,2),
  valor_icms_st NUMERIC(15,2),
  -- IPI
  cst_ipi VARCHAR(2),
  valor_bc_ipi NUMERIC(15,2),
  aliq_ipi NUMERIC(5,2),
  valor_ipi NUMERIC(15,2),
  -- PIS
  cst_pis VARCHAR(2),
  valor_bc_pis NUMERIC(15,2),
  aliq_pis NUMERIC(5,2),
  valor_pis NUMERIC(15,2),
  -- COFINS
  cst_cofins VARCHAR(2),
  valor_bc_cofins NUMERIC(15,2),
  aliq_cofins NUMERIC(5,2),
  valor_cofins NUMERIC(15,2),
  -- Classificação fiscal (preenchida pelo usuário)
  destinacao_item VARCHAR(2),
  centro_custo_id UUID REFERENCES centros_custo(id),
  conta_contabil_id UUID REFERENCES plano_contas(id),
  aproveitamento_credito BOOLEAN DEFAULT FALSE,
  motivo_nao_aproveitamento VARCHAR(100),
  obs_fiscal TEXT,
  -- Status e auditoria
  classificado BOOLEAN DEFAULT FALSE,
  usuario_classificou UUID REFERENCES usuarios(id),
  data_classificacao TIMESTAMPTZ,
  UNIQUE(nfe_entrada_id, numero_item)
);

-- Tabela de memorização fiscal (para sugestões automáticas)
CREATE TABLE regras_classificacao_fiscal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  cnpj_emitente VARCHAR(14),
  ncm VARCHAR(8),
  codigo_produto_emitente VARCHAR(60),
  cfop_sugerido VARCHAR(4),
  cst_icms_sugerido VARCHAR(3),
  cst_ipi_sugerido VARCHAR(2),
  cst_pis_sugerido VARCHAR(2),
  cst_cofins_sugerido VARCHAR(2),
  destinacao_sugerida VARCHAR(2),
  conta_contabil_id UUID REFERENCES plano_contas(id),
  total_usos INTEGER DEFAULT 1,
  total_confirmacoes INTEGER DEFAULT 0,
  confianca NUMERIC(5,2) DEFAULT 0, -- 0 a 100
  ultima_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de períodos de apuração
CREATE TABLE periodos_apuracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  competencia DATE NOT NULL, -- primeiro dia do mês
  status VARCHAR(20) DEFAULT 'aberto', -- aberto | em_escrituracao | fechado | transmitido
  data_fechamento TIMESTAMPTZ,
  usuario_fechou UUID REFERENCES usuarios(id),
  arquivo_sped_gerado BOOLEAN DEFAULT FALSE,
  data_geracao_sped TIMESTAMPTZ,
  observacoes TEXT,
  UNIQUE(empresa_id, competencia)
);

-- Log de auditoria do módulo fiscal
CREATE TABLE audit_log_fiscal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  entidade VARCHAR(50), -- nfe_entrada | item | periodo
  entidade_id UUID,
  acao VARCHAR(30), -- importar | classificar | reabrir | gerar_sped | etc.
  dados_anteriores JSONB,
  dados_novos JSONB,
  usuario_id UUID REFERENCES usuarios(id),
  ip_origem VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.8 — ENDPOINTS DE API (REST)

```
POST   /api/fiscal/nfe/importar              — Importar XML(s) de NF-e
GET    /api/fiscal/nfe                        — Listar NF-e com filtros (período, status, emitente)
GET    /api/fiscal/nfe/:id                    — Detalhar NF-e com itens
PUT    /api/fiscal/nfe/:id/itens             — Salvar classificação fiscal dos itens
GET    /api/fiscal/nfe/:id/sugestoes         — Obter sugestões automáticas de classificação
POST   /api/fiscal/nfe/:id/conciliar         — Vincular ao financeiro manualmente
GET    /api/fiscal/nfe/:id/financeiro        — Buscar pagamentos no financeiro para a NF
GET    /api/fiscal/periodos                  — Listar períodos de apuração
POST   /api/fiscal/periodos/:id/fechar       — Fechar período
POST   /api/fiscal/periodos/:id/reabrir      — Reabrir período (com justificativa)
POST   /api/fiscal/sped/gerar               — Gerar arquivo SPED para o período
GET    /api/fiscal/relatorios/lre            — Livro de Registro de Entradas
GET    /api/fiscal/relatorios/impostos       — Resumo de impostos por período
GET    /api/fiscal/relatorios/cfop           — Resumo por CFOP
GET    /api/fiscal/dashboard                 — Dados do painel principal
GET    /api/fiscal/tabelas/cfop              — Tabela de CFOP (com busca)
GET    /api/fiscal/tabelas/cst-icms          — Tabela de CST ICMS
GET    /api/fiscal/tabelas/cst-ipi           — Tabela de CST IPI
GET    /api/fiscal/tabelas/cst-pis-cofins    — Tabela de CST PIS/COFINS
```

---

## PARTE 4 — REGRAS DE NEGÓCIO ESPECÍFICAS PARA ASSOCIAÇÕES

### 4.1 Imunidade e Isenção vs. Obrigações Acessórias

O sistema deve deixar claro ao usuário que, conforme o **Art. 14, III do CTN** e a jurisprudência consolidada (ex: CMT-SP, ementa citada acima), **a imunidade tributária da associação não a dispensa das obrigações acessórias de escrituração**. O módulo deve ser configurável para:

- Indicar o **enquadramento tributário da entidade** (imune/isenta de IRPJ e CSLL, optante PIS/COFINS cesta zero, etc.)
- Registrar corretamente os CSTs que reflitam a condição de imunidade/isenção (ex: CST ICMS 40 ou 41 para operações isentas)
- Emitir alerta quando houver tentativa de escriturar com CST de tributação plena sem cálculo de imposto a recolher

### 4.2 Classificação por Atividade-Fim vs. Administrativa

A correta segregação é exigida pelo **Art. 12 da Lei nº 9.532/1997** e pela **ITG 2002 (R1)** para manutenção da imunidade/isenção. O sistema deve:

- Permitir configurar **projetos/atividades** da associação (ex: Projeto Saúde, Projeto Educação, Administrativo)
- Vincular cada item da NF a um projeto/atividade
- Gerar relatório de **demonstrativo de aplicação de recursos por projeto** (obrigatório para prestação de contas)

### 4.3 Integração com ECD (Escrituração Contábil Digital)

Os lançamentos fiscais devem alimentar automaticamente a **contabilidade**:

- Cada NF-e escriturada deve gerar um **lançamento contábil** (débito na conta de custo/ativo, crédito em Contas a Pagar ou Caixa)
- O plano de contas deve seguir a **ITG 2002 (R1)** (receitas, despesas, patrimônio líquido — sem "lucro")
- Todos os lançamentos devem ser exportáveis no padrão **ECD (SPED Contábil)**

---

## PARTE 5 — INTERFACE DE USUÁRIO (UX/UI REQUIREMENTS)

### 5.1 Fluxo Principal (Wizard de Escrituração)

```
[1] IMPORTAR XML
    └─> Drag & drop | Upload | Importação em lote
    └─> Validação estrutural
    └─> Preview da nota
    └─> Confirmar importação

[2] CONSULTAR FINANCEIRO
    └─> Busca automática por CNPJ + valor + período
    └─> Exibir resultado: pago / em aberto / não encontrado
    └─> Opção: criar conta a pagar

[3] CLASSIFICAR ITENS
    └─> Tabela editável item a item
    └─> Sugestões automáticas
    └─> Validações em tempo real
    └─> Salvar rascunho ou finalizar

[4] REVISAR E ESCRITURAR
    └─> Resumo da nota e totais
    └─> Verificação de completude
    └─> Assinar escrituração (confirmar)
    └─> Status: ESCRITURADA

[5] FECHAR PERÍODO E GERAR SPED
    └─> Validação de completude do período
    └─> Geração do arquivo TXT
    └─> Download para uso no PVA da Receita Federal
```

### 5.2 Requisitos de Interface

- **Responsivo** — funcionar em desktop e tablet
- **Atalhos de teclado** — Tab para navegar entre campos na grade de itens, Enter para confirmar
- **Cópia de classificação** — botão "Aplicar mesma classificação a todos os itens com mesmo NCM"
- **Histórico da nota** — log de todas as alterações realizadas na escrituração
- **Destaque visual** — itens não classificados em vermelho, classificados em verde
- **Barra de progresso** — "X de Y itens classificados" por nota

---

## PARTE 6 — SEGURANÇA E COMPLIANCE

- **LGPD — Lei nº 13.709/2018:** os dados fiscais (CNPJ, CPF, valores) devem ser tratados conforme os requisitos de proteção de dados. Implementar pseudonimização para logs
- **Integridade do XML:** armazenar o XML original e nunca modificá-lo. Toda escrituração é sobreposta como metadado, nunca alterando o documento fiscal original
- **Trilha de auditoria completa:** toda ação no módulo (importar, classificar, editar, excluir, reabrir período) deve gerar registro imutável no `audit_log_fiscal`
- **Controle de acesso por perfil:**
  - `fiscal_viewer` — visualização apenas
  - `fiscal_operator` — importar e classificar
  - `fiscal_supervisor` — fechar períodos e gerar SPED
  - `fiscal_admin` — reabrir períodos e configurações
- **Backup do XML original:** manter o XML da NF-e por no mínimo **5 anos** (conforme Art. 195 do CTN)
- **Hash de integridade:** calcular e armazenar SHA-256 do XML original para verificação futura de integridade

---

## PARTE 7 — CONSIDERAÇÕES FINAIS E INSTRUÇÕES DE DESENVOLVIMENTO

### 7.1 Sequência de Desenvolvimento Sugerida

```
Sprint 1: Modelagem do banco de dados + Parser XML da NF-e
Sprint 2: API de importação + validação + armazenamento
Sprint 3: Interface de escrituração por item (tabela editável)
Sprint 4: Tabelas de CFOP, CST, NCM e motor de sugestões
Sprint 5: Integração com módulo financeiro
Sprint 6: Geração do arquivo SPED EFD-ICMS/IPI
Sprint 7: Relatórios (LRE, Dashboard, Impostos)
Sprint 8: Testes de compliance e ajustes
```

### 7.2 Bibliotecas e Recursos Recomendados

- **Tabela NCM completa:** disponível no portal da Receita Federal — importar como seed no banco
- **Tabela CFOP:** Ajuste SINIEF 03/1994 e alterações posteriores — importar como seed
- **Tabela IBGE de municípios:** para validação do campo `cMun` da NF-e
- **Validação de CNPJ:** usar algoritmo oficial de dígito verificador (módulo 11)
- **Parsing XML NF-e:** respeitar os schemas XSD oficiais disponíveis em `http://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=BMPFMBoln3w=`

### 7.3 Testes Obrigatórios

- **Testes unitários:** parser XML para todos os campos obrigatórios
- **Testes de integração:** API de importação com XMLs reais (usar XMLs de teste da SEFAZ)
- **Testes de geração SPED:** validar o arquivo gerado no PVA oficial
- **Testes de regra de negócio:** todos os alertas e validações fiscais
- **Testes de carga:** importação de 500+ notas simultaneamente

### 7.4 Documentação Obrigatória a Seguir

Toda a implementação deve estar aderente a:

1. **MOC NF-e v4.0.1** — Manual de Orientação ao Contribuinte (NF-e Modelo 55)
2. **Guia Prático EFD-ICMS/IPI v3.2.2** — SPED/Receita Federal (vigência jan/2026)
3. **Ajuste SINIEF 07/2005** — institui a NF-e
4. **Decreto nº 6.022/2007** — institui o SPED
5. **Ato COTEPE/ICMS nº 44/2018** e alterações até **Ato COTEPE nº 79/2025**
6. **Lei Complementar nº 87/1996 (Lei Kandir)** — regras do ICMS
7. **Lei nº 10.637/2002 e 10.833/2003** — PIS e COFINS não cumulativos
8. **ITG 2002 (R1) — CFC** — escrituração contábil de entidades sem fins lucrativos
9. **CTN, Art. 14** — requisitos para manutenção de imunidade/isenção tributária
10. **Reforma Tributária — EC 132/2023** — observar impactos futuros do IBS/CBS na escrituração

---

**FIM DO PROMPT — ESTE DOCUMENTO É O BRIEFING TÉCNICO COMPLETO PARA DESENVOLVIMENTO DO MÓDULO DE ESCRITURAÇÃO FISCAL.**

---
*Documento gerado para uso como instrução técnica a sistemas de IA para desenvolvimento de software fiscal. Versão 1.0 — Referência: legislação tributária brasileira vigente em abril/2026.*
