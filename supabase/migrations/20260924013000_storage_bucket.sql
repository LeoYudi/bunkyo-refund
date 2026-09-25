-- Cria o bucket "receipts" de forma pública
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- RLS nos objetos do storage já vem habilitado por padrão no Supabase

-- Política para permitir que qualquer pessoa (anon ou autenticada) faça upload
CREATE POLICY "Anon can upload receipts"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'receipts');

-- Política para permitir leitura pública
CREATE POLICY "Anyone can read receipts"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'receipts');
