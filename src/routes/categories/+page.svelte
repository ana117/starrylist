<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { flattenCategories, subtreeIds } from '$lib/categories';
	import { activeFields, type CustomField, type FieldType } from '$lib/domain';
	import { app } from '$lib/state.svelte';

	let newName = $state('');
	let addingParentId = $state<string | null>(null);
	let addChildName = $state('');
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let deletingId = $state<string | null>(null);

	let fieldsCategoryId = $state<string | null>(null);
	let newFieldName = $state('');
	let newFieldType = $state<FieldType>('text');
	let newFieldOptions = $state('');

	const ordered = $derived(flattenCategories(app.doc.categories));

	const fieldsCategory = $derived(
		fieldsCategoryId ? (app.doc.categories.find((c) => c.id === fieldsCategoryId) ?? null) : null
	);
	const managedFields = $derived(fieldsCategory ? activeFields(fieldsCategory) : []);

	const fieldTypes: FieldType[] = ['text', 'number', 'date', 'select'];

	function addField(): void {
		if (!fieldsCategory || !newFieldName.trim()) return;
		const options =
			newFieldType === 'select'
				? newFieldOptions
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean)
				: undefined;
		app.addField(fieldsCategory.id, { name: newFieldName.trim(), type: newFieldType, options });
		newFieldName = '';
		newFieldType = 'text';
		newFieldOptions = '';
	}

	function updateOptions(field: CustomField, raw: string): void {
		if (!fieldsCategory) return;
		app.updateField(fieldsCategory.id, field.id, {
			options: raw.split(',').map((s) => s.trim())
		});
	}

	function createRoot(): void {
		const name = newName.trim();
		if (!name) return;
		app.createCategory(name, null);
		newName = '';
	}

	function addChild(parentId: string): void {
		const name = addChildName.trim();
		if (!name) return;
		app.createCategory(name, parentId);
		addChildName = '';
		addingParentId = null;
	}

	function startRename(id: string, current: string): void {
		renamingId = id;
		renameValue = current;
	}

	function saveRename(): void {
		if (!renamingId) return;
		const name = renameValue.trim();
		if (name) app.renameCategory(renamingId, name);
		renamingId = null;
	}

	function confirmDelete(): void {
		if (deletingId) app.deleteCategoryTree(deletingId);
		deletingId = null;
	}

	const deleteInfo = $derived.by(() => {
		if (!deletingId) return null;
		const doomed = subtreeIds(app.doc.categories, deletingId);
		const items = app.doc.wishlists.reduce(
			(n, w) => n + w.items.filter((i) => i.categoryId && doomed.has(i.categoryId)).length,
			0
		);
		return { categories: doomed.size, items };
	});
</script>

<div class="mb-8">
	<h1 class="text-2xl font-bold tracking-tight">Categories</h1>
	<p class="mt-1 text-sm text-zinc-500">
		One shared taxonomy for every wishlist. Nest as deep as you like; items can sit on any node.
	</p>
</div>

<form
	class="mb-6 flex gap-2"
	onsubmit={(e) => {
		e.preventDefault();
		createRoot();
	}}
>
	<input
		type="text"
		class="grow rounded-lg border-zinc-200 text-sm"
		placeholder="New top-level category…"
		bind:value={newName}
	/>
	<button
		type="submit"
		class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
		disabled={!newName.trim()}
	>
		Add
	</button>
</form>

{#if ordered.length === 0}
	<div class="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
		<p class="text-sm font-medium text-zinc-700">No categories yet.</p>
		<p class="mt-1 text-sm text-zinc-400">Items work fine without them.</p>
	</div>
{:else}
	<ul class="space-y-1.5">
		{#each ordered as flat (flat.category.id)}
			{@const category = flat.category}
			<li
				class="group flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2"
				style="margin-left: {flat.depth * 1.5}rem"
			>
				{#if renamingId === category.id}
					<input
						type="text"
						class="w-56 rounded-lg border-zinc-200 px-2 py-1 text-sm"
						bind:value={renameValue}
						onkeydown={(e) => {
							if (e.key === 'Enter') saveRename();
							if (e.key === 'Escape') renamingId = null;
						}}
					/>
					<button
						type="button"
						class="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
						onclick={saveRename}
					>
						Save
					</button>
					<button
						type="button"
						class="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
						onclick={() => (renamingId = null)}
					>
						Cancel
					</button>
				{:else if addingParentId === category.id}
					<span class="text-sm font-medium">{category.name}</span>
					<span class="text-xs text-zinc-400">↳ new subcategory:</span>
					<input
						type="text"
						class="w-56 rounded-lg border-zinc-200 px-2 py-1 text-sm"
						placeholder="Name…"
						bind:value={addChildName}
						onkeydown={(e) => {
							if (e.key === 'Enter') addChild(category.id);
							if (e.key === 'Escape') addingParentId = null;
						}}
					/>
					<button
						type="button"
						class="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
						disabled={!addChildName.trim()}
						onclick={() => addChild(category.id)}
					>
						Add
					</button>
					<button
						type="button"
						class="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
						onclick={() => (addingParentId = null)}
					>
						Cancel
					</button>
				{:else}
					<span class="text-sm font-medium">
						{flat.depth > 0 ? '↳ ' : ''}{category.name}
					</span>
					<div
						class="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
					>
						<button
							type="button"
							class="rounded-md px-2 py-1 text-xs font-medium {fieldsCategoryId === category.id
								? 'bg-indigo-50 text-indigo-700'
								: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'}"
							onclick={() =>
								(fieldsCategoryId = fieldsCategoryId === category.id ? null : category.id)}
						>
							Fields ({activeFields(category).length})
						</button>
						<button
							type="button"
							class="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
							onclick={() => {
								addingParentId = category.id;
								addChildName = '';
								renamingId = null;
							}}
						>
							+ subcategory
						</button>
						<button
							type="button"
							class="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
							onclick={() => startRename(category.id, category.name)}
						>
							Rename
						</button>
						<button
							type="button"
							class="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
							onclick={() => (deletingId = category.id)}
						>
							Delete
						</button>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

{#if fieldsCategory}
	<section class="mt-6 rounded-xl border border-indigo-100 bg-white p-5">
		<h2 class="text-sm font-semibold">Custom Fields — {fieldsCategory.name}</h2>
		<p class="mt-1 text-xs text-zinc-500">
			Items in this category can hold one Custom Value per field. Removing a field only hides its
			values; re-creating a field with the same name and type reveals them again.
		</p>

		<div class="mt-3 divide-y divide-zinc-100">
			{#each managedFields as field (field.id)}
				<div class="flex flex-wrap items-end gap-x-3 gap-y-2 py-2.5">
					<label class="block w-44">
						<span class="mb-1 block text-xs font-medium text-zinc-500">Name</span>
						<input
							type="text"
							class="w-full rounded-lg border-zinc-200 text-sm"
							value={field.name}
							onchange={(e) =>
								app.updateField(fieldsCategory.id, field.id, { name: e.currentTarget.value })}
						/>
					</label>
					<label class="block w-28">
						<span class="mb-1 block text-xs font-medium text-zinc-500">Type</span>
						<select
							class="w-full rounded-lg border-zinc-200 text-sm"
							value={field.type}
							onchange={(e) =>
								app.updateField(fieldsCategory.id, field.id, {
									type: e.currentTarget.value as FieldType
								})}
						>
							{#each fieldTypes as t (t)}
								<option value={t}>{t}</option>
							{/each}
						</select>
					</label>
					{#if field.type === 'select'}
						<label class="block grow basis-56">
							<span class="mb-1 block text-xs font-medium text-zinc-500"
								>Options (comma-separated)</span
							>
							<input
								type="text"
								class="w-full rounded-lg border-zinc-200 text-sm"
								value={field.options.join(', ')}
								onchange={(e) => updateOptions(field, e.currentTarget.value)}
							/>
						</label>
					{/if}
					<button
						type="button"
						class="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
						onclick={() => app.removeField(fieldsCategory.id, field.id)}
					>
						Remove
					</button>
				</div>
			{:else}
				<p class="py-2 text-xs text-zinc-400">No Custom Fields defined yet.</p>
			{/each}
		</div>

		<form
			class="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2 border-t border-zinc-200 pt-4"
			onsubmit={(e) => {
				e.preventDefault();
				addField();
			}}
		>
			<label class="block w-44">
				<span class="mb-1 block text-xs font-medium text-zinc-500">New field name</span>
				<input
					type="text"
					class="w-full rounded-lg border-zinc-200 text-sm"
					placeholder="Priority, Size…"
					bind:value={newFieldName}
				/>
			</label>
			<label class="block w-28">
				<span class="mb-1 block text-xs font-medium text-zinc-500">Type</span>
				<select class="w-full rounded-lg border-zinc-200 text-sm" bind:value={newFieldType}>
					{#each fieldTypes as t (t)}
						<option value={t}>{t}</option>
					{/each}
				</select>
			</label>
			{#if newFieldType === 'select'}
				<label class="block grow basis-56">
					<span class="mb-1 block text-xs font-medium text-zinc-500">Options (comma-separated)</span
					>
					<input
						type="text"
						class="w-full rounded-lg border-zinc-200 text-sm"
						placeholder="high, medium, low"
						bind:value={newFieldOptions}
					/>
				</label>
			{/if}
			<button
				type="submit"
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
				disabled={!newFieldName.trim()}
			>
				Add field
			</button>
		</form>
	</section>
{/if}

<ConfirmModal
	open={deletingId !== null}
	title="Delete category"
	message="This removes the category and its whole subtree ({deleteInfo?.categories ?? 0}
		{deleteInfo?.categories === 1 ? 'category' : 'categories'}). {deleteInfo?.items ?? 0}
		{deleteInfo?.items === 1
		? 'item'
		: 'items'} on those nodes will become uncategorized — nothing is deleted."
	confirmLabel="Delete subtree"
	onconfirm={confirmDelete}
	oncancel={() => (deletingId = null)}
/>
