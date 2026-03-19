export const categories = [
	"Hot Dishes",
	"Cold Dishes",
	"Soup",
	"Grill",
	"Appetizer",
	"Dessert",
] as const;

export type Category = (typeof categories)[number];

export type RestaurantInfo = {
	name: string;
	searchPlaceholder: string;
};

export type Dish = {
	title: string;
	price: number;
	availability: string;
	image: string;
	categories: Category[];
};

export type OrderItem = {
	title: string;
	shortTitle: string;
	price: number;
	total: number;
	quantity: number;
	note: string;
	image: string;
};

export type OrderSummary = {
	orderNumber: string;
	discount: number;
	subtotal: number;
};

export const restaurantInfo: RestaurantInfo = {
	name: "le restaurante",
	searchPlaceholder: "Search for food, coffee, etc.",
};

export const dishes: Dish[] = [
	{
		title: "Spicy seasoned seafood noodles",
		price: 2.29,
		availability: "20 Bowls available",
		image: "/image/pizza.png",
		categories: ["Hot Dishes"],

	},
	{
		title: "Salted Pasta with mushroom sauce",
		price: 2.69,
		availability: "11 Bowls available",
		image: "/image/pizza.png",
		categories: ["Cold Dishes"],
	},
	{
		title: "Beef dumpling in hot and sour soup",
		price: 2.99,
		availability: "16 Bowls available",
		image: "/image/pizza.png",
		categories: ["Soup"],
	},
	{
		title: "Healthy noodle with spinach leaf",
		price: 3.29,
		availability: "22 Bowls available",
		image: "/image/pizza.png",
		categories: ["Hot Dishes"],
	},
	{
		title: "Hot spicy fried rice with omelette",
		price: 3.49,
		availability: "13 Bowls available",
		image: "/image/pizza.png",
		categories: ["Hot Dishes"],
	},
	{
		title: "Spicy instant noodle with special omelette",
		price: 3.59,
		availability: "17 Bowls available",
		image: "/image/pizza.png",
		categories: ["Hot Dishes"],
	},
];

export const orderTypes = ["Dine In", "To Go", "Delivery"];

export const orderItems: OrderItem[] = [
	{
		title: "Spicy seasoned seafood noodles",
		shortTitle: "Spicy seasoned sea...",
		price: 2.29,
		total: 4.58,
		quantity: 2,
		note: "Please, Just a little bit spicy only.",
		image: "/image/pizza.png",
	},
	{
		title: "Salted Pasta with mushroom sauce",
		shortTitle: "Salted pasta with mu...",
		price: 2.69,
		total: 2.69,
		quantity: 1,
		note: "Order Note...",
		image: "/image/pizza.png",
	},
	{
		title: "Spicy instant noodle with special omelette",
		shortTitle: "Spicy instant noodle...",
		price: 3.49,
		total: 10.47,
		quantity: 3,
		note: "Order Note...",
		image: "/image/pizza.png",
	},
	{
		title: "Healthy noodle with spinach leaf",
		shortTitle: "Healthy noodle with ...",
		price: 3.29,
		total: 3.29,
		quantity: 1,
		note: "",
		image: "/image/pizza.png",
	},
];

export const orderSummary: OrderSummary = {
	orderNumber: "#34562",
	discount: 0,
	subtotal: 21.03,
};
