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
		scene.background = new THREE.Color('#246');

		const pickingScene = new THREE.Scene();
		pickingScene.background = new THREE.Color(0);

		const maxNumCountries = 512;
		const paletteTextureWidth = maxNumCountries;
		const paletteTextureHeight = 1;
		const palette = new Uint8Array(paletteTextureWidth * 4);
		const paletteTexture = new THREE.DataTexture(
			palette,
			paletteTextureWidth,
			paletteTextureHeight
		);
		paletteTexture.minFilter = THREE.NearestFilter;
		paletteTexture.magFilter = THREE.NearestFilter;
		paletteTexture.colorSpace = THREE.SRGBColorSpace;
		for (let i = 1; i < palette.length; ++i) {
			palette[i] = Math.random() * 256;
		}
		palette.set([100, 200, 255, 255], 0);
		paletteTexture.needsUpdate = true;

		{
			const loader = new THREE.TextureLoader();
			const geometry = new THREE.SphereGeometry(1, 64, 32);

			const indexTexture = loader.load('/country-index-texture.png', render);
			indexTexture.minFilter = THREE.NearestFilter;
			indexTexture.magFilter = THREE.NearestFilter;

			const pickingMaterial = new THREE.MeshBasicMaterial({ map: indexTexture });
			pickingScene.add(new THREE.Mesh(geometry, pickingMaterial));

			const fragmentShaderReplacements = [
				{
					from: '#include <common>',
					to: `
					  #include <common>
						uniform sampler2D indexTexture;
						uniform sampler2D paletteTexture;
						uniform float paletteTextureWidth;
					`
				},
				{
					from: '#include <color_fragment>',
					to: `
					  #include <color_fragment>
						{
							vec4 indexColor = texture2D(indexTexture, vMapUv);
							float index = indexColor.r * 255.0 + indexColor.g * 255.0 * 256.0;
							vec2 paletteUV = vec2((index + 0.5) / paletteTextureWidth, 0.5);
							vec4 paletteColor = texture2D(paletteTexture, paletteUV);
							// diffuseColor.rgb += paletteColor.rgb; // white outlines
							diffuseColor.rgb = paletteColor.rgb - diffuseColor.rgb; // black outlines
						}
					`
				}
			];

			const texture = loader.load('/country-outlines-4k.png', render);
			const material = new THREE.MeshBasicMaterial({ map: texture });
			material.onBeforeCompile = function (shader) {
				fragmentShaderReplacements.forEach((rep) => {
					shader.fragmentShader = shader.fragmentShader.replace(rep.from, rep.to);
				});
				shader.uniforms.paletteTexture = { value: paletteTexture };
				shader.uniforms.indexTexture = { value: indexTexture };
				shader.uniforms.paletteTextureWidth = { value: paletteTextureWidth };
			};

			scene.add(new THREE.Mesh(geometry, material));
		}

		async function loadJSON(url: string) {
			const req = await fetch(url);
			return req.json();
		}

		type CountryInfo = {
			lat: number;
			lon: number;
			min: [number, number];
			max: [number, number];
			name: string;
			position: THREE.Vector3;
			elem: HTMLElement;
			area: number;
			selected: boolean;
		};

		let numCountriesSelected = 0;
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
				const { lat, lon, min, max, name } = countryInfo;

				lonHelper.rotation.y = THREE.MathUtils.degToRad(lon) + lonFudge;
				latHelper.rotation.x = THREE.MathUtils.degToRad(lat) + latFudge;

				positionHelper.updateWorldMatrix(true, false);
				const position = new THREE.Vector3();
				positionHelper.getWorldPosition(position);
				countryInfo.position = position;

				const width = max[0] - min[0];
				const height = max[1] - min[1];
				const area = width * height;
				countryInfo.area = area;

				const elem = document.createElement('div');
				elem.textContent = name;
				labelParentElem.appendChild(elem);
				countryInfo.elem = elem;
			}

			requestRenderIfNotRequested();
		}

		loadCountryData();

		const tempV = new THREE.Vector3();
		const cameraToPoint = new THREE.Vector3();
		const cameraPosition = new THREE.Vector3();
		const normalMatrix = new THREE.Matrix3();

		const settings = {
			minArea: 20,
			maxVisibleDot: -0.2
		};

		function updateLabels() {
			if (!countryInfos) {
				return;
			}

			const large = settings.minArea * settings.minArea;
			normalMatrix.getNormalMatrix(camera.matrixWorldInverse);
			camera.getWorldPosition(cameraPosition);

			for (const countryInfo of countryInfos) {
				const { position, elem, area, selected } = countryInfo;
				const largeEnough = area >= large;
				const show = selected || (numCountriesSelected === 0 && largeEnough);
				if (!show) {
					elem.style.display = 'none';
					continue;
				}

				tempV.copy(position);
				tempV.applyMatrix3(normalMatrix);

				cameraToPoint.copy(position);
				cameraToPoint.applyMatrix4(camera.matrixWorldInverse).normalize();

				const dot = tempV.dot(cameraToPoint);

				if (dot > settings.maxVisibleDot) {
					elem.style.display = 'none';
					continue;
				}

				elem.style.display = '';

				tempV.copy(position);
				tempV.project(camera);

				const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
				const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

				elem.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

				elem.style.zIndex = String(((-tempV.z * 0.5 + 0.5) * 100000) | 0);
			}
		}

		class GPUPickHelper {
			pickingTexture = new THREE.WebGLRenderTarget(1, 1);
			pixelBuffer = new Uint8Array(4);

			pick(
				cssPosition: { x: number; y: number },
				scene: THREE.Scene,
				camera: THREE.PerspectiveCamera
			) {
				const { pickingTexture, pixelBuffer } = this;

				const pixelRatio = renderer.getPixelRatio();
				camera.setViewOffset(
					renderer.getContext().drawingBufferWidth,
					renderer.getContext().drawingBufferHeight,
					(cssPosition.x * pixelRatio) | 0,
					(cssPosition.y * pixelRatio) | 0,
					1,
					1
				);

				renderer.setRenderTarget(pickingTexture);
				renderer.render(scene, camera);
				renderer.setRenderTarget(null);
				camera.clearViewOffset();
				renderer.readRenderTargetPixels(pickingTexture, 0, 0, 1, 1, pixelBuffer);

				const id = (pixelBuffer[0] << 0) | (pixelBuffer[1] << 8) | (pixelBuffer[2] << 16);

				return id;
			}
		}

		const pickHelper = new GPUPickHelper();

		function getCanvasRelativePosition(event: MouseEvent) {
			const rect = canvas.getBoundingClientRect();
			return {
				x: ((event.clientX - rect.left) * canvas.width) / rect.width,
				y: ((event.clientY - rect.top) * canvas.height) / rect.height
			};
		}

		function pickCountry(event: MouseEvent) {
			if (!countryInfos) {
				return;
			}

			const position = getCanvasRelativePosition(event);
			const id = pickHelper.pick(position, pickingScene, camera);
			if (id > 0) {
				const countryInfo = countryInfos[id - 1];
				const selected = !countryInfo.selected;
				if (selected && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
					unselectAllCountries();
				}

				numCountriesSelected += selected ? 1 : -1;
				countryInfo.selected = selected;
			} else if (numCountriesSelected) {
				unselectAllCountries();
			}
			requestRenderIfNotRequested();
		}

		function unselectAllCountries() {
			numCountriesSelected = 0;
			countryInfos.forEach((countryInfo) => {
				countryInfo.selected = false;
			});
		}

		canvas.addEventListener('pointerup', pickCountry);

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

	onMount(async () => {
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
