
-- 1. PROFILES: restrict SELECT to owner/admin
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- Public lawyer directory view (safe, joined fields only)
DROP VIEW IF EXISTS public.lawyer_directory;
CREATE VIEW public.lawyer_directory
WITH (security_invoker = off) AS
SELECT
  lp.id,
  lp.category,
  lp.bio,
  lp.specialties,
  lp.years_experience,
  lp.rating_avg,
  lp.rating_count,
  lp.verified,
  lp.hourly_rate_ngn,
  lp.accepts_pro_bono,
  p.full_name,
  p.state,
  p.avatar_url
FROM public.lawyer_profiles lp
JOIN public.profiles p ON p.id = lp.id;

GRANT SELECT ON public.lawyer_directory TO anon, authenticated;

-- 2. LAWYER_PROFILES: split policies, block self-promotion of verified/ratings
DROP POLICY IF EXISTS "Lawyers can manage own profile" ON public.lawyer_profiles;

CREATE POLICY "Lawyers insert own profile" ON public.lawyer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Lawyers update own profile" ON public.lawyer_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage lawyer profiles" ON public.lawyer_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger preventing lawyers from changing trust fields
CREATE OR REPLACE FUNCTION public.guard_lawyer_trust_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.rating_avg IS DISTINCT FROM OLD.rating_avg
     OR NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
    RAISE EXCEPTION 'Not allowed to modify verified or rating fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_lawyer_trust_fields ON public.lawyer_profiles;
CREATE TRIGGER guard_lawyer_trust_fields
  BEFORE UPDATE ON public.lawyer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_lawyer_trust_fields();

-- 3. CASES: remove pro-bono full-row exposure, expose safe view instead
DROP POLICY IF EXISTS "Clients view own cases" ON public.cases;
CREATE POLICY "Clients view own cases" ON public.cases
  FOR SELECT TO authenticated
  USING (
    auth.uid() = client_id
    OR auth.uid() = lawyer_id
    OR public.has_role(auth.uid(), 'admin')
  );

DROP VIEW IF EXISTS public.pro_bono_cases_public;
CREATE VIEW public.pro_bono_cases_public
WITH (security_invoker = off) AS
SELECT id, title, category, jurisdiction, created_at
FROM public.cases
WHERE is_pro_bono = true AND status = 'open';

GRANT SELECT ON public.pro_bono_cases_public TO authenticated;

-- 4. Lock down SECURITY DEFINER function EXECUTE from anon, keep what's needed
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_lawyer_trust_fields() FROM PUBLIC, anon, authenticated;
