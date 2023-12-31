<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;

	function main() {
		const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

		const fov = 45;
		const aspect = 2;
		const near = 0.1;
		const far = 100;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(0, 10, 20);
		camera.lookAt(0, 0, 0);

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('white');

		const loader = new THREE.TextureLoader();

		{
			const planeSize = 40;

			const texture = loader.load('/checker.png');
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.magFilter = THREE.NearestFilter;
			texture.colorSpace = THREE.SRGBColorSpace;
			const repeats = planeSize / 2;
			texture.repeat.set(repeats, repeats);

			const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
			const planeMat = new THREE.MeshBasicMaterial({
				map: texture,
				side: THREE.DoubleSide
			});
			planeMat.color.setRGB(1.5, 1.5, 1.5);
			const mesh = new THREE.Mesh(planeGeo, planeMat);
			mesh.rotation.x = Math.PI * -0.5;
			scene.add(mesh);
		}

		const shadowTexture = loader.load('/roundshadow.png');

		type SphereShadowBase = {
			base: THREE.Object3D<THREE.Event>;
			sphereMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhongMaterial>;
			shadowMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
			y: number;
		};
		const sphereShadowBases: SphereShadowBase[] = [];
		{
			const sphereRadius = 1;
			const sphereWidthDivisions = 32;
			const sphereHeightDivisions = 16;
			const sphereGeo = new THREE.SphereGeometry(
				sphereRadius,
				sphereWidthDivisions,
				sphereHeightDivisions
			);

			const planeSize = 1;
			const shadowGeo = new THREE.PlaneGeometry(planeSize, planeSize);

			const numSpheres = 16;
			for (let i = 0; i < numSpheres; ++i) {
				const base = new THREE.Object3D();
				scene.add(base);

				const shadowMat = new THREE.MeshBasicMaterial({
					map: shadowTexture,
					transparent: true,
					depthWrite: false
				});
				const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
				shadowMesh.position.y = 0.001;
				shadowMesh.rotation.x = Math.PI * -0.5;
				const shadowSize = sphereRadius * 4;
				shadowMesh.scale.set(shadowSize, shadowSize, shadowSize);
				base.add(shadowMesh);

				const u = i / numSpheres;
				const sphereMat = new THREE.MeshPhongMaterial();
				sphereMat.color.setHSL(u, 1, 0.75);
				const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
				sphereMesh.position.set(0, sphereRadius + 2, 0);
				base.add(sphereMesh);

				sphereShadowBases.push({ base, sphereMesh, shadowMesh, y: sphereMesh.position.y });
			}
		}

		{
			const skyColor = 0xb1e1ff;
			const groundColor = 0xb97a20;
			const intensity = 0.75;
			const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
			scene.add(light);
		}

		{
			const color = 0xffffff;
			const intensity = 2.5;
			const light = new THREE.DirectionalLight(color, intensity);
			light.position.set(0, 10, 5);
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

			sphereShadowBases.forEach((sphereShadowBase, ndx) => {
				const { base, sphereMesh, shadowMesh, y } = sphereShadowBase;

				const u = ndx / sphereShadowBases.length;

				const speed = time * 0.2;
				const angle = speed + u * Math.PI * 2 * (ndx % 1 ? 1 : -1);
				const radius = Math.sin(speed - ndx) * 10;
				base.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

				const yOff = Math.abs(Math.sin(time * 2 + ndx));
				sphereMesh.position.y = y + THREE.MathUtils.lerp(-2, 2, yOff);
				shadowMesh.material.opacity = THREE.MathUtils.lerp(1, 0.25, yOff);
			});

			renderer.render(scene, camera);

			requestAnimationFrame(render);
		});
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
