<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	let canvas: HTMLCanvasElement;
	let GUI: (typeof import('lil-gui'))['default'];

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const fov = 45;
		const aspect = 2;
		const near = 0.00001;
		const far = 100;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(10, 6, 10);

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
		gui.add(camera, 'fov', 1, 180);
		const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
		gui.add(minMaxGUIHelper, 'min', 0.00001, 50, 0.00001).name('near');
		gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far');

		const controls = new OrbitControls(camera, canvas);
		controls.target.set(0, 5, 0);
		controls.update();

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('black');

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
			const sphereRadius = 3;
			const sphereWidthDivisions = 32;
			const sphereHeightDivisions = 16;
			const sphereGeo = new THREE.SphereGeometry(
				sphereRadius,
				sphereWidthDivisions,
				sphereHeightDivisions
			);
			const numSpheres = 20;
			for (let i = 0; i < numSpheres; ++i) {
				const sphereMat = new THREE.MeshPhongMaterial();
				sphereMat.color.setHSL(i * 0.73, 1, 0.5);
				const mesh = new THREE.Mesh(sphereGeo, sphereMat);
				mesh.position.set(-sphereRadius - 1, sphereRadius + 2, i * sphereRadius * -2.2);
				scene.add(mesh);
			}
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

		requestAnimationFrame(function render(time) {
			time *= 0.001;

			if (resizeRendererToDisplaySize(renderer)) {
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			renderer.render(scene, camera);

			requestAnimationFrame(render);
		});
	}

	onMount(async () => {
		GUI = (await import('lil-gui')).default;
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
