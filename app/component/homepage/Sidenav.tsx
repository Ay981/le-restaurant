import { CiHome } from "react-icons/ci";
import { FaStore } from "react-icons/fa";
import { CiDiscount1 } from "react-icons/ci";
import { GrAnalytics } from "react-icons/gr";
import { MdOutlineMessage } from "react-icons/md";
import { IoIosNotificationsOutline } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosLogOut } from "react-icons/io";

const navItems = [
  { icon: CiHome, active: true },
  { icon: CiDiscount1, active: false },
  { icon: GrAnalytics, active: false },
  { icon: MdOutlineMessage, active: false },
  { icon: IoIosNotificationsOutline, active: false },
  { icon: IoSettingsOutline, active: false },
];

export default function Sidenav() {
  return (
    <div className="flex w-24 flex-col items-center bg-[#1f1d2b] px-3 py-5">

      {/* Logo */}
      <div className="mb-4 rounded-2xl bg-[#312a42] p-4">
        <FaStore className="text-[#ea7c69] text-2xl" />
      </div>

      {/* Nav Icons */}
      <div className="mt-1 flex flex-1 flex-col items-center gap-4">
        {navItems.map(({ icon: Icon, active }, i) => (
          <button
            key={i}
            className={`rounded-xl p-3 transition-colors ${
              active
                ? "bg-[#ea7c69] text-white shadow-[0_0_24px_rgba(234,124,105,0.45)]"
                : "text-[#ea7c69] hover:bg-[#ea7c6920]"
            }`}
          >
            <Icon className="text-2xl" />
          </button>
        ))}
      </div>

      {/* Logout pinned to bottom */}
      <button className="mt-auto rounded-xl p-3 text-[#ea7c69] transition-colors hover:bg-[#ea7c6920]">
        <IoIosLogOut className="text-2xl" />
      </button>
    </div>
  );
}