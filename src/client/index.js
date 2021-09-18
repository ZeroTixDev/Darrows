
// import CPlayer from './CPlayer.js';
// import msgpack from './msgpack.min.js'

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')
const width = 1600;
const height = 900;
const updateRate = 60;
canvas.width = width;
canvas.height = height;
resizeCanvas(canvas)
document.body.appendChild(canvas);
const inputs = ["KeyW", "KeyA", "KeyS", "KeyD"];
const inputCodes = {
	[inputs[0]]: { key: "up" },
	[inputs[1]]: { key: "left" },
	[inputs[2]]: { key: "down" },
	[inputs[3]]: { key: "right" },
	ArrowUp: { key: 'up' },
	ArrowLeft: { key: 'left' },
	ArrowRight: { key: 'right' },
	ArrowDown: { key: 'down' },
};

window.stutter = false;

window.addEventListener("keydown", trackKeys);
window.addEventListener("keyup", trackKeys);

function trackKeys(event) {
	if (event.repeat) return;
	if (event.code == 'KeyQ' && event.type === 'keydown') {
		window.stutter = !window.stutter
	}
	if (inputCodes[event.code] === undefined) return;
	input[inputCodes[event.code].key] = event.type === "keydown";
}


function resizeCanvas(canvas) {
	canvas.style.transform = `scale(${Math.min(window.innerWidth / width, window.innerHeight / height)})`;
	canvas.style.left = `${(window.innerWidth - width) / 2}px`;
	canvas.style.top = `${(window.innerHeight - height) / 2}px`;
	return Math.min(window.innerWidth / width, window.innerHeight / height);
};



window.addEventListener('resize', () => {
	resizeCanvas(canvas)
})

const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
ws.binaryType = 'arraybuffer'

let text = ``

const players = {};
const unconfirmed_inputs = [];
const input = { up: false, right: false, left: false, down: false };
let lastSentInput;
let selfId;
let startTime;
let arena;
let tick;
let tickOffset;

let stateMessageDisplay = 0;
let stateMessageCount = 0;
let inputMessageDisplay = 0;
let inputMessageCount = 0;
let byteCount = 0;
let byteDisplay = 0;
let uploadByteCount = 0;
let uploadByteDisplay = 0;
let ping = 0;
window.extraLag = 0;

setInterval(() => {
	stateMessageDisplay = stateMessageCount;
	stateMessageCount = 0;
	inputMessageDisplay = inputMessageCount;
	inputMessageCount = 0;
	byteDisplay = byteCount;
	byteCount = 0;
	uploadByteDisplay = uploadByteCount;
	uploadByteCount = 0;
}, 1000);

ws.addEventListener('open',() => {
	setInterval(() => {
		send({ ping: window.performance.now() })
	}, 200);
});

ws.addEventListener('message', (msg) => {
	setTimeout(() => {
		if (window.stutter) return;
		byteCount += msg.data.byteLength;
		const obj = msgpack.decode(new Uint8Array(msg.data));
		if (obj.type === 'init') {
			for (const { data, id } of obj.players) {
				players[id] = new CPlayer(data);
			}
			selfId = obj.selfId;
			startTime = Date.now();
			tickOffset = obj.tick;
			tick = obj.tick;
			arena = obj.arena;
		}
		if (obj.pung != undefined) {
			ping = Math.round((window.performance.now() - obj.pung) / 2)
		}
		if (obj.type === "newPlayer") {
			players[obj.id] = new CPlayer(obj.player);
		}
		if (obj.type === 'leave') {
			delete players[obj.id]
		}
		if (obj.type === "state") {
			stateMessageCount++;
			const cplayers = obj.data.players;
			for (const { id, data, last_processed_input } of cplayers) {
				if (id === selfId) {
					players[selfId].Snap(data);

					let j = 0;
					while (j < unconfirmed_inputs.length) {
						const { input, tick } = unconfirmed_inputs[j];
						// console.log(tick, last_processed_input)
						if (tick <= last_processed_input) {
							// Already processed. so we can drop it
							unconfirmed_inputs.splice(j, 1);
						} else {
							// Not processed by the server yet. Re-apply it.
							applyInput(players[selfId], input, arena);
							// collidePlayers(players)
							j++;
						}
					}
				} else {
					players[id].Snap(data);
					// maybe interpolation
				}
			}
		}
	}, extraLag);
})

let lastTime = window.performance.now();
; (function run() {
	requestAnimationFrame(run);
	update();
	const delta = (window.performance.now() - lastTime) / 1000;
	lastTime = window.performance.now()
	for (const playerId of Object.keys(players)) {
		players[playerId].smooth(delta, playerId === selfId)
	}
	render();
})()

function processInputs() {
	const expectedTick = Math.ceil(
		(Date.now() - startTime) * (60 / 1000)
	) + tickOffset;

	const difference = expectedTick - tick;

	// if (difference > 5) { // most likely off tab
	// 	input = { right: false, left: false, down: false, up: false}
	// }

	while (tick < expectedTick) {
		const packageInput = {
			type: "input",
			data: copyInput(input),
			tick,
			id: selfId,
		};

		if (lastSentInput != null && sameInput(lastSentInput, input)) {
			// send smaller package indicating that its the last input sent
			packageInput.data = { last: true };
		} else {
			lastSentInput = copyInput(input);
		}
		send(packageInput);
		inputMessageCount++;
		applyInput(players[selfId], input, arena);
		unconfirmed_inputs.push({
			input: copyInput(input),
			tick: tick
		});
		tick++;
	}
}

function sameInput(input1, input2) {
	return input1.up === input2.up && input1.down === input2.down && input1.right === input2.right && input1.left === input2.left;
}

function send(obj) {
	setTimeout(() => {
		if (window.stutter) return;
		const pack = msgpack.encode(obj);
		uploadByteCount += pack.byteLength;
		ws.send(pack)
	}, extraLag);
}



ws.onclose = function() {
	alert('Disconnected.')
}

function update() {
	if (selfId == null || startTime == null || players[selfId] == null) {
		return;
	}
	processInputs();

}

function offset(x, y) {
	const player = players[selfId];
	if (!player) return;
	return {
		x: Math.round(x - player.pos.x + canvas.width / 2),
		y: Math.round(y - player.pos.y + canvas.height / 2),
	};
}

function render() {
	ctx.fillStyle = 'gray'
	ctx.fillRect(0, 0, canvas.width, canvas.height);



	// ctx.fillStyle = 'black'
	// ctx.fillText(msgpack, 0, 20)

	ctx.fillStyle = 'white';
	const a = offset(0, 0);

	if (!a) return;
	ctx.fillRect(a.x, a.y, arena.width, arena.height);
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 10;
	ctx.strokeRect(a.x, a.y, arena.width, arena.height);

	ctx.font = '25px Arial'

	ctx.fillStyle = 'black';
	ctx.textAlign = 'left'
	ctx.fillText(`Players: ${Object.keys(players).length}   download: ${stateMessageDisplay} msg/s  (${(byteDisplay / 1000).toFixed(1)}kb/s)    upload: ${(uploadByteDisplay / 1000).toFixed(1)}kb/s     inputs sent: ${inputMessageDisplay} msg/s (inputs)    Ping: ${ping}ms   Stutter: ${window.stutter}`, 10, 870);

	for (const playerId of Object.keys(players)) {
		const player = players[playerId];

		// // if (playerId === selfId) {
		// 	for (let i = 0; i < player.snapshots.length; i++) {
		// 		const { x, y } = player.snapshots[i]
		// 		ctx.fillStyle = `rgb(0,${i * 50},0)`
		// 		ctx.beginPath();
		// 		const pos = offset(x, y)
		// 		ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
		// 		ctx.fill();
		// 	}
		// // }


		ctx.fillStyle = "#a37958";
		ctx.beginPath();
		const pos = offset(player.pos.x, player.pos.y)
		ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = 'black';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle'
		ctx.fillText(player.name, pos.x, pos.y - player.radius * 1.5)
	}
}
