
import glob
import re

files = [
    "supabase/migrations/021_payment_hardening.sql",
    "supabase/migrations/025_fix_payment_logic.sql",
    "supabase/migrations/026_resolve_rpc_ambiguity.sql",
    "supabase/migrations/031_fix_empire_pulses_insert.sql",
    "supabase/migrations/20260111002710_fix_onboarding_heartbeat.sql",
    "supabase/migrations/20260112000000_create_orders_schema.sql",
    "supabase/migrations/20260112000004_update_tenant_rpc.sql",
    "supabase/migrations/20260112000005_update_tenant_rpc_sov.sql",
    "supabase/migrations/20260118000002_update_create_order_atomic_with_sync_metadata.sql",
    "supabase/migrations/20260120000001_add_partial_payment_support.sql",
    "supabase/migrations/20260122000001_hardening_p0_events.sql",
    "supabase/migrations/20260122000002_hardening_p0_locking.sql",
    "supabase/migrations/20260123000001_inventory_logic.sql"
]

for file_path in files:
    try:
        with open(file_path, "r") as f:
            content = f.read()
        
        # Replace: 'some text ' ||\n 'more text' -> 'some text more text'
        new_content = re.sub(r"' \|\|\n\s*'", "", content)
        
        if new_content != content:
            print(f"Fixing {file_path}")
            with open(file_path, "w") as f:
                f.write(new_content)
    except FileNotFoundError:
        print(f"Skipping missing file: {file_path}")
