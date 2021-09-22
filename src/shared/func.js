

function copyInput(input) {
	return {
		up: input.up,
		left: input.left,
		right: input.right,
		down: input.down,
		angle: input.angle,
	};
}

function applyInput(player, input, arena) {
  if (!player) return;
	player.xv += (input.right - input.left) * 2;
	player.yv += (input.down - input.up) * 2;
	player.x += player.xv;
	player.y += player.yv;
	player.angle = input.angle;
	player.xv *= 0.65;
	player.yv *= 0.65;
	boundPlayer(player, arena)
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
  module.exports = { copyInput, boundPlayer,collidePlayers, applyInput }
}