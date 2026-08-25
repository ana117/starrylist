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
	bought: boolean;
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

export type Theme = 'light' | 'dark' | 'system';

export const THEMES: Theme[] = ['light', 'dark', 'system'];

export type NumberFormat = 'system' | 'english' | 'indonesian';

export const NUMBER_FORMATS: NumberFormat[] = ['system', 'english', 'indonesian'];

export interface Settings {
	currency: string;
	stat: Stat;
	theme: Theme;
	numberFormat: NumberFormat;
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
		settings: {
			currency: 'USD',
			stat: 'average',
			theme: 'system',
			numberFormat: 'system'
		},
		wishlists: [],
		categories: []
	};
}

export function activeFields(category: Category): CustomField[] {
	return category.fields.filter((f) => !f.deleted);
}
