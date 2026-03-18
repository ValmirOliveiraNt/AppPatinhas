-- Add last_payment_date column to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
