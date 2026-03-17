"use client";

import { CiHome } from "react-icons/ci";
import { FaStore } from "react-icons/fa";
import { CiDiscount1 } from "react-icons/ci";
import { GrAnalytics } from "react-icons/gr";
import { MdOutlineMessage } from "react-icons/md";
import { IoIosNotificationsOutline } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosLogOut } from "react-icons/io";
import Link from "next/link";
import { usePathname } from "next/navigation";


const navItems = [
  { icon: CiHome, href: "/" },
  { icon: CiDiscount1, href: "/discounts" },
  { icon: GrAnalytics, href: "/analytics" },
  { icon: MdOutlineMessage, href: "/messages" },
  { icon: IoIosNotificationsOutline, href: "/notifications" },
  { icon: IoSettingsOutline, href: "/settings" },
];

export default function Sidenav() {
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center justify-between bg-[#1f1d2b] px-3 py-3 md:w-24 md:flex-col md:justify-start md:py-5 hover:bg-[#1f1d2b]/90">

      {/* Logo */}
      <Link href="/" className="rounded-2xl bg-[#312a42] p-3 md:mb-4 md:p-4">
        <FaStore className="text-[#ea7c69] text-xl md:text-2xl" />
      </Link>

      {/* Nav Icons */}
      <div className="mx-3 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto md:mx-0 md:mt-1 md:flex-col md:gap-4 md:overflow-visible">
        {navItems.map(({ icon: Icon, href }, i) => (
          <Link
            href={href}
            key={i}
            className={`shrink-0 rounded-xl p-2.5 transition-colors md:p-3 ${
              pathname === href
                ? "bg-[#ea7c69] text-white shadow-[0_0_24px_rgba(234,124,105,0.45)]"
                : "text-[#ea7c69] hover:bg-[#ea7c6920]"
            }`}
          >
            <Icon className="text-xl md:text-2xl" />
          </Link>
        ))}
      </div>

      {/* Logout pinned to bottom */}
      <button className="rounded-xl p-2.5 text-[#ea7c69] transition-colors hover:bg-[#ea7c6920] md:mt-auto md:p-3">
        <IoIosLogOut className="text-xl md:text-2xl" />
      </button>
    </div>
  );
}