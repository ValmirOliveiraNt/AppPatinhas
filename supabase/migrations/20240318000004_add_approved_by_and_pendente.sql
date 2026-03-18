-- Add approved_by_name column to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS approved_by_name TEXT;

-- Update status to support 'pendente'
-- Existing statuses: 'valida', 'vencida'
-- New status: 'pendente' (waiting for registration approval)
ALTER TABLE public.members ALTER COLUMN status SET DEFAULT 'pendente';

-- Update existing members that might be null
UPDATE public.members SET status = 'vencida' WHERE status IS NULL;
