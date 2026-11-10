ALTER TABLE public.support_messages ADD COLUMN image_path text;
ALTER TABLE public.support_messages DROP CONSTRAINT IF EXISTS support_messages_body_check;
ALTER TABLE public.support_messages ADD CONSTRAINT support_messages_content_check
  CHECK (char_length(body) <= 2000 AND (char_length(body) >= 1 OR image_path IS NOT NULL));
CREATE POLICY "support files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'support' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "support files upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'support' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));