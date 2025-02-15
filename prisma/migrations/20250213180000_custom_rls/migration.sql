-- -- RLS Settings for "chat_history"

-- ALTER TABLE "chat_history" ENABLE ROW LEVEL SECURITY;
-- -- Supabase の auth.uid() を利用して、user_idカラムとの比較を行います
-- CREATE POLICY chat_history_user_isolation_policy ON "chat_history"
--   USING (auth.uid()::text = user_id::text);

-- -- ※ bypass ポリシーが不要であれば以下は省略してください。必要な場合は条件に合わせて調整してください
-- -- CREATE POLICY bypass_rls_policy ON "chat_history"
-- --   USING (current_setting('app.bypass_rls', TRUE)::text = 'on');

-- -- RLS Settings for "upload"

-- ALTER TABLE "upload" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY upload_user_isolation_policy ON "upload"
--   USING (auth.uid()::text = user_id::text);

-- -- CREATE POLICY bypass_rls_policy ON "upload"
-- --   USING (current_setting('app.bypass_rls', TRUE)::text = 'on');