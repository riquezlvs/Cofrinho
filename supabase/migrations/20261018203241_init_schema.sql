-- ==============================================================================
-- Migration: init_schema
-- Description: Initial schema for "Cofrinho" PWA financial application.
-- Features: Multi-account, isolated VR/VA silos, credit card engine (closing/due dates,
--           installments/snowball), split expenses (social finances/rachadinhas),
--           travel mode (events), visual savings goals (cofrinhos), tags, and strict RLS.
-- ==============================================================================

-- 1. ENUMS & DOMAINS
-- ------------------------------------------------------------------------------
CREATE TYPE public.account_type AS ENUM (
    'checking',
    'savings',
    'vr',
    'va',
    'cash'
);

CREATE TYPE public.transaction_type AS ENUM (
    'income',
    'expense'
);

CREATE TYPE public.payment_method AS ENUM (
    'pix',
    'debit',
    'credit',
    'vr',
    'va',
    'cash'
);

CREATE TYPE public.transaction_status AS ENUM (
    'paid',
    'pending'
);

CREATE TYPE public.split_direction AS ENUM (
    'receivable',
    'payable'
);

-- 2. HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CORE ENTITIES
-- ------------------------------------------------------------------------------

-- 3.1 ACCOUNTS (Contas correntes, carteira e cartões de benefícios VR/VA isolados)
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    type public.account_type NOT NULL DEFAULT 'checking',
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_isolated BOOLEAN NOT NULL DEFAULT false, -- true para VR/VA garantindo silagem do Safe to Spend
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 3.2 CREDIT CARDS (Gestão de Cartões, Fechamento, Vencimento e Limite)
CREATE TABLE public.credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (credit_limit >= 0),
    closing_day SMALLINT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day SMALLINT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    is_default BOOLEAN NOT NULL DEFAULT false, -- Fast Input (cartão padrão assumido no teclado)
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 3.3 CATEGORIES (Categorização padrão, fixos vs variáveis)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    type public.transaction_type NOT NULL,
    icon TEXT,
    color TEXT,
    is_fixed BOOLEAN NOT NULL DEFAULT false, -- Renda fixa / Custo fixo (SaaS/Assinaturas)
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 3.4 EVENTS (Modo Viagem / Eventos - Agrupamento atípico isolado da média)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget NUMERIC(12, 2) CHECK (budget IS NULL OR budget >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    isolate_from_monthly_average BOOLEAN NOT NULL DEFAULT true, -- Não distorce o custo de vida mensal
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT check_event_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- 3.5 SAVINGS GOALS (Metas visuais / Cofrinhos com alocação virtual)
CREATE TABLE public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
    deadline DATE,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 3.6 PEOPLE (Contatos e amigos para Rachadinhas / Finanças Sociais)
CREATE TABLE public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    pix_key TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 3.7 TRANSACTIONS (Tabela Central de Entradas e Saídas)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type public.transaction_type NOT NULL,
    payment_method public.payment_method NOT NULL,
    status public.transaction_status NOT NULL DEFAULT 'paid',
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    competence_date DATE, -- Mês de referência contábil/fatura
    is_fixed BOOLEAN NOT NULL DEFAULT false, -- Flag para SaaS/Contratos e Projeções

    -- Parcelamento / Motor de Cartão ("Bola de Neve")
    installment_group_id UUID, -- Identificador único do lote de parcelas da mesma compra
    installment_number SMALLINT NOT NULL DEFAULT 1 CHECK (installment_number >= 1),
    installment_total SMALLINT NOT NULL DEFAULT 1 CHECK (installment_total >= 1),

    -- Relacionamentos Opcionais
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    savings_goal_id UUID REFERENCES public.savings_goals(id) ON DELETE SET NULL,

    -- Micro-categorização & Auditoria
    tags TEXT[] NOT NULL DEFAULT '{}',
    receipt_url TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT check_installment_validity CHECK (installment_number <= installment_total)
);

-- 3.8 SPLITS (Rateio de Despesas / Rachadinhas com Terceiros)
CREATE TABLE public.splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    amount_owed NUMERIC(12, 2) NOT NULL CHECK (amount_owed > 0),
    direction public.split_direction NOT NULL DEFAULT 'receivable', -- receivable (amigo deve ao user), payable (user deve ao amigo)
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 4. PERFORMANCE & INDEXES
-- ------------------------------------------------------------------------------
-- Índices essenciais para consultas filtradas por usuário (RLS)
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX idx_people_user_id ON public.people(user_id);

-- Índices otimizados para a tabela central de transações
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_competence_date ON public.transactions(user_id, competence_date);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_credit_card_id ON public.transactions(credit_card_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_event_id ON public.transactions(event_id);
CREATE INDEX idx_transactions_savings_goal_id ON public.transactions(savings_goal_id);
CREATE INDEX idx_transactions_installment_group ON public.transactions(installment_group_id);
CREATE INDEX idx_transactions_tags ON public.transactions USING GIN (tags);

-- Índices para splits / rachadinhas
CREATE INDEX idx_splits_user_id ON public.splits(user_id);
CREATE INDEX idx_splits_transaction_id ON public.splits(transaction_id);
CREATE INDEX idx_splits_person_id ON public.splits(person_id);
CREATE INDEX idx_splits_status ON public.splits(user_id, is_paid);

-- 5. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;

-- 5.1 Policies: accounts
CREATE POLICY "Users can view their own accounts"
    ON public.accounts FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own accounts"
    ON public.accounts FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own accounts"
    ON public.accounts FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own accounts"
    ON public.accounts FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 5.2 Policies: credit_cards
CREATE POLICY "Users can view their own credit cards"
    ON public.credit_cards FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own credit cards"
    ON public.credit_cards FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own credit cards"
    ON public.credit_cards FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own credit cards"
    ON public.credit_cards FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 5.3 Policies: categories
CREATE POLICY "Users can view their own categories"
    ON public.categories FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own categories"
    ON public.categories FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 5.4 Policies: events
CREATE POLICY "Users can view their own events"
    ON public.events FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own events"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own events"
    ON public.events FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own events"
    ON public.events FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 5.5 Policies: savings_goals
CREATE POLICY "Users can view their own savings goals"
    ON public.savings_goals FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own savings goals"
    ON public.savings_goals FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own savings goals"
    ON public.savings_goals FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own savings goals"
    ON public.savings_goals FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 5.6 Policies: people
CREATE POLICY "Users can view their own people"
    ON public.people FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own people"
    ON public.people FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own people"
    ON public.people FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own people"
    ON public.people FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 5.7 Policies: transactions
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 5.8 Policies: splits
CREATE POLICY "Users can view their own splits"
    ON public.splits FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own splits"
    ON public.splits FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own splits"
    ON public.splits FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own splits"
    ON public.splits FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 6. TRIGGERS (Automated updated_at timestamp)
-- ------------------------------------------------------------------------------
CREATE TRIGGER trigger_set_updated_at_accounts
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_set_updated_at_credit_cards
    BEFORE UPDATE ON public.credit_cards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_set_updated_at_categories
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_set_updated_at_events
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_set_updated_at_savings_goals
    BEFORE UPDATE ON public.savings_goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_set_updated_at_people
    BEFORE UPDATE ON public.people
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_set_updated_at_transactions
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_set_updated_at_splits
    BEFORE UPDATE ON public.splits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
