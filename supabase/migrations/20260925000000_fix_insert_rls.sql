-- Remover a política antiga restrita ao 'anon'
DROP POLICY IF EXISTS "Anon can insert refund requests" ON refund_requests;

-- Criar política nova permitindo 'public' (anon + authenticated) inserir
CREATE POLICY "Anyone can insert refund requests" 
ON refund_requests FOR INSERT TO public 
WITH CHECK (true);
