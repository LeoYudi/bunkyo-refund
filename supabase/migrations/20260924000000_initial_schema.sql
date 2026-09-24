-- ====================================================================================
-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS (SUPABASE)
-- ====================================================================================

-- 1. Criação de Tipos e Enums
CREATE TYPE user_role AS ENUM ('ADMIN');

CREATE TYPE refund_status AS ENUM (
  'PENDING',    -- Recebido do form público
  'PROCESSING', -- Em extração pela IA
  'APPROVED',   -- Revisado e validado
  'DENIED',     -- Negado/Cancelado
  'SENT',       -- Enviado ao financeiro
  'PAID'        -- Pago
);

-- ====================================================================================

-- 2. Criação das Tabelas
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados preenchidos pelo usuário
    requester_name VARCHAR(255) NOT NULL,
    receipt_file_url VARCHAR(1024) NOT NULL,
    
    -- Controle de estado
    status refund_status NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Dados extraídos pela IA
    issuer_name VARCHAR(255),
    issuer_cnpj VARCHAR(20),
    receiver_cnpj VARCHAR(20),
    total_value NUMERIC(10,2),
    issue_date DATE,
    issue_number VARCHAR(100),
    description TEXT
);

-- ====================================================================================

-- 3. Constraints e Triggers
ALTER TABLE refund_requests 
ADD CONSTRAINT check_total_value_positive CHECK (total_value > 0);

-- Trigger para atualizar automaticamente o 'updated_at'
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_refund_requests_updated_at
BEFORE UPDATE ON refund_requests
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ====================================================================================

-- 4. Segurança de Nível de Linha (Row Level Security - RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Função auxiliar super-rápida para verificar se o logado é ADMIN
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas da tabela Profiles
CREATE POLICY "Admins can do everything on profiles" 
ON profiles FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- Políticas da tabela Refund Requests
-- Anônimos PÓDEM inserir novas requisições (formulário público), mas NÃO podem ler nada
CREATE POLICY "Anon can insert refund requests" 
ON refund_requests FOR INSERT TO anon 
WITH CHECK (true);

-- Admins podem ler e gerenciar tudo
CREATE POLICY "Admins can manage refund requests" 
ON refund_requests FOR ALL TO authenticated USING (is_admin());
