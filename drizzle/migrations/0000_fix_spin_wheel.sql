CREATE OR REPLACE FUNCTION public.spin_wheel()
 RETURNS TABLE(prize_id uuid, label text, amount numeric)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  s RECORD; v_used INT; v_total NUMERIC; v_pick NUMERIC; v_acc NUMERIC := 0; pz RECORD;
  v_bal NUMERIC; v_id uuid; v_label text; v_amount numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT * INTO s FROM public.wheel_settings ws WHERE ws.id = true;
  IF NOT FOUND OR NOT s.active THEN RAISE EXCEPTION 'La roue est indisponible'; END IF;
  SELECT count(*) INTO v_used FROM public.wheel_spins sp
   WHERE sp.user_id = auth.uid() AND sp.created_at >= date_trunc('day', now());
  IF v_used >= s.daily_spins THEN RAISE EXCEPTION 'Vous avez utilisé tous vos tours du jour'; END IF;
  SELECT pr.balance INTO v_bal FROM public.profiles pr WHERE pr.id = auth.uid();
  IF coalesce(v_bal,0) < s.spin_cost THEN RAISE EXCEPTION 'Solde insuffisant pour tourner la roue'; END IF;

  SELECT sum(w.weight * power(greatest(w.amount,1)::numeric, -0.35 * s.difficulty)) INTO v_total
    FROM public.wheel_prizes w WHERE w.active;
  IF coalesce(v_total,0) <= 0 THEN RAISE EXCEPTION 'Aucun lot configuré'; END IF;
  v_pick := random() * v_total;
  FOR pz IN SELECT w.id AS pid, w.label AS plabel, w.amount AS pamount,
                   w.weight * power(greatest(w.amount,1)::numeric, -0.35 * s.difficulty) AS pw
            FROM public.wheel_prizes w WHERE w.active ORDER BY w.amount LOOP
    v_acc := v_acc + pz.pw;
    IF v_id IS NULL AND v_pick <= v_acc THEN v_id := pz.pid; v_label := pz.plabel; v_amount := pz.pamount; END IF;
  END LOOP;
  IF v_id IS NULL THEN
    SELECT w.id, w.label, w.amount INTO v_id, v_label, v_amount FROM public.wheel_prizes w WHERE w.active ORDER BY w.amount LIMIT 1;
  END IF;

  INSERT INTO public.wheel_spins (user_id, prize_id, amount) VALUES (auth.uid(), v_id, v_amount);
  IF s.spin_cost > 0 THEN
    UPDATE public.profiles SET balance = balance - s.spin_cost WHERE id = auth.uid();
    INSERT INTO public.transactions (user_id, kind, amount, note) VALUES (auth.uid(), 'purchase', s.spin_cost, 'Tour de roue');
  END IF;
  IF v_amount > 0 THEN
    UPDATE public.profiles SET balance = balance + v_amount WHERE id = auth.uid();
    INSERT INTO public.transactions (user_id, kind, amount, note) VALUES (auth.uid(), 'bonus', v_amount, 'Gain roue de la chance');
  END IF;
  RETURN QUERY SELECT v_id, v_label, v_amount;
END; $function$;
REVOKE ALL ON FUNCTION public.spin_wheel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;