-- Rename tables to match Sovereign Architecture (gm_ prefix)
-- Menu Categories
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'menu_categories'
        AND table_schema = 'public'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'gm_menu_categories'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.menu_categories
    RENAME TO gm_menu_categories;
END IF;
END $$;
-- Menu Items
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'menu_items'
        AND table_schema = 'public'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'gm_menu_items'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.menu_items
    RENAME TO gm_menu_items;
END IF;
END $$;
-- Cash Registers
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'cash_registers'
        AND table_schema = 'public'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'gm_cash_registers'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.cash_registers
    RENAME TO gm_cash_registers;
END IF;
END $$;
-- Cash Register Sessions (if exists) -> gm_cash_register_sessions
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'cash_register_sessions'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.cash_register_sessions
    RENAME TO gm_cash_register_sessions;
END IF;
END $$;