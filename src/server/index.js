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

const hashedKey = '873966b053c331257235d4fac61cd5f5fc7dd78e7818fb28d36bb449b9d6b25c';


const Round = require('./round.js')
const wss = require('./setupServer.js')();
const { players, arrows, obstacles, arena } = require('./util/createState.js')();
const { lowest, avg, highest } = require('./util/numArray.js')();
const { reachedIpLimit } = require('./util/ip.js');
const clients = {};

const spacings = [];
const updateRate = 60;
const ipLimit = 4;
const startTime = Date.now();
const leader = { id: null, score: null }
let lastSent = { players: {}, arrows: {} };
let lastSentPackageTime = null;
let tick = 0;

const round = new Round();
const encode = (msg) => msgpack.encode(msg);
const decode = (msg) => msgpack.decode(msg);

setInterval(() => {
	ServerTick()
}, 16);

wss.on('connection', (socket, req) => {
	const clientId = createId();
	const ip = hash(String(req.headers['x-forwarded-for'] || req.connection.remoteAddress));
	if (reachedIpLimit(
		Object.keys(clients).map((id) => clients[id]._ip),
		ip, ipLimit)) {
		socket.terminate()
	}
	clients[clientId] = socket;
	clients[clientId]._ip = ip;

	

	socket.on('message', (data) => {
		try {
			newMessage(decode(data), socket, clientId);
		} catch (e) {
			console.log(e);
		}
	});

	socket.on('close', () => {
		if (clients[clientId]) {
			delete clients[clientId];
		}
		if (players[clientId]) {
			delete players[clientId];
			broadcast({ type: 'leave', id: clientId })
		}

		if (leader.id === clientId) {
			leader.id = null;
		}

		if (Object.keys(players).length === 0) {
			round.end()
		}
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
	if (obj.joinE !== undefined && players[clientId] == null) {
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

		if (round.state === 'none') {
			round.start()
		}
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
			const { kills, deaths, arrowsHit, arrowsShot, score, dev } = clients[clientId]._playerStats;
			player.kills = kills;
			player.deaths = deaths;
			player.arrowsHit = arrowsHit;
			player.arrowsShot = arrowsShot;
			player.score = score;
			player.dev = dev;
		}
		if (clients[clientId]._name != undefined) {
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
	// } else if (players[clientId].dev && obj.chat.slice(0, 5) == "/kick") {
			// 	const id = obj.chat.slice(6).trim();
			// 	if (players[id]) {
			// 		send(clients[id], { kick: true })
			// 		clients[id].close()
			// 	}
			// } 
	if (obj.chat != undefined) {
		if (players[clientId]) {
			console.log(obj.chat.slice(0, 5));
			if (obj.chat.slice(0, 5) == "/name") {
				let newName = obj.chat.slice(6);
				players[clientId].name = newName;

			} else if (hash(obj.chat.trim()) === hashedKey) {
				players[clientId].dev = !players[clientId].dev;
			} else if (obj.chat.trim() === '/passive') {
				players[clientId].passive = !players[clientId].passive;
				players[clientId].score = 0;	
				console.log(players[clientId].passive)
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
			if (!player.dying && !player.passive && !arrow.dead && dist < (arrow.radius + player.radius) ** 2) {
				// collision
				player.dying = true;
				player.arrowing = 0;
				players[playerId].deaths++;
				setTimeout(() => {
					if (clients[playerId]) {
						players[playerId].negateScore(25);
						
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
				if (clients[arrow.parent] && players[arrow.parent]) {
					players[arrow.parent].kills++;
					players[arrow.parent].addScore(100)
					if (arrow.slided) {
						players[arrow.parent].addScore(25)
					}
					if (arrow.max) {
						players[arrow.parent].addScore(25)
					}
					players[arrow.parent].arrowsHit++;
					send(clients[arrow.parent], {
						kill: players[playerId].name,
						kills: players[arrow.parent].kills,
					})
				}
				send(clients[playerId], {
					arrowHit: true,
				})
				arrow.die()
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
		round.tick(1/updateRate)
		tick++;
	}
}

function isDifferent(obj1, obj2) {
	for (const key of Object.keys(obj2)) {
		if (obj1[key] !== obj2[key]) {
			// console.log(key, obj1[key], obj2[key])
			return true;
		}
	}
	return false;
}


function sendWorldState() {
	const state = { players: [], arrows: [] };

	for (const clientId of Object.keys(players)) {
		const player = players[clientId];
		if (lastSent.players[clientId] == null || isDifferent(player.pack(), lastSent.players[clientId])) {
			state.players.push({
				id: clientId,
				data: player.differencePack(lastSent.players[clientId]),
			});

		}
	}

	for (const arrowId of Object.keys(arrows)) {
		const arrow = arrows[arrowId];
		if (lastSent.arrows[arrowId] == null || isDifferent(arrow.pack(), lastSent.arrows[arrowId])) {
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
			leader.score = player.score;
			leaderChange = true;
			continue;
		}
		if (player.score > players[leader.id].score) {
			leader.id = playerId;
			leader.score =  player.score;
			leaderChange = true;
		}
		if (playerId === leader.id && player.kills> leader.score) {
			leaderChange = true;
			leader.score = player.score;
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
		obj.leader = { name: players[leader.id].name, id: leader.id };
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