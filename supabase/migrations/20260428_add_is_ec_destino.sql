-- Adiciona coluna para identificar lançamentos de destino em encontro de contas
-- Isso permite pular a integração contábil e exibir a tag visual correta
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS is_ec_destino BOOLEAN DEFAULT false;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS id_origem UUID REFERENCES lancamentos(id) ON DELETE SET NULL;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS valor_pago_ec NUMERIC(12,2) DEFAULT 0;


