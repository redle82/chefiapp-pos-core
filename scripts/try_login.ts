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

const supabase = createClient(supabaseUrl, supabaseKey);

const USERS = [
  { email: "admin@chefiapp.com", password: "password123" },
  { email: "admin@chefiapp.com", password: "password" },
  { email: "test@chefiapp.com", password: "password123" },
  { email: "sofia@chefiapp.com", password: "password123" },
  { email: "sofia.gastrobar@chefiapp.com", password: "password123" },
  { email: "beta.sofia@chefiapp.com", password: "password123" },
];

async function tryLogin() {
  for (const u of USERS) {
    console.log(`Trying login: ${u.email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });

    if (error) {
      console.log(`Failed: ${error.message}`);
    } else {
      console.log("✅✅✅ LOGIN SUCCESSFUL! ✅✅✅");
      console.log(`__CREDENTIALS__:${u.email}:${u.password}`);
      console.log("User ID:", data.user?.id);
      process.exit(0);
    }
  }
  console.log("❌ All login attempts failed.");
  process.exit(1);
}

tryLogin();
