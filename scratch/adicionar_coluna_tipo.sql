-- Executar no SQL Editor do Supabase para atualizar a tabela de responsáveis

ALTER TABLE responsaveis_atendimento
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Atendimento Presencial';

-- Atualiza o cache do PostgREST para a API reconhecer a nova coluna imediatamente
NOTIFY pgrst, 'reload schema';
