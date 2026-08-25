import type { Category } from './domain';

export interface FlatCategory {
	category: Category;
	depth: number;
	path: string;
}

export function flattenCategories(categories: Category[]): FlatCategory[] {
	const byParent = new Map<string, Category[]>();
	for (const c of categories) {
		const key = c.parentId ?? '';
		const list = byParent.get(key) ?? [];
		list.push(c);
		byParent.set(key, list);
	}
	const out: FlatCategory[] = [];
	const visit = (parentKey: string, depth: number, prefix: string[]): void => {
		const children = (byParent.get(parentKey) ?? []).sort((a, b) => a.name.localeCompare(b.name));
		for (const c of children) {
			const path = [...prefix, c.name];
			out.push({ category: c, depth, path: path.join(' › ') });
			visit(c.id, depth + 1, path);
		}
	};
	visit('', 0, []);
	return out;
}

export function categoryPath(categories: Category[], id: string | null): string {
	if (!id) return '';
	return flattenCategories(categories).find((f) => f.category.id === id)?.path ?? '';
}

export function subtreeIds(categories: Category[], rootId: string): Set<string> {
	const result = new Set<string>([rootId]);
	let frontier = [rootId];
	while (frontier.length > 0) {
		const next: string[] = [];
		for (const c of categories) {
			if (c.parentId && frontier.includes(c.parentId) && !result.has(c.id)) {
				result.add(c.id);
				next.push(c.id);
			}
		}
		frontier = next;
	}
	return result;
}
