# Templates de mensagens de cobrança — ACPROBEC
**Módulo:** Cobrança / Inadimplência  
**Versão:** 1.0  
**Data:** 04/06/2026  

---

## Instruções para o sistema

Cada template abaixo deve ser cadastrado como um registro na tabela de templates do sistema. As variáveis entre `{{chaves}}` devem ser substituídas dinamicamente pelos dados reais do associado no momento em que o texto for gerado.

### Variáveis disponíveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{nome}}` | Primeiro nome do associado | Maria Helena |
| `{{nome_completo}}` | Nome completo | Maria Helena Pereira |
| `{{mes_ano}}` | Mês e ano da mensalidade mais antiga em aberto | março/2026 |
| `{{meses_abertos}}` | Lista de meses em aberto | março, abril e maio/2026 |
| `{{qtd_mensalidades}}` | Quantidade de mensalidades em aberto | 3 |
| `{{valor_original}}` | Valor original sem encargos | R$ 50,00 |
| `{{valor_multa}}` | Valor da multa (2%) | R$ 1,00 |
| `{{valor_juros}}` | Valor dos juros proporcionais | R$ 1,50 |
| `{{valor_total}}` | Total atualizado com encargos | R$ 202,50 |
| `{{dias_atraso}}` | Dias corridos desde o primeiro vencimento | 74 |
| `{{dias_restantes}}` | Dias restantes até completar 90 dias | 16 |
| `{{data_suspensao}}` | Data prevista para suspensão | 15/06/2026 |
| `{{data_vencimento}}` | Data de vencimento da mensalidade mais antiga | 28/02/2026 |
| `{{data_hoje}}` | Data atual | 04/06/2026 |
| `{{nome_associacao}}` | Nome da associação | ACPROBEC |
| `{{contato_tesouraria}}` | Contato do tesoureiro (tel/e-mail) | (87) 9 9999-9999 |
| `{{nome_tesoureiro}}` | Nome do tesoureiro responsável | João Silva |
| `{{matricula}}` | Número de matrícula do associado | #0042 |

---

## Etapa 1 — Lembrete amigável
**Gatilho:** D+1 a D+7  
**Canal:** WhatsApp  
**Etapa interna:** `lembrete`  
**Tom:** Informal, amigável, sem pressão

---

### Template 1A — lembrete simples (D+1 a D+3)

```
Olá, {{nome}}! Tudo bem?

Passando para lembrar que a mensalidade de {{mes_ano}} da {{nome_associacao}}, no valor de R$ 50,00, venceu no dia {{data_vencimento}}.

Caso já tenha realizado o pagamento, desconsidere esta mensagem. 😊

Qualquer dúvida, estamos à disposição!

Tesouraria — {{nome_associacao}}
{{contato_tesouraria}}
```

---

### Template 1B — lembrete reforçado (D+4 a D+7)

```
Olá, {{nome}}!

Ainda não identificamos o pagamento da mensalidade de {{mes_ano}} da {{nome_associacao}}, no valor de R$ 50,00.

Se já pagou, por favor nos confirme pelo número abaixo para baixarmos no sistema.

Se ainda não pagou, fique tranquilo(a) — é só entrar em contato e a gente resolve! 😊

{{contato_tesouraria}}
Tesouraria — {{nome_associacao}}
```

---

## Etapa 2 — Reforço com encargos
**Gatilho:** D+8 a D+30  
**Canal:** WhatsApp + E-mail  
**Etapa interna:** `reforco`  
**Tom:** Cordial, informativo, já menciona encargos

---

### Template 2A — reforço inicial (D+8 a D+15)

```
Olá, {{nome}}!

Identificamos que a mensalidade de {{mes_ano}} da {{nome_associacao}} ainda consta em aberto.

📋 Detalhamento:
• Valor original: R$ 50,00
• Multa (2%): {{valor_multa}}
• Juros (1% a.m.): {{valor_juros}}
• Total atualizado: {{valor_total}}

Para regularizar, entre em contato com a tesouraria ou realize o pagamento pelo canal de sua preferência.

{{contato_tesouraria}}
Tesouraria — {{nome_associacao}}
```

---

### Template 2B — reforço tardio (D+16 a D+30)

```
Olá, {{nome}}.

Sua mensalidade de {{mes_ano}} está há {{dias_atraso}} dias em aberto na {{nome_associacao}}.

📋 Valor atualizado:
• Principal: R$ 50,00
• Multa (2%): {{valor_multa}}
• Juros: {{valor_juros}}
• Total: {{valor_total}}

Pedimos que regularize o quanto antes para manter seus benefícios em dia, incluindo o plano de saúde.

Para dúvidas ou pagamento:
{{contato_tesouraria}}

Tesouraria — {{nome_associacao}}
```

---

## Etapa 3 — Comunicação formal
**Gatilho:** D+31 a D+44 (envios em D+37 e D+44)  
**Canal:** E-mail (principal) + WhatsApp (reforço)  
**Etapa interna:** `formal`  
**Tom:** Formal, objetivo, menciona risco de suspensão

---

### Template 3A — carta formal (D+37) — versão e-mail/carta

```
Prezado(a) {{nome_completo}},

Comunicamos que constam em aberto {{qtd_mensalidades}} mensalidade(s) 
da {{nome_associacao}}, conforme abaixo:

Mensalidades em aberto: {{meses_abertos}}
Total em aberto: {{valor_total}}
(Inclui multa de 2% e juros de 1% ao mês, conforme estatuto)

Informamos que, conforme o Estatuto Social da {{nome_associacao}} e o 
art. 57 do Código Civil, o associado inadimplente por prazo superior a 
90 dias está sujeito à suspensão dos benefícios associativos, incluindo 
o plano de saúde coletivo.

Sua situação atual: {{dias_atraso}} dias em atraso.
Prazo até a suspensão: aproximadamente {{dias_restantes}} dias.

Solicitamos a regularização em até 10 dias a contar desta comunicação.

Para pagamento, negociação ou dúvidas:
{{contato_tesouraria}}

Atenciosamente,
{{nome_tesoureiro}}
Tesouraria — {{nome_associacao}}
Data: {{data_hoje}}
```

---

### Template 3B — reforço formal (D+44) — WhatsApp

```
Prezado(a) {{nome}},

Retornamos para informar que as pendências financeiras abaixo continuam em aberto com a {{nome_associacao}}:

Meses em aberto: {{meses_abertos}}
Total atualizado: {{valor_total}}

⚠️ Atenção: o plano de saúde já possui boletos em aberto, o que coloca seu benefício em risco iminente de suspensão pela operadora.

Pedimos que entre em contato com urgência para evitar a interrupção dos seus benefícios.

{{contato_tesouraria}}
Tesouraria — {{nome_associacao}}
```

---

## Etapa 4 — Notificação extrajudicial pré-suspensão
**Gatilho:** D+61 a D+89 (envios em D+67 e D+74)  
**Canal:** Cartório / Carta AR (D+67) + WhatsApp urgente (D+74)  
**Etapa interna:** `pre_notificacao` (D+67) e `ultimo_aviso` (D+74)  
**Tom:** Formal-legal, prazo explícito, base jurídica citada

---

### Template 4A — notificação extrajudicial (D+67) — carta AR ou cartório

```
NOTIFICAÇÃO EXTRAJUDICIAL

{{nome_associacao}}
CNPJ: [CNPJ da associação]
Endereço: [endereço da associação]

Destinatário(a): {{nome_completo}}
Matrícula: {{matricula}}
Endereço: [endereço do associado — puxar do cadastro]

{{cidade}}, {{data_hoje}}

A {{nome_associacao}}, por meio de sua Tesouraria, vem por meio desta 
NOTIFICAÇÃO EXTRAJUDICIAL comunicar o seguinte:

1. Consta(m) em aberto {{qtd_mensalidades}} mensalidade(s) associativa(s) 
   referente(s) a {{meses_abertos}}, totalizando {{valor_total}}, 
   acrescido de multa de 2% (dois por cento) e juros moratórios de 1% 
   (um por cento) ao mês, calculados proporcionalmente ao período de 
   inadimplência, conforme previsto no Estatuto Social desta associação.

2. Nos termos do art. 57 do Código Civil Brasileiro (Lei 10.406/2002), 
   o associado inadimplente por prazo superior a 90 (noventa) dias está 
   sujeito à suspensão dos benefícios associativos, assegurado o direito 
   de defesa e recurso, conforme previsto no estatuto.

3. A suspensão abrangerá todos os benefícios associativos, incluindo 
   o plano de saúde coletivo operado em parceria com esta associação, 
   nos termos da Lei 9.656/1998.

4. Situação atual: {{dias_atraso}} dias de inadimplência.
   Prazo até a suspensão: {{dias_restantes}} dias (data prevista: {{data_suspensao}}).

CONCEDEMOS o prazo de 10 (dez) dias corridos, a contar do recebimento 
desta notificação, para regularização integral do débito ou contato 
para acordo de parcelamento, sob pena de suspensão automática ao 
atingir 90 dias de inadimplência.

Para regularização ou negociação:
{{contato_tesouraria}}

____________________________
{{nome_tesoureiro}}
Tesoureiro(a) — {{nome_associacao}}
```

---

### Template 4B — último aviso antes da suspensão (D+74) — WhatsApp

```
Prezado(a) {{nome}},

⚠️ COMUNICAÇÃO URGENTE — Tesouraria {{nome_associacao}}

Seu débito está há {{dias_atraso}} dias em aberto e a suspensão dos seus benefícios — incluindo o plano de saúde — ocorrerá automaticamente em {{dias_restantes}} dias ({{data_suspensao}}).

💰 Total atualizado: {{valor_total}}
📅 Meses em aberto: {{meses_abertos}}

A notificação extrajudicial formal já foi enviada conforme exige o art. 57 do Código Civil.

Entre em contato HOJE para negociarmos:
{{contato_tesouraria}}

Queremos encontrar uma solução junto com você.

Tesouraria — {{nome_associacao}}
```

---

## Etapa 5 — Suspensão efetivada
**Gatilho:** D+90 ou mais  
**Canal:** E-mail + WhatsApp + Carta  
**Etapa interna:** `suspensao`  
**Tom:** Formal, informativo, indica caminho para reativação

---

### Template 5A — comunicado de suspensão — e-mail/carta

```
Prezado(a) {{nome_completo}},

Informamos que, em razão de {{qtd_mensalidades}} mensalidade(s) em 
aberto totalizando {{valor_total}}, seus benefícios associativos foram 
suspensos a partir de {{data_hoje}}, conforme previsto no art. 57 do 
Código Civil e no Estatuto Social da {{nome_associacao}}.

Situação que gerou a suspensão:
• Mensalidades em aberto: {{meses_abertos}}
• Total devido: {{valor_total}}
• Dias de inadimplência: {{dias_atraso}} dias

A suspensão abrange:
• Todos os benefícios associativos
• Plano de saúde coletivo (comunicado à operadora nesta data)

A reativação dos benefícios ocorrerá mediante:
a) Quitação integral do débito, OU
b) Assinatura de acordo de parcelamento com a tesouraria

Para regularização:
{{contato_tesouraria}}

{{nome_tesoureiro}}
Tesouraria — {{nome_associacao}}
{{data_hoje}}
```

---

### Template 5B — comunicado de suspensão — WhatsApp

```
Prezado(a) {{nome}},

Comunicamos que seus benefícios na {{nome_associacao}} foram suspensos a partir de hoje ({{data_hoje}}) em razão de {{dias_atraso}} dias de inadimplência.

❌ Benefícios suspensos:
• Benefícios associativos
• Plano de saúde (comunicado à operadora)

💰 Total em aberto: {{valor_total}}
📅 Referente a: {{meses_abertos}}

✅ Para reativar: entre em contato para quitar ou negociar parcelamento.

{{contato_tesouraria}}
Tesouraria — {{nome_associacao}}
```

---

## Etapa 6 — Reativação
**Gatilho:** Após quitação integral ou assinatura de acordo  
**Canal:** WhatsApp  
**Etapa interna:** `reativacao`  
**Tom:** Positivo, acolhedor, confirma reativação

---

### Template 6A — reativação por quitação integral

```
Olá, {{nome}}!

Confirmamos o recebimento do pagamento integral das suas pendências com a {{nome_associacao}}. ✅

Seus benefícios associativos estão reativados a partir de hoje, {{data_hoje}}.

Sobre o plano de saúde: a reativação será processada pela operadora conforme o prazo dela — em caso de dúvidas, entre em contato diretamente com o plano.

Obrigado pela regularização. Conte sempre conosco!

Tesouraria — {{nome_associacao}}
{{contato_tesouraria}}
```

---

### Template 6B — reativação por acordo de parcelamento

```
Olá, {{nome}}!

Confirmamos a assinatura do acordo de parcelamento com a {{nome_associacao}}. ✅

Seus benefícios associativos estão reativados a partir de hoje, {{data_hoje}}, condicionados ao cumprimento do acordo firmado.

⚠️ Importante: o não pagamento de qualquer parcela nas datas acordadas poderá resultar na suspensão imediata dos benefícios.

Sobre o plano de saúde: a reativação será processada pela operadora conforme o prazo dela.

Qualquer dúvida, estamos à disposição.

Tesouraria — {{nome_associacao}}
{{contato_tesouraria}}
```

---

## Etapa 7 — Acompanhamento de acordo (pós-suspensão)
**Gatilho:** Parcela de acordo próxima do vencimento ou vencida  
**Canal:** WhatsApp  
**Etapa interna:** `acompanhamento_acordo`  
**Tom:** Lembrete amigável, mas com alerta sobre consequências

---

### Template 7A — lembrete de parcela a vencer (3 dias antes)

```
Olá, {{nome}}!

Lembrando que a parcela {{numero_parcela}} de {{total_parcelas}} do seu acordo com a {{nome_associacao}} vence em {{data_vencimento_parcela}}.

💰 Valor da parcela: {{valor_parcela}}

Para manter seus benefícios ativos, lembre-se de realizar o pagamento na data combinada.

Qualquer dúvida:
{{contato_tesouraria}}

Tesouraria — {{nome_associacao}}
```

---

### Template 7B — parcela em atraso

```
Prezado(a) {{nome}},

Identificamos que a parcela {{numero_parcela}} do seu acordo com a {{nome_associacao}}, com vencimento em {{data_vencimento_parcela}}, ainda não foi paga.

💰 Valor em aberto: {{valor_parcela}}

O não cumprimento do acordo pode resultar na suspensão imediata dos benefícios associativos e do plano de saúde.

Entre em contato o quanto antes:
{{contato_tesouraria}}

Tesouraria — {{nome_associacao}}
```

---

## Resumo dos templates por etapa

| Código | Etapa | Dias | Canal | Tom |
|--------|-------|------|-------|-----|
| 1A | Lembrete simples | D+1 a D+3 | WhatsApp | Amigável |
| 1B | Lembrete reforçado | D+4 a D+7 | WhatsApp | Amigável |
| 2A | Reforço inicial | D+8 a D+15 | WhatsApp + E-mail | Cordial |
| 2B | Reforço tardio | D+16 a D+30 | WhatsApp + E-mail | Cordial |
| 3A | Carta formal | D+37 | E-mail / Carta | Formal |
| 3B | Reforço formal | D+44 | WhatsApp | Formal |
| 4A | Notif. extrajudicial | D+67 | Carta AR / Cartório | Jurídico |
| 4B | Último aviso | D+74 | WhatsApp | Urgente |
| 5A | Suspensão — carta | D+90 | E-mail / Carta | Formal |
| 5B | Suspensão — WA | D+90 | WhatsApp | Formal |
| 6A | Reativação — quitação | Após pagamento | WhatsApp | Positivo |
| 6B | Reativação — acordo | Após acordo | WhatsApp | Positivo |
| 7A | Parcela a vencer | 3 dias antes | WhatsApp | Lembrete |
| 7B | Parcela em atraso | Dia seguinte ao venc. | WhatsApp | Alerta |

---

## Instruções de implementação no sistema

1. Cadastrar cada template com seu código (1A, 1B, 2A...) como identificador único
2. O sistema deve selecionar automaticamente o template sugerido com base nos `dias_atraso` do associado, mas permitir que o tesoureiro troque manualmente antes de copiar
3. Ao selecionar o template, substituir todas as variáveis `{{...}}` pelos dados reais do associado em tempo real, antes de exibir o texto
4. O campo de texto deve ser editável pelo tesoureiro antes de copiar — o template é um ponto de partida, não um texto bloqueado
5. Ao salvar o registro da ação, gravar o texto final (já editado, se for o caso) na coluna `texto_enviado` da tabela `cobranca_acoes`
6. Nos templates que mencionam base legal (art. 57 CC, Lei 9.656/1998), não permitir edição dessas referências no modo padrão — criar um aviso visual indicando que são trechos com embasamento jurídico

---

*Documento gerado em 04/06/2026 para uso interno de desenvolvimento do sistema ACPROBEC.*
