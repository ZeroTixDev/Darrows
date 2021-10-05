
function createInput() {
	return { up: false, right: false, left: false, down: false, arrowLeft: false, arrowRight: false, space: false }
}

// console.log('example input', createInput())

function copyInput(input) {
	const copy = {};
	for (const key of Object.keys(input)) {
		copy[key] = input[key];
	}
	return copy;
}

function simulatePlayer(player, arena) {
	if (player.dying) {
		player.radius -= 60 * (1 / 60);
		if (player.radius <= 20) {
			player.radius = 20;
			player.respawn = true;
		}
	}
}

function applyInput(player, input, arena) {
	if (!player) return;
	if (!player.dying) {
		player.xv += (input.right - input.left) * (150 * 1 / 60);
		player.yv += (input.down - input.up) * (150 * 1 / 60);
		if (input.space && !player.spaceLock) {
			player.timer = 1;
			// create arrowx
			player.xv += Math.cos(player.angle) * 5;
			player.yv += Math.sin(player.angle) * 5;
			player.arrows.push({ x: player.x, y: player.y, angle: player.angle, radius: 35, speed: 15, life: 5, })
			player.spaceLock = true;
		}
		player.x += player.xv;
		player.y += player.yv;


		// player.angle = input.angle;
		if (input.arrowLeft) {
			player.angleVel -= 0.05;
		}
		if (input.arrowRight) {
			player.angleVel += 0.05;
		}
		player.angle += player.angleVel;
		player.angleVel = 0;
		// player.angleVel *= 0.1;
		if (player.angle > Math.PI) {
			player.angle -= Math.PI * 2;
		}
		if (player.angle < -Math.PI) {
			player.angle += Math.PI * 2
		}
		player.xv *= 0.65;
		player.yv *= 0.65;
		if (!input.space) {
			player.spaceLock = false;
		}
		// player.angleVel *= 0;
	}
	boundPlayer(player, arena)

	for (let i = player.arrows.length - 1; i >= 0; i--) {
		const arrow = player.arrows[i];
		arrow.x += Math.cos(arrow.angle) * arrow.speed;
		arrow.y += Math.sin(arrow.angle) * arrow.speed;
		arrow.life -= 1 / 60;
		if (arrow.x - arrow.radius < 0 || arrow.x + arrow.radius > arena.width || arrow.y - arrow.radius < 0 || arrow.y + arrow.radius > arena.height) {
			arrow.life = 0;
		}
		if (arrow.life <= 0) {
			player.arrows.splice(i, 1);
		}
	}
	player.timer -= 1 / 60;
	if (player.timer <= 0) {
		player.timer = 0;
	}
	// boundPlayer(player);
}

function collidePlayers(players) {
	for (const i of Object.keys(players)) {
		const player1 = players[i];
		for (const j of Object.keys(players)) {
			if (i === j) continue;
			const player2 = players[j];
			const distX = player1.x - player2.x;
			const distY = player1.y - player2.y;
			if (
				distX * distX + distY * distY <
				player1.radius * 2 * (player2.radius * 2)
			) {
				const magnitude = Math.sqrt(distX * distX + distY * distY) || 1;
				const xv = distX / magnitude;
				const yv = distY / magnitude;
				player1.x = player2.x + (player1.radius + 0.05 + player2.radius) * xv;
				player1.y = player2.y + (player1.radius + 0.05 + player2.radius) * yv;
			}
		}
	}
}

function boundPlayer(player, arena) {
	if (player.x - player.radius < 0) {
		player.x = player.radius;
		player.xv = 0;
	}
	if (player.x + player.radius > arena.width) {
		player.x = arena.width - player.radius;
		player.xv = 0;
	}

	if (player.y - player.radius < 0) {
		player.y = player.radius;
		player.yv = 0;
	}
	if (player.y + player.radius > arena.height) {
		player.y = arena.height - player.radius;
		player.yv = 0;
	}
}

if (module) {
	module.exports = { simulatePlayer, copyInput, boundPlayer, collidePlayers, applyInput, createInput }
}