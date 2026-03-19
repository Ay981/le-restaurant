import { CiGrid41, CiHome } from "react-icons/ci";
import { FiBell, FiLock, FiMail, FiPieChart, FiSettings } from "react-icons/fi";

export default function AdminSideRail() {
  return (
    <aside className="app-bg-panel flex flex-row items-center gap-2 rounded-2xl p-2 lg:flex-col lg:justify-between lg:py-4">
      <div className="flex items-center gap-2 lg:flex-col">
        <button type="button" className="app-bg-elevated rounded-xl p-3 text-xl text-gray-200">
          <CiHome />
        </button>
        <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
          <CiGrid41 />
        </button>
        <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
          <FiPieChart />
        </button>
        <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
          <FiMail />
        </button>
        <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
          <FiBell />
        </button>
        <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
          <FiLock />
        </button>
      </div>
      <button type="button" className="app-bg-accent rounded-xl p-3 text-xl text-white">
        <FiSettings />
      </button>
    </aside>
  );
}
