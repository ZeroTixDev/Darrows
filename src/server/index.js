console.log('Running server script...');

const {
	collidePlayers,
	createInput,
	updatePlayer,
	collideArrowObstacle,
} = require('../shared/func.js');
const createId = require('./util/createId.js');
const msgpack = require('msgpack-lite')
const Player = require('./player.js');
const Obstacle = require('./obstacle.js');

const wss = require('./setupServer.js')();
const { players, arrows, obstacles, arena } = require('./util/createState.js')();
const { lowest, avg, highest } = require('./util/numArray.js')();
const clients = {};

const spacings = [];
const updateRate = 60;
const startTime = Date.now();
const leader = { id: null, kills: null }
let lastSentPackageTime = null;
let lastSentPlayers = {};
let tick = 0;

const encode = (msg) => msgpack.encode(msg);
const decode = (msg) => msgpack.decode(msg);

setInterval(() => {
	ServerTick()
}, 16);

wss.on('connection', (socket, _request) => {
	const clientId = createId();
	clients[clientId] = socket;
	players[clientId] = new Player(clientId, arena);
	const payload = {
		type: 'init',
		players: _allPlayerPacks(),
		arena,
		obstacles: obstacles.map((ob) => ob.pack()),
		selfId: clientId,
	};
	if (leader.id != null) {
		payload.leader = {
			name: players[leader.id].name,
			kills: players[leader.id].kills,
			id: leader.id
		}
	}

	send(socket, payload);


	for (const playerId of Object.keys(players)) {
		const player = players[playerId];
		if (player.chatMessage != '' && player.chatMessageTimer > 0) {
			send(socket, { type: 'chat', msg: player.chatMessage, id: playerId })
		}
	}

	broadcast({
		type: 'newPlayer',
		id: clientId,
		player: players[clientId].pack(),
	}, [clientId])

	socket.on('message', (data) => {
		try {
			newMessage(decode(data), socket, clientId);
		} catch (e) {
			console.log(e);
		}
	});

	socket.on('close', () => {
		delete clients[clientId];
		delete players[clientId];

		if (leader.id === clientId) {
			leader.id = null;
		}

		broadcast({ type: 'leave', id: clientId })
	});
});


function presentTick() {
	return Math.ceil((Date.now() - startTime) * (updateRate / 1000));
}

function send(ws, obj) {
	ws.send(encode(obj));
}

function _allPlayerPacks() {
	const packs = [];
	for (const playerId of Object.keys(players)) {
		packs.push({
			data: players[playerId].pack(),
			id: playerId
		});
	}
	return packs;
}

function broadcast(obj, except = []) {
	for (const clientId of Object.keys(clients)) {
		if (except.includes(clientId)) {
			continue;
		}
		send(clients[clientId], obj);
	}
}

function validateInput(obj) {
	return true;
}

function newMessage(obj, socket, clientId) {
	if (obj.chat != undefined) {
		if (players[clientId]) {
			console.log(obj.chat.slice(0, 5));
			if (obj.chat.slice(0, 5) == "/name") {
				let newName = obj.chat.slice(6);
				players[clientId].name = newName;
			}
			else if (obj.chat.slice(0, 5) == "/kick") {
				socket.close();
			}
			else {
				players[clientId].chatMessage = obj.chat;
				players[clientId].chatMessageTimer = players[clientId].chatMessageTime;

				broadcast({ type: 'chat', msg: obj.chat, id: clientId })
			}
		}
	}
	if (obj.input && validateInput(obj)) {
		players[clientId].input = obj.data;
	}
	if (obj.ping != null) {
		send(socket, {
			pung: obj.ping
		});
	}
}

function updateWorld() {

	for (const playerId of Object.keys(players)) {
		updatePlayer(players[playerId], players[playerId].input, arena, obstacles, arrows)
	}

	collidePlayers(players, arena, obstacles)

	const dIds = [];
	for (const arrowId of Object.keys(arrows)) {
		const arrow = arrows[arrowId]
		if (!arrow.dead) {
			arrow.x += Math.cos(arrow.angle) * (arrow.speed * (60 * (1 / 60)));
			arrow.y += Math.sin(arrow.angle) * (arrow.speed * (60 * (1 / 60)));
		}
		arrow.life -= 1 / 60;
		if (arrow.life <= 0.5) {
			arrow.alpha = Math.max((arrow.life * 2) / 1, 0);
		}
		if (!arrow.dead && (arrow.x - arrow.radius < 0 || arrow.x + arrow.radius > arena.width || arrow.y - arrow.radius < 0 || arrow.y + arrow.radius > arena.height)) {
			// arrow.life = 0;
			arrow.dead = true;
			arrow.life = Math.min(arrow.life, 0.5);
		}
		if (arrow.dead) {
			arrow.radius += 20 * (1 / 60)
		}
		if (arrow.life <= 0) {
			dIds.push(arrowId)
		}
	}

	for (const id of dIds) {
		delete arrows[id]
	}
	// check arrow collison
	// very expensive operation
	// todo fix speed :D
	for (const arrowId of Object.keys(arrows)) {
		const arrow = arrows[arrowId]
		for (const playerId of Object.keys(players)) {
			if (playerId === arrow.parent) continue;
			const player = players[playerId];
			const distX = arrow.x - player.x;
			const distY = arrow.y - player.y;
			const dist = distX * distX + distY * distY;
			if (!player.dying && !arrow.dead && dist < (arrow.radius + player.radius) ** 2) {
				// collision
				player.dying = true;
				setTimeout(() => {
					if (players[playerId]) {
						players[playerId].spawn()
					}
				}, 500)
				arrow.dead = true;
				arrow.life = Math.min(arrow.life, 0.5);
				if (clients[arrow.parent] && players[arrow.parent]) {
					players[arrow.parent].kills++;
					send(clients[arrow.parent], {
						kill: players[playerId].name,
						kills: players[arrow.parent].kills,
					})
				}
				send(clients[playerId], {
					arrowHit: true,
				})
			}
		}
		if (!arrow.dead) {
			for (const obstacle of obstacles) {
				if (collideArrowObstacle(arrow, obstacle).type) {
					arrow.dead = true;
					arrow.life = Math.min(arrow.life, 0.5)
				}
			}
		}
	}


}


function copyPlayers() {
	const p = {};
	for (const playerId of Object.keys(players)) {
		p[playerId] = players[playerId].pack();
	}
	return p;
}


function takeSnapshots() {
	const expectedTick = presentTick();

	while (tick < expectedTick) {
		// take a snapshot
		updateWorld();
		tick++;
	}
}


function sendWorldState() {
	const state = { players: [], arrows };

	for (const clientId of Object.keys(clients)) {
		const player = players[clientId];
		if (lastSentPlayers[clientId] == null || player.isDifferent(lastSentPlayers[clientId])) {
			state.players.push({
				id: clientId,
				data: player.differencePack(lastSentPlayers[clientId]),
			});

		}
	}


	lastSentPlayers = copyPlayers()

	if (lastSentPackageTime == null) {
		lastSentPackageTime = Date.now();
	} else {
		if (spacings.length > 120) {
			spacings.shift()
		}
		spacings.push(Date.now() - lastSentPackageTime);
		lastSentPackageTime = Date.now();
	}

	let leaderChange = false;

	for (const playerId of Object.keys(players)) {
		const player = players[playerId];
		if (leader.id == null) {
			leader.id = playerId;
			leader.kills = player.kills;
			leaderChange = true;
			continue;
		}
		if (player.kills > players[leader.id].kills) {
			leader.id = playerId;
			leader.kills = players[leader.id].kills;
			leaderChange = true;
		}
		if (playerId === leader.id && player.kills > leader.kills) {
			leaderChange = true;
			leader.kills = player.kills;
		}
	}

	const obj = {
		type: 'state', data: state,
		spacing: [lowest(spacings).toFixed(1), avg(spacings).toFixed(1), highest(spacings).toFixed(1)],
	}

	if (leaderChange) {
		obj.leader = { name: players[leader.id].name, kills: leader.kills, id: leader.id };
	}


	broadcast(obj);


}

let serverTickMs = 0;

function ServerTick() {
	let before = Date.now();
	takeSnapshots();
	sendWorldState();
	const time = Date.now() - before;
	serverTickMs += time;
}

setInterval(() => {
	broadcast({ serverTickMs });
	serverTickMs = 0;
}, 1000)