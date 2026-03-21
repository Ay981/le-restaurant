import Image from "next/image";
import { formatCurrency } from "@/lib/currency";

type CardProps = {
    title: string;
    image: string;
    price?: number;
    availability?: string;
    onClick?: () => void;
};

export default function Card({
    title = "Spicy seasoned seafood noodles",
    image,
    price = 2.29,
    availability = "20 Bowls available",
    onClick,
}: CardProps) {
    return (
        <button
        type="button"
        onClick={onClick}
        className="relative w-full max-w-52 min-w-0 justify-self-center pt-11 transition-transform hover:-translate-y-1 sm:pt-12 lg:w-64 lg:max-w-64"
        >
            <Image
                src={image}
                alt={title}
                width={104}
                height={104}
                className="app-ring-elevated absolute left-1/2 top-0 h-21 w-21 -translate-x-1/2 rounded-full object-cover ring-2 sm:h-24 sm:w-24"
            />

            <div className="app-bg-panel min-h-61 rounded-2xl border border-white/12 px-4 pb-5 pt-14 text-center shadow-[0_20px_36px_rgba(0,0,0,0.28)] sm:min-h-64 sm:px-5 sm:pb-6 sm:pt-16">
                <h2 className="h-16 text-lg font-semibold leading-6 text-gray-200 sm:h-18 sm:text-xl sm:leading-7">
                    {title}
                </h2>

                <p className="mt-2.5 text-2xl font-medium text-gray-200">{formatCurrency(price)}</p>
                <p className="mt-1.5 text-base text-gray-400">{availability}</p>
            </div>
        </button>
    );
}