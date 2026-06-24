
-- 1. admin_audit_logs: require admin role on insert
DROP POLICY IF EXISTS "any admin writes logs" ON public.admin_audit_logs;
CREATE POLICY "admins write logs" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (
      public.is_super_admin(auth.uid())
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = auth.uid())
    )
  );

-- 2. profiles: remove anon exposure of lawyer phone numbers
DROP POLICY IF EXISTS "Lawyer profiles are public" ON public.profiles;
CREATE POLICY "Lawyer profiles visible to authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lawyer_profiles lp WHERE lp.id = profiles.id));
REVOKE SELECT ON public.profiles FROM anon;

-- 3. Convert role-check helpers from SECURITY DEFINER to INVOKER
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT public.has_role(_user_id, 'super_admin'); $$;

CREATE OR REPLACE FUNCTION public.has_admin_module(_user_id uuid, _module admin_module, _level admin_permission_level)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.admin_permissions
      WHERE user_id = _user_id AND module = _module
        AND (level = _level OR (_level = 'view' AND level = 'edit'))
    );
$$;

-- 4. Storage RLS for the private 'casefiles' bucket
-- Path convention: <case_id>/<filename>
DROP POLICY IF EXISTS "casefiles read participants" ON storage.objects;
DROP POLICY IF EXISTS "casefiles insert participants" ON storage.objects;
DROP POLICY IF EXISTS "casefiles update participants" ON storage.objects;
DROP POLICY IF EXISTS "casefiles delete participants" ON storage.objects;

CREATE POLICY "casefiles read participants" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'casefiles'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_super_admin(auth.uid())
      OR public.is_case_participant(
        NULLIF(split_part(name, '/', 1), '')::uuid,
        auth.uid()
      )
    )
  );

CREATE POLICY "casefiles insert participants" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'casefiles'
    AND public.is_case_participant(
      NULLIF(split_part(name, '/', 1), '')::uuid,
      auth.uid()
    )
  );

CREATE POLICY "casefiles update participants" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'casefiles'
    AND public.is_case_participant(
      NULLIF(split_part(name, '/', 1), '')::uuid,
      auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'casefiles'
    AND public.is_case_participant(
      NULLIF(split_part(name, '/', 1), '')::uuid,
      auth.uid()
    )
  );

CREATE POLICY "casefiles delete participants" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'casefiles'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_super_admin(auth.uid())
      OR public.is_case_participant(
        NULLIF(split_part(name, '/', 1), '')::uuid,
        auth.uid()
      )
    )
  );
