
DO $$ BEGIN
  CREATE TYPE public.admin_module AS ENUM ('users','lawyers','cases','messages','flags','logs','sql');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_permission_level AS ENUM ('view','edit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module public.admin_module NOT NULL,
  level public.admin_permission_level NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.message_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.case_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_flags TO authenticated;
GRANT ALL ON public.message_flags TO service_role;
ALTER TABLE public.message_flags ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  module public.admin_module NOT NULL,
  action text NOT NULL,
  target text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(_user_id, 'super_admin'); $$;

CREATE OR REPLACE FUNCTION public.has_admin_module(_user_id uuid, _module public.admin_module, _level public.admin_permission_level)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.admin_permissions
      WHERE user_id = _user_id AND module = _module
        AND (level = _level OR (_level = 'view' AND level = 'edit'))
    );
$$;

CREATE OR REPLACE FUNCTION public.log_admin_action(_module public.admin_module, _action text, _target text, _details jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs(actor_id, module, action, target, details)
  VALUES (auth.uid(), _module, _action, _target, _details);
END; $$;

DROP POLICY IF EXISTS "super admin reads permissions" ON public.admin_permissions;
CREATE POLICY "super admin reads permissions" ON public.admin_permissions
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR user_id = auth.uid());
DROP POLICY IF EXISTS "super admin writes permissions" ON public.admin_permissions;
CREATE POLICY "super admin writes permissions" ON public.admin_permissions
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "report messages" ON public.message_flags;
CREATE POLICY "report messages" ON public.message_flags
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS "read flags" ON public.message_flags;
CREATE POLICY "read flags" ON public.message_flags
  FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_admin_module(auth.uid(),'flags','view'));
DROP POLICY IF EXISTS "admin updates flags" ON public.message_flags;
CREATE POLICY "admin updates flags" ON public.message_flags
  FOR UPDATE TO authenticated USING (public.has_admin_module(auth.uid(),'flags','edit'))
  WITH CHECK (public.has_admin_module(auth.uid(),'flags','edit'));

DROP POLICY IF EXISTS "admin reads logs" ON public.admin_audit_logs;
CREATE POLICY "admin reads logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.has_admin_module(auth.uid(),'logs','view'));
DROP POLICY IF EXISTS "any admin writes logs" ON public.admin_audit_logs;
CREATE POLICY "any admin writes logs" ON public.admin_audit_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "admin cases view" ON public.cases;
CREATE POLICY "admin cases view" ON public.cases
  FOR SELECT TO authenticated USING (public.has_admin_module(auth.uid(),'cases','view'));
DROP POLICY IF EXISTS "admin cases edit" ON public.cases;
CREATE POLICY "admin cases edit" ON public.cases
  FOR UPDATE TO authenticated USING (public.has_admin_module(auth.uid(),'cases','edit'))
  WITH CHECK (public.has_admin_module(auth.uid(),'cases','edit'));

DROP POLICY IF EXISTS "admin profiles view" ON public.profiles;
CREATE POLICY "admin profiles view" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_admin_module(auth.uid(),'users','view'));
DROP POLICY IF EXISTS "admin profiles edit" ON public.profiles;
CREATE POLICY "admin profiles edit" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_admin_module(auth.uid(),'users','edit'))
  WITH CHECK (public.has_admin_module(auth.uid(),'users','edit'));

DROP POLICY IF EXISTS "admin lawyers view" ON public.lawyer_profiles;
CREATE POLICY "admin lawyers view" ON public.lawyer_profiles
  FOR SELECT TO authenticated USING (public.has_admin_module(auth.uid(),'lawyers','view'));
DROP POLICY IF EXISTS "admin lawyers edit" ON public.lawyer_profiles;
CREATE POLICY "admin lawyers edit" ON public.lawyer_profiles
  FOR UPDATE TO authenticated USING (public.has_admin_module(auth.uid(),'lawyers','edit'))
  WITH CHECK (public.has_admin_module(auth.uid(),'lawyers','edit'));

DROP POLICY IF EXISTS "admin messages view" ON public.case_messages;
CREATE POLICY "admin messages view" ON public.case_messages
  FOR SELECT TO authenticated USING (public.has_admin_module(auth.uid(),'messages','view'));
DROP POLICY IF EXISTS "admin messages delete" ON public.case_messages;
CREATE POLICY "admin messages delete" ON public.case_messages
  FOR DELETE TO authenticated USING (public.has_admin_module(auth.uid(),'messages','edit'));

DROP POLICY IF EXISTS "super admin manages roles" ON public.user_roles;
CREATE POLICY "super admin manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR user_id = auth.uid())
  WITH CHECK (public.is_super_admin(auth.uid()));
