<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const fov = 75;
		const aspect = 2;
		const near = 0.1;
		const far = 5;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 2;

		const scene = new THREE.Scene();

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
	function onClick() {
		canvas.toBlob((blob) => {
			saveBlob(blob as Blob, `screencapture-${canvas.width}x${canvas.height}.png`);
		});
	}

	let a: HTMLAnchorElement;
	function saveBlob(blob: Blob, fileName: string) {
		a ??= (() => {
			const el = document.createElement('a');
			document.body.appendChild(el);
			el.style.display = 'none';
			return el;
		})();

		const url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = fileName;
		a.click();
	}

	onMount(() => {
		main();
	});
</script>

<canvas bind:this={canvas} />
<button id="screenshot" type="button" on:click={onClick}>Save...</button>

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

	#screenshot {
		position: absolute;
		left: 10px;
		top: 10px;
		padding: 10px;
		background: rgba(0, 0, 0, 0.9);
		color: white;
		border: 1px solid gray;
		cursor: pointer;
	}

	#screenshot:hover {
		background: #444;
	}

	#screenshot:focus {
		outline: none;
	}
</style>
