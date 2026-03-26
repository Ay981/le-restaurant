"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

type MobileRouteItem = {
  href: string;
  labelEn: string;
  labelAm: string;
};

const publicRoutes: MobileRouteItem[] = [
  { href: "/", labelEn: "Home", labelAm: "መነሻ" },
  { href: "/menu", labelEn: "Menu", labelAm: "ሜኑ" },
  { href: "/about-us", labelEn: "About Us", labelAm: "ስለ እኛ" },
  { href: "/contact-us", labelEn: "Support / Contact", labelAm: "ድጋፍ / አግኙን" },
];

const guestOnlyRoutes: MobileRouteItem[] = [
  { href: "/sign-in", labelEn: "Sign In", labelAm: "ግባ" },
  { href: "/create-account", labelEn: "Create Account", labelAm: "አካውንት ፍጠር" },
];

const customerRoutes: MobileRouteItem[] = [
  { href: "/orders", labelEn: "Orders", labelAm: "ትዕዛዞች" },
  { href: "/my-orders", labelEn: "My Orders", labelAm: "የእኔ ትዕዛዞች" },
  { href: "/messages", labelEn: "Messages", labelAm: "መልዕክቶች" },
  { href: "/notifications", labelEn: "Notifications", labelAm: "ማሳወቂያዎች" },
];

const staffRoutes: MobileRouteItem[] = [
  { href: "/admin/orders", labelEn: "Admin Orders", labelAm: "የአስተዳዳሪ ትዕዛዞች" },
  { href: "/admin/messages", labelEn: "Admin Messages", labelAm: "የአስተዳዳሪ መልዕክቶች" },
  { href: "/menu", labelEn: "Menu", labelAm: "ሜኑ" },
  { href: "/notifications", labelEn: "Notifications", labelAm: "ማሳወቂያዎች" },
];

const adminRoutes: MobileRouteItem[] = [
  { href: "/admin", labelEn: "Admin Products", labelAm: "የአስተዳዳሪ ምርቶች" },
  { href: "/admin/orders", labelEn: "Admin Orders", labelAm: "የአስተዳዳሪ ትዕዛዞች" },
  { href: "/admin/messages", labelEn: "Admin Messages", labelAm: "የአስተዳዳሪ መልዕክቶች" },
  { href: "/admin/analytics", labelEn: "Admin Analytics", labelAm: "የአስተዳዳሪ ትንታኔ" },
  { href: "/admin/settings", labelEn: "Admin Settings", labelAm: "የአስተዳዳሪ ቅንብሮች" },
  { href: "/menu", labelEn: "Menu", labelAm: "ሜኑ" },
  { href: "/notifications", labelEn: "Notifications", labelAm: "ማሳወቂያዎች" },
];

type ProfileRole = "customer" | "admin" | "staff" | null;

type MobileHamburgerSidebarProps = {
  locale: Locale;
  languageLabel: string;
  englishLabel: string;
  amharicLabel: string;
};

export default function MobileHamburgerSidebar({
  locale,
  languageLabel,
  englishLabel,
  amharicLabel,
}: MobileHamburgerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale: activeLocale } = useI18n();
  const isAmharic = activeLocale === "am";
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileRole, setProfileRole] = useState<ProfileRole>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSessionAndRole = async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      const userId = session?.user?.id;
      const authed = Boolean(userId);
      setIsAuthenticated(authed);

      if (!authed || !userId) {
        setProfileRole(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      const roleValue = data?.role;
      setProfileRole(roleValue === "admin" || roleValue === "staff" || roleValue === "customer" ? roleValue : null);
    };

    void loadSessionAndRole();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const visibleItems = useMemo(() => {
    if (!isAuthenticated) {
      return [...publicRoutes, ...guestOnlyRoutes];
    }

    if (profileRole === "admin") {
      return adminRoutes;
    }

    if (profileRole === "staff") {
      return staffRoutes;
    }

    return [...publicRoutes, ...customerRoutes];
  }, [isAuthenticated, profileRole]);

  const dedupedItems = useMemo(() => {
    return visibleItems.filter((item, index, allItems) => allItems.findIndex((entry) => entry.href === item.href) === index);
  }, [visibleItems]);

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.replace("/sign-in");
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="app-bg-panel fixed left-3 top-[calc(env(safe-area-inset-top)+0.5rem)] z-70 rounded-xl border border-white/15 p-2 text-white"
        aria-label={isAmharic ? "ናቪጌሽን ክፈት" : "Open navigation"}
      >
        <FiMenu className="text-xl" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-80">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
            aria-label={isAmharic ? "ናቪጌሽን ዝጋ" : "Close navigation"}
          />

          <aside className="app-bg-panel absolute left-0 top-0 h-full w-[84%] max-w-sm border-r border-white/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{isAmharic ? "መንገዶች" : "Routes"}</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-white/15 p-2 text-gray-200"
                aria-label={isAmharic ? "ዝጋ" : "Close"}
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="mb-4">
              <LanguageSwitcher
                locale={locale}
                label={languageLabel}
                englishLabel={englishLabel}
                amharicLabel={amharicLabel}
              />
            </div>

            <nav className="max-h-[calc(100vh-160px)] space-y-1 overflow-y-auto pr-1">
              {dedupedItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive ? "app-bg-accent text-white" : "text-gray-200 hover:bg-white/10"
                    }`}
                  >
                    {isAmharic ? item.labelAm : item.labelEn}
                  </Link>
                );
              })}
            </nav>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-200"
              >
                <IoIosLogOut className="text-lg" />
                <span>{isAmharic ? "ውጣ" : "Sign out"}</span>
              </button>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
