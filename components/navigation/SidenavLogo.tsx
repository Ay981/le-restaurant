import Link from "next/link";
import { FaStore } from "react-icons/fa";

export default function SidenavLogo() {
  return (
    <Link href="/" className="app-bg-logo rounded-2xl p-3 md:mb-4 md:p-4">
      <FaStore className="app-text-accent text-xl md:text-2xl" />
    </Link>
  );
}
