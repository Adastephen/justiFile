
CREATE TABLE public.case_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX case_messages_case_id_created_at_idx ON public.case_messages(case_id, created_at);

GRANT SELECT, INSERT ON public.case_messages TO authenticated;
GRANT ALL ON public.case_messages TO service_role;

ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_case_participant(_case_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = _case_id
      AND (c.client_id = _user_id OR c.lawyer_id = _user_id)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_case_participant(uuid, uuid) FROM anon, authenticated;

CREATE POLICY "Participants read messages"
ON public.case_messages FOR SELECT
TO authenticated
USING (
  public.is_case_participant(case_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Participants send messages"
ON public.case_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_case_participant(case_id, auth.uid())
);

CREATE POLICY "Lawyers can claim open cases"
ON public.cases FOR UPDATE
TO authenticated
USING (
  lawyer_id IS NULL
  AND status = 'open'
  AND public.has_role(auth.uid(), 'lawyer')
)
WITH CHECK (
  lawyer_id = auth.uid()
  AND status IN ('claimed','in_progress')
);

CREATE POLICY "Assigned lawyer updates own case"
ON public.cases FOR UPDATE
TO authenticated
USING (lawyer_id = auth.uid())
WITH CHECK (lawyer_id = auth.uid());

CREATE POLICY "Client updates own case"
ON public.cases FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Lawyers browse open cases"
ON public.cases FOR SELECT
TO authenticated
USING (
  lawyer_id IS NULL
  AND status = 'open'
  AND public.has_role(auth.uid(), 'lawyer')
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.case_messages;
ALTER TABLE public.case_messages REPLICA IDENTITY FULL;
