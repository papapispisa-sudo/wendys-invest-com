CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  telegram_url text NOT NULL DEFAULT '',
  support_url text NOT NULL DEFAULT '',
  whatsapp_url text NOT NULL DEFAULT '',
  popup_enabled boolean NOT NULL DEFAULT true,
  popup_title text NOT NULL DEFAULT 'Bienvenue chez Wendy''s',
  popup_message text NOT NULL DEFAULT 'Achetez un produit et recevez vos revenus chaque jour. Invitez vos amis et gagnez jusqu''à 30 % de commission. Rejoignez nos canaux pour ne rien manquer.',
  announcement text NOT NULL DEFAULT '',
  payment_url text NOT NULL DEFAULT 'https://monniz.com/p/wendys',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site settings public read" ON public.site_settings FOR SELECT USING (true);
INSERT INTO public.site_settings (id) VALUES (true);

CREATE OR REPLACE FUNCTION public.admin_update_site_settings(
  p_telegram_url text, p_support_url text, p_whatsapp_url text,
  p_popup_enabled boolean, p_popup_title text, p_popup_message text,
  p_announcement text, p_payment_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE public.site_settings SET
    telegram_url = coalesce(p_telegram_url,''), support_url = coalesce(p_support_url,''),
    whatsapp_url = coalesce(p_whatsapp_url,''), popup_enabled = coalesce(p_popup_enabled,true),
    popup_title = coalesce(p_popup_title,''), popup_message = coalesce(p_popup_message,''),
    announcement = coalesce(p_announcement,''), payment_url = coalesce(nullif(p_payment_url,''),'https://monniz.com/p/wendys'),
    updated_at = now()
  WHERE id = true;
END $$;
REVOKE ALL ON FUNCTION public.admin_update_site_settings(text,text,text,boolean,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_site_settings(text,text,text,boolean,text,text,text,text) TO authenticated;