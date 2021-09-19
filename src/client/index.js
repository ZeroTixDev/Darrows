try {
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
	window.showSnapshots = false;

	function trackKeys(event) {
		if (event.repeat) return;
		if (event.code == 'KeyQ' && event.type === 'keydown') {
			window.stutter = !window.stutter
		}
		if (event.code == 'KeyT' && event.type === 'keydown') {
			window.showSnapshots = !window.showSnapshots;
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
	let spacing = 0;
	let spacings = [];
	let spacingLength = 10;
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
	let messages = [];

	const rotator = { x: 0, y: 0 };
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

	ws.addEventListener('open', () => {
		setInterval(() => {
			send({ ping: window.performance.now() })
		}, 200);
	});

	ws.addEventListener('message', (msg) => {
		setTimeout(() => {
			if (window.stutter) return;
			messages.push(msg);
		}, extraLag);
	});

	function processMessage(msg) {
		byteCount += msg.data.byteLength;
		const obj = msgpack.decode(new Uint8Array(msg.data));
		if (obj.type === 'init') {
			selfId = obj.selfId;
			for (const { data, id } of obj.players) {
				players[id] = new CPlayer(data, id === selfId);
			}
			startTime = Date.now();
			tickOffset = obj.tick;
			tick = obj.tick;
			arena = obj.arena;
		}
		if (obj.pung != undefined) {
			ping = Math.round((window.performance.now() - obj.pung) / 2)
		}
		if (obj.type === "newPlayer") {
			players[obj.id] = new CPlayer(obj.player, obj.id === selfId);
		}
		if (obj.type === 'leave') {
			delete players[obj.id]
		}
		if (obj.type === "state") {
			stateMessageCount++;
			if (lastReceivedStateTime == null) {
				lastReceivedStateTime = window.performance.now();
			} else {
				const space = window.performance.now() - lastReceivedStateTime;
				if (spacings.length > spacingLength) {
					spacings.shift();
				}
				spacings.push(space);
				spacing = spacings.reduce((a, b) => a + b) / spacings.length
				lastReceivedStateTime = window.performance.now();
			}
			if (obj.rotator) {
				rotator.x = obj.rotator.x;
				rotator.y = obj.rotator.y;
			}
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
	}

	let lastTime = window.performance.now();
	; (function run() {
		requestAnimationFrame(run);
		update();
		window.delta = (window.performance.now() - lastTime) / 1000;
		lastTime = window.performance.now()
		for (const playerId of Object.keys(players)) {
			players[playerId].smooth(delta, playerId === selfId)
		}
		render();
	})()

	function getTick() {
		return Math.ceil(
			(Date.now() - startTime) * (60 / 1000)
		) + tickOffset;
	}

	function processInputs() {
		const expectedTick = getTick()

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
			// collidePlayers(players)
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

	let lastGlobalTick = 0;

	function handleVisibilityChange() {
		if (document.hidden) {
			// document.title = 'Paused';
			lastGlobalTick = tick;
		} else {
			// document.title = 'Playing';
			const value = (getTick() - lastGlobalTick)
			tick += value;
		}
	}

	document.addEventListener('visibilitychange', handleVisibilityChange, false);



	ws.onclose = function() {
		alert('Disconnected.')
	}

	function update() {
		for (const msg of messages) {
			processMessage(msg);
		}
		messages = [];
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
			if(arr[i] < h) {
				h = arr[i]
			}
		}
		return h;
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

		ctx.font = '20px Arial'

		ctx.fillStyle = 'black';
		ctx.textAlign = 'left'
		ctx.fillText(`Players: ${Object.keys(players).length} | Download: ${stateMessageDisplay} msg/s (${(byteDisplay / 1000).toFixed(1)}kb/s) | Upload: ${(uploadByteDisplay / 1000).toFixed(1)}kb/s | ${inputMessageDisplay} msg/s (inputs) | Ping: ${ping}ms | Spacing:[${lowest(spacings).toFixed(1)}, ${spacing.toFixed(1)}, ${highest(spacings).toFixed(1)}]ms | LocalTick#${tick - tickOffset} | GlobalTick#${tick}`, 10, 870);

		for (const playerId of Object.keys(players)) {
			const player = players[playerId];

			if (window.showSnapshots) {
				// for (let i = 0; i < player.snapshots.length; i++) {
				// 	const { x, y } = player.snapshots[i]
				// 	ctx.fillStyle = `rgb(0,${i * 5},0)`
				// 	ctx.beginPath();
				// 	const pos = offset(x, y)
				// 	ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
				// 	ctx.fill();
				// // }
				// if (player.oldInterp != undefined) {
				// 	ctx.fillStyle = 'blue'
				// 	ctx.beginPath();
				// 	const pos = offset(player.oldInterp.x, player.oldInterp.y)
				// 	ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
				// 	ctx.fill()
				// }

				// if (player.newInterp != undefined) {
				// 	ctx.fillStyle = 'red'
				// 	ctx.beginPath();
				// 	const pos = offset(player.newInterp.x, player.newInterp.y)
				// 	ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
				// 	ctx.fill()
				// }
			}


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

			ctx.fillStyle = "#a37958";
			ctx.beginPath();
			const pos = offset(rotator.x, rotator.y)
			ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
			ctx.fill();
	}
} catch (err) {
	document.body.innerHTML = `${err}`
}

