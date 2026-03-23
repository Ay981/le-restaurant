"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IoIosLogOut } from "react-icons/io";
import { CiHome } from "react-icons/ci";
import { FiEdit3, FiClipboard, FiMail, FiPieChart, FiPlus, FiSettings } from "react-icons/fi";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/I18nProvider";

type RailLink = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  activeWhen: (pathname: string) => boolean;
  labelEn: string;
  labelAm: string;
};

export default function AdminSideRail() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useI18n();
  const isAmharic = locale === "am";

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/sign-in");
  };

  const desktopLinks: RailLink[] = [
    {
      href: "/admin",
      icon: FiEdit3,
      activeWhen: (path) => path === "/admin",
      labelEn: "Open products management",
      labelAm: "የምርቶች አስተዳደርን ክፈት",
    },
    {
      href: "/admin/analytics",
      icon: FiPieChart,
      activeWhen: (path) => path === "/admin/analytics",
      labelEn: "Open analytics dashboard",
      labelAm: "የትንታኔ ዳሽቦርድን ክፈት",
    },
    {
      href: "/admin/orders",
      icon: FiClipboard,
      activeWhen: (path) => path === "/admin/orders",
      labelEn: "Open orders page",
      labelAm: "የትዕዛዞች ገጽን ክፈት",
    },
    {
      href: "/admin/messages",
      icon: FiMail,
      activeWhen: (path) => path === "/admin/messages",
      labelEn: "Open messages page",
      labelAm: "የመልእክቶች ገጽን ክፈት",
    },
  ];

  const mobilePrimaryLinks: RailLink[] = [
    {
      href: "/menu",
      icon: CiHome,
      activeWhen: (path) => path === "/menu",
      labelEn: "Back to dashboard home",
      labelAm: "ወደ ዳሽቦርድ መነሻ ተመለስ",
    },
    ...desktopLinks,
  ];

  const leftMobileLinks = mobilePrimaryLinks.filter((link) => ["/menu", "/admin/orders"].includes(link.href));
  const rightMobileLinks = mobilePrimaryLinks.filter((link) => ["/admin/messages", "/admin/settings"].includes(link.href));

  const renderLink = (item: RailLink, compact = false) => {
    const Icon = item.icon;
    const isActive = item.activeWhen(pathname);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`rounded-xl ${compact ? "p-2.5" : "p-3"} text-xl transition-colors ${isActive ? "app-bg-accent text-white" : "text-[#ea7c69]"}`}
        aria-label={isAmharic ? item.labelAm : item.labelEn}
      >
        <Icon />
      </Link>
    );
  };

  return (
    <>
      <aside className="app-bg-panel hidden h-full flex-col justify-between rounded-2xl py-4 lg:flex">
        <div className="flex items-center gap-2 lg:flex-col">
          <div className="app-bg-logo rounded-xl p-3 text-xl text-[#ea7c69]">
            <FiPieChart />
          </div>
          <Link href="/menu" className="rounded-xl p-3 text-xl text-[#ea7c69]" aria-label={isAmharic ? "ወደ ዳሽቦርድ መነሻ ተመለስ" : "Back to dashboard home"}>
            <CiHome />
          </Link>
          {desktopLinks.map((link) => renderLink(link))}
        </div>
        <div className="flex items-center gap-2 lg:flex-col">
          <Link
            href="/admin/settings"
            className={`rounded-xl p-3 text-xl ${pathname === "/admin/settings" ? "app-bg-accent text-white" : "text-[#ea7c69]"}`}
            aria-label={isAmharic ? "ቅንብሮችን ክፈት" : "Open settings"}
          >
            <FiSettings />
          </Link>
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="rounded-xl p-3 text-xl text-[#ea7c69]"
            aria-label={isAmharic ? "ውጣ" : "Sign out"}
          >
            <IoIosLogOut />
          </button>
        </div>
      </aside>

      <div className="lg:hidden">
        <aside className="app-bg-panel fixed inset-x-4 bottom-3 z-40 flex h-18 items-center justify-between rounded-3xl border border-white/10 px-5 shadow-[0_10px_26px_rgba(0,0,0,0.34)]">
          <div className="flex items-center gap-5">
            {leftMobileLinks.map((link) => renderLink(link, true))}
          </div>

          <Link
            href="/admin"
            className={`absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full text-2xl shadow-[0_10px_22px_rgba(0,0,0,0.35)] ${pathname === "/admin" ? "app-bg-accent text-white" : "app-bg-logo app-text-accent"}`}
            aria-label={isAmharic ? "የምርቶች አስተዳደርን ክፈት" : "Open products management"}
          >
            <FiPlus />
          </Link>

          <div className="flex items-center gap-5">
            {rightMobileLinks.map((link) => renderLink(link, true))}
            <button
              type="button"
              onClick={() => {
                void handleSignOut();
              }}
              className="rounded-xl p-2 text-xl text-[#ea7c69]"
              aria-label={isAmharic ? "ውጣ" : "Sign out"}
            >
              <IoIosLogOut />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
