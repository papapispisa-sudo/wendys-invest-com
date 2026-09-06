
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  referral_earned NUMERIC NOT NULL DEFAULT 0,
  has_invested BOOLEAN NOT NULL DEFAULT false,
  last_bonus_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  daily_return NUMERIC NOT NULL,
  duration_days INT NOT NULL DEFAULT 45,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO authenticated, anon;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.products (rank, name, price, daily_return, duration_days) VALUES
 (1,'Wendy 1',2000,600,45),
 (2,'Wendy 2',5000,1500,45),
 (3,'Wendy 3',10000,3000,45),
 (4,'Wendy 4',20000,6000,45),
 (5,'Wendy 5',40000,12000,45),
 (6,'Wendy 6',75000,22500,45),
 (7,'Wendy 7',120000,36000,45),
 (8,'Wendy 8',200000,60000,45),
 (9,'Wendy 9',320000,96000,45),
 (10,'Wendy 10',500000,150000,45);

-- INVESTMENTS
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  price NUMERIC NOT NULL,
  daily_return NUMERIC NOT NULL,
  duration_days INT NOT NULL,
  days_paid INT NOT NULL DEFAULT 0,
  last_payout TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own investments read" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  method TEXT,
  phone TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions read" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT;
  v_ref UUID;
BEGIN
  LOOP
    v_code := upper(substr(md5(random()::text), 1, 7));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = v_code);
  END LOOP;

  SELECT id INTO v_ref FROM public.profiles
   WHERE invite_code = upper(coalesce(NEW.raw_user_meta_data->>'invite_code',''));

  INSERT INTO public.profiles (id, phone, country, invite_code, referred_by, balance)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'phone',''),
    coalesce(NEW.raw_user_meta_data->>'country',''),
    v_code,
    v_ref,
    1000
  );

  INSERT INTO public.transactions (user_id, kind, amount, note)
  VALUES (NEW.id, 'bonus', 1000, 'Bonus d''inscription');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SYNC EARNINGS
CREATE OR REPLACE FUNCTION public.sync_earnings()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv RECORD;
  v_days INT;
  v_total NUMERIC := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  FOR inv IN SELECT * FROM public.investments WHERE user_id = auth.uid() AND active LOOP
    v_days := floor(extract(epoch FROM (now() - inv.last_payout)) / 86400)::int;
    v_days := least(v_days, inv.duration_days - inv.days_paid);
    IF v_days > 0 THEN
      UPDATE public.investments
         SET days_paid = days_paid + v_days,
             last_payout = last_payout + (v_days || ' days')::interval,
             active = (days_paid + v_days) < duration_days
       WHERE id = inv.id;
      INSERT INTO public.transactions (user_id, kind, amount, note)
      VALUES (auth.uid(), 'earning', inv.daily_return * v_days, 'Revenu quotidien');
      v_total := v_total + inv.daily_return * v_days;
    END IF;
  END LOOP;
  IF v_total > 0 THEN
    UPDATE public.profiles SET balance = balance + v_total, total_earned = total_earned + v_total
     WHERE id = auth.uid();
  END IF;
END;
$$;

-- DAILY BONUS
CREATE OR REPLACE FUNCTION public.claim_daily_bonus()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_last DATE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT last_bonus_date INTO v_last FROM public.profiles WHERE id = auth.uid();
  IF v_last IS NOT NULL AND v_last = current_date THEN
    RAISE EXCEPTION 'Bonus déjà réclamé aujourd''hui';
  END IF;
  UPDATE public.profiles
     SET balance = balance + 125, last_bonus_date = current_date
   WHERE id = auth.uid();
  INSERT INTO public.transactions (user_id, kind, amount, note)
  VALUES (auth.uid(), 'bonus', 125, 'Bonus quotidien');
END;
$$;

-- PURCHASE
CREATE OR REPLACE FUNCTION public.purchase_product(p_product_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p RECORD;
  v_bal NUMERIC;
  l1 UUID; l2 UUID; l3 UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT * INTO p FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
  SELECT balance, referred_by INTO v_bal, l1 FROM public.profiles WHERE id = auth.uid();
  IF v_bal < p.price THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;

  UPDATE public.profiles SET balance = balance - p.price, has_invested = true WHERE id = auth.uid();
  INSERT INTO public.investments (user_id, product_id, price, daily_return, duration_days)
  VALUES (auth.uid(), p.id, p.price, p.daily_return, p.duration_days);
  INSERT INTO public.transactions (user_id, kind, amount, note)
  VALUES (auth.uid(), 'purchase', p.price, 'Achat ' || p.name);

  IF l1 IS NOT NULL THEN
    UPDATE public.profiles SET balance = balance + p.price * 0.30, referral_earned = referral_earned + p.price * 0.30 WHERE id = l1;
    INSERT INTO public.transactions (user_id, kind, amount, note) VALUES (l1, 'referral', p.price * 0.30, 'Commission niveau 1');
    SELECT referred_by INTO l2 FROM public.profiles WHERE id = l1;
    IF l2 IS NOT NULL THEN
      UPDATE public.profiles SET balance = balance + p.price * 0.03, referral_earned = referral_earned + p.price * 0.03 WHERE id = l2;
      INSERT INTO public.transactions (user_id, kind, amount, note) VALUES (l2, 'referral', p.price * 0.03, 'Commission niveau 2');
      SELECT referred_by INTO l3 FROM public.profiles WHERE id = l2;
      IF l3 IS NOT NULL THEN
        UPDATE public.profiles SET balance = balance + p.price * 0.02, referral_earned = referral_earned + p.price * 0.02 WHERE id = l3;
        INSERT INTO public.transactions (user_id, kind, amount, note) VALUES (l3, 'referral', p.price * 0.02, 'Commission niveau 3');
      END IF;
    END IF;
  END IF;
END;
$$;

-- DEPOSIT REQUEST
CREATE OR REPLACE FUNCTION public.create_deposit(p_amount NUMERIC, p_method TEXT, p_phone TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF p_amount < 2000 THEN RAISE EXCEPTION 'Le dépôt minimum est de 2000 FCFA'; END IF;
  INSERT INTO public.transactions (user_id, kind, amount, status, method, phone, note)
  VALUES (auth.uid(), 'deposit', p_amount, 'pending', p_method, p_phone, 'Dépôt en attente de paiement')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- WITHDRAWAL REQUEST
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount NUMERIC, p_method TEXT, p_phone TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr RECORD; v_hour INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  v_hour := extract(hour FROM (now() AT TIME ZONE 'UTC'))::int;
  IF v_hour < 11 OR v_hour >= 18 THEN
    RAISE EXCEPTION 'Les retraits sont possibles de 11H à 18H GMT';
  END IF;
  IF p_amount < 1000 THEN RAISE EXCEPTION 'Le retrait minimum est de 1000 FCFA'; END IF;
  SELECT * INTO pr FROM public.profiles WHERE id = auth.uid();
  IF NOT pr.has_invested THEN RAISE EXCEPTION 'Vous devez acheter un produit avant de retirer'; END IF;
  IF pr.balance < p_amount THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;
  UPDATE public.profiles SET balance = balance - p_amount WHERE id = auth.uid();
  INSERT INTO public.transactions (user_id, kind, amount, status, method, phone, note)
  VALUES (auth.uid(), 'withdrawal', p_amount, 'pending', p_method, p_phone, 'Retrait en cours de traitement');
END;
$$;

-- REFERRAL TEAM COUNTS
CREATE OR REPLACE FUNCTION public.referral_stats()
RETURNS TABLE (level1 INT, level2 INT, level3 INT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH l1 AS (SELECT id FROM public.profiles WHERE referred_by = auth.uid()),
       l2 AS (SELECT p.id FROM public.profiles p JOIN l1 ON p.referred_by = l1.id),
       l3 AS (SELECT p.id FROM public.profiles p JOIN l2 ON p.referred_by = l2.id)
  SELECT (SELECT count(*) FROM l1)::int, (SELECT count(*) FROM l2)::int, (SELECT count(*) FROM l3)::int;
END;
$$;
