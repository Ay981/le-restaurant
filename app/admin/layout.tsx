"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSideRail } from "./_components/layout";
import AdminShellSkeleton from "./_components/skeletons/AdminShellSkeleton";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/I18nProvider";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const validateAccess = async () => {
      const supabase = createBrowserSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace(`/sign-in?next=${encodeURIComponent(pathname || "/admin")}`);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        setHasAccess(false);
        setErrorMessage(isAmharic ? "ለዚህ ክፍል የሚገባውን ሚና ማረጋገጥ አልተቻለም።" : "Unable to verify role for this section.");
        setIsCheckingAccess(false);
        return;
      }

      const role = profile?.role;
      const isAdmin = role === "admin";
      const isStaff = role === "staff";

      if (!isAdmin && !isStaff) {
        setHasAccess(false);
        setErrorMessage(isAmharic ? "ለዚህ ክፍል የአስተዳዳሪ ወይም የሰራተኛ ፍቃድ ያስፈልጋል።" : "Admin or staff access is required for this section.");
        setIsCheckingAccess(false);
        return;
      }

      if (isStaff && pathname !== "/admin" && pathname !== "/admin/orders" && pathname !== "/admin/messages") {
        router.replace("/admin/orders");
        return;
      }

      setHasAccess(true);
      setErrorMessage(null);
      setIsCheckingAccess(false);
    };

    void validateAccess();
  }, [isAmharic, pathname, router]);

  if (isCheckingAccess) {
    return <AdminShellSkeleton />;
  }

  if (!hasAccess) {
    return (
      <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 p-6">
          <h1 className="text-2xl font-semibold">{isAmharic ? "የአስተዳዳሪ ፍቃድ ያስፈልጋል" : "Admin Access Required"}</h1>
          <p className="mt-2 text-sm text-gray-300">{isAmharic ? "ይህን ክፍል የሚያገኙት አስተዳዳሪ እና ሰራተኛ መለያዎች ብቻ ናቸው።" : "Only admin and staff accounts can access this section."}</p>
          {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
          <div className="mt-4">
            <Link href="/menu" className="app-text-accent hover:underline">
              {isAmharic ? "ወደ ዳሽቦርድ ተመለስ" : "Back to dashboard"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-bg-main min-h-screen px-2 pb-6 pt-1 text-white md:px-3 md:pt-4 lg:py-2 lg:pb-2 lg:pt-2">
      <div className="w-full rounded-2xl border border-white/10 p-2 md:rounded-3xl md:p-4">
        <div className="grid items-stretch gap-3 lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[72px_1fr]">
          <AdminSideRail />
          <section>{children}</section>
        </div>
      </div>
    </main>
  );
}
