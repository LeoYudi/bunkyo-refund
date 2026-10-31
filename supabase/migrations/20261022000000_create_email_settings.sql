-- Migration: Create email_settings table
CREATE TABLE IF NOT EXISTS public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255) NOT NULL DEFAULT '',
  cc_email TEXT NOT NULL DEFAULT '',
  bcc_email TEXT NOT NULL DEFAULT '',
  subject_prefix VARCHAR(255) NOT NULL DEFAULT 'Reembolso CJB - ',
  default_event_description TEXT NOT NULL DEFAULT '',
  greeting_text TEXT NOT NULL DEFAULT 'Pessoal, bom dia.',
  intro_text_template TEXT NOT NULL DEFAULT 'Gostaria de solicitar o reembolso referente aos {eventDescription}.',
  spreadsheet_text TEXT NOT NULL DEFAULT 'A planilha compartilhada "Solicitação de Reembolso de Despesas" foi preenchida com os valores e informações das notas que competem ao evento.',
  approver_email VARCHAR(255) NOT NULL DEFAULT 'jaque.hanaoka@gmail.com',
  approval_request_text TEXT NOT NULL DEFAULT 'Por gentileza, poderia revisar e aprovar esta solicitação?',
  closing_text TEXT NOT NULL DEFAULT 'Atenciosamente,',
  sender_name VARCHAR(255) NOT NULL DEFAULT 'Lucas Tamanaha',
  sender_role VARCHAR(255) NOT NULL DEFAULT 'Diretor Financeiro da Comissão de Jovens do Bunkyo - Gestão 2026',
  sender_email VARCHAR(255) NOT NULL DEFAULT 'jovens@bunkyo.org.br',
  sender_phone VARCHAR(50) NOT NULL DEFAULT '(16) 99332-8607',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_email_settings_updated_at
BEFORE UPDATE ON public.email_settings
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email settings"
ON public.email_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
