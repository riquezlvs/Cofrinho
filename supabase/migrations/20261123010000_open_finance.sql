-- Open Finance connections table & external_id columns for deduplication
CREATE TABLE IF NOT EXISTS public.open_finance_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'pluggy',
  item_id TEXT NOT NULL UNIQUE,
  institution_name TEXT,
  status TEXT NOT NULL DEFAULT 'UPDATING',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.open_finance_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own open finance connections"
  ON public.open_finance_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own open finance connections"
  ON public.open_finance_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own open finance connections"
  ON public.open_finance_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own open finance connections"
  ON public.open_finance_connections FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
