"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IoIosLogOut } from "react-icons/io";
import { CiHome } from "react-icons/ci";
import { FiEdit3, FiMail, FiPieChart, FiSettings } from "react-icons/fi";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AdminSideRail() {
  const router = useRouter();
  const pathname = usePathname();

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
        <Link href="/" className="rounded-xl p-3 text-xl text-[#ea7c69]" aria-label="Back to dashboard home">
          <CiHome />
        </Link>
        <Link
          href="/admin"
          className={`rounded-xl p-3 text-xl ${pathname === "/admin" ? "app-bg-accent text-white" : "text-[#ea7c69]"}`}
          aria-label="Open products management"
        >
          <FiEdit3 />
        </Link>
        <Link
          href="/admin/analytics"
          className={`rounded-xl p-3 text-xl ${pathname === "/admin/analytics" ? "app-bg-accent text-white" : "text-[#ea7c69]"}`}
          aria-label="Open analytics dashboard"
        >
          <FiPieChart />
        </Link>
        <Link href="/orders" className="rounded-xl p-3 text-xl text-[#ea7c69]" aria-label="Open orders page">
          <FiMail />
        </Link>
      </div>
      <div className="flex items-center gap-2 lg:flex-col">
        <Link
          href="/admin/settings"
          className={`rounded-xl p-3 text-xl ${pathname === "/admin/settings" ? "app-bg-accent text-white" : "text-[#ea7c69]"}`}
          aria-label="Open settings"
        >
          <FiSettings />
        </Link>
        <button
          type="button"
          onClick={() => {
            void handleSignOut();
          }}
          className="rounded-xl p-3 text-xl text-[#ea7c69]"
          aria-label="Sign out"
        >
          <IoIosLogOut />
        </button>
      </div>
    </aside>
  );
}
