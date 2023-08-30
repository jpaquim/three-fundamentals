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
		main();
	});
</script>

<iframe id="background" src="/responsive/3"></iframe>

<div id="content">
	<h1>Beautiful Cubes</h1>
	<p>
		<b>Cubes are beautiful</b>. You can have an entire planet of them, for instance.
	</p>
	<p>
		How cool is that? (A bit confusing, honestly. I have always felt as though cubes had a tendency
		to be a little too cool and overly realistic. Like an endless collection of super-realistic
		robots… But I guess it is part of what makes them so interesting.)
	</p>
	<p>So maybe there's a limit to what the human imagination can do for me.</p>
	<p>That can't hurt.</p>
	<p>Well then… let's break it down.</p>
	<p>Stardust</p>
	<p>
		I know a lot of you are saying: You can't, because you will get stuck with something that's "too
		realistic." Well, I have a very real suggestion: Just don't be that dude. In fact, let's be very
		specific: If you have to do something, let the actual thing change. If it's a little weird to
		have a space ship, or a spaceship you have to fly, or … well, you probably already are.
	</p>
	<p>Forget about all of the sci-fi stuff. Space. No sense hiding that from me.</p>
	<p>
		The space in my own home was never real-world. It was never something that a person might have
		done. It was something that only seemed plausible to me. There was only one "space craft," and
		if you could figure
	</p>
	<p>
		<b>Cubes are beautiful</b>. Don't underestimate a nice stack of cubes.
	</p>
	<p>
		If you decide to stack more than one cube, don't forget to use a stack of cubes as a guide to
		follow to make a tight fit. If a bunch of cubes are stacked too close together, the edges will
		stick out which will make for a tight fit!
	</p>
	<p>
		Once again, if you decide you don't want to stack your boxes you can place another stack of
		cubes along the edge.
	</p>
	<p>And you are done! The process is super simple and simple it's the easy stuff to set up.</p>
	<p>But what if you don't like the size of the boxes?</p>
	<p>
		You see, in the old days, a box was a solid block of wood, plastic or ceramic with an outer
		layer of cardboard.
	</p>
	<p>
		In the 1990s, wood became the new material and in this method, the cardboard and wood are joined
		together so that they can both become a floor.
	</p>
	<p>
		But some people don't like to use just the plastic/carpet layer. And with those people, these
		cubes are more likely to get wet.
	</p>
	<p>So how does this stack?</p>
	<p>
		From: <a href="https://talktotransformer.com/">Talk to Transformer</a>
	</p>
</div>

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		color: white;
		font-size: 20pt;
	}

	h1 {
		font-family: sans-serif;
	}

	#background {
		width: 100%;
		height: 100%;
		display: block;
		position: fixed;
		left: 0;
		top: 0;
		z-index: -1;
		pointer-events: none;
		border: none;
	}

	#content {
		padding: 1em;
	}

	#content > * {
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
	}

	a {
		color: lightblue;
	}

	a:visited {
		color: lightcoral;
	}

	a:hover {
		color: magenta;
	}
</style>
