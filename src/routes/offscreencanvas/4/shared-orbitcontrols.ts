import * as THREE from 'three';
// import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';

type MainData = {
	canvas: HTMLCanvasElement | OffscreenCanvas;
	inputElement: HTMLElement;
};

export function init(data: MainData) {
	const { canvas, inputElement } = data;
	const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

	const fov = 75;
	const aspect = 2;
	const near = 0.1;
	const far = 100;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.z = 4;

	const controls = new OrbitControls(camera, inputElement);
	controls.target.set(0, 0, 0);
	controls.update();

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

	const pickPosition = { x: 0, y: 0 };
	const pickHelper = new PickHelper();
	clearPickPosition();

	function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
		const canvas = renderer.domElement;
		const width = inputElement.clientWidth;
		const height = inputElement.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if (needResize) {
			renderer.setSize(width, height, false);
		}
		return needResize;
	}

	requestAnimationFrame(function render(time) {
		time *= 0.001;

		if (resizeRendererToDisplaySize(renderer)) {
			camera.aspect = inputElement.clientWidth / inputElement.clientHeight;
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

	type Interaction = { clientX: number; clientY: number };

	function getCanvasRelativePosition(event: Interaction) {
		const rect = inputElement.getBoundingClientRect();
		return {
			x: ((event.clientX - rect.left) * canvas.width) / rect.width,
			y: ((event.clientY - rect.top) * canvas.height) / rect.height
		};
	}

	function setPickPosition(event: Interaction) {
		const pos = getCanvasRelativePosition(event);
		pickPosition.x = (pos.x / inputElement.clientWidth) * 2 - 1;
		pickPosition.y = (pos.y / inputElement.clientHeight) * -2 + 1;
	}

	function clearPickPosition() {
		// unlike the mouse which always has a position
		// if the user stops touching the screen we want
		// to stop picking. For now we just pick a value
		// unlikely to pick something
		pickPosition.x = -100000;
		pickPosition.y = -100000;
	}

	inputElement.addEventListener('mousemove', setPickPosition);
	inputElement.addEventListener('mouseout', clearPickPosition);
	inputElement.addEventListener('mouseleave', clearPickPosition);

	inputElement.addEventListener(
		'touchstart',
		(event) => {
			event.preventDefault();
			setPickPosition(event.touches[0]);
		},
		{ passive: false }
	);

	inputElement.addEventListener('touchmove', (event) => {
		setPickPosition(event.touches[0]);
	});

	inputElement.addEventListener('touchend', clearPickPosition);
}
