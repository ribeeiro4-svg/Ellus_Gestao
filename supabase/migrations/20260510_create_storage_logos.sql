
-- ============================================================
-- 20260510_create_storage_logos.sql
-- ============================================================

-- 1. Criar o bucket de logos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS (geralmente já habilitado por padrão em storage.objects)

-- 3. Política: Acesso Público para Visualização
DROP POLICY IF EXISTS "Public View Logos" ON storage.objects;
CREATE POLICY "Public View Logos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

-- 4. Política: Apenas usuários autenticados podem fazer Upload
DROP POLICY IF EXISTS "Authenticated Upload Logos" ON storage.objects;
CREATE POLICY "Authenticated Upload Logos" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- 5. Política: Apenas usuários autenticados podem Atualizar/Deletar
DROP POLICY IF EXISTS "Authenticated Update Logos" ON storage.objects;
CREATE POLICY "Authenticated Update Logos" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Delete Logos" ON storage.objects;
CREATE POLICY "Authenticated Delete Logos" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
