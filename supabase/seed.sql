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
