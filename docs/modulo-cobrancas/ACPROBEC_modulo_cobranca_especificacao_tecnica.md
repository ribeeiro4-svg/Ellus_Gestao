# Especificação técnica — módulo de cobrança de inadimplência
**Sistema:** ACPROBEC — Gestão Inteligente  
**Módulo:** Cobrança / Inadimplência  
**Versão do documento:** 1.0  
**Data:** 04/06/2026  

---

## ⚠️ Diretriz principal — leia antes de qualquer implementação

> **Este módulo é uma extensão do sistema existente. Nenhuma tabela, rota, componente ou lógica já existente deve ser alterada, removida ou refatorada durante esta implementação.**
>
> Toda adição deve ser feita de forma aditiva: novas tabelas, novas rotas, novos componentes. O funcionamento atual do sistema — incluindo o fluxo financeiro, o cálculo de inadimplência, os cards de resumo e a listagem de lançamentos em atraso — deve permanecer 100% intacto e funcional.
>
> Em caso de dúvida entre modificar algo existente ou criar algo novo, **sempre crie algo novo.**

---

## 1. Contexto e objetivo

A tela de inadimplência (`/financeiro` → aba Inadimplência) já exibe os associados em atraso, os valores, os meses de atraso e os botões "Acionar Cobrança". O que está faltando é:

1. Um **processo de cobrança estruturado por etapas** (baseado nos dias de atraso)
2. **Registro histórico** de cada ação realizada por associado
3. **Geração automática do texto da mensagem** conforme a etapa
4. **Controle de acordos e parcelamentos**
5. **Indicação automática da próxima etapa recomendada**

O botão "Acionar Cobrança" já existente na tela será o ponto de entrada para este módulo.

---

## 2. Regras de negócio do processo de cobrança

O processo de cobrança segue uma régua de etapas baseada nos dias corridos desde o vencimento da mensalidade mais antiga em aberto do associado.

| Etapa | Dias de atraso | Tipo de ação | Canal recomendado |
|-------|---------------|--------------|-------------------|
| 1ª cobrança | D+1 a D+7 | Lembrete amigável | WhatsApp |
| Reforço | D+8 a D+30 | Reforço com encargos | WhatsApp + E-mail |
| Formal | D+31 a D+44 | Comunicação formal escrita | E-mail + WhatsApp |
| Formal reforço | D+45 a D+60 | Reforço formal + alerta plano | E-mail + WhatsApp |
| Pré-notificação | D+61 a D+67 | Notificação extrajudicial | Carta AR / Cartório |
| Último aviso | D+68 a D+89 | Urgência pré-suspensão | WhatsApp |
| Suspensão | D+90+ | Comunicado de suspensão | E-mail + Carta |
| Reativação | Após quitação/acordo | Confirmação de reativação | WhatsApp |

**Encargos:**
- Multa moratória: **2%** sobre o valor original (incide a partir do 1º dia de atraso)
- Juros de mora: **1% ao mês** proporcional (calculado por dia: 1% ÷ 30 × dias de atraso)
- Base legal: Código Civil art. 406 + CDC

**Suspensão:**
- Benefícios da associação: suspensos a partir de **90 dias** de atraso
- Plano de saúde: comunicado à operadora ao atingir **90 dias** (o próprio plano suspende após 3 boletos, ~60-90 dias)

---

## 3. Banco de dados — novas tabelas

> Criar estas tabelas sem alterar nenhuma tabela existente. Usar o padrão de nomenclatura, tipos e convenções já adotados no banco do sistema.

### 3.1 Tabela `cobranca_acoes`

Registra cada ação de cobrança realizada por associado.

```sql
CREATE TABLE cobranca_acoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id        UUID NOT NULL,         -- FK para a tabela de associados existente
  etapa               VARCHAR(50) NOT NULL,  -- ver enum abaixo
  canal               VARCHAR(50) NOT NULL,  -- ver enum abaixo
  texto_enviado       TEXT,                  -- texto da mensagem copiada/enviada
  observacao          TEXT,                  -- resposta do associado, combinados, etc.
  realizado_por       UUID NOT NULL,         -- FK para usuário do sistema (tesoureiro)
  realizado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dias_atraso_momento INTEGER,               -- snapshot dos dias de atraso no momento da ação
  valor_momento       NUMERIC(10,2),         -- snapshot do total devido no momento da ação
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cobranca_acoes_associado ON cobranca_acoes(associado_id);
CREATE INDEX idx_cobranca_acoes_realizado_em ON cobranca_acoes(realizado_em DESC);
```

**Enum `etapa`** (usar como constante no código):
```
'lembrete'         → 1ª cobrança (D+1 a D+7)
'reforco'          → Reforço (D+8 a D+30)
'formal'           → Formal (D+31 a D+44)
'formal_reforco'   → Formal reforço (D+45 a D+60)
'pre_notificacao'  → Pré-notificação extrajudicial (D+61 a D+67)
'ultimo_aviso'     → Último aviso (D+68 a D+89)
'suspensao'        → Suspensão (D+90+)
'reativacao'       → Reativação (após quitação)
```

**Enum `canal`**:
```
'whatsapp'
'email'
'carta_formal'
'notificacao_extrajudicial'
'ligacao'
'sistema'   → ações automáticas registradas pelo sistema
```

---

### 3.2 Tabela `cobranca_acordos`

Registra acordos de parcelamento firmados com o associado.

```sql
CREATE TABLE cobranca_acordos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id        UUID NOT NULL,
  valor_total         NUMERIC(10,2) NOT NULL,   -- total a ser pago no acordo
  numero_parcelas     INTEGER NOT NULL,
  valor_parcela       NUMERIC(10,2) NOT NULL,
  data_primeira       DATE NOT NULL,             -- vencimento da 1ª parcela
  observacoes         TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ativo',
  -- status: 'ativo' | 'cumprido' | 'quebrado'
  criado_por          UUID NOT NULL,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cobranca_acordos_associado ON cobranca_acordos(associado_id);
```

---

### 3.3 Tabela `cobranca_acordos_parcelas`

Parcelas individuais de cada acordo.

```sql
CREATE TABLE cobranca_acordos_parcelas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acordo_id       UUID NOT NULL REFERENCES cobranca_acordos(id) ON DELETE CASCADE,
  numero          INTEGER NOT NULL,       -- número da parcela (1, 2, 3...)
  vencimento      DATE NOT NULL,
  valor           NUMERIC(10,2) NOT NULL,
  pago_em         DATE,                   -- NULL = não pago
  pago_valor      NUMERIC(10,2),
  status          VARCHAR(20) NOT NULL DEFAULT 'pendente'
  -- status: 'pendente' | 'pago' | 'atrasado'
);

CREATE INDEX idx_parcelas_acordo ON cobranca_acordos_parcelas(acordo_id);
```

---

## 4. Lógica de negócio — funções principais

### 4.1 Calcular dias de atraso do associado

```typescript
/**
 * Retorna os dias corridos desde o vencimento da mensalidade
 * mais antiga em aberto do associado.
 * Usar a tabela/view de lançamentos em atraso já existente no sistema.
 */
function calcularDiasAtraso(associadoId: string): number {
  // Buscar o lançamento em aberto mais antigo do associado
  // Calcular diferença entre hoje e a data de vencimento desse lançamento
  // Retornar como número inteiro de dias
}
```

### 4.2 Calcular total atualizado com encargos

```typescript
/**
 * Aplica multa de 2% e juros de 1% a.m. proporcional sobre o valor original.
 */
function calcularTotalAtualizado(valorOriginal: number, diasAtraso: number): {
  principal: number,
  multa: number,      // 2% fixo
  juros: number,      // 1% a.m. = 1/30% por dia
  total: number
} {
  const multa = valorOriginal * 0.02;
  const juros = valorOriginal * (0.01 / 30) * diasAtraso;
  return {
    principal: valorOriginal,
    multa: round(multa, 2),
    juros: round(juros, 2),
    total: round(valorOriginal + multa + juros, 2)
  };
}
```

### 4.3 Determinar próxima etapa recomendada

```typescript
/**
 * Com base nos dias de atraso e na última ação registrada,
 * retorna a etapa recomendada para o próximo contato.
 */
function determinarProximaEtapa(
  diasAtraso: number,
  ultimaAcao: CobrancaAcao | null
): {
  etapa: string,
  label: string,
  urgencia: 'baixa' | 'media' | 'alta' | 'critica'
} {
  if (diasAtraso >= 90) return { etapa: 'suspensao', label: 'Suspender', urgencia: 'critica' };
  if (diasAtraso >= 68) return { etapa: 'ultimo_aviso', label: 'Último aviso', urgencia: 'critica' };
  if (diasAtraso >= 61) return { etapa: 'pre_notificacao', label: 'Notif. extrajudicial', urgencia: 'alta' };
  if (diasAtraso >= 45) return { etapa: 'formal_reforco', label: 'Reforço formal', urgencia: 'alta' };
  if (diasAtraso >= 31) return { etapa: 'formal', label: 'Carta formal', urgencia: 'media' };
  if (diasAtraso >= 8)  return { etapa: 'reforco', label: 'Reforço', urgencia: 'media' };
  return { etapa: 'lembrete', label: '1ª cobrança', urgencia: 'baixa' };
}
```

### 4.4 Gerar texto da mensagem por etapa

```typescript
/**
 * Retorna o texto pré-formatado da mensagem para a etapa,
 * com os dados do associado já substituídos.
 */
function gerarTextoMensagem(
  etapa: string,
  dados: {
    nome: string,
    mesAno: string,         // ex: "março/2026"
    valorOriginal: number,
    valorAtualizado: number,
    diasAtraso: number,
    diasParaSuspensao: number,
    contatoTesouraria: string,
    nomeAssociacao: string
  }
): string {
  const textos: Record<string, string> = {
    lembrete: `Olá, ${dados.nome}! Tudo bem?\n\nPassando para lembrar que a mensalidade de ${dados.mesAno} da ${dados.nomeAssociacao}, no valor de R$ ${fmt(dados.valorOriginal)}, ainda está em aberto.\n\nCaso já tenha pago, desconsidere esta mensagem.\n\nQualquer dúvida, estamos à disposição!`,

    reforco: `Olá, ${dados.nome}!\n\nIdentificamos que a mensalidade de ${dados.mesAno} ainda consta em aberto.\n\nValor original: R$ ${fmt(dados.valorOriginal)}\nMulta (2%): R$ ${fmt(dados.valorOriginal * 0.02)}\nJuros (1% a.m.): proporcional ao atraso\nTotal atualizado: R$ ${fmt(dados.valorAtualizado)}\n\nPara regularizar, entre em contato com a tesouraria:\n${dados.contatoTesouraria}`,

    formal: `Prezado(a) ${dados.nome},\n\nComunicamos que constam em aberto mensalidades da ${dados.nomeAssociacao}.\n\nTotal em aberto: R$ ${fmt(dados.valorAtualizado)}\n\nInformamos que, conforme o estatuto da associação, ao atingir 90 dias de inadimplência os benefícios associativos e o plano de saúde poderão ser suspensos.\n\nSolicitamos a regularização em até 10 dias.\n\nTesouraria — ${dados.nomeAssociacao}\n${dados.contatoTesouraria}`,

    formal_reforco: `Prezado(a) ${dados.nome},\n\nRetornamos para informar que as pendências financeiras continuam em aberto.\n\nTotal atualizado: R$ ${fmt(dados.valorAtualizado)}\n\nLembramos que o plano de saúde já possui boletos em aberto, colocando seu benefício em risco imediato de suspensão pela operadora.\n\nPedimos que entre em contato com urgência.\n\nTesouraria — ${dados.nomeAssociacao}\n${dados.contatoTesouraria}`,

    pre_notificacao: `NOTIFICAÇÃO EXTRAJUDICIAL\n\nPrezado(a) ${dados.nome},\n\nA ${dados.nomeAssociacao} vem, por meio desta notificação, comunicar que constam em aberto mensalidades associativas totalizando R$ ${fmt(dados.valorAtualizado)}, acrescido de multa de 2% e juros de 1% ao mês, conforme previsto no Estatuto Social.\n\nNos termos do art. 57 do Código Civil, o associado inadimplente por prazo superior a 90 dias estará sujeito à suspensão dos benefícios associativos, incluindo o plano de saúde coletivo.\n\nConcedemos prazo de 10 (dez) dias corridos para regularização, sob pena de suspensão imediata.\n\nTesouraria — ${dados.nomeAssociacao}\n${dados.contatoTesouraria}`,

    ultimo_aviso: `Prezado(a) ${dados.nome},\n\nEsta é uma comunicação urgente da tesouraria da ${dados.nomeAssociacao}.\n\nSeu débito está há ${dados.diasAtraso} dias em aberto e a suspensão dos seus benefícios — incluindo o plano de saúde — ocorrerá automaticamente em aproximadamente ${dados.diasParaSuspensao} dias.\n\nTotal atualizado: R$ ${fmt(dados.valorAtualizado)}\n\nEntre em contato HOJE para negociar:\n${dados.contatoTesouraria}`,

    suspensao: `Prezado(a) ${dados.nome},\n\nInformamos que, em razão de mensalidades em aberto totalizando R$ ${fmt(dados.valorAtualizado)}, seus benefícios associativos foram suspensos a partir de hoje, conforme previsto no art. 57 do Código Civil e no Estatuto Social da ${dados.nomeAssociacao}.\n\nA suspensão inclui todos os benefícios da associação e o plano de saúde coletivo.\n\nA reativação ocorrerá mediante quitação integral ou acordo de parcelamento.\n\nTesouraria — ${dados.nomeAssociacao}\n${dados.contatoTesouraria}`,

    reativacao: `Olá, ${dados.nome}!\n\nConfirmamos o recebimento do pagamento/acordo referente às suas pendências com a ${dados.nomeAssociacao}.\n\nSeus benefícios associativos foram reativados a partir de hoje.\n\nObrigado pela regularização. Conte sempre conosco!\n\nTesouraria — ${dados.nomeAssociacao}`
  };

  return textos[etapa] ?? '';
}

function fmt(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}
```

---

## 5. Rotas de API — endpoints novos

> Criar sob o prefixo `/api/cobranca/` para não conflitar com rotas existentes.  
> Seguir o padrão de autenticação, middleware e response format já usado no sistema.

```
GET    /api/cobranca/associado/:id/resumo
       → Retorna: diasAtraso, totalAtualizado (com detalhamento),
                  proximaEtapa, ultimaAcao, statusSuspensao

GET    /api/cobranca/associado/:id/historico
       → Retorna: lista de cobranca_acoes do associado (ordenado por data DESC)

POST   /api/cobranca/associado/:id/acao
       → Body: { etapa, canal, textoEnviado, observacao }
       → Cria registro em cobranca_acoes
       → Retorna: acao criada

GET    /api/cobranca/associado/:id/texto/:etapa
       → Retorna: texto pré-gerado para a etapa informada,
                  com dados do associado já substituídos

GET    /api/cobranca/associado/:id/acordos
       → Retorna: lista de acordos do associado com parcelas

POST   /api/cobranca/associado/:id/acordo
       → Body: { valorTotal, numeroParcelas, dataPrimeira, observacoes }
       → Cria acordo + parcelas automaticamente

PATCH  /api/cobranca/acordo/:acordoId/parcela/:parcelaId/pagar
       → Body: { pagoValor, pagoEm }
       → Marca parcela como paga; atualiza status do acordo

GET    /api/cobranca/lista
       → Retorna: todos os associados inadimplentes com:
                  diasAtraso, totalAtualizado, proximaEtapa,
                  ultimaAcao (data + tipo), statusSuspensao
       → Ordenação padrão: diasAtraso DESC
```

---

## 6. Componentes de interface

> Seguir rigorosamente o design system atual: mesmas cores, fontes, tamanhos, bordas, espaçamentos, classes CSS e componentes já usados na tela `/financeiro`.  
> Não instalar novas bibliotecas de UI. Não criar novos tokens de design. Reaproveitar os existentes.

### 6.1 Modificação na tela de inadimplência existente

**O único ajuste permitido na tela atual** é no botão "Acionar Cobrança" de cada linha da tabela:

- Alterar o comportamento de clique para abrir o **painel lateral de cobrança** (drawer/sidebar) em vez de qualquer ação atual
- Adicionar duas colunas na tabela: **"Última ação"** e **"Próxima etapa"**
  - "Última ação": data + tipo da ação mais recente (vindo de `cobranca_acoes`)
  - "Próxima etapa": badge colorido calculado por `determinarProximaEtapa()`
- Nenhum outro elemento da tela deve ser alterado

**Badge de próxima etapa — cores seguindo o padrão do sistema:**

| Urgência | Cor do badge |
|----------|-------------|
| `baixa` | Azul (mesmo padrão dos badges informativos do sistema) |
| `media` | Amarelo/laranja (mesmo padrão dos badges de atenção) |
| `alta` | Vermelho claro (mesmo padrão dos badges de alerta) |
| `critica` | Vermelho escuro (mesmo padrão dos badges críticos — já usado em "CRÍTICO 3+ MESES") |

---

### 6.2 Painel lateral de cobrança (drawer)

Aberto ao clicar em "Acionar Cobrança". Deve usar o mesmo componente de drawer/sidebar já existente no sistema (se houver). Se não houver drawer, criar um painel que desliza da direita, com overlay, seguindo o padrão visual do sistema.

**Estrutura do painel:**

```
┌─────────────────────────────────────┐
│ [Avatar] Nome do associado  [Fechar]│
│ Badge status · Matrícula #XXXX      │
├─────────────────────────────────────┤
│ Cards de resumo (2x2):              │
│  Dias de atraso | Total atualizado  │
│  Ações feitas   | Status plano      │
├─────────────────────────────────────┤
│ Tabs: [ Histórico ] [ Acordo ]      │
├─────────────────────────────────────┤
│ (aba Histórico)                     │
│ Linha do tempo das ações realizadas │
│ com: data, etapa, canal, observação │
├─────────────────────────────────────┤
│ Botão: + Registrar nova ação        │
└─────────────────────────────────────┘
```

**Ao clicar em "+ Registrar nova ação"**, exibir um formulário inline (não abrir outro modal) com:

1. Seletor de **tipo de ação** (chips/tags selecionáveis: WhatsApp, E-mail, Carta formal, Notif. extrajudicial, Ligação, Acordo firmado, Suspensão)
2. Seletor de **etapa** (chips pré-selecionados automaticamente com base em `determinarProximaEtapa()`, mas editável)
3. **Texto gerado automaticamente** (somente leitura, com botão "Copiar") — busca de `/api/cobranca/associado/:id/texto/:etapa`
4. Campo de **observação** livre (textarea)
5. Botão **Salvar registro** → chama `POST /api/cobranca/associado/:id/acao`

**Aba Acordo:**

Exibe acordos existentes com status de cada parcela. Botão "Novo acordo" abre formulário com: valor total, número de parcelas, data da primeira parcela, observações. O sistema calcula e exibe as parcelas automaticamente antes de confirmar.

---

### 6.3 Coluna "Última ação" e "Próxima etapa" na tabela

```typescript
// Exemplo de query para popular a tabela com os novos dados
// Fazer como uma query separada / join opcional para não impactar
// a query principal existente da listagem de inadimplência

SELECT
  ca.associado_id,
  ca.etapa       AS ultima_etapa,
  ca.canal       AS ultimo_canal,
  ca.realizado_em AS ultima_acao_em
FROM cobranca_acoes ca
WHERE ca.id = (
  SELECT id FROM cobranca_acoes
  WHERE associado_id = ca.associado_id
  ORDER BY realizado_em DESC
  LIMIT 1
)
```

> Esta query deve ser executada separadamente e mesclada no frontend, **não** como JOIN na query de inadimplência existente, para não impactar sua performance.

---

## 7. Configurações do sistema

Criar uma seção de configuração em **Configurações → Cobrança** (nova sub-rota dentro da área de configurações já existente) com os seguintes parâmetros editáveis:

| Parâmetro | Padrão | Descrição |
|-----------|--------|-----------|
| Nome da associação | — | Usado nos textos das mensagens |
| Contato da tesouraria | — | Telefone/e-mail exibido nas mensagens |
| Multa moratória (%) | 2,00 | Percentual fixo sobre o valor original |
| Juros de mora (% a.m.) | 1,00 | Percentual mensal proporcional por dia |
| Dias para suspensão | 90 | Dias de atraso que acionam a suspensão |

Esses valores devem ser lidos pelas funções de cálculo e geração de texto — nunca hardcoded.

---

## 8. Ordem de implementação recomendada

Seguir esta sequência para garantir que o sistema não fique em estado inconsistente em nenhum momento:

1. **Banco de dados** — criar as 3 tabelas novas (sem tocar nas existentes)
2. **Funções de negócio** — implementar e testar isoladamente as funções de cálculo
3. **API** — criar os endpoints novos com seus testes
4. **Configurações** — criar a tela de configuração e persistência dos parâmetros
5. **Painel lateral** — construir o drawer de cobrança do zero, sem alterar nada existente
6. **Integração na tabela** — por último, adicionar as duas colunas novas e ajustar o botão "Acionar Cobrança" — este é o único ponto de contato com código existente

---

## 9. Testes obrigatórios antes de subir para produção

- [ ] A tela de inadimplência existente funciona identicamente ao estado anterior (cards de resumo, listagem, filtros, valores)
- [ ] O fluxo financeiro principal não é afetado
- [ ] Cálculo de encargos correto para 1, 30, 60 e 90 dias de atraso
- [ ] `determinarProximaEtapa()` retorna o valor correto para cada faixa de dias
- [ ] Geração de texto funciona para todas as 8 etapas
- [ ] Registro de ação persiste corretamente e aparece no histórico
- [ ] Acordo cria as parcelas na quantidade e valores corretos
- [ ] Painel lateral abre e fecha sem quebrar a tela de fundo
- [ ] Configurações são salvas e lidas corretamente pelas funções de cálculo

---

## 10. O que NÃO fazer

- ❌ Não alterar o schema de tabelas existentes
- ❌ Não modificar queries existentes de inadimplência, fluxo de caixa ou lançamentos
- ❌ Não instalar novas bibliotecas de UI ou design system
- ❌ Não criar novos tokens de cor, tipografia ou espaçamento
- ❌ Não alterar rotas existentes
- ❌ Não refatorar componentes existentes "aproveitando a oportunidade"
- ❌ Não mover ou renomear arquivos existentes
- ❌ Não criar tela separada para cobrança — tudo parte da tela de inadimplência existente

---

*Documento gerado em 04/06/2026 para uso interno de desenvolvimento do sistema ACPROBEC.*
