import { init, state } from './shared-cube';

type SizeData = {
	width: number;
	height: number;
};

function size(data: SizeData) {
	state.width = data.width;
	state.height = data.height;
}

const handlers = {
	init,
	size
};

self.onmessage = function (e) {
	const fn = handlers[e.data.type as keyof typeof handlers];
	if (typeof fn !== 'function') {
		throw new Error(`no handler for type: ${e.data.type}`);
	}

	fn(e.data);
};
