<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

	let canvas: HTMLCanvasElement;

	async function main() {
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
		scene.background = new THREE.Color('black');

		{
			const loader = new THREE.TextureLoader();
			const texture = loader.load('/world.jpg', render);
			texture.colorSpace = THREE.SRGBColorSpace;
			const geometry = new THREE.SphereGeometry(1, 64, 32);
			const material = new THREE.MeshBasicMaterial({ map: texture });
			scene.add(new THREE.Mesh(geometry, material));
		}

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

		function addBoxes(file: File) {
			const { min, max, data, settings } = file;
			const range = max - min;

			const lonHelper = new THREE.Object3D();
			scene.add(lonHelper);
			const latHelper = new THREE.Object3D();
			lonHelper.add(latHelper);
			const positionHelper = new THREE.Object3D();
			positionHelper.position.z = 1;
			latHelper.add(positionHelper);
			const originHelper = new THREE.Object3D();
			originHelper.position.z = 0.5;
			positionHelper.add(originHelper);

			const lonFudge = Math.PI * 0.5;
			const latFudge = Math.PI * -0.135;
			const geometries: THREE.BufferGeometry[] = [];
			data.forEach((row, latNdx) => {
				row.forEach((value, lonNdx) => {
					if (value === undefined) {
						return;
					}

					const amount = (value - min) / range;

					const boxWidth = 1;
					const boxHeight = 1;
					const boxDepth = 1;
					const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

					lonHelper.rotation.y = THREE.MathUtils.degToRad(lonNdx + settings.xllcorner) + lonFudge;
					latHelper.rotation.x = THREE.MathUtils.degToRad(latNdx + settings.yllcorner) + latFudge;

					positionHelper.scale.set(0.005, 0.005, THREE.MathUtils.lerp(0.01, 0.5, amount));
					originHelper.updateWorldMatrix(true, false);
					geometry.applyMatrix4(originHelper.matrixWorld);

					geometries.push(geometry);
				});
			});

			const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
			const material = new THREE.MeshBasicMaterial({ color: 'red' });
			const mesh = new THREE.Mesh(mergedGeometry, material);
			scene.add(mesh);
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

		const text = await loadFile(
			'/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc'
		);
		const data = await parseData(text);
		addBoxes(data);
		render();
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
