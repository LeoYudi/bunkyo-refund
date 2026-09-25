CREATE OR REPLACE FUNCTION create_refund_request(payload JSONB)
RETURNS refund_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_request refund_requests;
BEGIN
    INSERT INTO refund_requests (
        requester_name,
        receipt_file_url,
        status,
        reviewed_by,
        issuer_name,
        issuer_cnpj,
        receiver_cnpj,
        total_value,
        issue_date,
        issue_number,
        description
    )
    VALUES (
        payload->>'requester_name',
        payload->>'receipt_file_url',
        COALESCE(payload->>'status', 'PENDING')::refund_status,
        (payload->>'reviewed_by')::UUID,
        payload->>'issuer_name',
        payload->>'issuer_cnpj',
        payload->>'receiver_cnpj',
        (payload->>'total_value')::NUMERIC(10,2),
        (payload->>'issue_date')::DATE,
        payload->>'issue_number',
        payload->>'description'
    )
    RETURNING * INTO new_request;

    RETURN new_request;
END;
$$;
