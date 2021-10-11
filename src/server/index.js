console.log('Running server script...');

const {
	collidePlayers,
	createInput,
	updatePlayer,
	collideArrowObstacle,
} = require('../shared/func.js');
const Raycast = require('../shared/raycast.js');
const express = require('express');
const path = require('path')
const WebSocket = require('ws');
const msgpack = require('msgpack-lite')
const uuid = require('uuid');
// const Loop = require('accurate-game-loop')
// const gameloop = require('node-gameloop')
const Player = require('./player.js');
const Obstacle = require('./obstacle.js');
const wss = new WebSocket.Server({
	noServer: true
});
const app = express();
const PORT = process.env.PORT || 80;
const server = app.listen(PORT,
	() => console.log(`Server started on Port ${PORT}`));

app.use(express.static('src/client'));

app.get('/', (request, result) => {
	result.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/shared/:fileName', (request, result) => {
	result.sendFile(path.join(__dirname, String('../shared/' + request.params.fileName)));
});

server.on('upgrade', (request, socket, head) => {
	wss.handleUpgrade(request, socket, head, (socket) => {
		wss.emit('connection', socket, request);
	});
});

const players = {};
const clients = {};
const arrows = {};
const obstacles = [ 
	new Obstacle(750, 500, 100, 200),
	new Obstacle(1150, 500, 100, 200),
	new Obstacle(950, 900, 100, 100)
]
const arena = {
	width: 2000,
	height: 1500,
};
const spacings = [];
// const tickRate = 60;
const pingRate = 10;
const updateRate = 60;
const startTime = Date.now();
const history = {};
const pings = {};
const maximumAllowedPingForCompensation = 400;
const historyMaxSize = Math.round(
	maximumAllowedPingForCompensation / (1000 / updateRate)
);
let lastSentPackageTime = null;
let lastSentPlayers = {};
// console.log('max history size', historyMaxSize)
let tick = 0;

const encode = (msg) => msgpack.encode(msg);
const decode = (msg) => msgpack.decode(msg)


// new Loop(() => {
// 	ServerTick();
// }, tickRate).start();

// gameloop.setGameLoop(ServerTick, Math.round(1000 / tickRate)); 

function highest(arr) {
	let h = -Infinity;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] > h) {
			h = arr[i]
		}
	}
	return h;
}

function avg(arr) {
	return arr.reduce((a, b) => a + b, 0) / arr.length
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

// accurate-game-loop for heroku*

setInterval(() => {
	ServerTick()
}, 16);

setInterval(() => {
	for (const clientId of Object.keys(clients)) {
		send(clients[clientId], {
			ping: tick,
		})
	}
	// console.log(tick)
}, 1000 / pingRate)

wss.on('connection', (socket, _request) => {
	const clientId = createId();
	clients[clientId] = socket;
	pings[clientId] = 0;
	players[clientId] = new Player(clientId);

	console.log('new client', clientId);

	send(socket, {
		type: 'init',
		players: _allPlayerPacks(),
		arena,
		obstacles: obstacles.map((ob) => ob.pack()),
		selfId: clientId,
		tick: presentTick(),
	});

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
		console.log('client left', clientId);
		delete clients[clientId];
		delete players[clientId];
		delete pings[clientId];

		broadcast({ type: 'leave', id: clientId })
	});
});

function createId() {
	return uuid.v4().slice(0, 6)
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
	// console.log(obj, 'obj')
	if (obj.pung != undefined) {
		pings[clientId] = Math.floor((presentTick() - obj.pung) / 2);
		send(socket, {
			serverPing: pings[clientId],
		});
	}
	if (obj.debug !== undefined) {
		console.log(obj.debug)
	}
	// if (obj.lastInput && validateInput(obj)) {
	// 	if (inputMessages[obj.id] == null) {
	// 		inputMessages[obj.id] = [];
	// 	}
	// 	inputMessages[obj.id].push({
	// 		id: obj.id,
	// 		data: players[obj.id].lastReceivedInput,
	// 		tick: obj.tick,
	// 	})
	// }
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
			arrow.radius += 20 * (1/60)
		}
		if (arrow.life <= 0) {
			dIds.push(arrowId)
			// player.arrows.splice(i, 1);
		}
	}

	for (const id of dIds) {
		delete arrows[id]
		// console.log('arrows length', Object.keys(arrows).length)
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
			if (!arrow.dead && dist < (arrow.radius + player.radius) ** 2) {
				// collision
				player.dying = true;
				setTimeout(() => {
					if (players[playerId]) {
						players[playerId].spawn()
					}
				}, 500)
				arrow.dead = true;
				arrow.life = Math.min(arrow.life, 0.5);
				if (clients[arrow.parent]) {
					send(clients[arrow.parent], {
						kill: players[playerId].name,
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
// for (const id of Object.keys(inputMessages)) {
// 	inputMessages[id] = []
// }
// collidePlayers(players)
// }

function copyPlayers() {
	const p = {};
	for (const playerId of Object.keys(players)) {
		p[playerId] = players[playerId].pack();
	}
	return p;
}

function oldestHistory() {
	return history[Object.keys(history)[0]];
}

function getSnapshot(tick) {
	if (tick < Object.keys(history)[0]) {
		return oldestHistory();
	}
	return history[tick];
}

function takeSnapshots() {
	const expectedTick = presentTick();

	while (tick < expectedTick) {
		// take a snapshot
		updateWorld();
		history[tick] = {
			players: copyPlayers()
		};
		if (Object.keys(history).length > historyMaxSize) {
			delete history[Object.keys(history)[0]];
		}
		tick++;
	}
}


function sendWorldState() {
	const state = { players: [], arrows };

	for (const clientId of Object.keys(clients)) {
		const player = players[clientId];
		// if (lastSentPlayers[clientId] == null || player.isDifferent(lastSentPlayers[clientId])) {
		state.players.push({
			id: clientId,
			data: player.pack(),
		});

		// }
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

	broadcast({ type: 'state', data: state, spacing: [lowest(spacings).toFixed(1), avg(spacings).toFixed(1), highest(spacings).toFixed(1)], });

	// console.log(state)

}

let last = Date.now();

function ServerTick() {
	takeSnapshots();
	sendWorldState();
}