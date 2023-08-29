<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	let canvas: HTMLCanvasElement;
	let view1Elem: HTMLDivElement;
	let view2Elem: HTMLDivElement;
	let GUI: (typeof import('lil-gui'))['default'];

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const left = -1;
		const right = 1;
		const top = 1;
		const bottom = -1;
		const near = 5;
		const far = 50;
		const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		camera.zoom = 0.2;
		camera.position.set(0, 10, 20);

		const cameraHelper = new THREE.CameraHelper(camera);

		class MinMaxGUIHelper {
			constructor(
				public obj: any,
				public minProp: string,
				public maxProp: string,
				public minDif: number
			) {}
			get min() {
				return this.obj[this.minProp];
			}
			set min(v: number) {
				this.obj[this.minProp] = v;
				this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
			}
			get max() {
				return this.obj[this.maxProp];
			}
			set max(v: number) {
				this.obj[this.maxProp] = v;
				this.min = this.min;
			}
		}

		const gui = new GUI();
		gui.add(camera, 'zoom', 0.01, 1, 0.01).listen();
		const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
		gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near');
		gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far');

		const controls = new OrbitControls(camera, view1Elem);
		controls.target.set(0, 5, 0);
		controls.update();

		const camera2 = new THREE.PerspectiveCamera(60, 2, 0.1, 500);
		camera2.position.set(16, 28, 40);
		camera2.lookAt(0, 5, 0);

		const controls2 = new OrbitControls(camera2, view2Elem);
		controls2.target.set(0, 5, 0);
		controls2.update();

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('black');
		scene.add(cameraHelper);

		{
			const planeSize = 40;

			const loader = new THREE.TextureLoader();
			const texture = loader.load('/checker.png');
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.magFilter = THREE.NearestFilter;
			texture.colorSpace = THREE.SRGBColorSpace;
			const repeats = planeSize / 2;
			texture.repeat.set(repeats, repeats);

			const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
			const planeMat = new THREE.MeshPhongMaterial({
				map: texture,
				side: THREE.DoubleSide
			});
			const mesh = new THREE.Mesh(planeGeo, planeMat);
			mesh.rotation.x = Math.PI * -0.5;
			scene.add(mesh);
		}

		{
			const cubeSize = 4;
			const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
			const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
			const mesh = new THREE.Mesh(cubeGeo, cubeMat);
			mesh.position.set(cubeSize + 1, cubeSize / 2, 0);
			scene.add(mesh);
		}
		{
			const sphereRadius = 3;
			const sphereWidthDivisions = 32;
			const sphereHeightDivisions = 16;
			const sphereGeo = new THREE.SphereGeometry(
				sphereRadius,
				sphereWidthDivisions,
				sphereHeightDivisions
			);
			const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });
			const mesh = new THREE.Mesh(sphereGeo, sphereMat);
			mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
			scene.add(mesh);
		}

		{
			const color = 0xffffff;
			const intensity = 3;
			const light = new THREE.DirectionalLight(color, intensity);
			light.position.set(0, 10, 0);
			light.target.position.set(-5, 0, 0);
			scene.add(light);
			scene.add(light.target);
		}

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

		function setScissorForElement(elem: HTMLElement) {
			const canvasRect = canvas.getBoundingClientRect();
			const elemRect = elem.getBoundingClientRect();

			const right = Math.min(elemRect.right, canvasRect.right) - canvasRect.left;
			const left = Math.max(0, elemRect.left - canvasRect.left);
			const bottom = Math.min(elemRect.bottom, canvasRect.bottom) - canvasRect.top;
			const top = Math.max(0, elemRect.top - canvasRect.top);

			const width = Math.min(canvasRect.width, right - left);
			const height = Math.min(canvasRect.height, bottom - top);

			const positiveYUpBottom = canvasRect.height - bottom;
			renderer.setScissor(left, positiveYUpBottom, width, height);
			renderer.setViewport(left, positiveYUpBottom, width, height);

			return width / height;
		}

		requestAnimationFrame(function render(time) {
			time *= 0.001;

			resizeRendererToDisplaySize(renderer);

			renderer.setScissorTest(true);

			{
				const aspect = setScissorForElement(view1Elem);

				camera.left = -aspect;
				camera.right = aspect;
				camera.updateProjectionMatrix();
				cameraHelper.update();

				cameraHelper.visible = false;
				(scene.background as THREE.Color).set(0x000000);

				renderer.render(scene, camera);
			}

			{
				const aspect = setScissorForElement(view2Elem);

				camera2.aspect = aspect;
				camera2.updateProjectionMatrix();

				cameraHelper.visible = true;
				(scene.background as THREE.Color).set(0x000040);

				renderer.render(scene, camera2);
			}

			requestAnimationFrame(render);
		});
	}

	onMount(async () => {
		GUI = (await import('lil-gui')).default;
		main();
	});
</script>

<canvas bind:this={canvas} />
<div class="split">
	<div bind:this={view1Elem} tabindex="1"></div>
	<div bind:this={view2Elem} tabindex="2"></div>
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

	.split {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		display: flex;
	}

	.split > div {
		width: 100%;
		height: 100%;
	}
</style>
