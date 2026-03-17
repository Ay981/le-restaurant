import Link from "next/link";
import type { NavItem } from "./nav-items";

type SidenavNavProps = {
  pathname: string;
  items: NavItem[];
};

export default function SidenavNav({ pathname, items }: SidenavNavProps) {
  return (
    <div className="mx-3 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto md:mx-0 md:mt-1 md:flex-col md:gap-4 md:overflow-visible">
      {items.map(({ icon: Icon, href }) => (
        <Link
          href={href}
          key={href}
          className={`shrink-0 rounded-xl p-2.5 transition-colors md:p-3 ${
            pathname === href
              ? "app-bg-accent text-white shadow-[0_0_24px_rgba(234,124,105,0.45)]"
              : "app-text-accent app-hover-accent-soft"
          }`}
        >
          <Icon className="text-xl md:text-2xl" />
        </Link>
      ))}
    </div>
  );
}
