import { init, pickPosition, state } from './shared-picking';

type SizeData = {
	width: number;
	height: number;
};

function size(data: SizeData) {
	state.width = data.width;
	state.height = data.height;
}

type MouseData = {
	x: number;
	y: number;
};
function mouse(data: MouseData) {
	pickPosition.x = data.x;
	pickPosition.y = data.y;
}

const handlers = {
	init,
	mouse,
	size
};

self.onmessage = function (e) {
	const fn = handlers[e.data.type as keyof typeof handlers];
	if (typeof fn !== 'function') {
		throw new Error(`no handler for type: ${e.data.type}`);
	}

	fn(e.data);
};
