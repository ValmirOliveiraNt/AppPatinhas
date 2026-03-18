-- Fix members table columns
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

-- Ensure status has correct default
ALTER TABLE public.members ALTER COLUMN status SET DEFAULT 'vencida';

-- Ensure updated_at exists
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure created_at exists
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ensure uid is present
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS uid TEXT;

-- Update any existing null statuses
UPDATE public.members SET status = 'vencida' WHERE status IS NULL;
