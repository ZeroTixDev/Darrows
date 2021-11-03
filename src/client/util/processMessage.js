function processMessage(obj) {

	if (obj.kick != undefined) {
		alert(`You have been kicked from the server`)
		window.kicked = true;
	}

	if (obj.type === 'init') {
		selfId = obj.selfId;
		iExist = true;

		for (const { data, id } of obj.players) {
			if (id === selfId) dead = false;
			players[id] = new CPlayer(data, id === selfId);
		}

		startTime = Date.now();
		arena = obj.arena;
		obstacles = obj.obstacles;
	}



	if (obj.type === 'stats') {
		ref.deathScreen.classList.remove('hidden');
		ref.deathScreen.classList.add('dAnim')
		ref.kills.innerText = obj.kills;
		ref.deaths.innerText = obj.deaths;
		ref.kdr.innerText = obj.kdr.toFixed(1);
		ref.accuracy.innerText = obj.accuracy + '%';
		overlaying = true;
	}

	if (obj.leader != undefined) leader = obj.leader;
	if (obj.fric != undefined) window.fric = obj.fric
	if (obj.speed != undefined) window.speed = obj.speed;
	if (obj.serverTickMs != undefined) serverTickMs = obj.serverTickMs;

	if (obj.type === 'shoot') {
		shotPlayers = {};
		for (const { data, id } of obj.players) {
			shotPlayers[id] = new CPlayer(data, id === selfId);
		}
	}

	if (obj.type === 'chat')
		players[obj.id] != undefined ? players[obj.id].chat(obj.msg)
			: undefined;

	if (obj.kill != undefined) {
		_kills = obj.kills;
		killedNotifTime = 2;
		killedPlayerName = obj.kill;
	}

	if (obj.arrowHit != undefined) window.redness = 0.7;
	if (obj.pung != undefined) ping = 
		Math.round((Date.now() - obj.pung) / 2)

	if (obj.type === "newPlayer") {
		if (obj.id === selfId) dead = false;
		players[obj.id] = new CPlayer(obj.player, obj.id === selfId);
	}

	if (obj.type === 'leave') {
		if (obj.id === selfId) dead = true;
		delete players[obj.id]
	}

	if (obj.type === "state") {
		stateMessageCount++;
		let timeDiff;
		if (lastReceivedStateTime != null) {
			const space = window.performance.now() - lastReceivedStateTime;
			if (spacings.length > spacingLength) spacings.shift();
			spacings.push(space);
			spacing = spacings.reduce((a, b) => a + b) / spacings.length
			timeDiff = (window.performance.now() - lastReceivedStateTime) / 1000;
		}

		lastReceivedStateTime = window.performance.now();

		if (obj.spacing) serverSpacing = obj.spacing;

		for (const pack of obj.data.players) {
			if (players[pack.id] == null) {
				console.error('Wtf!!! players[pack.id] not defined processMessage')
			} else {
				players[pack.id].Snap(pack.data);
			}
		}
		
		for (const pack of obj.data.arrows) {
			if (arrows[pack.id] == null) {
				arrows[pack.id] = new CArrow(pack.data);
			} else {
				arrows[pack.id].Snap(pack.data)
			}
		}

		for (const arrowId of Object.keys(arrows)) {
			let arrowDead = true;
			for (const { id } of obj.data.arrows) {
				if (arrowId === id) {
					arrowDead = false;
					break;
				}
			}
			if (arrowDead) delete arrows[arrowId]
		}
	}


}
