import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.CORE_API_URL ||
  "http://localhost:3001";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.CORE_ANON_KEY || "";
if (!supabaseKey) {
  console.error("Missing CORE_ANON_KEY or VITE_SUPABASE_ANON_KEY env var");
  process.exit(1);
}

if (!supabaseKey) {
  console.error("Missing VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const timestamp = Date.now();
  const email = `reality_test_${timestamp}@chefiapp.com`;
  const password = "Password123!";

  console.log(`Creating user: ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: "Reality Tester",
      },
    },
  });

  if (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  }

  console.log("User created successfully!");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("ID:", data.user?.id);

  // Output strictly for parsing
  console.log(`__CREDENTIALS__:${email}:${password}`);
}

createTestUser();
