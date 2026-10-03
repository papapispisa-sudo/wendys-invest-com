CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount NUMERIC, p_method TEXT, p_phone TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr RECORD; v_hour INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  v_hour := extract(hour FROM (now() AT TIME ZONE 'UTC'))::int;
  IF v_hour < 10 OR v_hour >= 17 THEN
    RAISE EXCEPTION 'Les retraits sont possibles de 10H à 17H GMT';
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
REVOKE ALL ON FUNCTION public.request_withdrawal(NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(NUMERIC, TEXT, TEXT) TO authenticated;