<script lang="ts">
	import { onMount } from 'svelte';
	import { init, pickPosition, state } from './shared-picking';

	let canvas: HTMLCanvasElement;
	let sendMouse: (x: number, y: number) => void;

	function startWorker(canvas: HTMLCanvasElement) {
		const offscreen = canvas.transferControlToOffscreen();
		const worker = new Worker(new URL('./offscreencanvas-worker-picking.ts', import.meta.url), {
			type: 'module'
		});
		worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);

		sendMouse = (x, y) => {
			worker.postMessage({
				type: 'mouse',
				x,
				y
			});
		};

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

		sendMouse = (x, y) => {
			pickPosition.x = x;
			pickPosition.y = y;
		};

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

		window.addEventListener('mousemove', setPickPosition);
		window.addEventListener('mouseout', clearPickPosition);
		window.addEventListener('mouseleave', clearPickPosition);

		window.addEventListener(
			'touchstart',
			(event) => {
				// prevent the window from scrolling
				event.preventDefault();
				setPickPosition(event.touches[0]);
			},
			{ passive: false }
		);

		window.addEventListener('touchmove', (event) => {
			setPickPosition(event.touches[0]);
		});

		window.addEventListener('touchend', clearPickPosition);
	}

	function getCanvasRelativePosition(event) {
		const rect = canvas.getBoundingClientRect();
		return {
			x: ((event.clientX - rect.left) * canvas.width) / rect.width,
			y: ((event.clientY - rect.top) * canvas.height) / rect.height
		};
	}

	function setPickPosition(event) {
		const pos = getCanvasRelativePosition(event);
		sendMouse((pos.x / canvas.width) * 2 - 1, (pos.y / canvas.height) * -2 + 1); // note we flip Y
	}

	function clearPickPosition() {
		// unlike the mouse which always has a position
		// if the user stops touching the screen we want
		// to stop picking. For now we just pick a value
		// unlikely to pick something
		sendMouse(-100000, -100000);
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
