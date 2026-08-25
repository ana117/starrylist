<script lang="ts">
	let {
		value,
		min = 1,
		step = 1,
		label = 'Quantity',
		onchange
	}: {
		value: number;
		min?: number;
		step?: number;
		label?: string;
		onchange: (value: number) => void;
	} = $props();

	function clamp(next: number): number {
		return Number.isFinite(next) ? Math.max(min, next) : min;
	}
</script>

<div
	class="flex items-stretch overflow-hidden rounded-lg border border-zinc-200 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-zinc-700"
>
	<button
		type="button"
		class="px-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
		aria-label="Decrease {label}"
		onclick={() => onchange(clamp(value - step))}
	>
		−
	</button>
	<input
		type="number"
		{min}
		{step}
		class="w-14 border-x border-zinc-200 bg-transparent text-center text-sm tabular-nums outline-none dark:border-zinc-700"
		aria-label={label}
		{value}
		onchange={(e) => onchange(clamp(Number(e.currentTarget.value)))}
	/>
	<button
		type="button"
		class="px-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
		aria-label="Increase {label}"
		onclick={() => onchange(clamp(value + step))}
	>
		+
	</button>
</div>
