"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthGateProps = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    let mounted = true;

    const getCurrentPathForRedirect = () => {
      if (typeof window !== "undefined") {
        const fullPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        return fullPath || pathname;
      }

      return pathname;
    };

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setUser(session?.user ?? null);

        if (!session?.user) {
          const encodedPath = encodeURIComponent(getCurrentPathForRedirect());
          router.replace(`/sign-in?next=${encodedPath}`);
        }
      } catch (error) {
        console.error("Failed to check Supabase session", error);

        if (!mounted) {
          return;
        }

        setUser(null);
        const encodedPath = encodeURIComponent(pathname);
        router.replace(`/sign-in?next=${encodedPath}`);
      } finally {
        if (mounted) {
          setIsCheckingSession(false);
        }
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setUser(session?.user ?? null);
      if (!session?.user) {
        const encodedPath = encodeURIComponent(getCurrentPathForRedirect());
        router.replace(`/sign-in?next=${encodedPath}`);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (isCheckingSession || !user) {
    return (
      <div className="app-bg-main flex min-h-screen items-center justify-center px-4 text-gray-300">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}