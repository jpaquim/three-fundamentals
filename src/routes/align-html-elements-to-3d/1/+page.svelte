<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	let canvas: HTMLCanvasElement;
	let labelContainerElem: HTMLDivElement;

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const fov = 75;
		const aspect = 2;
		const near = 1.1;
		const far = 50;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 7;

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
			x: number,
			name: string
		): { cube: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial>; elem: HTMLDivElement } {
			const material = new THREE.MeshPhongMaterial({ color });

			const cube = new THREE.Mesh(geometry, material);
			scene.add(cube);

			cube.position.x = x;

			const elem = document.createElement('div');
			elem.textContent = name;
			labelContainerElem.appendChild(elem);

			return { cube, elem };
		}

		const cubes = [
			makeInstance(geometry, 0x44aa88, 0, 'Aqua'),
			makeInstance(geometry, 0x8844aa, -2, 'Purple'),
			makeInstance(geometry, 0xaa8844, 2, 'Gold')
		];

		function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			const needResize = canvas.width !== width || canvas.height !== height;
			if (needResize) {
				renderer.setSize(width, height, false);
			}
			return needResize;
		}

		const tempV = new THREE.Vector3();

		requestAnimationFrame(function render(time) {
			time *= 0.001;

			if (resizeRendererToDisplaySize(renderer)) {
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			cubes.forEach((cubeInfo, ndx) => {
				const { cube, elem } = cubeInfo;
				const speed = 1 + ndx * 0.1;
				const rot = time * speed;
				cube.rotation.x = rot;
				cube.rotation.y = rot;

				cube.updateWorldMatrix(true, false);
				cube.getWorldPosition(tempV);

				tempV.project(camera);

				const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
				const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

				elem.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
			});

			renderer.render(scene, camera);

			requestAnimationFrame(render);
		});
	}

	onMount(() => {
		main();
	});
</script>

<div id="container">
	<canvas bind:this={canvas} />
	<div bind:this={labelContainerElem} id="labels"></div>
</div>

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
	}

	#container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	#labels {
		position: absolute;
		left: 0;
		top: 0;
		color: white;
	}

	#labels > :global(div) {
		position: absolute;
		left: 0;
		top: 0;
		cursor: pointer;
		font-size: large;
		user-select: none;
		text-shadow:
			-1px -1px 0 #000,
			0 -1px 0 #000,
			1px -1px 0 #000,
			1px 0 0 #000,
			1px 1px 0 #000,
			0 1px 0 #000,
			-1px 1px 0 #000,
			-1px 0 0 #000;
	}

	#labels > :global(div:hover) {
		color: red;
	}
</style>
