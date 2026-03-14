import { FiSearch } from "react-icons/fi";

type HeaderProps = {
  name: string;
  date: string;
  searchPlaceholder: string;
};

export default function Header({ name, date, searchPlaceholder }: HeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white">{name}</h1>
        <p className="mt-1 text-xl text-gray-400">{date}</p>
      </div>

      <div className="flex w-full max-w-75 items-center gap-2 rounded-xl border border-white/10 bg-[#2d303e] px-4 py-3 text-gray-400">
        <FiSearch className="text-base" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-base text-gray-200 outline-none placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}