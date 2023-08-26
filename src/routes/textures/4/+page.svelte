<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;
	let loadingElem: HTMLDivElement;
	let progressBarElem: HTMLDivElement;

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
		const loadManager = new THREE.LoadingManager();
		const loader = new THREE.TextureLoader(loadManager);

		const materials = [
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-1.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-2.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-3.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-4.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-5.jpg') }),
			new THREE.MeshBasicMaterial({ map: loadColorTexture('/flower-6.jpg') })
		];

		loadManager.onLoad = () => {
			loadingElem.style.display = 'none';
			const cube = new THREE.Mesh(geometry, materials);
			scene.add(cube);
			cubes.push(cube);
		};

		loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
			const progress = itemsLoaded / itemsTotal;
			progressBarElem.style.transform = `scaleX(${progress})`;
		};

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
<div bind:this={loadingElem} id="loading">
	<div class="progress"><div bind:this={progressBarElem} class="progressbar"></div></div>
</div>

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

	#loading {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	#loading .progress {
		margin: 1.5em;
		border: 1px solid white;
		width: 50vw;
	}

	#loading .progressbar {
		margin: 2px;
		background: white;
		height: 1em;
		transform-origin: top left;
		transform: scaleX(0);
	}
</style>
