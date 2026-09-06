
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_earnings() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_daily_bonus() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purchase_product(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_deposit(NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_withdrawal(NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.referral_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_earnings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_bonus() TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_deposit(NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.referral_stats() TO authenticated;
