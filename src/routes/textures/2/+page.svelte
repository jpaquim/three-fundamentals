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

		const cubes: THREE.Object3D[] = [];
		const loader = new THREE.TextureLoader();

		const materials = [
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-1.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-2.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-3.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-4.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-5.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-6.jpg') })
		];
		const cube = new THREE.Mesh(geometry, materials);
		scene.add(cube);
		cubes.push(cube);

		function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
			const width = canvas.clientWidth;
			const height = canvas.clientWidth;
			const needResize = canvas.width !== width || canvas.height !== height;
			if (needResize) {
				renderer.setSize(width, height, false);
			}
			return needResize;
		}

		function loadColorTexture(path: string) {
			const texture = loader.load(path);
			texture.colorSpace = THREE.SRGBColorSpace;
			return texture;
		}

		requestAnimationFrame(function render(time) {
			time *= 0.001;

			if (resizeRendererToDisplaySize(renderer)) {
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

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
