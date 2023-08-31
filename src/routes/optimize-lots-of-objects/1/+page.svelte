<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	async function loadFile(url: string) {
		const res = await fetch(url);
		return res.text();
	}

	type Data = (number | undefined)[][];

	type Settings = Record<string, number>;

	type File = {
		data: Data;
		settings: Settings;
		max: number;
		min: number;
	};

	function parseData(text: string): File {
		const data: Data = [];
		const settings: Settings = {};
		let max: number | undefined = undefined;
		let min: number | undefined = undefined;
		text.split('\n').forEach((line) => {
			const parts = line.trim().split(/\s+/);
			if (parts.length === 2) {
				settings[parts[0]] = parseFloat(parts[1]);
			} else if (parts.length > 2) {
				const values = parts.map((v) => {
					const value = parseFloat(v);
					if (value === settings.NODATA_value) {
						return undefined;
					}
					max = Math.max(max === undefined ? value : max, value);
					min = Math.min(min === undefined ? value : min, value);
					return value;
				});
				data.push(values);
			}
		});
		if (min === undefined || max === undefined) throw new Error('max/min undefined');
		return { data, settings, max, min };
	}

	function drawData(file: File) {
		const {
			min,
			max,
			data,
			settings: { ncols, nrows }
		} = file;
		const range = max - min;
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
		ctx.canvas.width = ncols;
		ctx.canvas.height = nrows;
		ctx.canvas.style.width = px(ncols * 2);
		ctx.fillStyle = '#444';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		data.forEach((row, latNdx) => {
			row.forEach((value, lonNdx) => {
				if (value === undefined) {
					return;
				}

				const amount = (value - min) / range;
				const hue = 1;
				const saturation = 1;
				const lightness = amount;
				ctx.fillStyle = hsl(hue, saturation, lightness);
				ctx.fillRect(lonNdx, latNdx, 1, 1);
			});
		});
	}

	function px(v: number) {
		return `${v | 0}px`;
	}

	function hsl(h: number, s: number, l: number) {
		return `hsl(${(h * 360) | 0}, ${(s * 100) | 0}%, ${(l * 100) | 0}%)`;
	}

	onMount(async () => {
		const text = await loadFile(
			'/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc'
		);
		const data = await parseData(text);
		drawData(data);
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		max-width: calc(100% - 16px);
	}
</style>
