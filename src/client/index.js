window.addEventListener("keydown", trackKeys);
window.addEventListener("keyup", trackKeys);

window.addEventListener('resize', () => {
	resize([canvas, gui])
})

canvas.addEventListener('mousemove', (event) => {
	const bound = canvas.getBoundingClientRect();
	mouse.x = Math.round((event.pageX - bound.left) / getScale());
	mouse.y = Math.round((event.pageY - bound.top) / getScale());
});

canvas.addEventListener('contextmenu', (event) => {
	return event.preventDefault();
})


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
	send({ join: true })
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


function run() {

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
		if (arrows[arrowId].alpha <= 0) {
			delete arrows[arrowId]
		}
	}

	if (players[selfId] != null) {
		// if (camera.x == null) {
		// 	camera.x = players[selfId].pos.x;
		// }
		// if (camera.y == null) {
		// 	camera.y = players[selfId].pos.y;
		// }

		if (players[selfId].pos !== undefined && players[selfId].pos.x !== undefined && players[selfId].pos.y !== undefined
			&& !Number.isNaN(players[selfId].pos.x) && !Number.isNaN(players[selfId].pos.x)) {
			camera.x = players[selfId].pos.x ;
			camera.y = players[selfId].pos.y;

		}

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
	requestAnimationFrame(run);
}
run()





ws.onclose = function() {
	alert('Disconnected.')
}

function update(dt, msg = true) {
	window.dt = dt;
	if (selfId == null || startTime == null || (players[selfId] == null && iExist === false)) {
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
		// for (const playerId of Object.keys(players)) {
		// const player = players[selfId];


		// if (player.input.space && player.timer <= 0) {
		// 	player.angle += (input.arrowRight - input.arrowLeft) * (2.9 * dt);
		// }
		// }
	}
}


