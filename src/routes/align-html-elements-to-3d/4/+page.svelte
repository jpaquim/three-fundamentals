<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	let canvas: HTMLCanvasElement;
	let labelParentElem: HTMLDivElement;

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const fov = 60;
		const aspect = 2;
		const near = 0.1;
		const far = 10;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 2.5;

		const controls = new OrbitControls(camera, canvas);
		controls.enableDamping = true;
		controls.enablePan = false;
		controls.minDistance = 1.2;
		controls.maxDistance = 4;
		controls.update();

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#236');

		{
			const loader = new THREE.TextureLoader();
			const texture = loader.load('/country-outlines-4k.png', render);
			const geometry = new THREE.SphereGeometry(1, 64, 32);
			const material = new THREE.MeshBasicMaterial({ map: texture });
			scene.add(new THREE.Mesh(geometry, material));
		}

		async function loadJSON(url: string) {
			const req = await fetch(url);
			return req.json();
		}

		type CountryInfo = {
			lat: number;
			lon: number;
			name: string;
			position: THREE.Vector3;
			elem: HTMLElement;
		};

		let countryInfos: CountryInfo[];
		async function loadCountryData() {
			countryInfos = await loadJSON('/country-info.json');

			const lonFudge = Math.PI * 1.5;
			const latFudge = Math.PI;
			const lonHelper = new THREE.Object3D();
			const latHelper = new THREE.Object3D();
			lonHelper.add(latHelper);
			const positionHelper = new THREE.Object3D();
			positionHelper.position.z = 1;
			latHelper.add(positionHelper);

			for (const countryInfo of countryInfos) {
				const { lat, lon, name } = countryInfo;

				lonHelper.rotation.y = THREE.MathUtils.degToRad(lon) + lonFudge;
				latHelper.rotation.x = THREE.MathUtils.degToRad(lat) + latFudge;

				positionHelper.updateWorldMatrix(true, false);
				const position = new THREE.Vector3();
				positionHelper.getWorldPosition(position);
				countryInfo.position = position;

				const elem = document.createElement('div');
				elem.textContent = name;
				labelParentElem.appendChild(elem);
				countryInfo.elem = elem;
			}

			requestRenderIfNotRequested();
		}

		loadCountryData();

		const tempV = new THREE.Vector3();

		function updateLabels() {
			if (!countryInfos) {
				return;
			}

			for (const countryInfo of countryInfos) {
				const { position, elem } = countryInfo;

				tempV.copy(position);
				tempV.project(camera);

				const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
				const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

				elem.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

				elem.style.zIndex = String(((-tempV.z * 0.5 + 0.5) * 100000) | 0);
			}
		}

		function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			const needResize = canvas.width !== width || canvas.height !== height;
			if (needResize) {
				renderer.setSize(width, height, false);
			}
			return needResize;
		}

		let renderRequested = false;

		function render() {
			renderRequested = false;

			if (resizeRendererToDisplaySize(renderer)) {
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			controls.update();

			updateLabels();

			renderer.render(scene, camera);
		}

		render();

		function requestRenderIfNotRequested() {
			if (!renderRequested) {
				renderRequested = true;
				requestAnimationFrame(render);
			}
		}

		controls.addEventListener('change', requestRenderIfNotRequested);
		window.addEventListener('resize', requestRenderIfNotRequested);
	}

	onMount(() => {
		main();
	});
</script>

<div id="container">
	<canvas bind:this={canvas} />
	<div bind:this={labelParentElem} id="labels"></div>
</div>

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
		font-family: sans-serif;
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
		z-index: 0;
		left: 0;
		top: 0;
		color: white;
	}

	#labels > :global(div) {
		position: absolute;
		left: 0;
		top: 0;
		cursor: pointer;
		font-size: small;
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
