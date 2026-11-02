ALTER TABLE public.site_settings
 ADD COLUMN min_deposit numeric NOT NULL DEFAULT 2000,
 ADD COLUMN min_withdrawal numeric NOT NULL DEFAULT 1000,
 ADD COLUMN withdrawal_start_hour integer NOT NULL DEFAULT 10,
 ADD COLUMN withdrawal_end_hour integer NOT NULL DEFAULT 17,
 ADD COLUMN signup_bonus numeric NOT NULL DEFAULT 1000,
 ADD COLUMN daily_bonus numeric NOT NULL DEFAULT 125,
 ADD COLUMN referral_rate_1 numeric NOT NULL DEFAULT 30,
 ADD COLUMN referral_rate_2 numeric NOT NULL DEFAULT 3,
 ADD COLUMN referral_rate_3 numeric NOT NULL DEFAULT 2;
ALTER TABLE public.site_settings ADD CONSTRAINT financial_settings_valid CHECK (
 min_deposit BETWEEN 1 AND 1000000000 AND min_deposit=trunc(min_deposit) AND min_withdrawal BETWEEN 1 AND 1000000000 AND min_withdrawal=trunc(min_withdrawal)
 AND withdrawal_start_hour >= 0 AND withdrawal_start_hour < withdrawal_end_hour AND withdrawal_end_hour <= 24
 AND signup_bonus BETWEEN 0 AND 1000000000 AND signup_bonus=trunc(signup_bonus) AND daily_bonus BETWEEN 0 AND 1000000000 AND daily_bonus=trunc(daily_bonus)
 AND referral_rate_1 BETWEEN 0 AND 100 AND referral_rate_2 BETWEEN 0 AND 100 AND referral_rate_3 BETWEEN 0 AND 100
 AND referral_rate_1+referral_rate_2+referral_rate_3 <= 100);
CREATE OR REPLACE FUNCTION public.admin_update_financial_settings(p_settings jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Accès refusé'; END IF;
 IF p_settings IS NULL OR jsonb_typeof(p_settings) <> 'object' OR NOT (p_settings ?& ARRAY['min_deposit','min_withdrawal','withdrawal_start_hour','withdrawal_end_hour','signup_bonus','daily_bonus','referral_rate_1','referral_rate_2','referral_rate_3']) THEN RAISE EXCEPTION 'Réglages incomplets'; END IF;
 IF (p_settings->>'withdrawal_start_hour')::numeric <> trunc((p_settings->>'withdrawal_start_hour')::numeric) OR (p_settings->>'withdrawal_end_hour')::numeric <> trunc((p_settings->>'withdrawal_end_hour')::numeric) THEN RAISE EXCEPTION 'Les heures doivent être entières'; END IF;
 UPDATE public.site_settings SET min_deposit=(p_settings->>'min_deposit')::numeric, min_withdrawal=(p_settings->>'min_withdrawal')::numeric,
 withdrawal_start_hour=(p_settings->>'withdrawal_start_hour')::integer, withdrawal_end_hour=(p_settings->>'withdrawal_end_hour')::integer,
 signup_bonus=(p_settings->>'signup_bonus')::numeric, daily_bonus=(p_settings->>'daily_bonus')::numeric,
 referral_rate_1=(p_settings->>'referral_rate_1')::numeric, referral_rate_2=(p_settings->>'referral_rate_2')::numeric, referral_rate_3=(p_settings->>'referral_rate_3')::numeric, updated_at=now() WHERE id=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Réglages du site introuvables'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_update_financial_settings(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_financial_settings(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_deposit(p_amount numeric,p_method text,p_phone text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; s public.site_settings;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
 SELECT * INTO STRICT s FROM public.site_settings WHERE id=true;
 IF p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount < s.min_deposit OR p_amount <> trunc(p_amount) THEN RAISE EXCEPTION 'Le dépôt minimum est de % FCFA (montant entier)', s.min_deposit; END IF;
 INSERT INTO public.transactions(user_id,kind,amount,status,method,phone,note) VALUES(auth.uid(),'deposit',p_amount,'pending',p_method,p_phone,'Dépôt en attente de paiement') RETURNING id INTO v_id;
 RETURN v_id;
END $$;
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount numeric,p_method text,p_phone text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pr public.profiles; s public.site_settings; v_hour integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
 SELECT * INTO STRICT s FROM public.site_settings WHERE id=true;
 v_hour:=extract(hour FROM now() AT TIME ZONE 'UTC')::integer;
 IF v_hour<s.withdrawal_start_hour OR v_hour>=s.withdrawal_end_hour THEN RAISE EXCEPTION 'Les retraits sont possibles de %H à %H GMT',s.withdrawal_start_hour,s.withdrawal_end_hour; END IF;
 IF p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount<s.min_withdrawal OR p_amount<>trunc(p_amount) THEN RAISE EXCEPTION 'Le retrait minimum est de % FCFA (montant entier)',s.min_withdrawal; END IF;
 SELECT * INTO pr FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Compte introuvable'; END IF;
 IF NOT pr.has_invested THEN RAISE EXCEPTION 'Vous devez acheter un produit avant de retirer'; END IF;
 IF pr.balance<p_amount THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;
 UPDATE public.profiles SET balance=balance-p_amount WHERE id=auth.uid();
 INSERT INTO public.transactions(user_id,kind,amount,status,method,phone,note) VALUES(auth.uid(),'withdrawal',p_amount,'pending',p_method,p_phone,'Retrait en cours de traitement');
END $$;
CREATE OR REPLACE FUNCTION public.claim_daily_bonus()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_last date; v_bonus numeric; v_today date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
 SELECT daily_bonus INTO STRICT v_bonus FROM public.site_settings WHERE id=true;
 SELECT last_bonus_date INTO v_last FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Compte introuvable'; END IF;
 IF v_last=v_today THEN RAISE EXCEPTION 'Bonus déjà réclamé aujourd''hui'; END IF;
 UPDATE public.profiles SET balance=balance+v_bonus,last_bonus_date=v_today WHERE id=auth.uid();
 INSERT INTO public.transactions(user_id,kind,amount,note) VALUES(auth.uid(),'bonus',v_bonus,'Bonus quotidien');
END $$;
REVOKE ALL ON FUNCTION public.create_deposit(numeric,text,text), public.request_withdrawal(numeric,text,text), public.claim_daily_bonus() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_deposit(numeric,text,text), public.request_withdrawal(numeric,text,text), public.claim_daily_bonus() TO authenticated;

DO $$ DECLARE def text; BEGIN
 SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure) INTO def;
 def:=replace(def,'v_ref UUID;','v_ref UUID; v_signup_bonus numeric;');
 def:=replace(def,'BEGIN','BEGIN SELECT signup_bonus INTO STRICT v_signup_bonus FROM public.site_settings WHERE id=true;');
 def:=replace(def,'1000','v_signup_bonus');
 IF position('v_signup_bonus' in def)=0 THEN RAISE EXCEPTION 'Bonus inscription non adapté'; END IF;
 EXECUTE def;
 SELECT pg_get_functiondef('public.purchase_product(uuid)'::regprocedure) INTO def;
 def:=replace(def,'p.price * 0.30','p.price * (SELECT referral_rate_1/100 FROM public.site_settings WHERE id=true)');
 def:=replace(def,'p.price * 0.03','p.price * (SELECT referral_rate_2/100 FROM public.site_settings WHERE id=true)');
 def:=replace(def,'p.price * 0.02','p.price * (SELECT referral_rate_3/100 FROM public.site_settings WHERE id=true)');
 def:=replace(def,'BEGIN','BEGIN PERFORM 1 FROM public.profiles WHERE id=auth.uid() FOR UPDATE;');
 IF position('referral_rate_1' in def)=0 OR position('referral_rate_2' in def)=0 OR position('referral_rate_3' in def)=0 THEN RAISE EXCEPTION 'Commissions non adaptées'; END IF;
 EXECUTE def;
END $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.referral_details()
RETURNS TABLE(user_id uuid,phone text,country text,level integer,total_invested numeric,total_withdrawn numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
 RETURN QUERY WITH RECURSIVE team AS (
 SELECT p.id,p.phone,p.country,1 AS depth, ARRAY[auth.uid(),p.id] AS path FROM public.profiles p WHERE p.referred_by=auth.uid() AND p.id<>auth.uid()
 UNION ALL
 SELECT p.id,p.phone,p.country,t.depth+1,t.path||p.id FROM public.profiles p JOIN team t ON p.referred_by=t.id WHERE t.depth<3 AND NOT p.id=ANY(t.path)
 ) SELECT t.id,t.phone,t.country,t.depth,
 coalesce((SELECT sum(x.amount) FROM public.transactions x WHERE x.user_id=t.id AND x.kind='purchase' AND x.status='completed'),0),
 coalesce((SELECT sum(x.amount) FROM public.transactions x WHERE x.user_id=t.id AND x.kind='withdrawal' AND x.status='completed'),0)
 FROM team t ORDER BY t.depth,t.id;
END $$;
REVOKE ALL ON FUNCTION public.referral_details() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.referral_details() TO authenticated;