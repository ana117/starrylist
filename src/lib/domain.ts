export type Stat = 'low' | 'average' | 'high';

export const STATS: Stat[] = ['low', 'average', 'high'];

export type FieldType = 'text' | 'number' | 'date' | 'select';

export interface Price {
	id: string;
	amount: number;
}

export interface Link {
	id: string;
	url: string;
	label?: string;
	priceId?: string;
}

export type CustomValue = string | number;

export interface Item {
	id: string;
	name: string;
	quantity: number;
	included: boolean;
	categoryId: string | null;
	prices: Price[];
	links: Link[];
	values: Record<string, CustomValue>;
}

export interface Wishlist {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	items: Item[];
}

export interface CustomField {
	id: string;
	name: string;
	type: FieldType;
	options: string[];
	deleted: boolean;
}

export interface Category {
	id: string;
	name: string;
	parentId: string | null;
	fields: CustomField[];
}

export interface Settings {
	currency: string;
	stat: Stat;
}

export interface StarryDocument {
	schemaVersion: number;
	settings: Settings;
	wishlists: Wishlist[];
	categories: Category[];
}

export const SCHEMA_VERSION = 1;

export function emptyDocument(): StarryDocument {
	return {
		schemaVersion: SCHEMA_VERSION,
		settings: { currency: 'USD', stat: 'average' },
		wishlists: [],
		categories: []
	};
}

export function activeFields(category: Category): CustomField[] {
	return category.fields.filter((f) => !f.deleted);
}
