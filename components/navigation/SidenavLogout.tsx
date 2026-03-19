"use client";

import { IoIosLogOut } from "react-icons/io";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function SidenavLogout() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/sign-in");
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleSignOut();
      }}
      className="app-text-accent app-hover-accent-soft rounded-xl p-2.5 transition-colors md:mt-auto md:p-3"
      aria-label="Sign out"
    >
      <IoIosLogOut className="text-xl md:text-2xl" />
    </button>
  );
}
