
import re

files = [
    "supabase/migrations/20260112000004_update_tenant_rpc.sql",
    "supabase/migrations/20260112000005_update_tenant_rpc_sov.sql",
    "supabase/migrations/20260113000000_create_audit_logs.sql",
    "supabase/migrations/20260115000000_create_restaurant_groups.sql",
    "supabase/migrations/20260116000002_fiscal_event_store.sql",
    "supabase/migrations/20260116000003_customer_loyalty.sql",
    "supabase/migrations/20260117000001_rls_orders.sql",
    "supabase/migrations/20260117000005_delivery_integration.sql",
    "supabase/migrations/20260120000002_create_fiscal_queue.sql"
]

for file_path in files:
    try:
        with open(file_path, "r") as f:
            content = f.read()
            
        # Regex to match 'restaurant_members' not preceded by 'gm_' or 'saas_' (just in case)
        # Actually, simply checking for word boundary?
        # (?<!gm_)restaurant_members matches 'restaurant_members' but not 'gm_restaurant_members'.
        # It WOULD match 'public.restaurant_members'.
        
        new_content = re.sub(r'(?<!gm_)restaurant_members', 'gm_restaurant_members', content)
        
        if new_content != content:
            print(f"Fixing {file_path}")
            with open(file_path, "w") as f:
                f.write(new_content)
    except FileNotFoundError:
        print(f"Skipping missing file: {file_path}")
