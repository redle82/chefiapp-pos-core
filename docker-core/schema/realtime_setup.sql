-- =============================================================================
-- REALTIME SETUP — Configuração do Realtime para Docker Core
-- =============================================================================
-- Este script configura o Realtime do Supabase para funcionar com o Docker Core.
-- 
-- IMPORTANTE: 
-- 1. O PostgreSQL precisa ter wal_level = 'logical' (configurado no docker-compose)
-- 2. O Realtime precisa de uma publicação PostgreSQL para escutar mudanças
-- 3. Após executar este script, reinicie o Realtime: docker compose restart realtime
-- =============================================================================

-- Criar publicação para Realtime (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Adicionar tabelas à publicação (ignora erro se já existir)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE gm_orders;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE gm_order_items;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE gm_tasks;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Comentários
COMMENT ON PUBLICATION supabase_realtime IS 'Publicação para Realtime do Supabase - escuta mudanças em gm_orders, gm_order_items e gm_tasks';
