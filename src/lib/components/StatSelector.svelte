<script lang="ts">
	import { STATS } from '$lib/domain';
	import { app } from '$lib/state.svelte';

	const labels: Record<string, string> = {
		low: 'Lowest',
		average: 'Average',
		high: 'Highest'
	};
</script>

<div
	class="flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800"
	role="group"
	aria-label="Price stat"
>
	{#each STATS as stat (stat)}
		<button
			type="button"
			class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors {app.doc.settings
				.stat === stat
				? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-950 dark:text-indigo-300'
				: 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}"
			onclick={() => app.setStat(stat)}
		>
			{labels[stat]}
		</button>
	{/each}
</div>
