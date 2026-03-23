"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IoIosLogOut } from "react-icons/io";
import { CiHome } from "react-icons/ci";
import { FiEdit3, FiClipboard, FiMail, FiPieChart, FiSettings } from "react-icons/fi";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/I18nProvider";

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

  return (
    <aside className="app-bg-panel flex flex-row items-center justify-between rounded-2xl p-2 lg:h-full lg:flex-col lg:py-4">
      <div className="flex items-center gap-2 lg:flex-col">
        <div className="app-bg-logo rounded-xl p-3 text-xl text-[#ea7c69]">
          <FiPieChart />
        </div>
        <Link href="/menu" className="rounded-xl p-3 text-xl text-[#ea7c69]" aria-label={isAmharic ? "ወደ ዳሽቦርድ መነሻ ተመለስ" : "Back to dashboard home"}>
          <CiHome />
        </Link>
        <Link
          href="/admin"
          className={`rounded-xl p-3 text-xl ${pathname === "/admin" ? "app-bg-accent text-white" : "text-[#ea7c69]"}`}
          aria-label={isAmharic ? "የምርቶች አስተዳደርን ክፈት" : "Open products management"}
        >
          <FiEdit3 />
        </Link>
        <Link
          href="/admin/analytics"
          className={`rounded-xl p-3 text-xl ${pathname === "/admin/analytics" ? "app-bg-accent text-white" : "text-[#ea7c69]"}`}
          aria-label={isAmharic ? "የትንታኔ ዳሽቦርድን ክፈት" : "Open analytics dashboard"}
        >
          <FiPieChart />
        </Link>
        <Link
          href="/admin/orders"
          className={`rounded-xl p-3 text-xl ${pathname === "/admin/orders" ? "app-bg-accent text-white" : "text-[#ea7c69]"}`}
          aria-label={isAmharic ? "የትዕዛዞች ገጽን ክፈት" : "Open orders page"}
        >
          <FiClipboard />
        </Link>
        <Link
          href="/admin/messages"
          className={`rounded-xl p-3 text-xl ${pathname === "/admin/messages" ? "app-bg-accent text-white" : "text-[#ea7c69]"}`}
          aria-label={isAmharic ? "የመልእክቶች ገጽን ክፈት" : "Open messages page"}
        >
          <FiMail />
        </Link>
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
  );
}
