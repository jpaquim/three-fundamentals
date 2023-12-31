<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	let canvas: HTMLCanvasElement;

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const fov = 75;
		const aspect = 2;
		const near = 0.1;
		const far = 5;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 2;

		const controls = new OrbitControls(camera, canvas);
		controls.target.set(0, 0, 0);
		controls.update();

		const scene = new THREE.Scene();

		{
			const color = 0xffffff;
			const intensity = 3;
			const light = new THREE.DirectionalLight(color, intensity);
			light.position.set(-1, 2, 4);
			scene.add(light);
		}

		const boxWidth = 1;
		const boxHeight = 1;
		const boxDepth = 1;
		const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

		function makeInstance(
			geometry: THREE.BufferGeometry,
			color: THREE.ColorRepresentation,
			x: number
		): THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial> {
			const material = new THREE.MeshPhongMaterial({ color });

			const cube = new THREE.Mesh(geometry, material);
			scene.add(cube);

			cube.position.x = x;
			return cube;
		}

		makeInstance(geometry, 0x44aa88, 0);
		makeInstance(geometry, 0x8844aa, -2);
		makeInstance(geometry, 0xaa8844, 2);

		function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			const needResize = canvas.width !== width || canvas.height !== height;
			if (needResize) {
				renderer.setSize(width, height, false);
			}
			return needResize;
		}

		function render() {
			if (resizeRendererToDisplaySize(renderer)) {
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			renderer.render(scene, camera);
		}

		render();

		controls.addEventListener('change', render);
		window.addEventListener('resize', render);
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
