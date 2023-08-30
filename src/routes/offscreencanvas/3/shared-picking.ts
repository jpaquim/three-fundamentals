import * as THREE from 'three';
// import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';

export const state = {
	width: 300,
	height: 150
};

export const pickPosition = { x: 0, y: 0 };

type MainData = {
	canvas: HTMLCanvasElement | OffscreenCanvas;
};

export function init(data: MainData) {
	const { canvas } = data;
	const renderer = new THREE.WebGLRenderer({ canvas });

	state.width = canvas.width;
	state.height = canvas.height;

	const fov = 75;
	const aspect = 2;
	const near = 0.1;
	const far = 100;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.z = 4;

	const scene = new THREE.Scene();

	{
		const color = 0xffffff;
		const intensity = 1;
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

	const pickHelper = new PickHelper();

	function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
		const canvas = renderer.domElement;
		const width = state.width;
		const height = state.height;
		const needResize = canvas.width !== width || canvas.height !== height;
		if (needResize) {
			renderer.setSize(width, height, false);
		}
		return needResize;
	}

	requestAnimationFrame(function render(time) {
		time *= 0.001;

		if (resizeRendererToDisplaySize(renderer)) {
			camera.aspect = state.width / state.height;
			camera.updateProjectionMatrix();
		}

		cubes.forEach((cube, ndx) => {
			const speed = 1 + ndx * 0.1;
			const rot = time * speed;
			cube.rotation.x = rot;
			cube.rotation.y = rot;
		});

		pickHelper.pick(pickPosition as THREE.Vector2, scene, camera, time);

		renderer.render(scene, camera);

		requestAnimationFrame(render);
	});
}
