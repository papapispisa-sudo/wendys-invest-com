-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own roles read" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Products activation
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Admin overview
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS TABLE(
  users_count integer,
  total_deposits numeric,
  total_withdrawals numeric,
  pending_deposits integer,
  pending_withdrawals integer,
  total_invested numeric,
  total_balance numeric,
  profit numeric
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.profiles)::int,
    coalesce((SELECT sum(amount) FROM public.transactions WHERE kind='deposit' AND status='completed'),0),
    coalesce((SELECT sum(amount) FROM public.transactions WHERE kind='withdrawal' AND status='completed'),0),
    (SELECT count(*) FROM public.transactions WHERE kind='deposit' AND status='pending')::int,
    (SELECT count(*) FROM public.transactions WHERE kind='withdrawal' AND status='pending')::int,
    coalesce((SELECT sum(price) FROM public.investments),0),
    coalesce((SELECT sum(balance) FROM public.profiles),0),
    coalesce((SELECT sum(amount) FROM public.transactions WHERE kind='deposit' AND status='completed'),0)
      - coalesce((SELECT sum(amount) FROM public.transactions WHERE kind='withdrawal' AND status='completed'),0);
END;
$$;

-- Admin users list
CREATE OR REPLACE FUNCTION public.admin_users(p_search text DEFAULT '')
RETURNS TABLE(
  id uuid, phone text, country text, invite_code text, balance numeric,
  total_earned numeric, referral_earned numeric, has_invested boolean, created_at timestamptz,
  is_admin boolean
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  SELECT p.id, p.phone, p.country, p.invite_code, p.balance, p.total_earned,
         p.referral_earned, p.has_invested, p.created_at,
         public.has_role(p.id, 'admin')
  FROM public.profiles p
  WHERE coalesce(p_search,'') = ''
     OR p.phone ILIKE '%'||p_search||'%'
     OR p.invite_code ILIKE '%'||p_search||'%'
  ORDER BY p.created_at DESC
  LIMIT 200;
END;
$$;

-- Admin transactions list
CREATE OR REPLACE FUNCTION public.admin_transactions(p_status text DEFAULT 'pending')
RETURNS TABLE(
  id uuid, user_id uuid, user_phone text, kind text, amount numeric,
  status text, method text, phone text, note text, created_at timestamptz
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  SELECT t.id, t.user_id, p.phone, t.kind, t.amount, t.status, t.method, t.phone, t.note, t.created_at
  FROM public.transactions t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  WHERE (coalesce(p_status,'') = '' OR t.status = p_status)
    AND t.kind IN ('deposit','withdrawal')
  ORDER BY t.created_at DESC
  LIMIT 200;
END;
$$;

-- Validate / reject a deposit or withdrawal
CREATE OR REPLACE FUNCTION public.admin_set_transaction_status(p_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_status NOT IN ('completed','failed') THEN RAISE EXCEPTION 'Statut invalide'; END IF;
  SELECT * INTO t FROM public.transactions WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction introuvable'; END IF;
  IF t.status <> 'pending' THEN RAISE EXCEPTION 'Transaction déjà traitée'; END IF;

  IF t.kind = 'deposit' AND p_status = 'completed' THEN
    UPDATE public.profiles SET balance = balance + t.amount WHERE id = t.user_id;
  ELSIF t.kind = 'withdrawal' AND p_status = 'failed' THEN
    UPDATE public.profiles SET balance = balance + t.amount WHERE id = t.user_id;
  END IF;

  UPDATE public.transactions SET status = p_status WHERE id = p_id;
END;
$$;

-- Add funds
CREATE OR REPLACE FUNCTION public.admin_add_funds(p_user_id uuid, p_amount numeric, p_note text DEFAULT 'Ajustement administrateur')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_amount = 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  UPDATE public.profiles SET balance = balance + p_amount WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Utilisateur introuvable'; END IF;
  INSERT INTO public.transactions (user_id, kind, amount, status, note)
  VALUES (p_user_id, 'bonus', p_amount, 'completed', p_note);
END;
$$;

-- Toggle product
CREATE OR REPLACE FUNCTION public.admin_set_product_active(p_product_id uuid, p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE public.products SET active = p_active WHERE id = p_product_id;
END;
$$;

-- Block purchase of inactive products
CREATE OR REPLACE FUNCTION public.purchase_product(p_product_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p RECORD;
  v_bal NUMERIC;
  l1 UUID; l2 UUID; l3 UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT * INTO p FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
  IF NOT p.active THEN RAISE EXCEPTION 'Produit indisponible'; END IF;
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