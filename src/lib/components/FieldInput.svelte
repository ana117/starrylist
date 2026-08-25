<script lang="ts">
	import type { CustomField, CustomValue } from '$lib/domain';

	let {
		field,
		value,
		onchange
	}: {
		field: CustomField;
		value: CustomValue | undefined;
		onchange: (value: CustomValue | null) => void;
	} = $props();

	function commitText(raw: string, parse: boolean): void {
		const trimmed = raw.trim();
		if (trimmed === '') {
			onchange(null);
			return;
		}
		if (!parse) {
			onchange(trimmed);
			return;
		}
		const parsed = Number(trimmed);
		onchange(Number.isFinite(parsed) ? parsed : trimmed);
	}
</script>

<label class="block">
	<span class="mb-1 block text-xs font-medium text-zinc-500">{field.name}</span>
	{#if field.type === 'text'}
		<input
			type="text"
			class="w-full rounded-lg border-zinc-200 text-sm"
			value={value === undefined ? '' : String(value)}
			onchange={(e) => commitText(e.currentTarget.value, false)}
			placeholder={field.name}
		/>
	{:else if field.type === 'number'}
		<input
			type="number"
			step="any"
			class="w-full rounded-lg border-zinc-200 text-sm"
			value={value === undefined ? '' : String(value)}
			onchange={(e) => commitText(e.currentTarget.value, true)}
			placeholder={field.name}
		/>
	{:else if field.type === 'date'}
		<input
			type="date"
			class="w-full rounded-lg border-zinc-200 text-sm"
			value={typeof value === 'string' ? value : ''}
			onchange={(e) => onchange(e.currentTarget.value || null)}
		/>
	{:else}
		<select
			class="w-full rounded-lg border-zinc-200 text-sm {value !== undefined &&
			!field.options.includes(String(value))
				? 'bg-amber-50'
				: ''}"
			value={value === undefined ? '' : String(value)}
			onchange={(e) => onchange(e.currentTarget.value || null)}
		>
			<option value="">—</option>
			{#each field.options as option (option)}
				<option value={option}>{option}</option>
			{/each}
			{#if value !== undefined && !field.options.includes(String(value))}
				<option value={String(value)}>{String(value)} (removed option)</option>
			{/if}
		</select>
	{/if}
</label>
