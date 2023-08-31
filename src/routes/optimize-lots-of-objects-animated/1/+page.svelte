<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

	let canvas: HTMLCanvasElement;
	let uiElem: HTMLDivElement;

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

		function addBoxes(file: File, hueRange: [number, number]) {
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

			const color = new THREE.Color();

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

					const hue = THREE.MathUtils.lerp(...hueRange, amount);
					const saturation = 1;
					const lightness = THREE.MathUtils.lerp(0.4, 1.0, amount);
					color.setHSL(hue, saturation, lightness);
					const rgb = color.toArray().map((v) => v * 255);

					const numVerts = geometry.getAttribute('position').count;
					const itemSize = 3;
					const colors = new Uint8Array(itemSize * numVerts);

					colors.forEach((v, ndx) => {
						colors[ndx] = rgb[ndx % 3];
					});

					const normalized = true;
					const colorAttrib = new THREE.BufferAttribute(colors, itemSize, normalized);
					geometry.setAttribute('color', colorAttrib);

					geometries.push(geometry);
				});
			});

			const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
			const material = new THREE.MeshBasicMaterial({
				vertexColors: true
			});
			const mesh = new THREE.Mesh(mergedGeometry, material);
			scene.add(mesh);
			return mesh;
		}

		type FileInfo = {
			name: string;
			hueRange: [number, number];
			url?: string;
			file?: File;
			elem?: HTMLElement;
			root?: THREE.Mesh;
		};

		async function loadData(info: FileInfo) {
			const text = await loadFile(info.url as string);
			info.file = parseData(text);
		}

		async function loadAll() {
			const fileInfos: FileInfo[] = [
				{
					name: 'men',
					hueRange: [0.7, 0.3],
					url: '/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc'
				},
				{
					name: 'women',
					hueRange: [0.9, 1.1],
					url: '/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014ft_2010_cntm_1_deg.asc'
				}
			];

			await Promise.all(fileInfos.map(loadData));

			type MapFn = (
				value: number | undefined,
				rowNdx: number,
				colNdx: number
			) => number | undefined;
			function mapValues(data: Data, fn: MapFn) {
				return data.map((row, rowNdx) => {
					return row.map((value, colNdx) => {
						return fn(value, rowNdx, colNdx);
					});
				});
			}

			type CompareFn = (base: number | undefined, other: number | undefined) => number;
			function makeDiffFile(baseFile: File, otherFile: File, compareFn: CompareFn) {
				let min: number | undefined;
				let max: number | undefined;
				const baseData = baseFile.data;
				const otherData = otherFile.data;
				const data = mapValues(baseData, (base, rowNdx, colNdx) => {
					const other = otherData[rowNdx][colNdx];
					if (base === undefined || other === undefined) {
						return undefined;
					}
					const value = compareFn(base, other);
					min = Math.min(min === undefined ? value : min, value);
					max = Math.max(max === undefined ? value : max, value);
					return value;
				});
				if (min === undefined || max === undefined) throw new Error('max/min undefined');
				return { settings: { ...baseFile.settings }, min, max, data } satisfies File;
			}

			{
				const menInfo = fileInfos[0];
				const womenInfo = fileInfos[1];
				const menFile = menInfo.file as File;
				const womenFile = womenInfo.file as File;

				function amountGreaterThan(a: number, b: number) {
					return Math.max(a - b, 0);
				}
				fileInfos.push({
					name: '>50% men',
					hueRange: [0.6, 1.1],
					file: makeDiffFile(menFile, womenFile, (men, women) => {
						return amountGreaterThan(men as number, women as number);
					})
				});
				fileInfos.push({
					name: '>50% women',
					hueRange: [0.0, 0.4],
					file: makeDiffFile(womenFile, menFile, (women, men) => {
						return amountGreaterThan(women as number, men as number);
					})
				});
			}

			function showFileInfo(fileInfos: FileInfo[], fileInfo: FileInfo) {
				fileInfos.forEach((info) => {
					const visible = fileInfo === info;
					(info.root as THREE.Mesh).visible = visible;
					(info.elem as HTMLElement).className = visible ? 'selected' : '';
				});
				requestRenderIfNotRequested();
			}

			fileInfos.forEach((info) => {
				const boxes = addBoxes(info.file as File, info.hueRange);
				info.root = boxes;
				const div = document.createElement('div');
				info.elem = div;
				div.textContent = info.name;
				uiElem.appendChild(div);

				function show() {
					showFileInfo(fileInfos, info);
				}

				div.addEventListener('mouseover', show);
				div.addEventListener('touchstart', show);
			});
			showFileInfo(fileInfos, fileInfos[0]);
		}

		loadAll();

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
	}

	onMount(() => {
		main();
	});
</script>

<canvas bind:this={canvas} />
<div bind:this={uiElem} id="ui"></div>

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
		color: white;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	#ui {
		position: absolute;
		left: 1em;
		top: 1em;
	}

	#ui > :global(div) {
		font-size: 20pt;
		padding: 1em;
		display: inline-block;
	}

	#ui > :global(div.selected) {
		color: red;
	}

	@media (max-width: 700px) {
		#ui > :global(div) {
			display: block;
			padding: 0.25em;
		}
	}
</style>
