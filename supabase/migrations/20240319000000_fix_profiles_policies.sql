-- Add UPDATE policy for profiles to allow admins, masters, and diretoria to update roles
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'master' OR p.role = 'diretoria')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'master' OR p.role = 'diretoria')
    )
);

-- Ensure admins can also view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'master' OR p.role = 'diretoria')
    )
);

-- Add INSERT policy for admins to support upsert
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'master' OR p.role = 'diretoria')
    )
);
