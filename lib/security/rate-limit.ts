import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ConsumeRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type ConsumeRateLimitRow = {
  allowed: boolean;
  retry_after_seconds: number;
};

export async function consumeRateLimit(params: {
  key: string;
  maxRequests: number;
  windowSeconds: number;
}): Promise<ConsumeRateLimitResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_key: params.key,
    p_limit: params.maxRequests,
    p_window_seconds: params.windowSeconds,
  });

  if (error || !Array.isArray(data) || data.length === 0) {
    return {
      allowed: false,
      retryAfterSeconds: params.windowSeconds,
    };
  }

  const row = data[0] as ConsumeRateLimitRow;
  return {
    allowed: Boolean(row.allowed),
    retryAfterSeconds: Math.max(1, Number(row.retry_after_seconds) || 1),
  };
}
