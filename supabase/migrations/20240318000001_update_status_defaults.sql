-- Update default status to 'vencida'
ALTER TABLE public.members ALTER COLUMN status SET DEFAULT 'vencida';

-- Update any existing 'active' or 'pending' statuses to 'valida' or 'vencida'
UPDATE public.members SET status = 'valida' WHERE status = 'active' OR status = 'ativo';
UPDATE public.members SET status = 'vencida' WHERE status = 'pending' OR status = 'pendente' OR status = 'inactive' OR status = 'inativo';
