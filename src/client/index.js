try {

	window.delta = 0;
	const serverDelta = 1 / 30;
	function getDelta(last) {
		return Math.min(((window.performance.now() - last) / serverDelta) / 1000, 1);
	}

	window.debug = false;
	window._interpolate = true;
	window._predict = false;
	window.serverTickMs = 0;
	window.redness = 0;

	let chatOpen = false;

	let killedPlayerName = '';
	let killedNotifTime = 0;
	let _kills = 0;

	const gui = ref.gui
	const canvas = ref.canvas
	const ctx = canvas.getContext('2d')
	const width = 1600;
	const height = 900;
	const updateRate = 60;
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

	window.stutter = false;

	window.addEventListener("keydown", trackKeys);
	window.addEventListener("keyup", trackKeys);
	window.showSnapshots = false;

	const hits = {};

	function sendInput() {
		send({ input: true, data: input });
	}

	function trackKeys(event) {
		if (event.repeat) return;
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

	};

	function getScale() {
		return Math.min(window.innerWidth / width, window.innerHeight / height);
	}


	window.addEventListener('resize', () => {
		resize([canvas, gui])
	})

	window.mouse = { x: 0, y: 0 };

	canvas.addEventListener('mousemove', (event) => {
		const bound = canvas.getBoundingClientRect();
		mouse.x = Math.round((event.pageX - bound.left) / getScale());
		mouse.y = Math.round((event.pageY - bound.top) / getScale());
	});

	canvas.addEventListener('contextmenu', (event) => {
		return event.preventDefault();
	})

	const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
	ws.binaryType = 'arraybuffer'

	let text = ``

	const players = {};
	const arrows = {}
	let obstacles = []
	const input = createInput();
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

	const camera = { x: null, y: null }

	window.extraLag = 0;
	window.inputsBuffered = 0;

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
		if (window.stutter) return;
		if (extraLag === 0) {
			messages.push(msg)
		} else {
			setTimeout(() => {
				messages.push(msg)
			}, extraLag);
		}
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
			arena = obj.arena;
			obstacles = obj.obstacles;
		}
		if (obj.leader) {
			leader = obj.leader;
		}
		if (obj.serverTickMs != undefined) {
			serverTickMs = obj.serverTickMs;
		}
		if (obj.type === 'shoot') {
			shotPlayers = {};
			for (const { data, id } of obj.players) {
				shotPlayers[id] = new CPlayer(data, id === selfId);
			}
		}
		if (obj.type === 'chat') {
			if (players[obj.id]) {
				players[obj.id].chat(obj.msg)
			}
		}
		if (obj.kill != undefined) {
			_kills = obj.kills;
			killedNotifTime = 2;
			killedPlayerName = obj.kill;
		}
		if (obj.arrowHit != undefined) {
			window.redness = 0.7;
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
			let timeDiff;
			if (lastReceivedStateTime == null) {
				lastReceivedStateTime = window.performance.now();
			} else {
				const space = window.performance.now() - lastReceivedStateTime;
				if (spacings.length > spacingLength) {
					spacings.shift();
				}
				spacings.push(space);
				spacing = spacings.reduce((a, b) => a + b) / spacings.length
				timeDiff = (window.performance.now() - lastReceivedStateTime) / 1000;
				lastReceivedStateTime = window.performance.now();
			}

			if (obj.spacing) {
				serverSpacing = obj.spacing;
			}
			for (const pack of obj.data.players) {
				if (players[pack.id] == null) {
					players[pack.id] = new CPlayer(pack, pack.id === selfId)
				}
			}
			for (const arrowId of Object.keys(arrows)) {
				if (obj.data.arrows[arrowId] == undefined) {
					delete arrows[arrowId]
				}
			}
			for (const arrowId of Object.keys(obj.data.arrows)) {
				if (arrows[arrowId] == undefined) {
					arrows[arrowId] = new CArrow(obj.data.arrows[arrowId]);
				} else {
					arrows[arrowId].Snap(obj.data.arrows[arrowId]);
				}
			}
			const cplayers = obj.data.players;
			for (const { id, data, last_processed_input } of cplayers) {
				players[id].Snap(data);
			}
		}
	}

	let lastTime = window.performance.now()

	let xoff = 0;
	let yoff = 0;


	; (function run() {
		try {
			requestAnimationFrame(run);
			update((window.performance.now() - lastTime) / 1000);
			const diff = (window.performance.now() - lastTime) / 1000;
			window.delta = getDelta(lastTime);
			window.redness -= ((window.performance.now() - lastTime) / 1000) * 1.5;
			if (window.redness <= 0) {
				window.redness = 0;
			}
			killedNotifTime -= ((window.performance.now() - lastTime) / 1000) * 1.5;
			if (killedNotifTime <= 0) {
				killedNotifTime = 0;
			}
			lastTime = window.performance.now();


			for (const playerId of Object.keys(players)) {
				players[playerId].smooth(delta, playerId === selfId)
			}

			for (const playerId of Object.keys(players)) {
				const player = players[playerId];

				player.chatMessageTimer -= diff;

				if (player.chatMessageTimer <= 0) {
					player.chatMessageTimer = 0;
				}
			}

			for (const arrowId of Object.keys(arrows)) {
				arrows[arrowId].smooth(delta)
			}

			if (players[selfId] != undefined) {
				if (camera.x == null) {
					camera.x = players[selfId].pos.x;
				}
				if (camera.y == null) {
					camera.y = players[selfId].pos.y;
				}

				camera.x = players[selfId].pos.x;
				camera.y = players[selfId].pos.y;

				let targetX = 0;
				let targetY = 0;
				if (players[selfId].arrowing) {
					targetX = -Math.cos(players[selfId].interpAngle) * 75;
					targetY = -Math.sin(players[selfId].interpAngle) * 75;
				} else {
					targetX = 0;
					targetY = 0;
				}
				const dtC = Math.min(diff * 2, 1);
				xoff = lerp(xoff, targetX, dtC);
				yoff = lerp(yoff, targetY, dtC)

				if (Math.abs(targetX - xoff) < 0.5) {
					xoff = targetX;
				}
				if (Math.abs(targetY - yoff) < 0.5) {
					yoff = targetY;
				}
			}

			render();
		} catch (err) {
			document.body.innerHTML = `${err}`
			console.error(err)
		}
	})()

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



	ws.onclose = function() {
		alert('Disconnected.')
	}

	function update(dt, msg = true) {
		window.dt = dt;
		if (selfId == null || startTime == null || players[selfId] == null) {
			if (msg) {
				for (const msg of messages) {
					processMessage(msg);
				}
				messages = [];
			}
			return;
		}

		if (msg) {
			for (const msg of messages) {
				processMessage(msg);
			}
			messages = [];
		}
		if (window._predict) {

		}


		
	}

	function lerp(start, end, dt) {
		return (1 - dt) * start + dt * end;
	}

	function offset(x, y) {
		const player = players[selfId];
		if (!player) return;
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

	function render() {
		try {
			ctx.fillStyle = '#b3b3b3'
			ctx.fillRect(0, 0, canvas.width, canvas.height);


			ctx.fillStyle = '#d6d6d6';
			const a = offset(0, 0);

			if (!a) return;
			ctx.fillRect(a.x, a.y, arena.width, arena.height);

			window.data = clientShotPlayers;


			if (window.showSnapshots) {
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
					ctx.fillStyle = 'white';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle'
					ctx.fillText(player.name, pos.x, pos.y - player.radius * 1.5)
				}
				ctx.globalAlpha = 1;
			}

			for (const { x, y, width, height } of obstacles) {
				const pos = offset(x, y);
				ctx.fillStyle = '#b3b3b3';
				ctx.fillRect(pos.x, pos.y, width, height)
			}

			for (const arrowId of Object.keys(arrows)) {
				// console.log(arrows[arrowId])
				const { angle, radius, life, alpha } = arrows[arrowId]
				const { x, y } = arrows[arrowId].pos;
				ctx.globalAlpha = alpha; // life 
				// ctx.fillStyle = '#d93311';
				// ctx.strokeStyle = '#a30800';
				ctx.fillStyle = 'black'
				ctx.lineWidth = 4;
				// ctx.beginPath();
				const pos = offset(x, y);

				ctx.translate(pos.x, pos.y);
				ctx.rotate(angle + Math.PI / 2);
				ctx.fillStyle = '#ff0000';
				ctx.fillRect(-6.25, -18.75, 12.5, 37.5);
				ctx.rotate(-(angle + Math.PI / 2));
				ctx.translate(-pos.x, -pos.y);

				// ctx.fillStyle = 'black'
				// 	ctx.beginPath()
				// ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
				// ctx.fill()
				if (window.showSnapshots) {
					const pos = offset(arrows[arrowId].x, arrows[arrowId].y);
					ctx.globalAlpha = 0.5;
					ctx.fillStyle = 'green';
					ctx.translate(pos.x, pos.y);
					ctx.rotate(angle + Math.PI / 2);
					// ctx.fillStyle = '#ff0000';
					ctx.fillRect(-5, 0, 10, 30);
					ctx.rotate(-(angle + Math.PI / 2));
					ctx.translate(-pos.x, -pos.y);
					ctx.globalAlpha = 1;

				}
				// ctx.fill()
				// ctx.stroke()
			}
			ctx.globalAlpha = 1;


			for (const playerId of Object.keys(players)) {
				const player = players[playerId];

				if (window.showSnapshots) {
				}

				const pos = offset(player.pos.x, player.pos.y)



				// ctx.fillStyle = "#a37958";
				ctx.fillStyle = '#292929';
				if (playerId === leader.id) {
					ctx.fillStyle =' #deae12'
				}
				if (player.timer > 0) {
					ctx.fillStyle = '#616161'
					if (playerId === leader.id) {
						ctx.fillStyle = '#c2ac65'
					}
				}
				// ctx.strokeStyle = '#363636';
				ctx.lineWidth = 2.5;
				ctx.beginPath();
				// const pos = offset(player.pos.x, player.pos.y)

				ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
				ctx.fill();

				if (player.dying) {
					ctx.fillStyle = '#d40000';
					ctx.globalAlpha = 0.5;
					ctx.beginPath();
					ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
					ctx.fill();
					ctx.globalAlpha = 1;
				}


				ctx.translate(pos.x, pos.y);
				ctx.rotate(player.interpAngle + Math.PI / 2);

				if (player.arrowing <= 0) {
					// ctx.beginPath()
					// ctx.strokeStyle = '#363636';
					// ctx.arc(
					// 	(-player.radius / 1.4) + 10 * player.timer * 3,
					// 	(-player.radius / 1.2) + 25 * player.timer * 3,
					// 	(player.radius / 3.3),
					// 	0,
					// 	Math.PI * 2
					// );
					// ctx.fill();
					// ctx.stroke();
					// ctx.beginPath();
					// ctx.arc(
					// 	(player.radius / 1.4) - 10 * player.timer * 3,
					// 	(-player.radius / 1.2) + 25 * player.timer * 3,
					// 	(player.radius / 3.3),
					// 	0,
					// 	Math.PI * 2
					// );
					// ctx.fill();
					// ctx.stroke();
					// ^hands
				} else {
					ctx.beginPath();
					ctx.strokeStyle = 'white';
					ctx.lineWidth = 1;
					ctx.lineTo(Math.cos(1.25 * Math.PI) * (60), Math.sin(1.25 * Math.PI) * (60));
					ctx.lineTo(-5, -30 + player.arrowing * 25);
					ctx.lineTo(5, -30 + player.arrowing * 25);
					ctx.lineTo(Math.cos(1.75 * Math.PI) * (60), Math.sin(1.75 * Math.PI) * (60));
					ctx.stroke();

					ctx.globalAlpha = 0.5;
					ctx.beginPath();
					ctx.strokeStyle = '#ff0000'
					ctx.lineTo(0, -60 + player.arrowing * 25);
					ctx.lineTo(0, -150);
					ctx.stroke();
					ctx.globalAlpha = 1;

					ctx.beginPath();
					ctx.arc(0, 0, 60, 1.25 * Math.PI, 1.75 * Math.PI, false);
					ctx.lineWidth = 5;
					ctx.strokeStyle = '#ff2626';
					ctx.stroke();

					ctx.fillStyle = '#ff0000';
					ctx.fillRect(-5, -60 + player.arrowing * 25, 10, 30);

				}

				// ctx.restore();
				ctx.rotate(-(player.interpAngle + Math.PI / 2));
				ctx.translate(-pos.x, -pos.y);

				if (window.showSnapshots) {
					ctx.globalAlpha = 0.5;
					ctx.fillStyle = "green";
					ctx.beginPath();
					const pos = offset(player.server.x, player.server.y)
					ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
					ctx.fill();
					ctx.globalAlpha = 1;
				}
				ctx.fillStyle = 'black';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle'
				ctx.font = '22px Arial'
				ctx.fillText(`${player.name}`, pos.x, pos.y + player.radius * 1.5)

				if (player.chatMessageTimer > 0) {
					ctx.globalAlpha = player.chatMessageTimer > 0.5 ? 1 : (player.chatMessageTimer * 2) / 1;
					ctx.fillText(player.chatMessage, pos.x, pos.y - player.radius * 1.5)
					ctx.globalAlpha = 1;
				}
			}


			ctx.globalAlpha = 1;



			// ctx.fillStyle = "green";
			// ctx.beginPath();
			// const pos = offset(rotator.x, rotator.y)
			// ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
			// ctx.fill();

			ctx.globalAlpha = window.redness;
			ctx.fillStyle = '#eb0000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha = 1;

			ctx.globalAlpha = killedNotifTime;
			ctx.fillStyle = '#0d0d0d';
			// ctx.fillRect(600, 700, 400, 50);
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'rgb(255, 0, 0)';
			ctx.font = '20px Arial'
			ctx.fillText(`Eliminiated`, 700, 725)
			const xOff = ctx.measureText('Eliminated ').width;
			ctx.fillStyle = 'black'
			ctx.fillText(` ${killedPlayerName}`, 700 + xOff, 725);
			ctx.globalAlpha = 1;


			// minimap

			const mwidth = 200;
			const mheight = 200;

			ctx.globalAlpha = 0.75;
			ctx.fillStyle = '#707070';
			ctx.fillRect(0, canvas.height - mheight, mwidth, mheight);

			ctx.fillStyle = '#595959'
			for (const { x, y, width, height } of obstacles) {
				ctx.fillRect((x / arena.width) * mwidth, (canvas.height - mheight) + (y / arena.height) * mheight, (width / arena.width) * mwidth, (height / arena.height) * mheight)
			}


			for (const playerId of Object.keys(players)) {
				const player = players[playerId];
				ctx.fillStyle = '#000000';
				if (playerId === leader.id) {
					ctx.fillStyle = '#ffc400'
				}
				ctx.beginPath();
				ctx.arc((player.pos.x / arena.width) * mwidth, (canvas.height - mheight) + (player.pos.y / arena.height) * mheight, 4, 0, Math.PI * 2)
				ctx.fill()
			}

			ctx.globalAlpha = 1;
			//text		



			ctx.font = '18px Arial'

			ctx.fillStyle = 'red';
			ctx.textAlign = 'left'
			if (window.debug) {
				ctx.fillText(`Players: ${Object.keys(players).length} | Download: ${stateMessageDisplay} msg/s (${(byteDisplay / 1000).toFixed(1)}kb/s) | Upload: ${(uploadByteDisplay / 1000).toFixed(1)}kb/s | ${inputMessageDisplay} msg/s (inputs) | Ping: ${ping}ms | Spacing:[${lowest(spacings).toFixed(1)}, ${spacing.toFixed(1)}, ${highest(spacings).toFixed(1)}]ms | ServerSpacing: [${serverSpacing[0]}, ${serverSpacing[1]}, ${serverSpacing[2]}]`, 210, 870);
				ctx.fillText(`Extralag: ${extraLag} | Interpolation: ${window.delta.toFixed(1)} / 1 | Interpolate: ${window._interpolate.toString().toUpperCase()} | Input Delay: ${Math.ceil((ping * 2) / (1000 / 60))} frames | Arrows: ${Object.keys(arrows).length} | ServerTickTime: ${serverTickMs}ms | EstimatedServerTickTimePerFrame: ${Math.round(serverTickMs/60)}ms`, 210, 840)
			}
			ctx.font = '25px Arial'

			ctx.fillText(`x${_kills}`, canvas.width - 10 - ctx.measureText(`x${_kills}`).width, canvas.height - 20);

			if (leader != null) {
				ctx.globalAlpha = 0.9;
				// ctx.fillStyle = '#303030';
				// ctx.fillRect(canvas.width - 350, 0, 350, 100)

				ctx.fillStyle = 'black'

				ctx.fillText('Current King', canvas.width - ctx.measureText('Current King').width * 1.75, 20);

				ctx.strokeStyle = 'black';
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.lineTo(canvas.width - ctx.measureText('Current King').width * 2.3, 45);
				ctx.lineTo(canvas.width - ctx.measureText('Current King').width / 5, 45);
				ctx.stroke()
				const width = ctx.measureText('Current King').width
				ctx.textAlign = 'center'
				// ctx.fillStyle = '#ffac05'
				// if (leader.id === selfId) {
				// 	ctx.fillStyle = '#fffb05'
				// }
				ctx.fillStyle = 'black'
				ctx.font = '22px Arial'
				ctx.fillText(`${leader.name} with ${leader.kills} eliminations`, canvas.width - width * 1.25, 70);
				ctx.globalAlpha =1;
			}




		} catch (err) {
			document.body.innerHTMK = `${err}`
		}
	}
} catch (err) {
	document.body.innerHTML = `${err}`
}

