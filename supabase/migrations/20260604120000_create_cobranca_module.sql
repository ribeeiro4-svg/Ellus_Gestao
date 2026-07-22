-- ============================================================
-- Módulo de Cobrança — ACPROBEC
-- Migration: criação das tabelas e seed dos templates oficiais
-- Versão: 2.0 — baseada em ACPROBEC_templates_mensagens_cobranca.md
-- ============================================================

CREATE TABLE IF NOT EXISTS cobranca_acoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id        UUID NOT NULL,
  etapa               VARCHAR(10) NOT NULL,   -- 1A, 1B, 2A ... 7B
  canal               VARCHAR(50) NOT NULL,   -- whatsapp | email | carta | cartorio | ligacao
  texto_enviado       TEXT,
  observacao          TEXT,
  realizado_por       UUID NOT NULL,
  realizado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dias_atraso_momento INTEGER,
  valor_momento       NUMERIC(10,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cobranca_acoes_associado    ON cobranca_acoes(associado_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_acoes_realizado_em ON cobranca_acoes(realizado_em DESC);

-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cobranca_acordos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id        UUID NOT NULL,
  valor_total         NUMERIC(10,2) NOT NULL,
  numero_parcelas     INTEGER NOT NULL,
  valor_parcela       NUMERIC(10,2) NOT NULL,
  data_primeira       DATE NOT NULL,
  observacoes         TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ativo',  -- ativo | quitado | inadimplente
  criado_por          UUID NOT NULL,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cobranca_acordos_associado ON cobranca_acordos(associado_id);

-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cobranca_acordos_parcelas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acordo_id       UUID NOT NULL REFERENCES cobranca_acordos(id) ON DELETE CASCADE,
  numero          INTEGER NOT NULL,
  vencimento      DATE NOT NULL,
  valor           NUMERIC(10,2) NOT NULL,
  pago_em         DATE,
  pago_valor      NUMERIC(10,2),
  status          VARCHAR(20) NOT NULL DEFAULT 'pendente'   -- pendente | pago | atrasado
);

CREATE INDEX IF NOT EXISTS idx_parcelas_acordo ON cobranca_acordos_parcelas(acordo_id);

-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cobranca_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(10) NOT NULL UNIQUE,   -- 1A, 1B, 2A ... 7B
  etapa       VARCHAR(50) NOT NULL,          -- lembrete | reforco | formal | ...
  canal       VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
  dias_min    INTEGER NOT NULL,
  dias_max    INTEGER NOT NULL,
  tom         VARCHAR(50) NOT NULL DEFAULT 'amigavel',
  titulo      VARCHAR(200) NOT NULL,
  texto       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cobranca_configuracoes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_associacao         VARCHAR(255),
  nome_tesoureiro         VARCHAR(255),
  contato_tesouraria      VARCHAR(255),
  cidade                  VARCHAR(100),
  multa_moratoria_perc    NUMERIC(5,2) NOT NULL DEFAULT 2.00,
  juros_mora_mensal_perc  NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  dias_para_suspensao     INTEGER NOT NULL DEFAULT 90,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- Configuração padrão
-- ----------------------------------------------------------------
INSERT INTO cobranca_configuracoes
  (nome_associacao, nome_tesoureiro, contato_tesouraria, cidade, multa_moratoria_perc, juros_mora_mensal_perc, dias_para_suspensao)
VALUES
  ('ACPROBEC', 'Tesoureiro(a)', '(00) 00000-0000', 'Petrolina-PE', 2.00, 1.00, 90)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- Templates oficiais — baseados em ACPROBEC_templates_mensagens_cobranca.md
-- ----------------------------------------------------------------
INSERT INTO cobranca_templates (codigo, etapa, canal, dias_min, dias_max, tom, titulo, texto) VALUES

-- ETAPA 1 — Lembrete amigável
('1A', 'lembrete', 'whatsapp', 1, 3, 'amigavel', 'Lembrete simples (D+1 a D+3)',
'Olá, {{nome}}! Tudo bem?

Passando para lembrar que a mensalidade de {{mes_ano}} da {{nome_associacao}}, no valor de R$ 50,00, venceu no dia {{data_vencimento}}.

Caso já tenha realizado o pagamento, desconsidere esta mensagem. 😊

Qualquer dúvida, estamos à disposição!

Tesouraria — {{nome_associacao}}
{{contato_tesouraria}}'),

('1B', 'lembrete', 'whatsapp', 4, 7, 'amigavel', 'Lembrete reforçado (D+4 a D+7)',
'Olá, {{nome}}!

Ainda não identificamos o pagamento da mensalidade de {{mes_ano}} da {{nome_associacao}}, no valor de R$ 50,00.

Se já pagou, por favor nos confirme pelo número abaixo para baixarmos no sistema.

Se ainda não pagou, fique tranquilo(a) — é só entrar em contato e a gente resolve! 😊

{{contato_tesouraria}}
Tesouraria — {{nome_associacao}}'),

-- ETAPA 2 — Reforço com encargos
('2A', 'reforco', 'whatsapp', 8, 15, 'cordial', 'Reforço inicial (D+8 a D+15)',
'Olá, {{nome}}!

Identificamos que a mensalidade de {{mes_ano}} da {{nome_associacao}} ainda consta em aberto.

📋 Detalhamento:
• Valor original: R$ {{valor_original}}
• Multa (2%): {{valor_multa}}
• Juros (1% a.m.): {{valor_juros}}
• Total atualizado: {{valor_total}}

Para regularizar, entre em contato com a tesouraria ou realize o pagamento pelo canal de sua preferência.

{{contato_tesouraria}}
Tesouraria — {{nome_associacao}}'),

('2B', 'reforco', 'whatsapp', 16, 30, 'cordial', 'Reforço tardio (D+16 a D+30)',
'Olá, {{nome}}.

Sua mensalidade de {{mes_ano}} está há {{dias_atraso}} dias em aberto na {{nome_associacao}}.

📋 Valor atualizado:
• Principal: R$ {{valor_original}}
• Multa (2%): {{valor_multa}}
• Juros: {{valor_juros}}
• Total: {{valor_total}}

Pedimos que regularize o quanto antes para manter seus benefícios em dia, incluindo o plano de saúde.

Para dúvidas ou pagamento:
{{contato_tesouraria}}

Tesouraria — {{nome_associacao}}'),

-- ETAPA 3 — Comunicação formal
('3A', 'formal', 'email', 37, 43, 'formal', 'Carta formal (D+37)',
'Prezado(a) {{nome_completo}},

Comunicamos que constam em aberto {{qtd_mensalidades}} mensalidade(s) da {{nome_associacao}}, conforme abaixo:

Mensalidades em aberto: {{meses_abertos}}
Total em aberto: {{valor_total}}
(Inclui multa de 2% e juros de 1% ao mês, conforme estatuto)

Informamos que, conforme o Estatuto Social da {{nome_associacao}} e o art. 57 do Código Civil, o associado inadimplente por prazo superior a 90 dias está sujeito à suspensão dos benefícios associativos, incluindo o plano de saúde coletivo.

Sua situação atual: {{dias_atraso}} dias em atraso.
Prazo até a suspensão: aproximadamente {{dias_restantes}} dias.

Solicitamos a regularização em até 10 dias a contar desta comunicação.

Para pagamento, negociação ou dúvidas:
{{contato_tesouraria}}

Atenciosamente,
{{nome_tesoureiro}}
Tesouraria — {{nome_associacao}}
Data: {{data_hoje}}'),

('3B', 'formal', 'whatsapp', 44, 60, 'formal', 'Reforço formal (D+44)',
'Prezado(a) {{nome}},

Retornamos para informar que as pendências financeiras abaixo continuam em aberto com a {{nome_associacao}}:

Meses em aberto: {{meses_abertos}}
Total atualizado: {{valor_total}}

⚠️ Atenção: o plano de saúde já possui boletos em aberto, o que coloca seu benefício em risco iminente de suspensão pela operadora.

Pedimos que entre em contato com urgência para evitar a interrupção dos seus benefícios.

{{contato_tesouraria}}
Tesouraria — {{nome_associacao}}'),

-- ETAPA 4 — Notificação extrajudicial pré-suspensão
('4A', 'pre_notificacao', 'carta', 61, 73, 'juridico', 'Notificação extrajudicial (D+67)',
'NOTIFICAÇÃO EXTRAJUDICIAL

{{nome_associacao}}
Endereço: [endereço da associação]

Destinatário(a): {{nome_completo}}
Matrícula: {{matricula}}

{{cidade}}, {{data_hoje}}

A {{nome_associacao}}, por meio de sua Tesouraria, vem por meio desta NOTIFICAÇÃO EXTRAJUDICIAL comunicar o seguinte:

1. Consta(m) em aberto {{qtd_mensalidades}} mensalidade(s) associativa(s) referente(s) a {{meses_abertos}}, totalizando {{valor_total}}, acrescido de multa de 2% (dois por cento) e juros moratórios de 1% (um por cento) ao mês, calculados proporcionalmente ao período de inadimplência, conforme previsto no Estatuto Social desta associação.

2. Nos termos do art. 57 do Código Civil Brasileiro (Lei 10.406/2002), o associado inadimplente por prazo superior a 90 (noventa) dias está sujeito à suspensão dos benefícios associativos, assegurado o direito de defesa e recurso, conforme previsto no estatuto.

3. A suspensão abrangerá todos os benefícios associativos, incluindo o plano de saúde coletivo operado em parceria com esta associação, nos termos da Lei 9.656/1998.

4. Situação atual: {{dias_atraso}} dias de inadimplência.
   Prazo até a suspensão: {{dias_restantes}} dias (data prevista: {{data_suspensao}}).

CONCEDEMOS o prazo de 10 (dez) dias corridos, a contar do recebimento desta notificação, para regularização integral do débito ou contato para acordo de parcelamento, sob pena de suspensão automática ao atingir 90 dias de inadimplência.

Para regularização ou negociação:
{{contato_tesouraria}}

____________________________
{{nome_tesoureiro}}
Tesoureiro(a) — {{nome_associacao}}'),

('4B', 'ultimo_aviso', 'whatsapp', 74, 89, 'urgente', 'Último aviso antes da suspensão (D+74)',
'Prezado(a) {{nome}},

⚠️ COMUNICAÇÃO URGENTE — Tesouraria {{nome_associacao}}

Seu débito está há {{dias_atraso}} dias em aberto e a suspensão dos seus benefícios — incluindo o plano de saúde — ocorrerá automaticamente em {{dias_restantes}} dias ({{data_suspensao}}).

💰 Total atualizado: {{valor_total}}
📅 Meses em aberto: {{meses_abertos}}

A notificação extrajudicial formal já foi enviada conforme exige o art. 57 do Código Civil.

Entre em contato HOJE para negociarmos:
{{contato_tesouraria}}

Queremos encontrar uma solução junto com você.

Tesouraria — {{nome_associacao}}'),

-- ETAPA 5 — Suspensão efetivada
('5A', 'suspensao', 'email', 90, 999, 'formal', 'Comunicado de suspensão — e-mail/carta',
'Prezado(a) {{nome_completo}},

Informamos que, em razão de {{qtd_mensalidades}} mensalidade(s) em aberto totalizando {{valor_total}}, seus benefícios associativos foram suspensos a partir de {{data_hoje}}, conforme previsto no art. 57 do Código Civil e no Estatuto Social da {{nome_associacao}}.

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
{{data_hoje}}'),

('5B', 'suspensao', 'whatsapp', 90, 999, 'formal', 'Comunicado de suspensão — WhatsApp',
'Prezado(a) {{nome}},

Comunicamos que seus benefícios na {{nome_associacao}} foram suspensos a partir de hoje ({{data_hoje}}) em razão de {{dias_atraso}} dias de inadimplência.

❌ Benefícios suspensos:
• Benefícios associativos
• Plano de saúde (comunicado à operadora)

💰 Total em aberto: {{valor_total}}
📅 Referente a: {{meses_abertos}}

✅ Para reativar: entre em contato para quitar ou negociar parcelamento.

{{contato_tesouraria}}
Tesouraria — {{nome_associacao}}'),

-- ETAPA 6 — Reativação
('6A', 'reativacao', 'whatsapp', 0, 0, 'positivo', 'Reativação por quitação integral',
'Olá, {{nome}}!

Confirmamos o recebimento do pagamento integral das suas pendências com a {{nome_associacao}}. ✅

Seus benefícios associativos estão reativados a partir de hoje, {{data_hoje}}.

Sobre o plano de saúde: a reativação será processada pela operadora conforme o prazo dela — em caso de dúvidas, entre em contato diretamente com o plano.

Obrigado pela regularização. Conte sempre conosco!

Tesouraria — {{nome_associacao}}
{{contato_tesouraria}}'),

('6B', 'reativacao', 'whatsapp', 0, 0, 'positivo', 'Reativação por acordo de parcelamento',
'Olá, {{nome}}!

Confirmamos a assinatura do acordo de parcelamento com a {{nome_associacao}}. ✅

Seus benefícios associativos estão reativados a partir de hoje, {{data_hoje}}, condicionados ao cumprimento do acordo firmado.

⚠️ Importante: o não pagamento de qualquer parcela nas datas acordadas poderá resultar na suspensão imediata dos benefícios.

Sobre o plano de saúde: a reativação será processada pela operadora conforme o prazo dela.

Qualquer dúvida, estamos à disposição.

Tesouraria — {{nome_associacao}}
{{contato_tesouraria}}'),

-- ETAPA 7 — Acompanhamento de acordo
('7A', 'acompanhamento_acordo', 'whatsapp', 0, 0, 'lembrete', 'Parcela a vencer (3 dias antes)',
'Olá, {{nome}}!

Lembrando que a parcela {{numero_parcela}} de {{total_parcelas}} do seu acordo com a {{nome_associacao}} vence em {{data_vencimento_parcela}}.

💰 Valor da parcela: {{valor_parcela}}

Para manter seus benefícios ativos, lembre-se de realizar o pagamento na data combinada.

Qualquer dúvida:
{{contato_tesouraria}}

Tesouraria — {{nome_associacao}}'),

('7B', 'acompanhamento_acordo', 'whatsapp', 0, 0, 'alerta', 'Parcela em atraso',
'Prezado(a) {{nome}},

Identificamos que a parcela {{numero_parcela}} do seu acordo com a {{nome_associacao}}, com vencimento em {{data_vencimento_parcela}}, ainda não foi paga.

💰 Valor em aberto: {{valor_parcela}}

O não cumprimento do acordo pode resultar na suspensão imediata dos benefícios associativos e do plano de saúde.

Entre em contato o quanto antes:
{{contato_tesouraria}}

Tesouraria — {{nome_associacao}}')

ON CONFLICT (codigo) DO UPDATE SET
  texto = EXCLUDED.texto,
  titulo = EXCLUDED.titulo,
  updated_at = NOW();
