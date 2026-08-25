import type {
	Category,
	CustomField,
	CustomValue,
	Item,
	Link,
	NumberFormat,
	StarryDocument,
	Stat,
	Theme,
	Wishlist
} from './domain';
import { emptyDocument } from './domain';
import { subtreeIds } from './categories';
import { newId } from './ids';
import { parseSnapshot } from './snapshot';

const STORAGE_KEY = 'starrylist.document';

const hasStorage = typeof localStorage !== 'undefined';

function normalizeQuantity(quantity: number): number {
	return Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1;
}

function cloneItem(item: Item): Item {
	return {
		...item,
		prices: item.prices.map((p) => ({ ...p })),
		links: item.links.map((l) => ({ ...l })),
		values: { ...item.values }
	};
}

function cloneWithNewIds(item: Item): Item {
	const copy = cloneItem(item);
	copy.id = newId();
	copy.prices = copy.prices.map((p) => ({ ...p, id: newId() }));
	copy.links = copy.links.map((l) => ({ ...l, id: newId() }));
	return copy;
}

function freshItem(name: string): Item {
	return {
		id: newId(),
		name,
		quantity: 1,
		included: true,
		bought: false,
		categoryId: null,
		prices: [],
		links: [],
		values: {}
	};
}

export class AppState {
	doc = $state<StarryDocument>(emptyDocument());
	quarantined = $state(false);

	constructor() {
		if (!hasStorage) return;
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === null) return;
		const result = parseSnapshot(raw);
		if (!result.ok) {
			this.quarantined = true;
			console.warn('Starrylist: stored data is unusable and has been quarantined.', result.error);
			return;
		}
		this.doc = result.doc;
	}

	#commit(): void {
		if (!hasStorage || this.quarantined) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.doc));
		} catch {
			console.warn('Starrylist: could not persist to localStorage.');
		}
	}

	#wishlist(id: string): Wishlist | undefined {
		return this.doc.wishlists.find((w) => w.id === id);
	}

	#item(wishlistId: string, itemId: string): Item | undefined {
		return this.#wishlist(wishlistId)?.items.find((i) => i.id === itemId);
	}

	#category(id: string): Category | undefined {
		return this.doc.categories.find((c) => c.id === id);
	}

	setCurrency(currency: string): void {
		this.doc.settings.currency = currency;
		this.#commit();
	}

	setStat(stat: Stat): void {
		this.doc.settings.stat = stat;
		this.#commit();
	}

	setTheme(theme: Theme): void {
		this.doc.settings.theme = theme;
		this.#commit();
	}

	setNumberFormat(numberFormat: NumberFormat): void {
		this.doc.settings.numberFormat = numberFormat;
		this.#commit();
	}

	createWishlist(name: string, emoji?: string, color?: string): string {
		const wishlist: Wishlist = {
			id: newId(),
			name,
			items: []
		};
		if (emoji) wishlist.emoji = emoji;
		if (color) wishlist.color = color;
		this.doc.wishlists.push(wishlist);
		this.#commit();
		return wishlist.id;
	}

	updateWishlist(id: string, patch: Partial<Pick<Wishlist, 'name' | 'emoji' | 'color'>>): void {
		const wishlist = this.#wishlist(id);
		if (!wishlist) return;
		if (patch.name !== undefined) wishlist.name = patch.name;
		if (patch.emoji !== undefined) {
			if (patch.emoji) wishlist.emoji = patch.emoji;
			else delete wishlist.emoji;
		}
		if (patch.color !== undefined) {
			if (patch.color) wishlist.color = patch.color;
			else delete wishlist.color;
		}
		this.#commit();
	}

	deleteWishlist(id: string): void {
		const index = this.doc.wishlists.findIndex((w) => w.id === id);
		if (index === -1) return;
		this.doc.wishlists.splice(index, 1);
		this.#commit();
	}

	createItem(wishlistId: string, name: string): string | null {
		const wishlist = this.#wishlist(wishlistId);
		if (!wishlist) return null;
		const item = freshItem(name);
		wishlist.items.push(item);
		this.#commit();
		return item.id;
	}

	updateItem(
		wishlistId: string,
		itemId: string,
		patch: Partial<Pick<Item, 'name' | 'quantity' | 'included' | 'bought' | 'categoryId'>>
	): void {
		const item = this.#item(wishlistId, itemId);
		if (!item) return;
		if (patch.name !== undefined) item.name = patch.name;
		if (patch.quantity !== undefined) item.quantity = normalizeQuantity(patch.quantity);
		if (patch.included !== undefined) item.included = patch.included;
		if (patch.bought !== undefined) item.bought = patch.bought;
		if (patch.categoryId !== undefined) item.categoryId = patch.categoryId || null;
		this.#commit();
	}

	deleteItem(wishlistId: string, itemId: string): void {
		const wishlist = this.#wishlist(wishlistId);
		if (!wishlist) return;
		const index = wishlist.items.findIndex((i) => i.id === itemId);
		if (index === -1) return;
		wishlist.items.splice(index, 1);
		this.#commit();
	}

	duplicateItem(wishlistId: string, itemId: string): void {
		const wishlist = this.#wishlist(wishlistId);
		const original = wishlist?.items.find((i) => i.id === itemId);
		if (!wishlist || !original) return;
		const copy = cloneWithNewIds(original);
		copy.included = original.included;
		wishlist.items.push(copy);
		this.#commit();
	}

	copyItemToWishlist(fromWishlistId: string, itemId: string, toWishlistId: string): void {
		if (fromWishlistId === toWishlistId) return;
		const source = this.#item(fromWishlistId, itemId);
		const target = this.#wishlist(toWishlistId);
		if (!source || !target) return;
		target.items.push(cloneWithNewIds(source));
		this.#commit();
	}

	reorderItems(wishlistId: string, orderedIds: string[]): void {
		const wishlist = this.#wishlist(wishlistId);
		if (!wishlist) return;
		const remaining = [...wishlist.items];
		const ordered: Item[] = [];
		for (const id of orderedIds) {
			const index = remaining.findIndex((i) => i.id === id);
			if (index !== -1) {
				const [item] = remaining.splice(index, 1);
				ordered.push(item);
			}
		}
		wishlist.items = [...ordered, ...remaining];
		this.#commit();
	}

	addPrice(wishlistId: string, itemId: string, amount: number): string | null {
		const item = this.#item(wishlistId, itemId);
		if (!item || !Number.isFinite(amount)) return null;
		const price = { id: newId(), amount };
		item.prices.push(price);
		this.#commit();
		return price.id;
	}

	updatePrice(
		wishlistId: string,
		itemId: string,
		priceId: string,
		patch: Partial<Pick<Item['prices'][number], 'amount'>>
	): void {
		const price = this.#item(wishlistId, itemId)?.prices.find((p) => p.id === priceId);
		if (!price || patch.amount === undefined || !Number.isFinite(patch.amount)) return;
		price.amount = patch.amount;
		this.#commit();
	}

	removePrice(wishlistId: string, itemId: string, priceId: string): void {
		const item = this.#item(wishlistId, itemId);
		if (!item) return;
		const index = item.prices.findIndex((p) => p.id === priceId);
		if (index === -1) return;
		item.prices.splice(index, 1);
		for (const link of item.links) {
			if (link.priceId === priceId) delete link.priceId;
		}
		this.#commit();
	}

	addLink(
		wishlistId: string,
		itemId: string,
		url: string,
		label?: string,
		priceId?: string
	): string | null {
		const item = this.#item(wishlistId, itemId);
		if (!item) return null;
		const link: Link = { id: newId(), url };
		if (label) link.label = label;
		if (priceId && item.prices.some((p) => p.id === priceId)) link.priceId = priceId;
		item.links.push(link);
		this.#commit();
		return link.id;
	}
	updateLink(
		wishlistId: string,
		itemId: string,
		linkId: string,
		patch: { url?: string; label?: string; priceId?: string | null }
	): void {
		const link = this.#item(wishlistId, itemId)?.links.find((l) => l.id === linkId);
		if (!link) return;
		if (patch.url !== undefined && patch.url) link.url = patch.url;
		if (patch.label !== undefined) {
			if (patch.label) link.label = patch.label;
			else delete link.label;
		}
		if (patch.priceId !== undefined) {
			const wanted = patch.priceId;
			const exists =
				wanted !== null && this.#item(wishlistId, itemId)?.prices.some((p) => p.id === wanted);
			if (wanted && exists) link.priceId = wanted;
			else delete link.priceId;
		}
		this.#commit();
	}

	removeLink(wishlistId: string, itemId: string, linkId: string): void {
		const item = this.#item(wishlistId, itemId);
		if (!item) return;
		const index = item.links.findIndex((l) => l.id === linkId);
		if (index === -1) return;
		item.links.splice(index, 1);
		this.#commit();
	}

	removeOfferRow(wishlistId: string, itemId: string, linkId?: string, priceId?: string): void {
		const item = this.#item(wishlistId, itemId);
		if (!item) return;
		let doomedPrice = priceId ?? null;
		if (linkId) {
			const link = item.links.find((l) => l.id === linkId);
			if (!link && !doomedPrice) return;
			item.links = item.links.filter((l) => l.id !== linkId);
			doomedPrice = doomedPrice ?? link?.priceId ?? null;
		}
		if (doomedPrice && !item.links.some((l) => l.priceId === doomedPrice)) {
			item.prices = item.prices.filter((p) => p.id !== doomedPrice);
		}
		this.#commit();
	}

	setCustomValue(
		wishlistId: string,
		itemId: string,
		fieldId: string,
		value: CustomValue | null
	): void {
		const item = this.#item(wishlistId, itemId);
		if (!item) return;
		if (value === null) delete item.values[fieldId];
		else item.values[fieldId] = value;
		this.#commit();
	}

	createCategory(name: string, parentId: string | null): string {
		const category: Category = {
			id: newId(),
			name,
			parentId: parentId && this.#category(parentId) ? parentId : null,
			fields: []
		};
		this.doc.categories.push(category);
		this.#commit();
		return category.id;
	}

	renameCategory(id: string, name: string): void {
		const category = this.#category(id);
		if (!category) return;
		category.name = name;
		this.#commit();
	}

	deleteCategoryTree(id: string): void {
		if (!this.#category(id)) return;
		const doomed = [...subtreeIds(this.doc.categories, id)];
		this.doc.categories = this.doc.categories.filter((c) => !doomed.includes(c.id));
		for (const wishlist of this.doc.wishlists) {
			for (const item of wishlist.items) {
				if (item.categoryId !== null && doomed.includes(item.categoryId)) item.categoryId = null;
			}
		}
		this.#commit();
	}

	addField(
		categoryId: string,
		input: { name: string; type: CustomField['type']; options?: string[] }
	): string | null {
		const category = this.#category(categoryId);
		if (!category || !input.name) return null;
		const tombstone = category.fields.find(
			(f) => f.deleted && f.name === input.name && f.type === input.type
		);
		if (tombstone) {
			tombstone.deleted = false;
			if (tombstone.type === 'select' && input.options) tombstone.options = input.options;
			this.#commit();
			return tombstone.id;
		}
		const field: CustomField = {
			id: newId(),
			name: input.name,
			type: input.type,
			options: input.type === 'select' ? (input.options ?? []) : [],
			deleted: false
		};
		category.fields.push(field);
		this.#commit();
		return field.id;
	}

	updateField(
		categoryId: string,
		fieldId: string,
		patch: Partial<Pick<CustomField, 'name' | 'type' | 'options'>>
	): void {
		const field = this.#category(categoryId)?.fields.find((f) => f.id === fieldId);
		if (!field) return;
		if (patch.name !== undefined && patch.name) field.name = patch.name;
		if (patch.type !== undefined) {
			field.type = patch.type;
			if (patch.type !== 'select') field.options = [];
			else if (field.options.length === 0) field.options = ['Option 1'];
		}
		if (patch.options !== undefined && field.type === 'select') {
			field.options = patch.options.filter((o) => o.length > 0);
		}
		this.#commit();
	}

	removeField(categoryId: string, fieldId: string): void {
		const field = this.#category(categoryId)?.fields.find((f) => f.id === fieldId);
		if (!field) return;
		field.deleted = true;
		this.#commit();
	}

	exportSnapshotText(): string {
		return JSON.stringify(this.doc, null, '\t');
	}

	importSnapshot(
		text: string
	):
		| { ok: true; wishlists: number; items: number; categories: number }
		| { ok: false; error: string } {
		const result = parseSnapshot(text);
		if (!result.ok) return result;
		this.doc = result.doc;
		this.quarantined = false;
		this.#commit();
		return { ok: true, ...result.counts };
	}
}

export const app = new AppState();
