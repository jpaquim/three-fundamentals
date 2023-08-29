<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;
	let GUI: (typeof import('lil-gui'))['default'];

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
		const gui = new GUI();

		const fov = 75;
		const aspect = 2;
		const near = 0.1;
		const far = 5;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 2;

		const scene = new THREE.Scene();

		class FogGUIHelper {
			constructor(
				public fog: THREE.Fog,
				public backgroundColor: THREE.Color
			) {}
			get near() {
				return this.fog.near;
			}
			set near(v: number) {
				this.fog.near = v;
				this.fog.far = Math.max(this.fog.far, v);
			}
			get far() {
				return this.fog.far;
			}
			set far(v: number) {
				this.fog.far = v;
				this.fog.near = Math.min(this.fog.near, v);
			}
			get color() {
				return `#${this.fog.color.getHexString()}`;
			}
			set color(hexString: string) {
				this.fog.color.set(hexString);
				this.backgroundColor.set(hexString);
			}
		}

		{
			const near = 1;
			const far = 2;
			const color = 'lightblue';
			scene.fog = new THREE.Fog(color, near, far);
			scene.background = new THREE.Color(color);

			const fogGUIHelper = new FogGUIHelper(scene.fog as THREE.Fog, scene.background);
			gui.add(fogGUIHelper, 'near', near, far).listen();
			gui.add(fogGUIHelper, 'far', near, far).listen();
			gui.addColor(fogGUIHelper, 'color');
		}

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
			x: number
		): THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial> {
			const material = new THREE.MeshPhongMaterial({ color });

			const cube = new THREE.Mesh(geometry, material);
			scene.add(cube);

			cube.position.x = x;
			return cube;
		}

		const cubes = [
			makeInstance(geometry, 0x44aa88, 0),
			makeInstance(geometry, 0x8844aa, -2),
			makeInstance(geometry, 0xaa8844, 2)
		];

		function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
			const width = canvas.clientWidth;
			const height = canvas.clientWidth;
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

			cubes.forEach((cube, ndx) => {
				const speed = 1 + ndx * 0.1;
				const rot = time * speed;
				cube.rotation.x = rot;
				cube.rotation.y = rot;
			});

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
