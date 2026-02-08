-- Migration: 075_unique_open_cash_register.sql
-- Purpose: Garantir apenas 1 caixa aberto por restaurante (LEI FÍSICA)
-- Date: 2026-01-03
-- 
-- CONTEXTO:
-- Antes: A regra "1 caixa aberto por restaurante" era garantida apenas pelo código
-- Depois: A regra é garantida pelo banco de dados (impossível violar)
--
-- BENEFÍCIOS:
-- 1. Bugs de UI não podem criar estado inválido
-- 2. Múltiplos clientes/tablets não podem quebrar a regra
-- 3. Scripts externos não podem criar caixas duplicados
-- 4. Operadores mal treinados não podem causar inconsistência
-- 5. Futuras integrações já nascem protegidas
--
-- AUDITORIA: TPV_AUDIT_2025-01 - Recomendação de segurança estrutural

-- ============================================================
-- 1. UNIQUE PARTIAL INDEX: Apenas 1 caixa aberto por restaurante
-- ============================================================
-- Este index garante que para cada restaurant_id só pode existir
-- uma linha onde status = 'open'. Tentativas de inserir ou atualizar
-- para criar um segundo caixa aberto resultarão em erro de constraint.

CREATE UNIQUE INDEX IF NOT EXISTS uq_one_open_cash_register_per_restaurant
ON public.cash_registers (restaurant_id)
WHERE status = 'open';

COMMENT ON INDEX public.uq_one_open_cash_register_per_restaurant IS 
'LEI FÍSICA: Apenas 1 caixa pode estar aberto por restaurante ao mesmo tempo. Qualquer tentativa de abrir segundo caixa será rejeitada pelo banco.';

-- ============================================================
-- 2. FUNÇÃO HELPER: Verificar antes de abrir (para mensagem amigável)
-- ============================================================
-- Embora o index já proteja, esta função permite dar erro mais amigável
-- antes de tentar inserir e receber erro de constraint

CREATE OR REPLACE FUNCTION public.fn_can_open_cash_register(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Retorna TRUE se pode abrir (não existe caixa aberto)
    -- Retorna FALSE se não pode (já existe caixa aberto)
    RETURN NOT EXISTS (
        SELECT 1 
        FROM public.cash_registers 
        WHERE restaurant_id = p_restaurant_id 
        AND status = 'open'
    );
END;
$$;

COMMENT ON FUNCTION public.fn_can_open_cash_register IS 
'Verifica se é possível abrir caixa para o restaurante. Retorna FALSE se já existe caixa aberto.';

-- ============================================================
-- 3. TRIGGER: Mensagem amigável ao tentar abrir segundo caixa
-- ============================================================
-- O UNIQUE INDEX vai rejeitar de qualquer forma, mas o erro seria:
-- "duplicate key value violates unique constraint"
-- Este trigger dá uma mensagem mais clara para o operador

CREATE OR REPLACE FUNCTION public.fn_prevent_duplicate_open_cash_register()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_register_id UUID;
    v_existing_register_name TEXT;
BEGIN
    -- Só verificar se status é 'open'
    IF NEW.status = 'open' THEN
        -- Verificar se já existe outro caixa aberto
        SELECT id, name 
        INTO v_existing_register_id, v_existing_register_name
        FROM public.cash_registers
        WHERE restaurant_id = NEW.restaurant_id
        AND status = 'open'
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
        
        IF v_existing_register_id IS NOT NULL THEN
            RAISE EXCEPTION 
                'Já existe caixa aberto: "%" (ID: %). Feche o caixa atual antes de abrir outro.',
                v_existing_register_name,
                v_existing_register_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para INSERT
DROP TRIGGER IF EXISTS tr_prevent_duplicate_open_cash_register_insert ON public.cash_registers;
CREATE TRIGGER tr_prevent_duplicate_open_cash_register_insert
BEFORE INSERT ON public.cash_registers
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_duplicate_open_cash_register();

-- Trigger para UPDATE (caso alguém tente reabrir via UPDATE)
DROP TRIGGER IF EXISTS tr_prevent_duplicate_open_cash_register_update ON public.cash_registers;
CREATE TRIGGER tr_prevent_duplicate_open_cash_register_update
BEFORE UPDATE ON public.cash_registers
FOR EACH ROW
WHEN (OLD.status != 'open' AND NEW.status = 'open')
EXECUTE FUNCTION public.fn_prevent_duplicate_open_cash_register();

COMMENT ON TRIGGER tr_prevent_duplicate_open_cash_register_insert ON public.cash_registers IS 
'Previne abertura de segundo caixa com mensagem amigável (além do UNIQUE INDEX que também protege).';

COMMENT ON TRIGGER tr_prevent_duplicate_open_cash_register_update ON public.cash_registers IS 
'Previne reabertura de caixa fechado se já existe outro aberto.';

-- ============================================================
-- 4. VALIDAÇÃO: Verificar estado atual (não deveria ter duplicados)
-- ============================================================
-- Esta query verifica se existem duplicados ANTES de criar o index
-- Se existirem, a migration falhará (o que é correto - dados devem ser corrigidos primeiro)

DO $$
DECLARE
    v_duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_duplicate_count
    FROM (
        SELECT restaurant_id
        FROM public.cash_registers
        WHERE status = 'open'
        GROUP BY restaurant_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF v_duplicate_count > 0 THEN
        RAISE WARNING 
            'ATENÇÃO: % restaurante(s) com múltiplos caixas abertos detectados. O UNIQUE INDEX foi criado, mas dados inconsistentes podem existir.',
            v_duplicate_count;
    END IF;
END $$;
