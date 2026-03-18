-- Update policies to include 'master' and 'diretoria' roles
DROP POLICY IF EXISTS "Admins can do everything on members" ON public.members;
CREATE POLICY "Admins can do everything on members"
ON public.members
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'master' OR profiles.role = 'diretoria')
    )
);

DROP POLICY IF EXISTS "Users can view their own member data" ON public.members;
CREATE POLICY "Users can view their own member data"
ON public.members
FOR SELECT
TO authenticated
USING (
    uid = auth.uid()::text OR 
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'master' OR profiles.role = 'diretoria')
    )
);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'master' OR profiles.role = 'diretoria')
    )
);
