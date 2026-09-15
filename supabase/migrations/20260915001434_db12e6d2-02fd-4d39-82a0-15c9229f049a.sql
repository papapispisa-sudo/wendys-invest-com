
-- 1. Produits enrichis
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'produit';

-- 2. Types de produits
CREATE TABLE public.product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_types TO anon, authenticated;
GRANT ALL ON public.product_types TO service_role;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product types public read" ON public.product_types FOR SELECT USING (true);
INSERT INTO public.product_types (slug, label, sort_order) VALUES
  ('produit','Produits',1), ('staking','Staking',2);

-- 3. Roue de la chance
CREATE TABLE public.wheel_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  difficulty INT NOT NULL DEFAULT 3,
  spin_cost NUMERIC NOT NULL DEFAULT 0,
  daily_spins INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wheel_settings TO anon, authenticated;
GRANT ALL ON public.wheel_settings TO service_role;
ALTER TABLE public.wheel_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wheel settings public read" ON public.wheel_settings FOR SELECT USING (true);
INSERT INTO public.wheel_settings (id) VALUES (true);

CREATE TABLE public.wheel_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  weight INT NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wheel_prizes TO anon, authenticated;
GRANT ALL ON public.wheel_prizes TO service_role;
ALTER TABLE public.wheel_prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wheel prizes public read" ON public.wheel_prizes FOR SELECT USING (active);
INSERT INTO public.wheel_prizes (label, amount, weight) VALUES
  ('Rien', 0, 60), ('50 FCFA', 50, 20), ('100 FCFA', 100, 12),
  ('250 FCFA', 250, 6), ('500 FCFA', 500, 3), ('2000 FCFA', 2000, 1);

CREATE TABLE public.wheel_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES public.wheel_prizes(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wheel_spins TO authenticated;
GRANT ALL ON public.wheel_spins TO service_role;
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own spins read" ON public.wheel_spins FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. Codes bonus
CREATE TABLE public.bonus_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  max_uses INT NOT NULL DEFAULT 1,
  uses INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bonus_codes TO service_role;
ALTER TABLE public.bonus_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bonus_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.bonus_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code_id, user_id)
);
GRANT SELECT ON public.bonus_code_uses TO authenticated;
GRANT ALL ON public.bonus_code_uses TO service_role;
ALTER TABLE public.bonus_code_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own code uses read" ON public.bonus_code_uses FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. Fonctions admin : produits
CREATE OR REPLACE FUNCTION public.admin_upsert_product(
  p_id UUID, p_name TEXT, p_price NUMERIC, p_daily_return NUMERIC,
  p_duration_days INT, p_rank INT, p_category TEXT,
  p_description TEXT, p_image_url TEXT, p_active BOOLEAN)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF coalesce(p_name,'') = '' THEN RAISE EXCEPTION 'Nom obligatoire'; END IF;
  IF p_price <= 0 THEN RAISE EXCEPTION 'Prix invalide'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.products (name, price, daily_return, duration_days, rank, category, description, image_url, active)
    VALUES (p_name, p_price, p_daily_return, greatest(p_duration_days,1), p_rank, coalesce(p_category,'produit'), p_description, p_image_url, coalesce(p_active,true))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.products SET
      name = p_name, price = p_price, daily_return = p_daily_return,
      duration_days = greatest(p_duration_days,1), rank = p_rank,
      category = coalesce(p_category,'produit'), description = p_description,
      image_url = p_image_url, active = coalesce(p_active,true)
    WHERE id = p_id RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
  END IF;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_product(p_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF EXISTS (SELECT 1 FROM public.investments WHERE product_id = p_id) THEN
    UPDATE public.products SET active = false WHERE id = p_id;
  ELSE
    DELETE FROM public.products WHERE id = p_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_upsert_product_type(p_slug TEXT, p_label TEXT, p_sort_order INT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  INSERT INTO public.product_types (slug, label, sort_order)
  VALUES (lower(trim(p_slug)), p_label, coalesce(p_sort_order,0))
  ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_product_type(p_slug TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  DELETE FROM public.product_types WHERE slug = p_slug;
END; $$;

-- 6. Fonctions admin : utilisateurs
CREATE OR REPLACE FUNCTION public.admin_user_referrals(p_user_id UUID)
RETURNS TABLE(id UUID, phone TEXT, level INT, balance NUMERIC, has_invested BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  WITH l1 AS (SELECT p.* FROM public.profiles p WHERE p.referred_by = p_user_id),
       l2 AS (SELECT p.* FROM public.profiles p JOIN l1 ON p.referred_by = l1.id),
       l3 AS (SELECT p.* FROM public.profiles p JOIN l2 ON p.referred_by = l2.id)
  SELECT x.id, x.phone, x.lvl, x.balance, x.has_invested, x.created_at FROM (
    SELECT l1.*, 1 AS lvl FROM l1
    UNION ALL SELECT l2.*, 2 FROM l2
    UNION ALL SELECT l3.*, 3 FROM l3
  ) x ORDER BY x.lvl, x.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_user_investments(p_user_id UUID)
RETURNS TABLE(id UUID, product_name TEXT, price NUMERIC, daily_return NUMERIC, duration_days INT, days_paid INT, active BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  SELECT i.id, pr.name, i.price, i.daily_return, i.duration_days, i.days_paid, i.active, i.created_at
  FROM public.investments i JOIN public.products pr ON pr.id = i.product_id
  WHERE i.user_id = p_user_id ORDER BY i.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_grant_investment(p_user_id UUID, p_product_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT * INTO p FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
  INSERT INTO public.investments (user_id, product_id, price, daily_return, duration_days)
  VALUES (p_user_id, p.id, p.price, p.daily_return, p.duration_days);
  UPDATE public.profiles SET has_invested = true WHERE id = p_user_id;
  INSERT INTO public.transactions (user_id, kind, amount, note)
  VALUES (p_user_id, 'purchase', 0, 'Produit ajouté par un administrateur : ' || p.name);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_remove_investment(p_investment_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE inv RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT * INTO inv FROM public.investments WHERE id = p_investment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investissement introuvable'; END IF;
  DELETE FROM public.investments WHERE id = p_investment_id;
  UPDATE public.profiles SET has_invested = EXISTS (SELECT 1 FROM public.investments WHERE user_id = inv.user_id)
   WHERE id = inv.user_id;
END; $$;

-- 7. Roue : admin + joueur
CREATE OR REPLACE FUNCTION public.admin_wheel_prizes()
RETURNS SETOF public.wheel_prizes LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY SELECT * FROM public.wheel_prizes ORDER BY amount;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_upsert_wheel_prize(p_id UUID, p_label TEXT, p_amount NUMERIC, p_weight INT, p_active BOOLEAN)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.wheel_prizes (label, amount, weight, active)
    VALUES (p_label, greatest(p_amount,0), greatest(p_weight,1), coalesce(p_active,true));
  ELSE
    UPDATE public.wheel_prizes SET label = p_label, amount = greatest(p_amount,0),
      weight = greatest(p_weight,1), active = coalesce(p_active,true) WHERE id = p_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_wheel_prize(p_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  DELETE FROM public.wheel_prizes WHERE id = p_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_update_wheel_settings(p_difficulty INT, p_spin_cost NUMERIC, p_daily_spins INT, p_active BOOLEAN)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE public.wheel_settings SET
    difficulty = least(greatest(coalesce(p_difficulty,3),1),5),
    spin_cost = greatest(coalesce(p_spin_cost,0),0),
    daily_spins = greatest(coalesce(p_daily_spins,1),0),
    active = coalesce(p_active,true),
    updated_at = now()
  WHERE id = true;
END; $$;

CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS TABLE(prize_id UUID, label TEXT, amount NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  s RECORD; v_used INT; v_total NUMERIC; v_pick NUMERIC; v_acc NUMERIC := 0; pz RECORD;
  v_bal NUMERIC; v_chosen RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT * INTO s FROM public.wheel_settings WHERE id = true;
  IF NOT s.active THEN RAISE EXCEPTION 'La roue est indisponible'; END IF;
  SELECT count(*) INTO v_used FROM public.wheel_spins
   WHERE user_id = auth.uid() AND created_at >= date_trunc('day', now());
  IF v_used >= s.daily_spins THEN RAISE EXCEPTION 'Vous avez utilisé tous vos tours du jour'; END IF;
  SELECT balance INTO v_bal FROM public.profiles WHERE id = auth.uid();
  IF v_bal < s.spin_cost THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;

  -- poids ajustés par la difficulté : plus la difficulté est élevée, plus les gros lots sont rares
  SELECT sum(w.weight * power(greatest(w.amount,1), -0.35 * s.difficulty)) INTO v_total
    FROM public.wheel_prizes w WHERE w.active;
  IF coalesce(v_total,0) <= 0 THEN RAISE EXCEPTION 'Aucun lot configuré'; END IF;
  v_pick := random() * v_total;
  FOR pz IN SELECT *, weight * power(greatest(amount,1), -0.35 * s.difficulty) AS w
            FROM public.wheel_prizes WHERE active ORDER BY amount LOOP
    v_acc := v_acc + pz.w;
    IF v_pick <= v_acc THEN v_chosen := pz; EXIT; END IF;
  END LOOP;
  IF v_chosen IS NULL THEN
    SELECT * INTO v_chosen FROM public.wheel_prizes WHERE active ORDER BY amount LIMIT 1;
  END IF;

  INSERT INTO public.wheel_spins (user_id, prize_id, amount) VALUES (auth.uid(), v_chosen.id, v_chosen.amount);
  IF s.spin_cost > 0 THEN
    UPDATE public.profiles SET balance = balance - s.spin_cost WHERE id = auth.uid();
    INSERT INTO public.transactions (user_id, kind, amount, note)
    VALUES (auth.uid(), 'purchase', s.spin_cost, 'Tour de roue');
  END IF;
  IF v_chosen.amount > 0 THEN
    UPDATE public.profiles SET balance = balance + v_chosen.amount WHERE id = auth.uid();
    INSERT INTO public.transactions (user_id, kind, amount, note)
    VALUES (auth.uid(), 'bonus', v_chosen.amount, 'Gain roue de la chance');
  END IF;
  RETURN QUERY SELECT v_chosen.id, v_chosen.label, v_chosen.amount;
END; $$;

CREATE OR REPLACE FUNCTION public.wheel_status()
RETURNS TABLE(active BOOLEAN, spin_cost NUMERIC, daily_spins INT, spins_left INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s RECORD; v_used INT;
BEGIN
  SELECT * INTO s FROM public.wheel_settings WHERE id = true;
  SELECT count(*) INTO v_used FROM public.wheel_spins
   WHERE user_id = auth.uid() AND created_at >= date_trunc('day', now());
  RETURN QUERY SELECT s.active, s.spin_cost, s.daily_spins, greatest(s.daily_spins - v_used, 0);
END; $$;

-- 8. Codes bonus
CREATE OR REPLACE FUNCTION public.admin_bonus_codes()
RETURNS SETOF public.bonus_codes LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY SELECT * FROM public.bonus_codes ORDER BY created_at DESC LIMIT 200;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_upsert_bonus_code(p_id UUID, p_code TEXT, p_amount NUMERIC, p_max_uses INT, p_expires_at TIMESTAMPTZ, p_active BOOLEAN)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF coalesce(p_code,'') = '' THEN RAISE EXCEPTION 'Code obligatoire'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.bonus_codes (code, amount, max_uses, expires_at, active)
    VALUES (upper(trim(p_code)), p_amount, greatest(coalesce(p_max_uses,1),1), p_expires_at, coalesce(p_active,true));
  ELSE
    UPDATE public.bonus_codes SET code = upper(trim(p_code)), amount = p_amount,
      max_uses = greatest(coalesce(p_max_uses,1),1), expires_at = p_expires_at,
      active = coalesce(p_active,true) WHERE id = p_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_bonus_code(p_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  DELETE FROM public.bonus_codes WHERE id = p_id;
END; $$;

CREATE OR REPLACE FUNCTION public.redeem_bonus_code(p_code TEXT)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT * INTO c FROM public.bonus_codes WHERE code = upper(trim(p_code)) FOR UPDATE;
  IF NOT FOUND OR NOT c.active THEN RAISE EXCEPTION 'Code invalide'; END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RAISE EXCEPTION 'Code expiré'; END IF;
  IF c.uses >= c.max_uses THEN RAISE EXCEPTION 'Ce code a atteint sa limite'; END IF;
  IF EXISTS (SELECT 1 FROM public.bonus_code_uses WHERE code_id = c.id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Vous avez déjà utilisé ce code';
  END IF;
  INSERT INTO public.bonus_code_uses (code_id, user_id) VALUES (c.id, auth.uid());
  UPDATE public.bonus_codes SET uses = uses + 1 WHERE id = c.id;
  UPDATE public.profiles SET balance = balance + c.amount WHERE id = auth.uid();
  INSERT INTO public.transactions (user_id, kind, amount, note)
  VALUES (auth.uid(), 'bonus', c.amount, 'Code bonus ' || c.code);
  RETURN c.amount;
END; $$;

-- 9. Droits d'exécution
DO $$
DECLARE f RECORD;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.prosecdef AND p.proname <> 'handle_new_user'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
  END LOOP;
END $$;
