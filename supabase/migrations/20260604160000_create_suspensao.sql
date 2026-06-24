-- Adiciona os campos de suspensão à tabela associados
ALTER TABLE associados
ADD COLUMN IF NOT EXISTS suspensao_motivo TEXT,
ADD COLUMN IF NOT EXISTS suspensao_data TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspensao_arquivo_url TEXT;

-- Atualiza o CHECK constraint para incluir 'suspenso' (caso seja aplicado no banco)
ALTER TABLE associados DROP CONSTRAINT IF EXISTS associados_status_check;
ALTER TABLE associados ADD CONSTRAINT associados_status_check CHECK (status IN ('ativo','inativo','inadimplente','pendente','suspenso'));

-- Criação do bucket para os documentos (caso não exista)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos_associados', 'documentos_associados', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies para acesso seguro aos documentos
CREATE POLICY "Permitir leitura de documentos pelo tenant"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos_associados' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir upload de documentos pelo tenant"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos_associados' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir atualizacao de documentos pelo tenant"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'documentos_associados' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir remocao de documentos pelo tenant"
ON storage.objects FOR DELETE
USING (bucket_id = 'documentos_associados' AND auth.role() = 'authenticated');
