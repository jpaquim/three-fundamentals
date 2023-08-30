<script lang="ts">
	import { onMount } from 'svelte';

	let canvasEls: HTMLCanvasElement[] = [];

	onMount(() => {
		canvasEls.forEach((canvas) => {
			const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

			function draw(str: string) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(str, canvas.width / 2, canvas.height / 2);
			}

			draw(canvas.id);

			canvas.addEventListener('focus', () => {
				draw('has focus press a key');
			});

			canvas.addEventListener('blur', () => {
				draw('lost focus');
			});

			canvas.addEventListener('keydown', (e) => {
				draw(`keyCode: ${e.keyCode}`);
			});
		});
	});
</script>

<div class="spread">
	<div>
		<canvas bind:this={canvasEls[0]} width="100" height="100" id="c1"></canvas>
		<div>tabindex not set</div>
	</div>
	<div>
		<canvas bind:this={canvasEls[1]} width="100" height="100" id="c2" tabindex="0"></canvas>
		<div>focus style not set</div>
	</div>
	<div>
		<canvas bind:this={canvasEls[2]} width="100" height="100" id="c3" tabindex="1"></canvas>
		<div>tabindex and<br />focus style set</div>
	</div>
</div>

<style>
	.spread {
		display: flex;
		font-size: x-small;
		text-align: center;
	}
	canvas {
		margin: 5px;
		background: pink;
	}
	#c3:focus {
		outline: none;
	}
</style>
