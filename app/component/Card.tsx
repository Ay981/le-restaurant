'use client';

import Image from "next/image";

type CardProps = {
    title: string;
    image: string;
    price?: string;
    availability?: string;
};

export default function Card({
    title = "Spicy seasoned seafood noodles",
    image,
    price = "$ 2.29",
    availability = "20 Bowls available",
}: CardProps) {
    return (
        <button 
        className="relative w-52 shrink-0 pt-13 transition-transform hover:-translate-y-1 sm:w-56 sm:pt-14"
        onClick={()=>alert("clicked")}
        
        
        >
            <Image
                src={image}
                alt={title}
                width={104}
                height={104}
                className="absolute left-1/2 top-0 h-23 w-23 -translate-x-1/2 rounded-full object-cover ring-2 ring-[#2d303e] sm:h-27 sm:w-27"
            />

            <div className="min-h-[270px] rounded-2xl bg-[#1f1d2b] px-4 pb-6 pt-16 text-center shadow-[0_16px_30px_rgba(0,0,0,0.22)] sm:min-h-[290px] sm:px-5 sm:pb-7 sm:pt-18">
                <h2 className="min-h-18 text-lg font-semibold leading-6 text-gray-200 sm:min-h-20 sm:text-xl sm:leading-7">
                    {title}
                </h2>

                <p className="mt-3 text-2xl font-medium text-gray-200 sm:text-3xl">{price}</p>
                <p className="mt-2 text-base text-gray-400 sm:text-lg">{availability}</p>
            </div>
        </button>
    );
}