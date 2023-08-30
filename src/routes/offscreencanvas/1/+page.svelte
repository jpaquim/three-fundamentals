<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let noOffscreenEl: HTMLDivElement;

	function main() {
		if (!canvas.transferControlToOffscreen) {
			canvas.style.display = 'none';
			noOffscreenEl.style.display = '';
			return;
		}

		const offscreen = canvas.transferControlToOffscreen();
		const worker = new Worker(new URL('./offscreencanvas-cubes.ts', import.meta.url), {
			type: 'module'
		});
		worker.postMessage({ type: 'main', canvas: offscreen }, [offscreen]);

		function sendSize() {
			worker.postMessage({
				type: 'size',
				width: canvas.clientWidth,
				height: canvas.clientHeight
			});
		}

		window.addEventListener('resize', sendSize);
		sendSize();
	}

	onMount(() => {
		main();
	});
</script>

<canvas bind:this={canvas} />
<div bind:this={noOffscreenEl} id="noOffscreenCanvas" style="display:none;">
	<div>no OffscreenCanvas support</div>
</div>

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	#noOffscreenCanvas {
		display: flex;
		width: 100%;
		height: 100%;
		align-items: center;
		justify-content: center;
		background: red;
		color: white;
	}
</style>
