console.log('Running server script...');

const {
	collidePlayers,
	createInput,
	updatePlayer,
} = require('../shared/func.js');
const createId = require('./util/createId.js');
const msgpack = require('msgpack-lite')
const Player = require('./player.js');
const Obstacle = require('./obstacle.js');
const hash = require('./util/hash.js');

const hashedKey = 'b4579ebfe636fac6142d095f0e3b6f7676db215ee8873b3b96c376cd655b25ca';

const wss = require('./setupServer.js')();
const { players, arrows, obstacles, arena } = require('./util/createState.js')();
const { lowest, avg, highest } = require('./util/numArray.js')();
const clients = {};

const spacings = [];
const updateRate = 60;
const startTime = Date.now();
const leader = { id: null, kills: null }
let lastSent = { players: {}, arrows: {} };
let lastSentPackageTime = null;
let tick = 0;

const encode = (msg) => msgpack.encode(msg);
const decode = (msg) => msgpack.decode(msg);

setInterval(() => {
	ServerTick()
}, 16);

wss.on('connection', (socket, _request) => {
	const clientId = createId();
	clients[clientId] = socket;

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
	if (obj.joinGame && players[clientId] == null) {
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

		send(socket, {
			fric: players[clientId].fric,
			speed: players[clientId].speed,
		})

		broadcast({
			type: 'newPlayer',
			id: clientId,
			player: players[clientId].pack(),
		}, [clientId])
	}
	if (obj.ping != null) {
		send(socket, {
			pung: obj.ping
		});
	}
	if (obj.type === 'spawn' && players[clientId] == null) {
		players[clientId] = new Player(clientId, arena);
		const player = players[clientId];
		console.log(clients[clientId]._playerStats);
		if (clients[clientId]._playerStats != null) {
			console.log(clients[clientId]._playerStats)
			const { kills, deaths, arrowsHit, arrowsShot } = clients[clientId]._playerStats;
			player.kills = kills;
			player.deaths = deaths;
			player.arrowsHit = arrowsHit;
			player.arrowsShot = arrowsShot;
		}
		if (clients[clientId]._name) {
			player.name = clients[clientId]._name;
		}
		return broadcast({
			type: 'newPlayer',
			id: clientId,
			player: players[clientId].pack(),
		}, [])
	}
	if (!players[clientId]) {
		return;
	}
	if (obj.chat != undefined) {
		if (players[clientId]) {
			console.log(obj.chat.slice(0, 5));
			if (obj.chat.slice(0, 5) == "/name") {
				let newName = obj.chat.slice(6);
				players[clientId].name = newName;
			} else if (obj.chat.slice(0, 5) == "/kick") {
				socket.close();
				// } else if (obj.chat.slice(0, 5) == '/fric') {
				// 	players[clientId].fric = Number(obj.chat.slice(6).trim())
				// 	send(socket, {
				// 		fric: players[clientId].fric,
				// 		speed: players[clientId].speed,
				// 	})
				// } else if (obj.chat.slice(0, 6) == '/speed') {
				// 	players[clientId].speed = Number(obj.chat.slice(7).trim());
				// 	send(socket, {
				// 		fric: players[clientId].fric,
				// 		speed: players[clientId].speed,
				// 	})
			} else {
				players[clientId].chatMessage = obj.chat;
				players[clientId].chatMessageTimer = players[clientId].chatMessageTime;

				broadcast({ type: 'chat', msg: obj.chat, id: clientId })
			}
		}
	}
	if (obj.input && validateInput(obj)) {
		players[clientId].input = obj.data;
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
		arrow.update(arena, obstacles)
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
				player.arrowing = 0;
				players[playerId].deaths++;
				setTimeout(() => {
					if (clients[playerId]) {
						clients[playerId]._playerStats = players[playerId].stats();
						clients[playerId]._name = players[playerId].name;


						delete players[playerId]


						if (leader.id === playerId) {
							leader.id = null;
						}

						broadcast({ type: 'leave', id: playerId })

						send(clients[playerId], {
							type: 'stats',
							kills: player.kills,
							deaths: player.deaths,
							kdr: player.kills / player.deaths,
							accuracy: player.accuracy(),
						});
					}
				}, 500)
				arrow.die()
				if (clients[arrow.parent] && players[arrow.parent]) {
					players[arrow.parent].kills++;
					players[arrow.parent].arrowsHit++;
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
		// if (!arrow.dead) {
		// 	for (const obstacle of obstacles) {
		// 		if (collideArrowObstacle(arrow, obstacle).type) {
		// 			arrow.die()
		// 		}
		// 	}
		// }
	}


}


function copyPacks(obj) {
	const p = {};
	for (const id of Object.keys(obj)) {
		p[id] = obj[id].pack();
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

function isDifferent(obj1, obj2) {
	for (const key of Object.keys(obj2)) {
		if (obj1[key] !== obj2[key]) {
			return true;
		}
	}
	return false;
}


function sendWorldState() {
	const state = { players: [], arrows: [] };

	for (const clientId of Object.keys(players)) {
		const player = players[clientId];
		if (lastSent.players[clientId] == null || isDifferent(player, lastSent.players[clientId])) {
			state.players.push({
				id: clientId,
				data: player.differencePack(lastSent.players[clientId]),
			});

		}
	}

	for (const arrowId of Object.keys(arrows)) {
		const arrow = arrows[arrowId];
		if (lastSent.arrows[arrowId] == null || isDifferent(arrow, lastSent.arrows[arrowId])) {
			state.arrows.push({
				id: arrowId,
				data: arrow.differencePack(lastSent.arrows[arrowId]),
			})
		}
	}

	lastSent.players = copyPacks(players);
	lastSent.arrows = copyPacks(arrows)

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
		// spacing: [lowest(spacings).toFixed(1), avg(spacings).toFixed(1), highest(spacings).toFixed(1)],
	}

	if (state.players.length > 0 || state.arrows.length > 0) {
		obj.type = 'state';
		obj.data = state;
	}

	if (leaderChange) {
		obj.leader = { name: players[leader.id].name, kills: leader.kills, id: leader.id };
	}

	if (Object.keys(obj).length > 0) {
		broadcast(obj);
	}


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