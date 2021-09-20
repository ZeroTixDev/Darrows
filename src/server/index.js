console.log('Running server script...');

const {
	applyInput,
	// collidePlayers
} = require('../shared/func.js');
const express = require('express');
const path = require('path')
const WebSocket = require('ws');
const msgpack = require('msgpack-lite')
const uuid = require('uuid');
// const Loop = require('accurate-game-loop')
const gameloop = require('node-gameloop')
const Player = require('./player.js');
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
let lastSentPlayers = {};
let inputMessages = {};
const arena = {
	width: 1500,
	height: 1500,
};
const spacings = [];
let lastSentPackageTime = null;
const rotator = { timer: 0, x: arena.width / 2, y: arena.height / 2, cx: arena.width / 2, cy: arena.height / 2 }
const tickRate = 60;
const updateRate = 60;
const startTime = Date.now();
const history = {};
const lastProcessedInputTick = {};
const maximumAllowedPingForCompensation = 400;
const historyMaxSize = Math.round(
	maximumAllowedPingForCompensation / (1000 / updateRate)
);
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

setInterval(() => {
	ServerTick()
}, 1000 / tickRate);

wss.on('connection', (socket, _request) => {
	const clientId = createId();
	clients[clientId] = socket;
	players[clientId] = new Player(Math.round(Math.random() * 100), Math.round(Math.random() * 100));

	console.log('new client', clientId);

	send(socket, {
		type: 'init',
		players: _allPlayerPacks(),
		arena,
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
			newMessage(decode(data), socket);
		} catch (e) {
			console.log(e);
		}
	});

	socket.on('close', () => {
		console.log('client left', clientId);
		delete clients[clientId];
		delete players[clientId];

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
	if (obj.tick < presentTick() && clients[obj.id] != undefined && presentTick() + Math.ceil(updateRate * 0.5) >= obj.tick) {
		return true;
	}
	return false;
}

function newMessage(obj, socket) {
	// console.log(obj, 'obj')
	if (obj.debug !== undefined) {
		console.log(obj.debug)
	}
	if (obj.lastInput && validateInput(obj)) {
		if (inputMessages[obj.id] == null) {
			inputMessages[obj.id] = [];
		}
		inputMessages[obj.id].push({
			id: obj.id,
			data: players[obj.id].lastReceivedInput,
			tick: obj.tick,
		})
	}
	if (obj.input && validateInput(obj)) {
		if (inputMessages[obj.id] == null) {
			inputMessages[obj.id] = [];
		}
		inputMessages[obj.id].push({
			id: obj.id,
			data: obj.data,
			tick: obj.tick
		});
		players[obj.id].lastReceivedInput = obj.data;
	}
	if (obj.ping != null) {
		send(socket, {
			pung: obj.ping
		});
	}
}

function processInputs() {
	// comes in order (inputMessages)
	for (const id of Object.keys(inputMessages)) {
		while (inputMessages[id][0] != undefined) {
			const {
				data,
				tick
			} = inputMessages[id][0];

			applyInput(players[id], data, arena);
			lastProcessedInputTick[id] = tick;
			inputMessages[id].shift()
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
	return this.history[Object.keys(this.history)[0]];
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
		processInputs();
		updateServerControlledObjects();
		history[tick] = {
			players: copyPlayers()
		};
		if (Object.keys(history).length > historyMaxSize) {
			delete history[Object.keys(history)[0]];
		}
		tick++;
	}
}

function updateServerControlledObjects() {
	const delta = 1 / updateRate;
	rotator.timer += delta * 3;
	rotator.x = rotator.cx + Math.cos(rotator.timer) * 250;
	rotator.y = rotator.cy + Math.sin(rotator.timer) * 250;
}

function sendWorldState() {
	const state = { players: [] };

	for (const clientId of Object.keys(clients)) {
		const player = players[clientId];
		if (lastSentPlayers[clientId] == null || player.isDifferent(lastSentPlayers[clientId])) {
			state.players.push({
				id: clientId,
				data: player.pack(),
				last_processed_input: lastProcessedInputTick[clientId]
			});
		}
	}


	lastSentPlayers = copyPlayers()

	if (lastSentPackageTime == null) {
		lastSentPackageTime = Date.now();
	} else {
		if (spacings.length > 10) {
			spacings.shift()
		}
		spacings.push(Date.now() - lastSentPackageTime);
		lastSentPackageTime = Date.now();
	}

	broadcast({ type: 'state', data: state, spacing: [lowest(spacings).toFixed(1), avg(spacings).toFixed(1), highest(spacings).toFixed(1)], rotator: { x: rotator.x, y: rotator.y } });

	// console.log(state)

}


function ServerTick() {
	takeSnapshots();
	sendWorldState();
}