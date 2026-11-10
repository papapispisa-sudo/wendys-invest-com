CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_messages_user_idx ON public.support_messages(user_id, created_at);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own support read" ON public.support_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own support write" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id AND from_admin = false) OR (from_admin = true AND public.has_role(auth.uid(), 'admin')));

CREATE OR REPLACE FUNCTION public.admin_support_threads()
RETURNS TABLE(user_id uuid, phone text, last_body text, last_at timestamptz, last_from_admin boolean, total integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  SELECT DISTINCT ON (m.user_id) m.user_id, p.phone, m.body, m.created_at, m.from_admin,
    (SELECT count(*)::int FROM support_messages x WHERE x.user_id = m.user_id)
  FROM support_messages m LEFT JOIN profiles p ON p.id = m.user_id
  ORDER BY m.user_id, m.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.admin_support_threads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_support_threads() TO authenticated;