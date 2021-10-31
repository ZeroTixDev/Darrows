function getDelta(last) {
	return Math.min(((window.performance.now() - last) / (1 / lerpRate)) / 1000, 1);
}

function getScale() {
	return Math.min(window.innerWidth / width, window.innerHeight / height);
}

function sendInput() {
	send({ input: true, data: input });
}

function sameInput(input1, input2) {
	for (const key of Object.keys(input1)) {
		if (input1[key] !== input2[key]) return false
	}
	return true;
}

function send(obj) {
	if (window.stutter) return;

	const pack = msgpack.encode(obj);
	uploadByteCount += pack.byteLength;

	extraLag > 0 ? setTimeout(() => {
		ws.send(pack);
	}): ws.send(pack);
}


function resize(elements) {
	for (const element of elements) {
		if (element.width !== width) {
			element.width = width;
			element.style.width = `${width}px`;
		}
		if (element.height !== height) {
			element.height = height;
			element.style.height = `${height}px`;
		}
		element.style.transform = `scale(${
			Math.min(window.innerWidth / width, window.innerHeight / height)
			})`;
		element.style.left = `${(window.innerWidth - width) / 2}px`;
		element.style.top = `${(window.innerHeight - height) / 2}px`;
	}
	return Math.min(window.innerWidth / width, window.innerHeight / height);

}

function fpsTick(timestamp) {
    while (times.length > 0 && times[0] <= timestamp - 1000) {
        times.shift();
    }
    times.push(timestamp);
    fps = times.length;
}

function lerp(start, end, dt) {
	return (1 - dt) * start + dt * end;
}

function offset(x, y) {
	return {
		x: x - (camera.x) + canvas.width / 2 + xoff,
		y: y - (camera.y) + canvas.height / 2 + yoff,
	};
}

function dist(pos1, pos2) {
	return Math.sqrt((pos2.x - pos1.x) * (pos2.x - pos1.x) + (pos2.y - pos1.y) * (pos2.y - pos1.y))
}

function highest(arr) {
	let h = -Infinity;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] > h) {
			h = arr[i]
		}
	}
	return h;
}

function lowest(arr) {
	let h = Infinity;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] < h) {
			h = arr[i]
		}
	}
	return h;
}