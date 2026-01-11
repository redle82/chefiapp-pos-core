-- 082_staff_user_link.sql
-- Vínculo funcionário ⇄ usuário + role em tarefas

-- 1) employees.user_id (FK opcional para profiles)
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'employees_user_id_fkey'
    ) THEN
        ALTER TABLE public.employees
        ADD CONSTRAINT employees_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 2) Um usuário não pode ser funcionário duas vezes no mesmo restaurante
CREATE UNIQUE INDEX IF NOT EXISTS employees_unique_user_per_restaurant
ON public.employees (restaurant_id, user_id)
WHERE user_id IS NOT NULL;

-- 3) Garantir role em tarefas
ALTER TABLE public.app_tasks
ADD COLUMN IF NOT EXISTS assigned_role TEXT DEFAULT 'staff';

-- 4) Normalização opcional: vincular pelo e-mail já existente
-- (executa apenas onde há correspondência)
UPDATE public.employees e
SET user_id = p.id
FROM public.profiles p
WHERE e.user_id IS NULL
  AND e.email = p.email;

