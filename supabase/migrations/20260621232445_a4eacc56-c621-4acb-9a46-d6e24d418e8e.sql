
-- Recreate lawyer_directory as security invoker
DROP VIEW IF EXISTS public.lawyer_directory;
CREATE VIEW public.lawyer_directory
WITH (security_invoker = on) AS
SELECT
  lp.id, lp.category, lp.bio, lp.specialties, lp.years_experience,
  lp.rating_avg, lp.rating_count, lp.verified, lp.hourly_rate_ngn,
  lp.accepts_pro_bono,
  p.full_name, p.state, p.avatar_url
FROM public.lawyer_profiles lp
JOIN public.profiles p ON p.id = lp.id;
GRANT SELECT ON public.lawyer_directory TO anon, authenticated;

-- Allow public read of profile fields ONLY for lawyer users (needed by directory)
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Lawyer profiles are public" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.lawyer_profiles lp WHERE lp.id = profiles.id));

-- Drop the pro_bono view (no feature uses it; safer to omit)
DROP VIEW IF EXISTS public.pro_bono_cases_public;

-- Convert has_role to SECURITY INVOKER (user_roles RLS already allows reading own rows)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
