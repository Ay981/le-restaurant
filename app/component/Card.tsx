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
        <article className="relative w-52 shrink-0 pt-14">
            <Image
                src={image}
                alt={title}
                width={132}
                height={132}
                className="absolute left-1/2 top-0 h-33 w-33 -translate-x-1/2 rounded-full object-cover"
            />

            <div className="rounded-3xl bg-[#1f1d2b] px-7 pb-7 pt-20 text-center shadow-md">
                <h2 className="min-h-15 text-lg font-semibold leading-6 text-gray-200">
                    {title}
                </h2>

                <p className="mt-2.5 text-2xl font-medium text-gray-200">{price}</p>
                <p className="mt-2 text-xl text-gray-400">{availability}</p>
            </div>
        </article>
    );
}