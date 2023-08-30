<script lang="ts">
	import { onMount } from 'svelte';
	import { init, state } from './shared-cube';

	let canvas: HTMLCanvasElement;

	function startWorker(canvas: HTMLCanvasElement) {
		const offscreen = canvas.transferControlToOffscreen();
		const worker = new Worker(new URL('./offscreencanvas-worker-cubes.ts', import.meta.url), {
			type: 'module'
		});
		worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);

		function sendSize() {
			worker.postMessage({
				type: 'size',
				width: canvas.clientWidth,
				height: canvas.clientHeight
			});
		}

		window.addEventListener('resize', sendSize);
		sendSize();

		console.log('using OffscreenCanvas');
	}

	function startMainPage(canvas: HTMLCanvasElement) {
		init({ canvas });

		function sendSize() {
			state.width = canvas.clientWidth;
			state.height = canvas.clientHeight;
		}
		window.addEventListener('resize', sendSize);
		sendSize();

		console.log('using regular canvas');
	}

	function main() {
		if (canvas.transferControlToOffscreen) {
			startWorker(canvas);
		} else {
			startMainPage(canvas);
		}
	}

	onMount(() => {
		main();
	});
</script>

<canvas bind:this={canvas} />

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
</style>
