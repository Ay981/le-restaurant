"use client";

import { usePathname } from "next/navigation";
import SidenavLogo from "./SidenavLogo";
import SidenavLogout from "./SidenavLogout";
import SidenavNav from "./SidenavNav";
import { navItems } from "./nav-items";

export default function Sidenav() {
  const pathname = usePathname();

  return (
    <div className="app-bg-panel hidden w-full items-center justify-between px-3 py-3 md:flex md:w-24 md:flex-col md:justify-start md:py-5 hover:bg-[#1f1d2b]/90">
      <SidenavLogo />
      <SidenavNav pathname={pathname} items={navItems} />
      <SidenavLogout />
    </div>
  );
}
