import { createClient } from "@supabase/supabase-js";

export type AppRole = "customer" | "admin" | "staff";

type RoleAuthResult =
  | {
      ok: true;
      userId: string;
      role: AppRole;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

function getPublicSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase public env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

function getBearerToken(request: Request): string | null {
  const authorizationHeader = request.headers.get("authorization");
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function requireRoleAccess(request: Request, allowedRoles: AppRole[]): Promise<RoleAuthResult> {
  const token = getBearerToken(request);
  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Missing access token.",
    };
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseEnv();

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return {
      ok: false,
      status: 401,
      message: "Invalid or expired access token.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      status: 403,
      message: "Unable to verify user role.",
    };
  }

  const role = (profile?.role ?? "customer") as AppRole;

  if (!allowedRoles.includes(role)) {
    const allowedLabel = allowedRoles.join(" or ");
    return {
      ok: false,
      status: 403,
      message: `${allowedLabel} access required.`,
    };
  }

  return {
    ok: true,
    userId: user.id,
    role,
  };
}

export async function requireAdminAccess(request: Request): Promise<RoleAuthResult> {
  return requireRoleAccess(request, ["admin"]);
}

export async function requireAdminOrStaffAccess(request: Request): Promise<RoleAuthResult> {
  return requireRoleAccess(request, ["admin", "staff"]);
}
