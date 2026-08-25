import type { Item, Price, Stat, Wishlist } from './domain';

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function priceStat(prices: Price[], stat: Stat): number {
	if (prices.length === 0) return 0;
	const amounts = prices.map((p) => p.amount);
	if (stat === 'low') return Math.min(...amounts);
	if (stat === 'high') return Math.max(...amounts);
	return amounts.reduce((a, b) => a + b, 0) / amounts.length;
}

export function itemTotal(item: Item, stat: Stat): number {
	return round2(priceStat(item.prices, stat) * item.quantity);
}

export function itemContribution(item: Item, stat: Stat): number {
	return item.included ? itemTotal(item, stat) : 0;
}

export function wishlistTotal(wishlist: Wishlist, stat: Stat): number {
	return round2(wishlist.items.reduce((sum, item) => sum + itemContribution(item, stat), 0));
}

export function wishlistProgress(wishlist: Wishlist): { bought: number; total: number } {
	const included = wishlist.items.filter((item) => item.included);
	return {
		bought: included.filter((item) => item.bought).length,
		total: included.length
	};
}
