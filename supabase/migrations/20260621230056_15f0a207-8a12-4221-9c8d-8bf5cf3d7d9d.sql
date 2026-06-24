
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'lawyer', 'client');
CREATE TYPE public.account_type AS ENUM ('client_individual', 'client_corporate', 'lawyer');
CREATE TYPE public.lawyer_category AS ENUM ('regular_advocate', 'san', 'retired_judge', 'notary_public');
CREATE TYPE public.case_status AS ENUM ('open', 'claimed', 'in_progress', 'completed', 'cancelled');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  account_type public.account_type NOT NULL DEFAULT 'client_individual',
  phone TEXT,
  state TEXT,
  organization TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Lawyer profile details
CREATE TABLE public.lawyer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.lawyer_category NOT NULL DEFAULT 'regular_advocate',
  nba_roll_number TEXT,
  bio TEXT,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  years_experience INT NOT NULL DEFAULT 0,
  san_conferment_year INT,
  court_name TEXT,
  judge_tenure_years INT,
  stamp_registration_no TEXT,
  accepts_pro_bono BOOLEAN NOT NULL DEFAULT true,
  hourly_rate_ngn INT,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lawyer_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.lawyer_profiles TO authenticated;
GRANT ALL ON public.lawyer_profiles TO service_role;
ALTER TABLE public.lawyer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lawyer profiles are public" ON public.lawyer_profiles FOR SELECT USING (true);
CREATE POLICY "Lawyers can manage own profile" ON public.lawyer_profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Cases
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  jurisdiction TEXT,
  is_pro_bono BOOLEAN NOT NULL DEFAULT false,
  status public.case_status NOT NULL DEFAULT 'open',
  budget_ngn INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view own cases" ON public.cases FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR (is_pro_bono AND status = 'open') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients create own cases" ON public.cases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients update own cases" ON public.cases FOR UPDATE TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = lawyer_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data ->> 'account_type')::public.account_type, 'client_individual')
  );

  IF COALESCE(NEW.raw_user_meta_data ->> 'account_type', '') = 'lawyer' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'lawyer');
    INSERT INTO public.lawyer_profiles (id, category)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'lawyer_category')::public.lawyer_category, 'regular_advocate'));
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER lawyer_profiles_updated BEFORE UPDATE ON public.lawyer_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cases_updated BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
