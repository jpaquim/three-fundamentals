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
		const pickingScene = new THREE.Scene();
		pickingScene.background = new THREE.Color(0);

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

		const loader = new THREE.TextureLoader();
		const texture = loader.load('/frame.png');

		const idToObject: Record<number, THREE.Object3D> = {};
		const numObjects = 100;
		for (let i = 0; i < numObjects; ++i) {
			const id = i + 1;
			const material = new THREE.MeshPhongMaterial({
				color: randomColor(),
				map: texture,
				transparent: true,
				side: THREE.DoubleSide,
				alphaTest: 0.1
			});
			const cube = new THREE.Mesh(geometry, material);
			scene.add(cube);
			idToObject[id] = cube;

			cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
			cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
			cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));

			const pickingMaterial = new THREE.MeshPhongMaterial({
				emissive: new THREE.Color(id),
				color: new THREE.Color(0, 0, 0),
				specular: new THREE.Color(0, 0, 0),
				map: texture,
				transparent: true,
				side: THREE.DoubleSide,
				alphaTest: 0.5,
				blending: THREE.NoBlending
			});
			const pickingCube = new THREE.Mesh(geometry, pickingMaterial);
			pickingScene.add(pickingCube);
			pickingCube.position.copy(cube.position);
			pickingCube.rotation.copy(cube.rotation);
			pickingCube.scale.copy(cube.scale);
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

		class GPUPickHelper {
			pickingTexture = new THREE.WebGLRenderTarget(1, 1);
			pixelBuffer = new Uint8Array(4);
			pickedObject: THREE.Object3D | null = null;
			pickedObjectSavedColor = 0;

			pick(
				cssPosition: THREE.Vector2,
				scene: THREE.Scene,
				camera: THREE.PerspectiveCamera,
				time: number
			) {
				const { pickingTexture, pixelBuffer } = this;

				if (this.pickedObject) {
					this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
					this.pickedObject = null;
				}

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

				const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];

				const intersectedObject = idToObject[id];
				if (intersectedObject) {
					this.pickedObject = intersectedObject;
					this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
					this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xffff00 : 0xff0000);
				}
			}
		}

		const pickPosition = { x: 0, y: 0 };
		const pickHelper = new GPUPickHelper();
		clearPickPosition();

		requestAnimationFrame(function render(time) {
			time *= 0.001;

			if (resizeRendererToDisplaySize(renderer)) {
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			cameraPole.rotation.y = time * 0.1;

			pickHelper.pick(pickPosition as THREE.Vector2, pickingScene, camera, time);

			renderer.render(scene, camera);

			requestAnimationFrame(render);
		});

		type Interaction = { clientX: number; clientY: number };

		function getCanvasRelativePosition(event: Interaction) {
			const rect = canvas.getBoundingClientRect();
			return {
				x: ((event.clientX - rect.left) * canvas.width) / rect.width,
				y: ((event.clientY - rect.top) * canvas.height) / rect.height
			};
		}

		function setPickPosition(event: Interaction) {
			const pos = getCanvasRelativePosition(event);
			pickPosition.x = pos.x;
			pickPosition.y = pos.y;
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
