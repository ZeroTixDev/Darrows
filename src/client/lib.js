window.delta = 0;
window.debug = false;
window._interpolate = true;
window._predict = false;
window.serverTickMs = 0;
window.stutter = false;
window.redness = 0;
window.showSnapshots = false;
window.mouse = { x: 0, y: 0 };
window.lerpRate = 30;
window.extraLag = 0;
window.inputsBuffered = 0;
window.fric = -1;
window.speed = -1;

let iExist = false;
let chatOpen = false;
let dead = false;
let killedPlayerName = '';
let killedNotifTime = 0;
let _kills = 0;
let lastTime = window.performance.now()
let xoff = 0;
let yoff = 0;
let shotPlayers = {}
let selfId;
let arena;
let spacing = 0;
let spacings = [];
let spacingLength = 120;
let lastReceivedStateTime;
let stateMessageDisplay = 0;
let stateMessageCount = 0;
let inputMessageDisplay = 0;
let inputMessageCount = 0;
let byteCount = 0;
let byteDisplay = 0;
let uploadByteCount = 0;
let uploadByteDisplay = 0;
let ping = 0;
let angle = 0;
let serverSpacing = Array(3).fill(0)
let messages = [];
let leader = null;

/* state */

const players = {};
const arrows = {}
let obstacles = []

/* state */

const input = createInput();
const gui = ref.gui
const canvas = ref.canvas
const ctx = canvas.getContext('2d')
const width = 1600;
const height = 900;
const updateRate = 60;
const camera = { x: null, y: null }
const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
ws.binaryType = 'arraybuffer'

canvas.width = width;
canvas.height = height;
resize([canvas, gui])

const inputs = ["KeyW", "KeyA", "KeyS", "KeyD"];
const inputCodes = {
	[inputs[0]]: { key: "up" },
	[inputs[1]]: { key: "left" },
	[inputs[2]]: { key: "down" },
	[inputs[3]]: { key: "right" },
	Space: { key: 'space' }
}


//func

function getDelta(last) {
	return Math.min(((window.performance.now() - last) / (1/lerpRate)) / 1000, 1);
}

function getScale() {
	return Math.min(window.innerWidth / width, window.innerHeight / height);
}

function sendInput() {
	send({ input: true, data: input });
}

function sameInput(input1, input2) {
	for (const key of Object.keys(input1)) {
		if (input1[key] !== input2[key]) {
			return false;
		}
	}
	return true;
}

function send(obj) {
	if (window.stutter) return;
	if (extraLag > 0) {
		setTimeout(() => {
			const pack = msgpack.encode(obj);
			uploadByteCount += pack.byteLength;
			ws.send(pack)
		}, extraLag)
	} else {
		const pack = msgpack.encode(obj);
		uploadByteCount += pack.byteLength;
		ws.send(pack)
	}
}


function trackKeys(event) {
	if (event.repeat) return;
	if (event.code === 'Space' && event.type === 'keydown' && iExist && dead) {
		send({ type: 'spawn' })
		ref.deathScreen.classList.add('hidden')
		ref.deathScreen.classList.remove('dAnim')
		return;
	}
	if (event.code === 'Enter') {
		if (chatOpen) {
			if (event.type === 'keydown') {
				ref.chatDiv.classList.add('hidden')
				send({ chat: ref.chat.value })
				ref.chat.value = '';
				chatOpen = false;
				return;
			}
		} else {
			if (event.type === 'keydown') {
				chatOpen = true;
				ref.chatDiv.classList.remove('hidden')
				ref.chat.focus()
				return;
			}
		}
	}
	if (chatOpen) return;
	if (event.code === 'KeyN' && event.type === 'keydown') {
		window.debug = !window.debug;
	}
	if (event.code === 'KeyL' && event.type === 'keydown') {
		window._interpolate = !window._interpolate;
	}
	if (event.code === 'KeyP' && event.type === 'keydown') {
		window._predict = !window._predict;
	}
	// if (event.code === 'KeyB'&& event.type === 'keydown') {
	// 	window.stutter = !window.stutter;
	// }
	if (event.code === 'ArrowLeft' || event.code === 'KeyQ') {
		input.arrowLeft = event.type === 'keydown'

		sendInput();
	}
	if (event.code === 'ArrowRight' || event.code === 'KeyE') {
		input.arrowRight = event.type === 'keydown'
		sendInput();
	}
	if (event.code == 'KeyT' && event.type === 'keydown') {
		window.showSnapshots = !window.showSnapshots;
	}
	if (inputCodes[event.code] === undefined) return;
	input[inputCodes[event.code].key] = event.type === "keydown";
	sendInput()
	inputMessageCount++;
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

function lerp(start, end, dt) {
	return (1 - dt) * start + dt * end;
}

function offset(x, y) {
	return {
		x: x - (camera.x) + canvas.width / 2 + xoff,
		y: y - (camera.y) + canvas.height / 2 + yoff,
	};
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