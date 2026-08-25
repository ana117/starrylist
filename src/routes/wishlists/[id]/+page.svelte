<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import FieldInput from '$lib/components/FieldInput.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import NumberStepper from '$lib/components/NumberStepper.svelte';
	import ProgressStar from '$lib/components/ProgressStar.svelte';
	import { activeFields, type Category, type Item, type Link } from '$lib/domain';
	import { categoryPath, flattenCategories } from '$lib/categories';
	import { formatMoney } from '$lib/money';
	import { app } from '$lib/state.svelte';
	import { itemContribution, itemTotal, wishlistProgress, wishlistTotal } from '$lib/stats';

	type SortMode = 'manual' | 'name' | 'total' | 'category';
	type ViewMode = 'flat' | 'grouped';

	const sortLabels: Record<SortMode, string> = {
		manual: 'Manual order',
		name: 'Name',
		total: 'Total contribution',
		category: 'Category'
	};

	let sortMode = $state<SortMode>('manual');
	let viewMode = $state<ViewMode>('grouped');
	let draggingId = $state<string | null>(null);
	let newItemName = $state('');

	let editingItemId = $state<string | null>(null);
	let copyTarget = $state('');
	let deletingItemId = $state<string | null>(null);

	const wishlist = $derived(app.doc.wishlists.find((w) => w.id === page.params.id));

	function sortItems(items: Item[]): Item[] {
		const stat = app.doc.settings.stat;
		const sorted = [...items];
		switch (sortMode) {
			case 'name':
				return sorted.sort((a, b) => a.name.localeCompare(b.name));
			case 'total':
				return sorted.sort((a, b) => itemContribution(b, stat) - itemContribution(a, stat));
			case 'category':
				return sorted.sort((a, b) =>
					categoryPath(app.doc.categories, a.categoryId).localeCompare(
						categoryPath(app.doc.categories, b.categoryId)
					)
				);
			default:
				return sorted;
		}
	}

	const visibleItems = $derived(wishlist ? sortItems(wishlist.items) : []);

	interface CategoryNode {
		id: string;
		name: string;
		items: Item[];
		count: number;
		total: number;
		children: CategoryNode[];
	}
	const categoryTree = $derived.by(() => {
		const empty = { roots: [] as CategoryNode[], uncategorized: [] as Item[] };
		const list = wishlist;
		if (!list) return empty;
		const stat = app.doc.settings.stat;
		const categories = app.doc.categories;

		const contributionOf = (items: Item[]): number =>
			items.reduce((sum, item) => sum + itemContribution(item, stat), 0);

		function build(category: Category, allItems: Item[]): CategoryNode | null {
			const children = categories
				.filter((c) => c.parentId === category.id)
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((c) => build(c, allItems))
				.filter((c): c is CategoryNode => c !== null);
			const items = sortItems(allItems.filter((i) => i.categoryId === category.id));
			if (items.length === 0 && children.length === 0) return null;
			return {
				id: category.id,
				name: category.name,
				items,
				count: items.length + children.reduce((n, c) => n + c.count, 0),
				total: contributionOf(items) + children.reduce((n, c) => n + c.total, 0),
				children
			};
		}

		const roots = categories
			.filter((c) => c.parentId === null)
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((c) => build(c, list.items))
			.filter((c): c is CategoryNode => c !== null);

		const uncategorized = sortItems(
			list.items.filter(
				(i) => i.categoryId === null || !categories.some((c) => c.id === i.categoryId)
			)
		);

		return { roots, uncategorized };
	});

	function linkLabel(link: Link): string {
		if (link.label) return link.label;
		try {
			return new URL(link.url).hostname;
		} catch {
			return link.url || 'link';
		}
	}

	interface OfferRow {
		key: string;
		linkId?: string;
		priceId?: string;
		url?: string;
		label?: string;
		amount?: number;
	}

	const offerRows = $derived.by<OfferRow[]>(() => {
		if (!editingItem) return [];
		const rows: OfferRow[] = [];
		for (const link of editingItem.links) {
			const price = link.priceId
				? editingItem.prices.find((p) => p.id === link.priceId)
				: undefined;
			rows.push({
				key: `l-${link.id}`,
				linkId: link.id,
				priceId: link.priceId,
				url: link.url,
				label: link.label,
				amount: price?.amount
			});
		}
		for (const price of editingItem.prices) {
			if (!editingItem.links.some((l) => l.priceId === price.id)) {
				rows.push({ key: `p-${price.id}`, priceId: price.id, amount: price.amount });
			}
		}
		return rows;
	});

	function setRowAmount(row: OfferRow, raw: string): void {
		if (!wishlist || !editingItem) return;
		const amount = raw.trim() === '' ? null : Number(raw);
		if (Number.isNaN(amount)) return;
		if (row.linkId) {
			if (row.priceId) {
				if (amount === null) {
					app.removePrice(wishlist.id, editingItem.id, row.priceId);
				} else {
					app.updatePrice(wishlist.id, editingItem.id, row.priceId, { amount });
				}
			} else if (amount !== null) {
				const priceId = app.addPrice(wishlist.id, editingItem.id, amount);
				if (priceId) app.updateLink(wishlist.id, editingItem.id, row.linkId, { priceId });
			}
		} else if (row.priceId && amount !== null) {
			app.updatePrice(wishlist.id, editingItem.id, row.priceId, { amount });
		}
	}

	function addSourceRow(): void {
		if (!wishlist || !editingItem) return;
		app.addLink(wishlist.id, editingItem.id, '');
	}

	function removeRow(row: OfferRow): void {
		if (!wishlist || !editingItem) return;
		app.removeOfferRow(wishlist.id, editingItem.id, row.linkId, row.priceId);
	}

	const editingItem = $derived(wishlist?.items.find((i) => i.id === editingItemId) ?? null);

	const flatCategories = $derived(flattenCategories(app.doc.categories));
	const editingCategory = $derived(
		editingItem?.categoryId
			? (app.doc.categories.find((c) => c.id === editingItem.categoryId) ?? null)
			: null
	);
	const editingFields = $derived(editingCategory ? activeFields(editingCategory) : []);

	function addItem(): void {
		if (!wishlist || !newItemName.trim()) return;
		app.createItem(wishlist.id, newItemName.trim());
		newItemName = '';
	}

	function dropOn(targetId: string): void {
		if (
			!draggingId ||
			draggingId === targetId ||
			!wishlist ||
			viewMode !== 'flat' ||
			sortMode !== 'manual'
		)
			return;
		const ids = wishlist.items.map((i) => i.id);
		const from = ids.indexOf(draggingId);
		const to = ids.indexOf(targetId);
		if (from === -1 || to === -1) return;
		ids.splice(to, 0, ...ids.splice(from, 1));
		app.reorderItems(wishlist.id, ids);
		draggingId = null;
	}

	function closeEditor(): void {
		editingItemId = null;
		copyTarget = '';
	}

	let groupedRoot = $state<HTMLDivElement | null>(null);

	function setAllDetails(open: boolean): void {
		groupedRoot?.querySelectorAll('details').forEach((d) => (d.open = open));
	}
</script>

<svelte:head>
	<title>{wishlist ? `${wishlist.name} · Starrylist` : 'Starrylist'}</title>
</svelte:head>

{#if !wishlist}
	<div
		class="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900"
	>
		<p class="text-sm text-zinc-500">This wishlist doesn't exist anymore.</p>
		<a
			href={resolve('/')}
			class="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
			>← Back to wishlists</a
		>
	</div>
{:else}
	{@const stat = app.doc.settings.stat}

	{@const progress = wishlistProgress(wishlist)}
	{@const progressPct =
		progress.total === 0 ? 0 : Math.round((progress.bought / progress.total) * 100)}

	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div class="flex items-center gap-3">
			<span
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl"
				style="background-color: {wishlist.color ?? '#e4e4e7'}33"
			>
				{wishlist.emoji ?? '☆'}
			</span>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">{wishlist.name}</h1>
				<p class="text-xs text-zinc-500">
					{wishlist.items.length} items · sorted by {sortLabels[sortMode].toLowerCase()}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-6">
			<div
				class="flex flex-col items-center gap-1"
				title="{progress.bought} of {progress.total} included items bought ({progressPct}%)"
			>
				<ProgressStar
					fraction={progress.total === 0 ? 0 : progress.bought / progress.total}
					sizeClass="h-10 w-10"
				/>
				<span class="text-xs font-semibold text-zinc-500 tabular-nums dark:text-zinc-400">
					{progress.bought}/{progress.total} · {progressPct}%
				</span>
			</div>
			<div class="text-right">
				<p class="text-xs font-medium tracking-wide text-zinc-400 uppercase">Total ({stat})</p>
				<p
					class="text-3xl font-bold tracking-tight text-indigo-700 tabular-nums dark:text-indigo-300"
				>
					{formatMoney(wishlistTotal(wishlist, stat), app.doc.settings)}
				</p>
			</div>
		</div>
	</div>

	<form
		class="mb-6 flex gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			addItem();
		}}
	>
		<input
			type="text"
			class="grow rounded-lg border-zinc-200 text-sm dark:border-zinc-700"
			placeholder="Add an item — just a name is enough…"
			bind:value={newItemName}
		/>
		<button
			type="submit"
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
			disabled={!newItemName.trim()}
		>
			Add item
		</button>
	</form>

	<div class="mb-3 flex flex-wrap items-center justify-end gap-3">
		{#if viewMode === 'grouped'}
			<div class="flex items-center gap-1">
				<button
					type="button"
					class="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
					onclick={() => setAllDetails(true)}
				>
					Expand all
				</button>
				<button
					type="button"
					class="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
					onclick={() => setAllDetails(false)}
				>
					Collapse all
				</button>
			</div>
		{/if}
		<div
			class="flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800"
			role="group"
			aria-label="View"
		>
			<button
				type="button"
				class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors {viewMode === 'flat'
					? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-950 dark:text-indigo-300'
					: 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}"
				onclick={() => (viewMode = 'flat')}
			>
				List
			</button>
			<button
				type="button"
				class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors {viewMode ===
				'grouped'
					? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-950 dark:text-indigo-300'
					: 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}"
				onclick={() => (viewMode = 'grouped')}
			>
				Grouped
			</button>
		</div>
		<label class="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
			Sort within {viewMode === 'grouped' ? 'groups' : 'list'}
			<select
				class="rounded-lg border-zinc-200 py-1 text-xs dark:border-zinc-700"
				bind:value={sortMode}
			>
				{#each Object.entries(sortLabels) as [mode, label] (mode)}
					<option value={mode}>{label}</option>
				{/each}
			</select>
		</label>
	</div>

	{#if wishlist.items.length === 0}
		<div
			class="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900"
		>
			<p class="text-sm font-medium text-zinc-700 dark:text-zinc-200">Nothing here yet.</p>
			<p class="mt-1 text-sm text-zinc-400">Add your first item above.</p>
		</div>
	{:else}
		{#snippet itemRow(item: Item)}
			{@const figure = itemTotal(item, stat)}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
			<!-- Keyboard users open the editor via the item-name button; the card click is a pointer affordance. -->
			<li
				class="group flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-white px-4 py-3 transition-colors hover:border-indigo-300 dark:bg-zinc-900 dark:hover:border-indigo-700 {item.included
					? 'border-zinc-200 dark:border-zinc-700'
					: 'border-dashed border-zinc-300 opacity-60 dark:border-zinc-700'} {draggingId === item.id
					? 'ring-2 ring-indigo-400'
					: ''}"
				onclick={(e) => {
					if ((e.target as HTMLElement).closest('a, button, input')) return;
					editingItemId = item.id;
				}}
				ondragstart={(e) => {
					draggingId = item.id;
					e.dataTransfer?.setData('text/plain', item.id);
				}}
				ondragover={(e) => e.preventDefault()}
				ondrop={(e) => {
					e.preventDefault();
					dropOn(item.id);
				}}
				draggable={viewMode === 'flat' && sortMode === 'manual'}
			>
				{#if viewMode === 'flat' && sortMode === 'manual'}
					<span
						class="cursor-grab text-sm leading-none text-zinc-300 select-none group-hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
						title="Drag to reorder"
					>
						⠿
					</span>
				{/if}

				<input
					type="checkbox"
					class="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
					checked={item.included}
					aria-label="Include {item.name} in total"
					onchange={(e) =>
						app.updateItem(wishlist.id, item.id, {
							included: e.currentTarget.checked
						})}
				/>

				<input
					type="checkbox"
					class="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
					checked={item.bought}
					title="Bought"
					aria-label="Mark {item.name} as bought"
					onchange={(e) =>
						app.updateItem(wishlist.id, item.id, {
							bought: e.currentTarget.checked
						})}
				/>

				<div class="min-w-0 grow basis-40">
					<button
						type="button"
						class="block max-w-full truncate text-left text-sm font-medium {item.bought
							? 'text-emerald-700 dark:text-emerald-400'
							: ''} {item.included ? '' : 'line-through decoration-zinc-400'}"
						onclick={() => (editingItemId = item.id)}
					>
						{item.name}
					</button>
					<span class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
						{#each item.links.slice(0, 2) as link (link.id)}
							<a
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								class="max-w-32 truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300"
								title={link.url}
							>
								{linkLabel(link)}
							</a>
						{/each}
						{#if item.links.length > 2}
							<button
								type="button"
								class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300"
								title="Show all links"
								onclick={() => (editingItemId = item.id)}
							>
								+{item.links.length - 2}
							</button>
						{/if}
						{#if item.quantity !== 1}
							<span class="tabular-nums">×{item.quantity}</span>
						{/if}
						{#if viewMode === 'flat'}
							<span class="truncate">
								{categoryPath(app.doc.categories, item.categoryId) || 'Uncategorized'}
							</span>
						{/if}
					</span>
				</div>

				<span class="shrink-0 text-right">
					{#if figure > 0}
						<span class="block text-sm font-semibold tabular-nums">
							{formatMoney(figure, app.doc.settings)}
						</span>
					{:else}
						<span class="block text-sm font-semibold text-zinc-300 tabular-nums">—</span>
					{/if}
				</span>

				<span class="hidden w-28 shrink-0 text-right text-xs text-zinc-400 tabular-nums sm:block">
					{item.included ? formatMoney(itemContribution(item, stat), app.doc.settings) : 'excluded'}
				</span>

				<button
					type="button"
					class="shrink-0 rounded-md p-1.5 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
					aria-label="Delete {item.name}"
					onclick={() => (deletingItemId = item.id)}
				>
					🗑
				</button>
			</li>
		{/snippet}

		{#snippet categoryCard(node: CategoryNode)}
			<details
				open
				class="group/details rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
			>
				<summary
					class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden"
				>
					<span class="flex items-center gap-2 text-sm font-semibold">
						<span class="text-xs text-zinc-400 transition-transform group-open/details:rotate-90"
							>▸</span
						>
						{node.name}
					</span>
					<span class="text-xs font-medium text-zinc-400 tabular-nums">
						{node.count}
						{node.count === 1 ? 'item' : 'items'} · {formatMoney(node.total, app.doc.settings)}
					</span>
				</summary>
				<div class="space-y-2 border-t border-zinc-100 p-2 dark:border-zinc-800">
					{#each node.items as item (item.id)}
						{@render itemRow(item)}
					{/each}
					{#each node.children as child (child.id)}
						{@render categoryCard(child)}
					{/each}
				</div>
			</details>
		{/snippet}

		{#if viewMode === 'flat'}
			<ul class="space-y-2">
				{#each visibleItems as item (item.id)}
					{@render itemRow(item)}
				{/each}
			</ul>
		{:else}
			<div class="space-y-3" bind:this={groupedRoot}>
				{#each categoryTree.roots as node (node.id)}
					{@render categoryCard(node)}
				{/each}
				{#if categoryTree.uncategorized.length > 0}
					<details
						open
						class="group/details rounded-xl border border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
					>
						<summary
							class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden"
						>
							<span class="flex items-center gap-2 text-sm font-semibold">
								<span
									class="text-xs text-zinc-400 transition-transform group-open/details:rotate-90"
									>▸</span
								>
								Uncategorized
							</span>
							<span class="text-xs font-medium text-zinc-400 tabular-nums">
								{categoryTree.uncategorized.length}
								{categoryTree.uncategorized.length === 1 ? 'item' : 'items'}
							</span>
						</summary>
						<ul class="space-y-2 border-t border-zinc-100 p-2 dark:border-zinc-800">
							{#each categoryTree.uncategorized as item (item.id)}
								{@render itemRow(item)}
							{/each}
						</ul>
					</details>
				{/if}
			</div>
		{/if}
	{/if}

	<p class="mt-6">
		<a href={resolve('/')} class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
			>← All wishlists</a
		>
	</p>

	<Modal open={editingItem !== null} title="Edit item" onclose={closeEditor} wide>
		{#if editingItem}
			<div class="space-y-5">
				<div class="flex gap-3">
					<label class="grow">
						<span class="mb-1 block text-xs font-medium text-zinc-500">Name</span>
						<input
							type="text"
							class="w-full rounded-lg border-zinc-200 text-sm dark:border-zinc-700"
							value={editingItem.name}
							onchange={(e) =>
								app.updateItem(wishlist.id, editingItem.id, { name: e.currentTarget.value })}
						/>
					</label>
					<div>
						<span class="mb-1 block text-xs font-medium text-zinc-500">Quantity</span>
						<NumberStepper
							value={editingItem.quantity}
							onchange={(v) => app.updateItem(wishlist.id, editingItem.id, { quantity: v })}
						/>
					</div>
					<label class="flex cursor-pointer items-center gap-2 self-end pb-1.5 text-sm">
						<input
							type="checkbox"
							class="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
							checked={editingItem.bought}
							onchange={(e) =>
								app.updateItem(wishlist.id, editingItem.id, {
									bought: e.currentTarget.checked
								})}
						/>
						Bought
					</label>
				</div>

				<label class="block">
					<span class="mb-1 block text-xs font-medium text-zinc-500">Category</span>
					<select
						class="w-full rounded-lg border-zinc-200 text-sm dark:border-zinc-700"
						value={editingItem.categoryId ?? ''}
						onchange={(e) =>
							app.updateItem(wishlist.id, editingItem.id, { categoryId: e.currentTarget.value })}
					>
						<option value="">Uncategorized</option>
						{#each flatCategories as flat (flat.category.id)}
							<option value={flat.category.id}>{flat.path}</option>
						{/each}
					</select>
				</label>

				<section>
					<h3 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
						Prices &amp; Links
					</h3>
					{#if offerRows.length === 0}
						<p class="mb-2 text-xs text-zinc-400">
							One row per shop or sighting — fill in what you know, leave the rest empty.
						</p>
					{/if}
					<ul class="space-y-2">
						{#each offerRows as row (row.key)}
							<li
								class="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/40"
							>
								<input
									type="number"
									min="0"
									step="0.01"
									class="w-28 rounded-lg border-zinc-200 text-sm tabular-nums dark:border-zinc-700"
									value={row.amount ?? ''}
									placeholder="Amount"
									aria-label="Price amount"
									onchange={(e) => setRowAmount(row, e.currentTarget.value)}
								/>
								{#if row.linkId}
									<input
										type="text"
										class="w-36 rounded-lg border-zinc-200 text-xs dark:border-zinc-700"
										value={row.label ?? ''}
										placeholder="Label (shop)"
										aria-label="Link label"
										onchange={(e) =>
											app.updateLink(wishlist.id, editingItem.id, row.linkId!, {
												label: e.currentTarget.value
											})}
									/>
									<input
										type="url"
										class="min-w-40 grow basis-52 rounded-lg border-zinc-200 text-xs dark:border-zinc-700"
										value={row.url ?? ''}
										placeholder="https://…  (leave empty for an in-store price)"
										aria-label="Link URL"
										onchange={(e) =>
											app.updateLink(wishlist.id, editingItem.id, row.linkId!, {
												url: e.currentTarget.value
											})}
									/>
									{#if row.url}
										<a
											href={row.url}
											target="_blank"
											rel="noopener noreferrer"
											class="rounded-md p-1 text-xs text-zinc-400 hover:text-indigo-600"
											aria-label="Open link"
										>
											↗
										</a>
									{/if}
								{:else}
									<span class="grow basis-40 text-xs text-zinc-400">
										Standalone price — no link
									</span>
								{/if}
								<button
									type="button"
									class="rounded-md p-1 text-xs text-zinc-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
									aria-label="Remove row"
									onclick={() => removeRow(row)}
								>
									✕
								</button>
							</li>
						{/each}
					</ul>
					<div class="mt-2 flex flex-wrap gap-2">
						<button
							type="button"
							class="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
							onclick={addSourceRow}
						>
							+ Add source
						</button>
					</div>
				</section>

				{#if editingFields.length !== 0}
					<section>
						<h3 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
							Custom values {editingCategory ? `— ${editingCategory.name}` : ''}
						</h3>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{#each editingFields as field (field.id)}
								<FieldInput
									{field}
									value={editingItem.values[field.id]}
									onchange={(value) =>
										app.setCustomValue(wishlist.id, editingItem.id, field.id, value)}
								/>
							{/each}
						</div>
					</section>
				{/if}

				<footer
					class="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700"
				>
					<button
						type="button"
						class="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
						onclick={() => app.duplicateItem(wishlist.id, editingItem.id)}
					>
						Duplicate
					</button>
					<div class="flex items-center gap-1.5">
						<select
							class="rounded-lg border-zinc-200 py-1.5 text-xs dark:border-zinc-700"
							bind:value={copyTarget}
						>
							<option value="">Copy to wishlist…</option>
							{#each app.doc.wishlists.filter((w) => w.id !== wishlist.id) as w (w.id)}
								<option value={w.id}>{w.name}</option>
							{/each}
						</select>
						<button
							type="button"
							class="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
							disabled={!copyTarget}
							onclick={() => {
								app.copyItemToWishlist(wishlist.id, editingItem.id, copyTarget);
								closeEditor();
							}}
						>
							Copy
						</button>
					</div>
					<button
						type="button"
						class="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
						onclick={() => {
							deletingItemId = editingItem.id;
							closeEditor();
						}}
					>
						Delete
					</button>
					<button
						type="button"
						class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
						onclick={closeEditor}
					>
						Done
					</button>
				</footer>
			</div>
		{/if}
	</Modal>

	<ConfirmModal
		open={deletingItemId !== null}
		title="Delete item"
		message="'{wishlist.items.find((i) => i.id === deletingItemId)
			?.name}' will be permanently removed."
		confirmLabel="Delete"
		onconfirm={() => {
			if (deletingItemId) app.deleteItem(wishlist.id, deletingItemId);
			deletingItemId = null;
		}}
		oncancel={() => (deletingItemId = null)}
	/>
{/if}
