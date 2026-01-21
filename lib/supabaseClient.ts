import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const hasEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasEnv) {
  // Avoid hard failure during build; runtime requests will still fail without envs.
  console.warn(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(
  hasEnv ? supabaseUrl : "http://localhost",
  hasEnv ? supabaseAnonKey : "anon",
);

