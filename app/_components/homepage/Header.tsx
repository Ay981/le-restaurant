import { FiSearch } from "react-icons/fi";

type HeaderProps = {
  name: string;
  date: string;
  searchPlaceholder: string;
  searchValue: string;
  isSearching: boolean;
  onSearchChange: (value: string) => void;
};

export default function Header({
  name,
  date,
  searchPlaceholder,
  searchValue,
  isSearching,
  onSearchChange,
}: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{name}</h1>
        <p className="mt-1 text-base text-gray-400 md:text-xl">{date}</p>
      </div>

      <div className="app-bg-elevated flex w-full items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-gray-400 lg:max-w-75">
        <FiSearch className="text-base" />
        <input
          type="text"
          aria-label="Search dishes"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-base text-gray-200 outline-none placeholder:text-gray-500"
        />
        {isSearching ? <span className="text-xs text-gray-500">...</span> : null}
      </div>
    </div>
  );
}