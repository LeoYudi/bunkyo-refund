-- Permite que administradores autenticados possam deletar arquivos no bucket receipts
CREATE POLICY "Admins can delete receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND public.is_admin());
