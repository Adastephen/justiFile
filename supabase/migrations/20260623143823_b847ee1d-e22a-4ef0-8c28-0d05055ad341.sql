
CREATE OR REPLACE FUNCTION public.log_admin_action(_module public.admin_module, _action text, _target text, _details jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_super_admin(auth.uid())
          OR EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.admin_audit_logs(actor_id, module, action, target, details)
  VALUES (auth.uid(), _module, _action, _target, _details);
END; $$;
