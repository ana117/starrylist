<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import FieldInput from '$lib/components/FieldInput.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { activeFields, type Item, type Link } from '$lib/domain';
	import { categoryPath, flattenCategories } from '$lib/categories';
	import { formatMoney } from '$lib/money';
	import { app } from '$lib/state.svelte';
	import { itemContribution, itemTotal, wishlistTotal } from '$lib/stats';

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

	interface Group {
		id: string;
		title: string;
		items: Item[];
		total: number;
	}

	const groups = $derived.by<Group[]>(() => {
		if (!wishlist) return [];
		const stat = app.doc.settings.stat;
		const totalOf = (items: Item[]): number =>
			items.reduce((sum, item) => sum + itemContribution(item, stat), 0);
		const result: Group[] = [];
		const remaining = [...wishlist.items];
		for (const flat of flattenCategories(app.doc.categories)) {
			const inCategory = remaining.filter((i) => i.categoryId === flat.category.id);
			if (inCategory.length === 0) continue;
			result.push({
				id: flat.category.id,
				title: flat.path,
				items: sortItems(inCategory),
				total: totalOf(inCategory)
			});
			for (const item of inCategory) {
				remaining.splice(
					remaining.findIndex((r) => r.id === item.id),
					1
				);
			}
		}
		if (remaining.length > 0) {
			result.push({
				id: 'uncategorized',
				title: 'Uncategorized',
				items: sortItems(remaining),
				total: totalOf(remaining)
			});
		}
		return result;
	});

	function linkLabel(link: Link): string {
		if (link.label) return link.label;
		try {
			return new URL(link.url).hostname;
		} catch {
			return link.url || 'link';
		}
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
</script>

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
		<div class="text-right">
			<p class="text-xs font-medium tracking-wide text-zinc-400 uppercase">Total ({stat})</p>
			<p class="text-3xl font-bold tracking-tight text-indigo-700 tabular-nums">
				{formatMoney(wishlistTotal(wishlist, stat), app.doc.settings)}
			</p>
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
			<li
				class="group flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-white px-4 py-3 transition-colors {item.included
					? 'border-zinc-200 dark:border-zinc-700'
					: 'border-dashed border-zinc-300 opacity-60 dark:border-zinc-700'} {draggingId === item.id
					? 'ring-2 ring-indigo-400'
					: ''}"
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

				<button
					type="button"
					class="min-w-0 grow basis-40 text-left"
					onclick={() => (editingItemId = item.id)}
				>
					<span
						class="block truncate text-sm font-medium {item.included
							? ''
							: 'line-through decoration-zinc-400'}"
					>
						{item.name}
					</span>
					<span class="mt-0.5 block truncate text-xs text-zinc-400">
						{#if viewMode === 'flat'}
							{#if item.quantity !== 1}×{item.quantity} ·
							{/if}{categoryPath(app.doc.categories, item.categoryId) || 'Uncategorized'}
						{:else if item.quantity !== 1}
							×{item.quantity}
						{/if}
					</span>
				</button>

				<span class="flex shrink-0 items-center gap-1">
					{#each item.links.slice(0, 2) as link (link.id)}
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							class="max-w-28 truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300"
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
				</span>

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

		{#if viewMode === 'flat'}
			<ul class="space-y-2">
				{#each visibleItems as item (item.id)}
					{@render itemRow(item)}
				{/each}
			</ul>
		{:else}
			<div class="space-y-3">
				{#each groups as group (group.id)}
					<details
						open
						class="group/details rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
					>
						<summary
							class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden"
						>
							<span class="flex items-center gap-2 text-sm font-semibold">
								<span
									class="text-xs text-zinc-400 transition-transform group-open/details:rotate-90"
									>▸</span
								>
								{group.title}
							</span>
							<span class="text-xs font-medium text-zinc-400 tabular-nums">
								{group.items.length}
								{group.items.length === 1 ? 'item' : 'items'} · {formatMoney(
									group.total,
									app.doc.settings
								)}
							</span>
						</summary>
						<ul class="space-y-2 border-t border-zinc-100 p-2 dark:border-zinc-800">
							{#each group.items as item (item.id)}
								{@render itemRow(item)}
							{/each}
						</ul>
					</details>
				{/each}
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
					<label class="w-24">
						<span class="mb-1 block text-xs font-medium text-zinc-500">Quantity</span>
						<input
							type="number"
							min="1"
							step="1"
							class="w-full rounded-lg border-zinc-200 text-sm dark:border-zinc-700"
							value={editingItem.quantity}
							onchange={(e) =>
								app.updateItem(wishlist.id, editingItem.id, {
									quantity: Number(e.currentTarget.value)
								})}
						/>
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
					<h3 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">Prices</h3>
					{#if editingItem.prices.length === 0}
						<p class="mb-2 text-xs text-zinc-400">No prices yet — bare amounts, no link needed.</p>
					{/if}
					<ul class="space-y-2">
						{#each editingItem.prices as price (price.id)}
							<li class="flex items-center gap-2">
								<input
									type="number"
									min="0"
									step="0.01"
									class="w-32 rounded-lg border-zinc-200 text-sm tabular-nums dark:border-zinc-700"
									value={price.amount}
									aria-label="Price amount"
									onchange={(e) =>
										app.updatePrice(wishlist.id, editingItem.id, price.id, {
											amount: Number(e.currentTarget.value)
										})}
								/>
								<button
									type="button"
									class="rounded-md p-1 text-xs text-zinc-300 hover:bg-red-50 hover:text-red-600"
									aria-label="Remove price"
									onclick={() => app.removePrice(wishlist.id, editingItem.id, price.id)}
								>
									✕
								</button>
							</li>
						{/each}
					</ul>
					<button
						type="button"
						class="mt-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => app.addPrice(wishlist.id, editingItem.id, 0)}
					>
						+ Add price
					</button>
				</section>

				<section>
					<h3 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">Links</h3>
					{#if editingItem.links.length === 0}
						<p class="mb-2 text-xs text-zinc-400">
							Bare links are fine — labels and price references are optional.
						</p>
					{/if}
					<ul class="space-y-2">
						{#each editingItem.links as link (link.id)}
							<li
								class="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/40"
							>
								{#if link.label}
									<span
										class="max-w-24 truncate rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900"
										title={link.label}
									>
										{link.label}
									</span>
								{/if}
								<input
									type="url"
									class="min-w-40 grow basis-52 rounded-lg border-zinc-200 text-xs dark:border-zinc-700"
									value={link.url}
									placeholder="https://…"
									aria-label="Link URL"
									onchange={(e) =>
										app.updateLink(wishlist.id, editingItem.id, link.id, {
											url: e.currentTarget.value
										})}
								/>
								<input
									type="text"
									class="w-32 rounded-lg border-zinc-200 text-xs dark:border-zinc-700"
									value={link.label ?? ''}
									placeholder="Label (shop)"
									aria-label="Link label"
									onchange={(e) =>
										app.updateLink(wishlist.id, editingItem.id, link.id, {
											label: e.currentTarget.value
										})}
								/>
								<select
									class="rounded-lg border-zinc-200 py-1 text-xs dark:border-zinc-700"
									value={link.priceId ?? ''}
									aria-label="Linked price"
									onchange={(e) =>
										app.updateLink(wishlist.id, editingItem.id, link.id, {
											priceId: e.currentTarget.value || undefined
										})}
								>
									<option value="">No price ref</option>
									{#each editingItem.prices as price (price.id)}
										<option value={price.id}>{formatMoney(price.amount, app.doc.settings)}</option>
									{/each}
								</select>
								<a
									href={link.url}
									target="_blank"
									rel="noopener noreferrer"
									class="rounded-md p-1 text-xs text-zinc-400 hover:text-indigo-600"
									aria-label="Open link"
								>
									↗
								</a>
								<button
									type="button"
									class="rounded-md p-1 text-xs text-zinc-300 hover:bg-red-50 hover:text-red-600"
									aria-label="Remove link"
									onclick={() => app.removeLink(wishlist.id, editingItem.id, link.id)}
								>
									✕
								</button>
							</li>
						{/each}
					</ul>
					<button
						type="button"
						class="mt-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => app.addLink(wishlist.id, editingItem.id, '')}
					>
						+ Add link
					</button>
				</section>

				<section>
					<h3 class="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
						Custom values {editingCategory ? `— ${editingCategory.name}` : ''}
					</h3>
					{#if editingFields.length === 0}
						<p class="text-xs text-zinc-400">
							{editingCategory
								? 'This category defines no custom fields.'
								: 'Pick a category to see its custom fields.'}
						</p>
					{:else}
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
					{/if}
				</section>

				<footer
					class="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700"
				>
					<button
						type="button"
						class="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
						Delete item
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
		confirmLabel="Delete item"
		onconfirm={() => {
			if (deletingItemId) app.deleteItem(wishlist.id, deletingItemId);
			deletingItemId = null;
		}}
		oncancel={() => (deletingItemId = null)}
	/>
{/if}
