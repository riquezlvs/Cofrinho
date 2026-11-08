-- ==============================================================================
-- Migration: expand_categories
-- Description: Suporte a hierarquia de categorias (Macro-categorias e Subcategorias)
-- ==============================================================================

-- 1. Adicionar coluna parent_id auto-referencial na tabela categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- 2. Índice para consultas rápidas por subcategorias de um pai
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

COMMENT ON COLUMN public.categories.parent_id IS 'UUID da Macro-categoria pai. NULL se for uma categoria de primeiro nível.';
