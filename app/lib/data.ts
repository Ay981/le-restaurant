export type RestaurantInfo = {
	name: string;
	date: string;
	searchPlaceholder: string;
};

export type Dish = {
	title: string;
	price: string;
	availability: string;
	image: string;
};

export type OrderItem = {
	title: string;
	shortTitle: string;
	price: string;
	total: string;
	quantity: number;
	note: string;
	image: string;
};

export type OrderSummary = {
	orderNumber: string;
	discount: string;
	subtotal: string;
};

export const restaurantInfo: RestaurantInfo = {
	name: "Jaegar Resto",
	date: "Tuesday, 2 Feb 2021",
	searchPlaceholder: "Search for food, coffe, etc..",
};

export const categories = [
	"Hot Dishes",
	"Cold Dishes",
	"Soup",
	"Grill",
	"Appetizer",
	"Dessert",
];

export const dishes: Dish[] = [
	{
		title: "Spicy seasoned seafood noodles",
		price: "$ 2.29",
		availability: "20 Bowls available",
		image: "/image/pizza.png",
	},
	{
		title: "Salted Pasta with mushroom sauce",
		price: "$ 2.69",
		availability: "11 Bowls available",
		image: "/image/image.png",
	},
	{
		title: "Beef dumpling in hot and sour soup",
		price: "$ 2.99",
		availability: "16 Bowls available",
		image: "/image/pizza.png",
	},
	{
		title: "Healthy noodle with spinach leaf",
		price: "$ 3.29",
		availability: "22 Bowls available",
		image: "/image/image.png",
	},
	{
		title: "Hot spicy fried rice with omelette",
		price: "$ 3.49",
		availability: "13 Bowls available",
		image: "/image/image.png",
	},
	{
		title: "Spicy instant noodle with special omelette",
		price: "$ 3.59",
		availability: "17 Bowls available",
		image: "/image/pizza.png",
	},
];

export const orderTypes = ["Dine In", "To Go", "Delivery"];

export const orderItems: OrderItem[] = [
	{
		title: "Spicy seasoned seafood noodles",
		shortTitle: "Spicy seasoned sea...",
		price: "$ 2.29",
		total: "$ 4,58",
		quantity: 2,
		note: "Please, Just a little bit spicy only.",
		image: "/image/pizza.png",
	},
	{
		title: "Salted Pasta with mushroom sauce",
		shortTitle: "Salted pasta with mu...",
		price: "$ 2.69",
		total: "$ 2.69",
		quantity: 1,
		note: "Order Note...",
		image: "/image/image.png",
	},
	{
		title: "Spicy instant noodle with special omelette",
		shortTitle: "Spicy instant noodle...",
		price: "$ 3.49",
		total: "$ 10,47",
		quantity: 3,
		note: "Order Note...",
		image: "/image/pizza.png",
	},
	{
		title: "Healthy noodle with spinach leaf",
		shortTitle: "Healthy noodle with ...",
		price: "$ 3.29",
		total: "$ 3.29",
		quantity: 1,
		note: "",
		image: "/image/image.png",
	},
];

export const orderSummary: OrderSummary = {
	orderNumber: "#34562",
	discount: "$0",
	subtotal: "$ 21,03",
};
