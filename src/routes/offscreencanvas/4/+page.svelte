<script lang="ts">
	import { onMount } from 'svelte';
	import { init } from './shared-orbitcontrols';

	let canvas: HTMLCanvasElement;

	const mouseEventHandler = makeSendPropertiesHandler([
		'ctrlKey',
		'metaKey',
		'shiftKey',
		'button',
		'pointerType',
		'clientX',
		'clientY',
		'pageX',
		'pageY'
	]);
	const wheelEventHandlerImpl = makeSendPropertiesHandler(['deltaX', 'deltaY']);
	const keydownEventHandler = makeSendPropertiesHandler([
		'ctrlKey',
		'metaKey',
		'shiftKey',
		'keyCode'
	]);

	function wheelEventHandler(event: WheelEvent, sendFn: Function) {
		event.preventDefault();
		wheelEventHandlerImpl(event, sendFn);
	}

	function preventDefaultHandler(event: Event) {
		event.preventDefault();
	}

	function copyProperties(
		src: Record<string, any>,
		properties: string[],
		dst: Record<string, any>
	) {
		for (const name of properties) {
			dst[name] = src[name];
		}
	}

	function makeSendPropertiesHandler(properties: string[]) {
		return function sendProperties(event: Event, sendFn: Function) {
			const data = { type: event.type };
			copyProperties(event, properties, data);
			sendFn(data);
		};
	}

	function touchEventHandler(event: TouchEvent, sendFn: Function) {
		const touches: { pageX: number; pageY: number }[] = [];
		const data = { type: event.type, touches };
		for (let i = 0; i < event.touches.length; ++i) {
			const touch = event.touches[i];
			touches.push({
				pageX: touch.pageX,
				pageY: touch.pageY
			});
		}

		sendFn(data);
	}

	const orbitKeys: Record<string, boolean> = {
		'37': true,
		'38': true,
		'39': true,
		'40': true
	};
	function filteredKeydownEventHandler(event: KeyboardEvent, sendFn: Function) {
		const { keyCode } = event;
		if (orbitKeys[keyCode]) {
			event.preventDefault();
			keydownEventHandler(event, sendFn);
		}
	}

	let nextProxyId = 0;
	class ElementProxy {
		id: number;
		constructor(
			element: HTMLElement,
			public worker: Worker,
			eventHandlers: Record<string, Function>
		) {
			this.id = nextProxyId++;
			const sendEvent = (data) => {
				this.worker.postMessage({
					type: 'event',
					id: this.id,
					data
				});
			};

			worker.postMessage({
				type: 'makeProxy',
				id: this.id
			});
			sendSize();
			for (const [eventName, handler] of Object.entries(eventHandlers)) {
				element.addEventListener(eventName, function (event) {
					handler(event, sendEvent);
				});
			}

			function sendSize() {
				const rect = element.getBoundingClientRect();
				sendEvent({
					type: 'size',
					left: rect.left,
					top: rect.top,
					width: element.clientWidth,
					height: element.clientHeight
				});
			}

			window.addEventListener('resize', sendSize);
		}
	}

	function startWorker(canvas: HTMLCanvasElement) {
		const offscreen = canvas.transferControlToOffscreen();
		const worker = new Worker(
			new URL('./offscreencanvas-worker-orbitcontrols.ts', import.meta.url),
			{
				type: 'module'
			}
		);
		const eventHandlers = {
			contextmenu: preventDefaultHandler,
			mousedown: mouseEventHandler,
			mousemove: mouseEventHandler,
			mouseup: mouseEventHandler,
			pointerdown: mouseEventHandler,
			pointermove: mouseEventHandler,
			pointerup: mouseEventHandler,
			touchstart: touchEventHandler,
			touchmove: touchEventHandler,
			touchend: touchEventHandler,
			wheel: wheelEventHandler,
			keydown: filteredKeydownEventHandler
		};
		const proxy = new ElementProxy(canvas, worker, eventHandlers);
		worker.postMessage(
			{
				type: 'start',
				canvas: offscreen,
				canvasId: proxy.id
			},
			[offscreen]
		);
		console.log('using OffscreenCanvas');
	}

	function startMainPage(canvas: HTMLCanvasElement) {
		init({ canvas, inputElement: canvas });
		console.log('using regular canvas');
	}

	function main() {
		if (canvas.transferControlToOffscreen) {
			startWorker(canvas);
		} else {
			startMainPage(canvas);
		}
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
