<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const fov = 75;
		const aspect = 2;
		const near = 0.1;
		const far = 5;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 2;

		const scene = new THREE.Scene();

		const boxWidth = 1;
		const boxHeight = 1;
		const boxDepth = 1;
		const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

		const cubes: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[] = [];

		const ctx = document.createElement('canvas').getContext('2d')!;
		ctx.canvas.width = 256;
		ctx.canvas.height = 256;
		ctx.fillStyle = '#FFF';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		const texture = new THREE.CanvasTexture(ctx.canvas);

		const material = new THREE.MeshBasicMaterial({
			map: texture
		});
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);
		cubes.push(cube);

		function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			const needResize = canvas.width !== width || canvas.height !== height;
			if (needResize) {
				renderer.setSize(width, height, false);
			}

			return needResize;
		}

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

		requestAnimationFrame(function render(time) {
			time *= 0.001;

			if (resizeRendererToDisplaySize(renderer)) {
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			drawRandomDot();
			texture.needsUpdate = true;

			cubes.forEach((cube, ndx) => {
				const speed = 0.2 + ndx * 0.1;
				const rot = time * speed;
				cube.rotation.x = rot;
				cube.rotation.y = rot;
			});

			renderer.render(scene, camera);

			requestAnimationFrame(render);
		});
	}

	onMount(() => {
		main();
	});
</script>

<canvas bind:this={canvas} />

<style>
	:global(html,body) {
		height: 100%;
		margin: 0;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
