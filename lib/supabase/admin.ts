import "server-only";

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminEnv() {
  const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverSupabaseUrl = process.env.SUPABASE_URL;
  const supabaseUrl = publicSupabaseUrl ?? serverSupabaseUrl;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env vars. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (publicSupabaseUrl && serverSupabaseUrl && publicSupabaseUrl !== serverSupabaseUrl) {
    throw new Error(
      "Supabase URL mismatch: SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL must point to the same project.",
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

export function createSupabaseAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getSupabaseAdminEnv();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
