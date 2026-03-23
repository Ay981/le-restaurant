"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiPlus } from "react-icons/fi";
import SidenavLogo from "./SidenavLogo";
import SidenavLogout from "./SidenavLogout";
import SidenavNav from "./SidenavNav";
import { navItems } from "./nav-items";

export default function Sidenav() {
  const pathname = usePathname();
  const leftDockItems = navItems.filter((item) => ["/menu", "/messages"].includes(item.href));
  const rightDockItems = navItems.filter((item) => ["/notifications", "/admin"].includes(item.href));
  const isCenterActive = pathname === "/orders";

  return (
    <>
      <div className="app-bg-panel hidden w-full items-center justify-between px-3 py-3 md:flex md:w-24 md:flex-col md:justify-start md:py-5 hover:bg-[#1f1d2b]/90">
        <SidenavLogo />
        <SidenavNav pathname={pathname} items={navItems} />
        <SidenavLogout />
      </div>

      <div className="md:hidden">
        <div className="h-24" />
        <aside className="app-bg-panel fixed inset-x-4 bottom-3 z-60 flex h-18 items-center justify-between rounded-3xl border border-white/10 px-5 shadow-[0_10px_26px_rgba(0,0,0,0.34)]">
          <div className="flex items-center gap-5">
            {leftDockItems.map(({ icon: Icon, href }) => (
              <Link
                href={href}
                key={href}
                className={`rounded-xl p-2 text-xl transition-colors ${pathname === href ? "app-text-accent" : "text-[#ea7c69]/70"}`}
              >
                <Icon className="text-xl" />
              </Link>
            ))}
          </div>

          <Link
            href="/orders"
            className={`absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full text-2xl shadow-[0_10px_22px_rgba(0,0,0,0.35)] ${isCenterActive ? "app-bg-accent text-white" : "app-bg-logo app-text-accent"}`}
            aria-label="Open orders"
          >
            <FiPlus />
          </Link>

          <div className="flex items-center gap-5">
            {rightDockItems.map(({ icon: Icon, href }) => (
              <Link
                href={href}
                key={href}
                className={`rounded-xl p-2 text-xl transition-colors ${pathname === href ? "app-text-accent" : "text-[#ea7c69]/70"}`}
              >
                <Icon className="text-xl" />
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
