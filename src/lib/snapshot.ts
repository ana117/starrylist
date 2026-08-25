import {
	SCHEMA_VERSION,
	STATS,
	type CustomValue,
	type Item,
	type StarryDocument,
	type Wishlist,
	type Category,
	type Settings
} from './domain';

export interface SnapshotCounts {
	wishlists: number;
	items: number;
	categories: number;
}

export type ParseResult =
	{ ok: true; doc: StarryDocument; counts: SnapshotCounts } | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const optStr = (v: unknown): string | undefined =>
	typeof v === 'string' && v.length > 0 ? v : undefined;
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

function parseItem(raw: unknown): Item | null {
	if (!isRecord(raw)) return null;
	const id = str(raw.id);
	const name = str(raw.name);
	if (!id || name === null) return null;
	const rawPrices = Array.isArray(raw.prices) ? raw.prices : [];
	const prices = rawPrices
		.map((p) => {
			if (!isRecord(p)) return null;
			const pid = str(p.id);
			const amount = num(p.amount);
			if (!pid || amount === null) return null;
			return { id: pid, amount };
		})
		.filter((p) => p !== null);
	const rawLinks = Array.isArray(raw.links) ? raw.links : [];
	const links = rawLinks
		.map((l) => {
			if (!isRecord(l)) return null;
			const lid = str(l.id);
			const url = str(l.url);
			if (!lid || url === null) return null;
			const link = { id: lid, url } as Item['links'][number];
			const label = optStr(l.label);
			if (label !== undefined) link.label = label;
			const priceId = str(l.priceId);
			if (priceId !== null) link.priceId = priceId;
			return link;
		})
		.filter((l) => l !== null);
	const values: Record<string, CustomValue> = {};
	if (isRecord(raw.values)) {
		for (const [k, v] of Object.entries(raw.values)) {
			if (typeof v === 'string' || typeof v === 'number') values[k] = v;
		}
	}
	return {
		id,
		name,
		quantity: Math.max(1, Math.floor(num(raw.quantity) ?? 1)),
		included: bool(raw.included, true),
		categoryId: str(raw.categoryId),
		prices,
		links,
		values
	};
}

function parseWishlist(raw: unknown): Wishlist | null {
	if (!isRecord(raw)) return null;
	const id = str(raw.id);
	const name = str(raw.name);
	if (!id || name === null) return null;
	const items = Array.isArray(raw.items)
		? raw.items.map(parseItem).filter((i): i is Item => i !== null)
		: [];
	return {
		id,
		name,
		emoji: optStr(raw.emoji),
		color: optStr(raw.color),
		items
	};
}

function parseCategory(raw: unknown): Category | null {
	if (!isRecord(raw)) return null;
	const id = str(raw.id);
	const name = str(raw.name);
	if (!id || name === null) return null;
	const fields = Array.isArray(raw.fields)
		? raw.fields
				.map((f) => {
					if (!isRecord(f)) return null;
					const fid = str(f.id);
					const fname = str(f.name);
					if (!fid || fname === null) return null;
					const type = str(f.type);
					if (type !== 'text' && type !== 'number' && type !== 'date' && type !== 'select')
						return null;
					const options = Array.isArray(f.options)
						? f.options.filter((o): o is string => typeof o === 'string')
						: [];
					return { id: fid, name: fname, type, options, deleted: bool(f.deleted, false) };
				})
				.filter((f): f is Category['fields'][number] => f !== null)
		: [];
	const parentId = str(raw.parentId);
	return { id, name, parentId, fields };
}

function parseSettings(raw: unknown): Settings | null {
	if (!isRecord(raw)) return null;
	const currency = str(raw.currency);
	const stat = str(raw.stat);
	if (!currency || stat === null || !STATS.includes(stat as Settings['stat'])) return null;
	return { currency, stat: stat as Settings['stat'] };
}

export function parseSnapshot(text: string): ParseResult {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return { ok: false, error: 'Not valid JSON.' };
	}
	if (!isRecord(raw)) return { ok: false, error: 'Snapshot root must be an object.' };
	if (typeof raw.schemaVersion !== 'number') {
		return { ok: false, error: 'Snapshot has no schema version.' };
	}
	if (raw.schemaVersion > SCHEMA_VERSION) {
		return {
			ok: false,
			error: `Snapshot was created by a newer version of Starrylist (schema ${raw.schemaVersion}). Update the app first.`
		};
	}
	if (raw.schemaVersion < SCHEMA_VERSION) {
		return { ok: false, error: `Snapshot schema ${raw.schemaVersion} is no longer supported.` };
	}
	const settings = parseSettings(raw.settings);
	if (!settings) return { ok: false, error: 'Snapshot settings are missing or invalid.' };
	if (!Array.isArray(raw.wishlists) || !Array.isArray(raw.categories)) {
		return { ok: false, error: 'Snapshot is missing wishlists or categories.' };
	}
	const categories = raw.categories.map(parseCategory).filter((c): c is Category => c !== null);
	const categoryIds = new Set(categories.map((c) => c.id));
	for (const c of categories) {
		if (c.parentId !== null && !categoryIds.has(c.parentId)) c.parentId = null;
	}
	const wishlists = raw.wishlists.map(parseWishlist).filter((w): w is Wishlist => w !== null);
	const doc: StarryDocument = {
		schemaVersion: SCHEMA_VERSION,
		settings,
		wishlists,
		categories
	};
	return {
		ok: true,
		doc,
		counts: {
			wishlists: wishlists.length,
			items: wishlists.reduce((n, w) => n + w.items.length, 0),
			categories: categories.length
		}
	};
}
