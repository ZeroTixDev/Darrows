window.delta = 0;
window.debug = false;
window._interpolate = true;
window._predict = false;
window.serverTickMs = 0;
window.stutter = false;
window.redness = 0;
window.showSnapshots = false;
window.mouse = { x: 0, y: 0 };
window.lerpRate = 30;
window.extraLag = 0;
window.inputsBuffered = 0;
window.fric = -1;
window.speed = -1;
window.autoRespawn = false;
window.movementMode = 'wasd';
window.font = 'Inter'
window.fps = 60;
window.overlayAlpha = 0;
window.overlaying = false;
window.times = [];
window.tab = false;
window.ghue = 0;

function changeMovMode() {
	if (window.movementMode === 'wasd') {
		window.movementMode = 'arr'
	} else {
		window.movementMode = 'wasd'
	}
}

let iExist = false;
let chatOpen = false;
let dead = false;
let killedPlayerName = '';
let killedNotifTime = 0;
let _kills = 0;
let lastTime = window.performance.now()
let xoff = 0;
let yoff = 0;
let shotPlayers = {}
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
// let messages = [];
let leader = null;

/* state */

const players = {};
const arrows = {}
let obstacles = []

/* state */

let input = createInput();
const gui = ref.gui
const canvas = ref.canvas
const ctx = canvas.getContext('2d')
const width = 1600;
const height = 900;
const updateRate = 60;
const camera = { x: null, y: null }
let ws = null;

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
const arrInputs = ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"]
const arrInputCodes = {
	[arrInputs[0]]: { key: "up" },
	[arrInputs[1]]: { key: "left" },
	[arrInputs[2]]: { key: "down" },
	[arrInputs[3]]: { key: "right" },
	Space: { key: 'space' }
}



function run(time =  0) {
	fpsTick(time)
	// processMessages();

	window.dt = (window.performance.now() - lastTime) / 1000;
	window.delta = getDelta(lastTime);
	window.redness -= dt * 1.5;
	if (window.redness <= 0) window.redness = 0;
	killedNotifTime -= dt * 1.5;
	if (killedNotifTime <= 0) killedNotifTime = 0;
	lastTime = window.performance.now();
	ghue += dt * 360 * 2;

	if (overlaying) {
		overlayAlpha += dt;
		if (overlayAlpha > 0.6) {
			overlayAlpha = 0.6;
		}
	}

	for (const playerId of Object.keys(players)) {
		const player = players[playerId];

		player.smooth(delta, playerId === selfId);
		
		player.chatMessageTimer -= dt;

		if (player.chatMessageTimer <= 0) 
			player.chatMessageTimer = 0;
	}

	for (const arrowId of Object.keys(arrows)) {
		arrows[arrowId].smooth(delta)
		if (arrows[arrowId].alpha <= 0) 
			delete arrows[arrowId]
	}

	if (players[selfId] != null) {
		camera.x = players[selfId].pos.x;
		camera.y = players[selfId].pos.y;

		let targetX = players[selfId].arrowing ? 
			-Math.cos(players[selfId].interpAngle) * 100: 0;
		let targetY = players[selfId].arrowing ? 
			-Math.sin(players[selfId].interpAngle) * 100: 0;

		const dtC = Math.min(dt * 2, 1);
		xoff = lerp(xoff, targetX, dtC);
		yoff = lerp(yoff, targetY, dtC)

		if (Math.abs(targetX - xoff) < 0.5) xoff = targetX;
		if (Math.abs(targetY - yoff) < 0.5) yoff = targetY;
	}

	render();
	requestAnimationFrame(run);
}





