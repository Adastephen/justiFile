
CREATE OR REPLACE FUNCTION public.admin_run_sql(_sql text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  EXECUTE 'SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (' || _sql || ') t'
    INTO result;
  INSERT INTO public.admin_audit_logs(actor_id, module, action, target, details)
  VALUES (auth.uid(), 'sql', 'run_sql', NULL, jsonb_build_object('sql', _sql));
  RETURN result;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_run_sql(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_run_sql(text) TO authenticated;
