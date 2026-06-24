
CREATE OR REPLACE FUNCTION public.is_case_participant(_case_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = _case_id
      AND (c.client_id = _user_id OR c.lawyer_id = _user_id)
  )
$$;
