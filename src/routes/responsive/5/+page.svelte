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

	onMount(() => {
		// This code is only related to handling the split.
		// Our three.js code has not changed
		window.Split(['#view', '#controls'], {
			sizes: [75, 25],
			minSize: 100,
			elementStyle: (dimension: any, size: any, gutterSize: any) => {
				return {
					'flex-basis': `calc(${size}% - ${gutterSize}px)`
				};
			},
			gutterStyle: (dimension: any, gutterSize: any) => {
				return {
					'flex-basis': `${gutterSize}px`
				};
			}
		});

		main();
	});
</script>

<svelte:head>
	<script src="/split.min.js"></script>
</svelte:head>

<div id="editor">
	<div id="view"><canvas bind:this={canvas} /></div>
	<div id="controls">
		<div>
			<p>various controls would appear here</p>
			<div>Drag this bar</div>
			<div>⇐</div>
		</div>
	</div>
</div>

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		font-size: 16pt;
	}

	#editor {
		display: flex;
		width: 100%;
		height: 100%;
	}

	#controls {
		background: #aaa;
		padding: 5px;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	:global(.gutter) {
		background-color: #eee;
		background-repeat: no-repeat;
		background-position: 50%;
	}

	:global(.gutter.gutter-horizontal) {
		cursor: ew-resize;
		background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
	}
</style>
