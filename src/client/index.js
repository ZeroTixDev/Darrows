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
		// ArrowUp: { key: 'up' },
		// ArrowLeft: { key: 'left' },
		// ArrowRight: { key: 'right' },
		// ArrowDown: { key: 'down' },
	}

	window.stutter = false;

	window.addEventListener("keydown", trackKeys);
	window.addEventListener("keyup", trackKeys);
	window.showSnapshots = false;
	window.timer = 0;

	const hits = {};

	function trackKeys(event) {
		if (event.repeat) return;
		if (event.code === 'ArrowLeft') {
			input.arrowLeft = event.type === 'keydown'
		}
		if (event.code === 'ArrowRight') {
			input.arrowRight = event.type === 'keydown'
		}
		if (event.code === 'Space' && event.type === 'keydown' && timer <= 0) { // temporary client space spam fix
			timer = 1;
			const id = Math.random();
			if (players[selfId]) {
				const data = [];
				for (const id of Object.keys(players)) {
					if (id !== selfId) {
						data.push({ type: 'circle', x: players[id].pos.x, y: players[id].pos.y, radius: players[id].radius });
					}
				}
				let { point } = players[selfId].ray.cast(data);
				// if (players[selfId].ray.getDist(point, players[selfId].ray.pos) > 200) {
				// 	point = null;
				// }
				if (point && players[selfId].ray.getDist(point, players[selfId].ray.pos) < 600) {
					hits[id] = { x: point.x, y: point.y, confirm: false };
					setTimeout(() => {
						delete hits[id]
					}, 2000);
				}
			}
			send({ type: 'shoot', hitId: id });
			clientShotPlayers = {};
			for (const id of Object.keys(players)) {
				clientShotPlayers[id] = players[id].pack()
			}
		}
		if (event.code == 'KeyQ' && event.type === 'keydown') {
			window.stutter = !window.stutter
		}
		if (event.code == 'KeyT' && event.type === 'keydown') {
			window.showSnapshots = !window.showSnapshots;
		}
		if (event.code === 'KeyZ' && event.type == 'keydown') {
			extraLag = 0;
		}
		if (event.code === 'KeyX' && event.type == 'keydown') {
			extraLag += 25;
		}
		if (event.code === 'KeyC' && event.type === 'keydown') {
			extraLag += 1000;
		}
		if (inputCodes[event.code] === undefined) return;
		input[inputCodes[event.code].key] = event.type === "keydown";
	}


	function resizeCanvas(canvas) {
		canvas.style.transform = `scale(${Math.min(window.innerWidth / width, window.innerHeight / height)})`;
		canvas.style.left = `${(window.innerWidth - width) / 2}px`;
		canvas.style.top = `${(window.innerHeight - height) / 2}px`;
	};

	function getScale() {
		return Math.min(window.innerWidth / width, window.innerHeight / height);
	}


	window.addEventListener('resize', () => {
		resizeCanvas(canvas)
	})

	window.mouse = { x: 0, y: 0 };

	canvas.addEventListener('mousemove', (event) => {
		const bound = canvas.getBoundingClientRect();
		mouse.x = Math.round((event.pageX - bound.left) / getScale());
		mouse.y = Math.round((event.pageY - bound.top) / getScale());
		// input.angle = Math.atan2(window.mouse.y - canvas.height / 2, window.mouse.x - canvas.width / 2)
	});

	canvas.addEventListener('contextmenu', (event) => {
		return event.preventDefault();
	})

	canvas.addEventListener('mousedown', () => {
		// send({ type: 'shoot' });
		// window.angle = 0;
	})

	// window.angle = 0;

	const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
	ws.binaryType = 'arraybuffer'

	let text = ``



	const players = {};
	const unconfirmed_inputs = [];
	const input = { up: false, right: false, left: false, down: false, arrowLeft: false, arrowRight: false };
	let lastSentInput;
	let selfId;
	let startTime;
	let arena;
	let tick;
	let tickOffset;
	let spacing = 0;
	let spacings = [];
	let spacingLength = 30;
	let lastReceivedStateTime;
	let serverPing = -1;

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
	// let messages = [];

	const rotator = { x: 0, y: 0, sx: 0, sy: 0, buffer: [], canUpdate: false };
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
			send({ ping: Date.now() })
		}, 500);
	});

	ws.addEventListener('message', (msg) => {
		// setTimeout(() => {
		if (window.stutter) return;
		if (extraLag === 0) {
			processMessage(msg);
		} else {
			setTimeout(() => {
				processMessage(msg);
			}, extraLag);
		}
		// }, extraLag);
	});

	let shotPlayers = {}
	let clientShotPlayers = {};

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
		if (obj.hitId) {
			hits[obj.hitId].confirm = true;
		}
		if (obj.type === 'shoot') {
			shotPlayers = {};
			for (const { data, id } of obj.players) {
				shotPlayers[id] = new CPlayer(data, id === selfId);
			}
		}
		if (obj.ping != undefined) { // server ping (tick)
			// byteCount += 50000000;
			// serverPing = 10000;
			send({
				pung: obj.ping,
			})
		}
		if (obj.serverPing != undefined) {
			serverPing = obj.serverPing;
		}
		if (obj.pung != undefined) {
			ping = Math.round((Date.now() - obj.pung) / 2)
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
				lastReceivedStateTime = Date.now();
			} else {
				const space = Date.now() - lastReceivedStateTime;
				if (spacings.length > spacingLength) {
					spacings.shift();
				}
				spacings.push(space);
				spacing = spacings.reduce((a, b) => a + b) / spacings.length
				lastReceivedStateTime = Date.now();
			}
			if (obj.rotator) {
				// rotator.buffer.push({ x: obj.rotator.x, y: obj.rotator.y })
				// if (rotator.buffer.length > 10) {
				// 	rotator.canUpdate = true;
				// }
				rotator.sx = obj.rotator.x;
				rotator.sy = obj.rotator.y;
			}
			if (obj.spacing) {
				serverSpacing = obj.spacing;
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
		try {
			requestAnimationFrame(run);
			update();
			window.delta = (window.performance.now() - lastTime) / 1000;
			lastTime = window.performance.now()
			timer -= delta;
			if (timer <= 0) {
				timer = 0;
			}
			for (const playerId of Object.keys(players)) {
				players[playerId].smooth(delta, playerId === selfId)
			}

			// if (players[selfId] != null) {
			// 	players[selfId].ray.setRay({ x: players[selfId].pos.x, y: players[selfId].pos.y }, window.angle);
			// }
			for (const playerId of Object.keys(players)) {
				// if (playerId === selfId) continue;
				players[playerId].ray.setRay({ x: players[playerId].pos.x, y: players[playerId].pos.y, }, players[playerId].interpAngle);
			}
			// window.data = Object.keys(players).map((id) => {
			// 	return players[id].angle;
			// })
			// simulateRotator();
			const dt = Math.min(delta * 20, 1);
			rotator.x = lerp(rotator.x, rotator.sx, dt);
			rotator.y = lerp(rotator.y, rotator.sy, dt)
			render();
		} catch (err) {
			document.body.innerHTML = `${err}`
		}
	})()

	function lerp(start, end, time) {
		return start * (1 - time) + end * time;
	}

	// function simulateRotator() {
	// 	if (rotator.canUpdate && rotator.buffer[0] != undefined) {
	// 		rotator.sx = rotator.buffer[0].x;
	// 		rotator.sy = rotator.buffer[0].y;
	// 		rotator.buffer.shift()
	// 	}
	// }

	function getTick() {
		return Math.ceil(
			(Date.now() - startTime) * (updateRate / 1000)
		) + tickOffset;
	}

	function processInputs() {
		const expectedTick = getTick()

		const difference = expectedTick - tick;

		// if (difference > 5) { // most likely off tab
		// 	input = { right: false, left: false, down: false, up: false}
		// }

		while (tick < expectedTick) {
			let packageInput = {
				data: copyInput(input),
				tick,
				id: selfId,
				input: true
			};

			if (lastSentInput != null && sameInput(lastSentInput, input)) {
				// send smaller package indicating that its the last input sent
				packageInput = { lastInput: true, tick, id: selfId };
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
		for (const key of Object.keys(input1)) {
			if (input1[key] !== input2[key]) {
				return false;
			}
		}
		return true;
	}

	function send(obj) {
		// setTimeout(() => {
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
		// }, extraLag);
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
		// for (const msg of messages) {
		// 	processMessage(msg);
		// }
		// messages = [];
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
			if (arr[i] < h) {
				h = arr[i]
			}
		}
		return h;
	}

	function render() {
		try {
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

			window.data = clientShotPlayers;

			ctx.font = '18px Arial'

			ctx.fillStyle = 'black';
			ctx.textAlign = 'left'
			ctx.fillText(`Players: ${Object.keys(players).length} | Download: ${stateMessageDisplay} msg/s (${(byteDisplay / 1000).toFixed(1)}kb/s) | Upload: ${(uploadByteDisplay / 1000).toFixed(1)}kb/s | ${inputMessageDisplay} msg/s (inputs) | Ping: ${ping}ms | Spacing:[${lowest(spacings).toFixed(1)}, ${spacing.toFixed(1)}, ${highest(spacings).toFixed(1)}]ms | ServerSpacing: [${serverSpacing[0]}, ${serverSpacing[1]}, ${serverSpacing[2]}]`, 10, 870);
			ctx.fillText(`GlobalTick#${tick} | Extralag: ${extraLag} | ServerPing[Tick]: ${serverPing}`, 10, 840)

			// if (window.showSnapshots) {
			ctx.globalAlpha = 0.5;
			for (const playerId of Object.keys(shotPlayers)) {
				const player = shotPlayers[playerId];
				ctx.fillStyle = 'orange'
				ctx.beginPath();
				const pos = offset(player.pos.x, player.pos.y)
				ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = 'black';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle'
				ctx.fillText(player.name, pos.x, pos.y - player.radius * 1.5)
			}
			// ctx.globalAlpha = 1;
			for (const playerId of Object.keys(clientShotPlayers)) {
				const player = clientShotPlayers[playerId];
				ctx.fillStyle = 'blue'
				ctx.beginPath();
				const pos = offset(player.x, player.y)
				ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = 'black';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle'
				ctx.fillText(player.name, pos.x, pos.y - player.radius * 1.5)
			}
			ctx.globalAlpha = 1;
			// }

			for (const playerId of Object.keys(players)) {
				const player = players[playerId];

				if (window.showSnapshots) {
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

				if (playerId === selfId) {
					ctx.beginPath();
					ctx.strokeStyle = 'black';
					ctx.arc(pos.x, pos.y, player.radius, 0, (Math.PI * 2) * (window.timer / 1));
					ctx.stroke();
				}
			}


			if (window.showSnapshots) {
				ctx.fillStyle = 'rgb(100, 0, 0)';
				for (const { x, y } of rotator.buffer) {
					const pos = offset(x, y);
					ctx.beginPath();
					ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
					ctx.fill()
				}
			}

			ctx.fillStyle = "green";
			ctx.beginPath();
			const pos = offset(rotator.x, rotator.y)
			ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
			ctx.fill();

			// if (players[selfId].ray != null) {
			// data.push({ type: 'line',  start: { x: arena.width, y: 0 }, end: { x: arena.width, y: arena.height }});

			// console.log(players)

			// window.data = point;
			// window.data = 0;
			ctx.strokeStyle = 'rgb(255, 0, 0)';
			ctx.lineWidth = 2;
			for (const playerId of Object.keys(players)) {
				const data = [];
				for (const id of Object.keys(players)) {
					if (id !== playerId) {
						data.push({ type: 'circle', x: players[id].pos.x, y: players[id].pos.y, radius: players[id].radius });
					}
				}
				let { point } = players[playerId].ray.cast(data);

				ctx.beginPath()
				const p = offset(players[playerId].ray.pos.x + players[playerId].ray.direction.x * players[playerId].radius, players[playerId].ray.pos.y + players[playerId].ray.direction.y * players[playerId].radius);
				ctx.moveTo(p.x, p.y);
				ctx.lineTo(p.x, p.y);
				let end = offset(players[playerId].ray.pos.x + players[playerId].ray.direction.x * 100, players[playerId].ray.pos.y + players[playerId].ray.direction.y * 100);
				ctx.lineTo(end.x, end.y);
				ctx.stroke()
				if (point && players[playerId].ray.getDist(point, players[playerId].ray.pos) < 600) {
					ctx.strokeStyle = '#4d1010'
					ctx.globalAlpha = 0.6;
					const pos = offset(point.x, point.y);
					ctx.beginPath();
					ctx.lineTo(end.x, end.y);
					ctx.lineTo(pos.x, pos.y);
					ctx.stroke();
					ctx.globalAlpha = 1;
					ctx.strokeStyle = 'rgb(255, 0, 0)';
					ctx.fillStyle = 'black';
					ctx.beginPath();
					ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
					ctx.fill()
				}
			}

			for (const { x, y, confirm } of Object.values(hits)) {
				ctx.font = '40px Arial';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				if (confirm) {
					ctx.fillStyle = '#ff0000';
					ctx.font = '30px Arial';
				} else {
					ctx.fillStyle = 'black';
				}
				const pos = offset(x, y);
				ctx.fillText('X', pos.x, pos.y);
			}

		} catch (err) {
			document.body.innerHTMK = `${err}`
		}
	}
} catch (err) {
	document.body.innerHTML = `${err}`
}

