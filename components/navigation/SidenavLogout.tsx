import { IoIosLogOut } from "react-icons/io";

export default function SidenavLogout() {
  return (
    <button className="app-text-accent app-hover-accent-soft rounded-xl p-2.5 transition-colors md:mt-auto md:p-3">
      <IoIosLogOut className="text-xl md:text-2xl" />
    </button>
  );
}
