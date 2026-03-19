import type { NextConfig } from "next";

const configuredSupabaseHost = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return null;
  }

  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yemjqotvmhgltfrdohkw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...(configuredSupabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: configuredSupabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
