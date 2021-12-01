function processMessage(obj) {

	if (obj.kick != undefined) {
		alert(`You have been kicked from the server from this admin: ${obj.kick}`)
		window.kicked = true;
	}

	if (obj.globalLeader != undefined) {
		const score = obj.globalLeader.score;
		const strScore = score <= 999 ?
			`${Math.floor(score)}` :
			`${Math.floor((score / 1000) * 100) / 100}k`
		ref.highscore.innerText = `Leader [ ${obj.globalLeader.name} with ${strScore} AP ]`
	}

	if (obj.type === 'init') {
		selfId = obj.selfId;
		iExist = true;

		for (const { data, id } of obj.players) {
			if (id === selfId) dead = false;
			players[id] = new CPlayer(data, id === selfId);
		}

		startTime = Date.now();
	}

	if (obj.saveName != undefined) {
		localStorage.setItem('name', obj.saveName);
	}

	if (obj.arena != undefined) {
		arena = obj.arena;
	}

	if (obj.obstacles != undefined) {
		obstacles = obj.obstacles;
	}

	if (obj.blocks != undefined) {
		blocks = obj.blocks;
		blockCanvas.width = arena.width;
		blockCanvas.height = arena.height;
		for (const { x, y, width, height, color } of blocks) {
			blockCtx.fillStyle = color;
			blockCtx.fillRect(x, y, width, height);
		}
	}

	if (obj.arrows != undefined) {
		for (const pack of obj.arrows) {
			arrows[pack.id] = new CArrow(pack.data);
		}
	}

	if (obj.version != undefined) {
		// the version of the game 
		ref.version.innerText = `[Alpha ${obj.version}]`;
		window.version = obj.version;
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

	// if (obj.type === 'shoot') {
	// 	shotPlayers = {};
	// 	for (const { data, id } of obj.players) {
	// 		shotPlayers[id] = new CPlayer(data, id === selfId);
	// 	}
	// }

	if (obj.type === 'chat') {
		const div = document.createElement('div');
		div.classList.add('chat-message');
		div.innerHTML = `${obj.dev ? '<span class="rainbow">[DEV]</span> ' : ''}${obj.name.safe()}: ${obj.msg.safe()}`;
		ref.chatMessageDiv.appendChild(div)
		ref.chatMessageDiv.scrollTop = ref.chatMessageDiv.scrollHeight;
	}

	if (obj.kill != undefined) {
		_kills = obj.kills;
		killedNotifTime = 2;
		killedPlayerName = obj.kill;
		hits.push({ x: obj.hit.x, y: obj.hit.y, score: obj.hit.score, timer: 1.5, })
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

	if (obj.d != undefined && obj.d.round && obj.d.round.time) {
		obj.round = obj.d.round;
	}

	if (obj.round) {
		roundTime = obj.round.time;
		if (obj.round.intermission != undefined) {
			intermission = obj.round.intermission;
			if (intermission) {
				const msgs = [
					...interMessages,
				];
				if (players[selfId] && players[selfId].characterName === 'Default') {
					msgs.push(defaultMessage);
					msgs.push(defaultMessage);
				}
				if (players[selfId] 
					&& selfId === Object.keys(players)
						.sort((a, b) => players[b].score - players[a].score)[0]) {
					msgs.push(firstMessage);
					msgs.push(firstMessage);
				}
				interMissionMessage = msgs[Math.floor(Math.random() * msgs.length)];
			}
		}
	}

	if (obj.arrowReset) {
		arrows = {};
	}

	if (obj.d != undefined) {
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


		for (const pack of obj.d.p) {
			if (players[pack.id] == null) {
				console.error('Wtf!!! players[pack.id] not defined processMessage')
			} else {
				players[pack.id].Snap(pack.data);
			}
		}

		for (const pack of obj.d.a) {
			if (arrows[pack.id] == null) {
				arrows[pack.id] = new CArrow(pack.data);
			} else {
				arrows[pack.id].Snap(pack.data)
			}
		}

		for (const arrowId of Object.keys(arrows)) {
			let arrowDead = true;
			for (const { id } of obj.d.a) {
				if (arrowId === id) {
					arrowDead = false;
					break;
				}
			}
			if (arrowDead) delete arrows[arrowId]
		}
	}


}
