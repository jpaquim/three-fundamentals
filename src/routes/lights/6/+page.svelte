<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import type { default as TGUI } from 'lil-gui';

	let canvas: HTMLCanvasElement;
	let GUI: typeof TGUI;

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const fov = 45;
		const aspect = 2;
		const near = 0.1;
		const far = 100;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(0, 10, 20);

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

		class ColorGUIHelper {
			constructor(
				public object: any,
				public prop: string
			) {}
			// ...
			get value() {
				return `#${this.object[this.prop].getHexString()}`;
			}
			set value(hexString) {
				this.object[this.prop].set(hexString);
			}
		}

		class DegRadHelper {
			constructor(
				public obj: any,
				public prop: string
			) {}
			get value() {
				return THREE.MathUtils.radToDeg(this.obj[this.prop]);
			}
			set value(v) {
				this.obj[this.prop] = THREE.MathUtils.degToRad(v);
			}
		}

		function makeXYZGUI(gui: TGUI, vector3: THREE.Vector3, name: string, onChangeFn: Function) {
			const folder = gui.addFolder(name);
			folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
			folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
			folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
			folder.open();
		}

		{
			const color = 0xffffff;
			const intensity = 150;
			const light = new THREE.SpotLight(color, intensity);
			light.position.set(0, 10, 0);
			light.target.position.set(-5, 0, 0);
			scene.add(light);
			scene.add(light.target);

			const helper = new THREE.SpotLightHelper(light);
			scene.add(helper);

			function updateLight() {
				light.target.updateMatrixWorld();
				helper.update();
			}

			updateLight();

			const gui = new GUI();
			gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
			gui.add(light, 'intensity', 0, 250, 1);
			gui.add(light, 'distance', 0, 40).onChange(updateLight);
			gui.add(new DegRadHelper(light, 'angle'), 'value', 0, 90).name('angle').onChange(updateLight);
			gui.add(light, 'penumbra', 0, 1, 0.01);

			makeXYZGUI(gui, light.position, 'position', updateLight);
			makeXYZGUI(gui, light.target.position, 'target', updateLight);
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
