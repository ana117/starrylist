<script lang="ts">
	import { newId } from '$lib/ids';

	let {
		fraction,
		sizeClass = 'h-7 w-7'
	}: {
		fraction: number;
		sizeClass?: string;
	} = $props();

	const clipId = `star-clip-${newId()}`;
	const STAR_PATH =
		'M12 1.8l3.08 6.63 6.92.62-5.23 4.6 1.56 6.79L12 16.86 5.67 20.44l1.56-6.79L2 9.05l6.92-.62z';

	const pct = $derived(Math.max(0, Math.min(1, fraction)) * 100);
</script>

<svg viewBox="0 0 24 24" class="{sizeClass} shrink-0" role="img" aria-label="Progress">
	<defs>
		<clipPath id={clipId}>
			<rect x="0" y="0" width={`${pct}%`} height="24" />
		</clipPath>
	</defs>
	<path d={STAR_PATH} class="fill-zinc-200 dark:fill-zinc-700" />
	<path d={STAR_PATH} class="fill-amber-400" clip-path={`url(#${clipId})`} />
</svg>
