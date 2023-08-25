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

		const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });

		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);

		requestAnimationFrame(function render(time) {
			time *= 0.001;

			cube.rotation.x = time;
			cube.rotation.y = time;

			renderer.render(scene, camera);

			requestAnimationFrame(render);
		});
	}

	onMount(() => {
		main();
	});
</script>

<canvas bind:this={canvas} />
