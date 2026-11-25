ALTER TABLE public.refund_requests
ADD COLUMN IF NOT EXISTS raw_ai_response TEXT;

NOTIFY pgrst, 'reload schema';
