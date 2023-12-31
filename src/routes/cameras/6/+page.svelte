<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const left = 0;
		const right = 300;
		const top = 0;
		const bottom = 150;
		const near = -1;
		const far = 1;
		const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		camera.zoom = 1;

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('black');

		const loader = new THREE.TextureLoader();
		const textures = [
			loader.load('/flower-1.jpg'),
			loader.load('/flower-2.jpg'),
			loader.load('/flower-3.jpg'),
			loader.load('/flower-4.jpg'),
			loader.load('/flower-5.jpg'),
			loader.load('/flower-6.jpg')
		];
		const planeSize = 256;
		const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
		const planes = textures.map((texture) => {
			const planePivot = new THREE.Object3D();
			scene.add(planePivot);
			texture.magFilter = THREE.NearestFilter;
			const planeMat = new THREE.MeshBasicMaterial({
				map: texture,
				side: THREE.DoubleSide
			});
			const mesh = new THREE.Mesh(planeGeo, planeMat);
			planePivot.add(mesh);
			mesh.position.set(planeSize / 2, planeSize / 2, 0);
			return planePivot;
		});

		function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
			const canvas = renderer.domElement;
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			const needResize = canvas.width !== width || canvas.height !== height;
			if (needResize) {
				renderer.setSize(width, height, false);
			}
			return needResize;
		}

		requestAnimationFrame(function render(time) {
			time *= 0.001;

			if (resizeRendererToDisplaySize(renderer)) {
				camera.right = canvas.width;
				camera.bottom = canvas.height;
				camera.updateProjectionMatrix();
			}

			const distAcross = Math.max(20, canvas.width - planeSize);
			const distDown = Math.max(20, canvas.height - planeSize);

			const xRange = distAcross * 2;
			const yRange = distDown * 2;
			const speed = 180;

			planes.forEach((plane, ndx) => {
				const t = time * speed + ndx * 300;

				const xt = t % xRange;
				const yt = t % yRange;

				const x = xt < distAcross ? xt : xRange - xt;
				const y = yt < distDown ? yt : yRange - yt;

				plane.position.set(x, y, 0);
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
