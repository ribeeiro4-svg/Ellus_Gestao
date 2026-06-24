-- Adicionar coluna para status de cobrança em mensalidades atrasadas
ALTER TABLE lancamentos ADD COLUMN status_cobranca TEXT;
