DO $$
DECLARE
    new_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'admin@bunkyo.org.br',
        crypt('Admin123!', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}',
        false,
        '',
        '',
        '',
        ''
    );

    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        new_user_id,
        format('{"sub":"%s","email":"%s"}', new_user_id, 'admin@bunkyo.org.br')::jsonb,
        'email',
        current_timestamp,
        current_timestamp,
        current_timestamp
    );

    INSERT INTO public.profiles (id, email, role)
    VALUES (new_user_id, 'admin@bunkyo.org.br', 'ADMIN');
END $$;

-- Insert mock refund requests
INSERT INTO public.refund_requests (
    requester_name,
    receipt_file_url,
    status,
    total_value,
    issue_date,
    issue_number,
    issuer_name,
    issuer_cnpj,
    description
) VALUES 
('João Silva', 'http://example.com/receipt1.pdf', 'PENDING', 150.50, '2026-09-20', 'NF-1001', 'Restaurante A', '12.345.678/0001-90', 'Almoço de negócios'),
('Maria Santos', 'http://example.com/receipt2.pdf', 'APPROVED', 450.00, '2026-09-21', 'NF-1002', 'Hotel B', '98.765.432/0001-10', 'Hospedagem evento anual'),
('Carlos Sousa', 'http://example.com/receipt3.pdf', 'DENIED', 50.00, '2026-09-22', 'NF-1003', 'Uber', '00.000.000/0001-00', 'Viagem não autorizada'),
('Ana Oliveira', 'http://example.com/receipt4.pdf', 'PROCESSING', 1200.00, '2026-09-23', 'NF-1004', 'Companhia Aérea C', '11.222.333/0001-44', 'Passagem aérea internacional');
