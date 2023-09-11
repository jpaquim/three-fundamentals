<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	function main() {
		const ctx = canvas.getContext('2d')!;
		canvas.width = 256;
		canvas.height = 256;
		ctx.fillStyle = '#FFF';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		function randInt(min: number, max?: number) {
			if (max === undefined) {
				max = min;
				min = 0;
			}
			return (Math.random() * (max - min) + min) | 0;
		}

		function drawRandomDot() {
			ctx.fillStyle = `#${randInt(0x1000000).toString(16).padStart(6, '0')}`;
			ctx.beginPath();

			const x = randInt(256);
			const y = randInt(256);
			const radius = randInt(10, 64);
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		}

		function render() {
			drawRandomDot();
			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);
	}

	onMount(() => {
		main();
	});
</script>

<canvas bind:this={canvas} />
