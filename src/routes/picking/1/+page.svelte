<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const fov = 60;
		const aspect = 2;
		const near = 0.1;
		const far = 200;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 30;

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('white');

		const cameraPole = new THREE.Object3D();
		scene.add(cameraPole);
		cameraPole.add(camera);

		{
			const color = 0xffffff;
			const intensity = 3;
			const light = new THREE.DirectionalLight(color, intensity);
			light.position.set(-1, 2, 4);
			camera.add(light);
		}

		const boxWidth = 1;
		const boxHeight = 1;
		const boxDepth = 1;
		const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

		function rand(min: number, max?: number) {
			if (max === undefined) {
				max = min;
				min = 0;
			}
			return min + (max - min) * Math.random();
		}

		function randomColor() {
			return `hsl(${rand(360) | 0}, ${rand(50, 100) | 0}%, 50%)`;
		}

		const numObjects = 100;
		for (let i = 0; i < numObjects; ++i) {
			const material = new THREE.MeshPhongMaterial({ color: randomColor() });
			const cube = new THREE.Mesh(geometry, material);
			scene.add(cube);

			cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
			cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
			cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));
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

		class PickHelper {
			raycaster = new THREE.Raycaster();
			pickedObject: THREE.Object3D | null = null;
			pickedObjectSavedColor = 0;

			pick(
				normalizedPosition: THREE.Vector2,
				scene: THREE.Scene,
				camera: THREE.Camera,
				time: number
			) {
				if (this.pickedObject) {
					this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
					this.pickedObject = null;
				}

				this.raycaster.setFromCamera(normalizedPosition, camera);
				const intersectedObjects = this.raycaster.intersectObjects(scene.children);
				if (intersectedObjects.length) {
					this.pickedObject = intersectedObjects[0].object;
					this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
					this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xffff00 : 0xff0000);
				}
			}
		}

		const pickPosition = { x: 0, y: 0 };
		const pickHelper = new PickHelper();
		clearPickPosition();

		requestAnimationFrame(function render(time) {
			time *= 0.001;

			if (resizeRendererToDisplaySize(renderer)) {
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			cameraPole.rotation.y = time * 0.1;

			pickHelper.pick(pickPosition as THREE.Vector2, scene, camera, time);

			renderer.render(scene, camera);

			requestAnimationFrame(render);
		});

		function getCanvasRelativePosition(event: MouseEvent) {
			const rect = canvas.getBoundingClientRect();
			return {
				x: ((event.clientX - rect.left) * canvas.width) / rect.width,
				y: ((event.clientY - rect.top) * canvas.height) / rect.height
			};
		}

		function setPickPosition(event) {
			const pos = getCanvasRelativePosition(event);
			pickPosition.x = (pos.x / canvas.width) * 2 - 1;
			pickPosition.y = (pos.y / canvas.height) * -2 + 1;
		}

		function clearPickPosition() {
			pickPosition.x = -100000;
			pickPosition.y = -100000;
		}

		window.addEventListener('mousemove', setPickPosition);
		window.addEventListener('mouseout', clearPickPosition);
		window.addEventListener('mouseleave', clearPickPosition);

		window.addEventListener(
			'touchstart',
			(event) => {
				event.preventDefault();
				setPickPosition(event.touches[0]);
			},
			{ passive: false }
		);

		window.addEventListener('touchmove', (event) => {
			setPickPosition(event.touches[0]);
		});

		window.addEventListener('touchend', clearPickPosition);
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
