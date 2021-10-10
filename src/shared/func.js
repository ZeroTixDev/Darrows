
	const { Circle, Vector, Response, testPolygonCircle } = require('sat')

const createInput = require('./createInput.js')



// console.log('example input', createInput())

function copyInput(input) {
	const copy = {};
	for (const key of Object.keys(input)) {
		copy[key] = input[key];
	}
	return copy;
}

// function simulatePlayer(player, arena) {
// 	if (player.dying) {
// 		player.radius -= 60 * (1 / 60);
// 		if (player.radius <= 20) {
// 			player.radius = 20;
// 			player.respawn = true;
// 		}
// 	}
// }

function createArrow(player) {
	return {
		x: player.x + Math.cos(player.angle) * (player.radius - player.arrowing * 20),
		y: player.y + Math.sin(player.angle) * (player.radius - player.arrowing * 20),
		angle: player.angle,
		radius: 10,
		life: 2.5,
		speed: 8 + (player.arrowing / 3) * 22,
		alpha: 1,
		dead: false,
		parent: player.id,
	}
}

function updatePlayer(player, input, arena, obstacles, arrows) {
	if (!player) return;
	if (!player.dying) {
		player.xv += (input.right - input.left) * ((player.arrowing > 0 ? 70: 110) * 1 / 60);
		player.yv += (input.down - input.up) * ((player.arrowing > 0 ? 70: 110) * 1 / 60);
		// if (input.space && player.timer <= 0) { // spacelock isnt being used rn
		// 	// create arrowx
		// 	player.xv -= Math.cos(player.angle) * 5;
		// 	player.yv -= Math.sin(player.angle) * 5;
		// 	player.timer = 0.9;
		// 	player.arrows.push(createArrow(player))
		// 	player.spaceLock = true;
		// }

		if (input.space && player.timer <= 0) {
			player.arrowing += (1 / 60) * 2;
			if (player.arrowing >= 3) {
				player.arrowing = 3;
			}
			if (input.arrowLeft) {
				player.angleVel -= 2.9 * (1 / 60);
			}
			if (input.arrowRight) {
				player.angleVel += 2.9 * (1 / 60);
			}
			player.angle += player.angleVel;
			player.angleVel = 0;
		} else {
			if (player.arrowing > 0) {
				// shoot
				arrows[Math.random()] = (createArrow(player))
				player.timer = player.timerMax;
				// console.log('shoot', player.arrows)
			}
			player.arrowing = 0;
		}

		player.timer -= (1 / 60);
		if (player.timer <= 0) {
			player.timer = 0;
		}


		player.x += player.xv;
		player.y += player.yv;


		// player.angle = input.angle;
		// player.angleVel *= 0.1;
		if (player.angle > Math.PI) {
			player.angle -= Math.PI * 2;
		}
		if (player.angle < -Math.PI) {
			player.angle += Math.PI * 2
		}
		player.xv *= Math.pow(0.7, (1 / 60) * 60);
		player.yv *= Math.pow(0.7, (1 / 60) * 60);
		if (!input.space) {
			player.spaceLock = false;
		}
		// player.angleVel *= 0;
	} else {
		player.radius -= 60 * (1 / 60);
		if (player.radius <= 20) {
			player.radius = 20;
			player.respawn = true;
		}
	}

	for (const obstacle of obstacles) {
		boundPlayerObstacle(player, obstacle)
	}


	boundPlayer(player, arena)




	player.timer -= 1 / 60;
	if (player.timer <= 0) {
		player.timer = 0;
	}
	// boundPlayer(player);
}


function boundPlayerObstacle(player, obstacle) {
	const rectHalfSizeX = obstacle.width / 2;
	const rectHalfSizeY = obstacle.height / 2;
	const rectCenterX = obstacle.x + rectHalfSizeX;
	const rectCenterY = obstacle.y + rectHalfSizeY;
	const distX = Math.abs(player.x - rectCenterX);
	const distY = Math.abs(player.y - rectCenterY);
	if (distX < rectHalfSizeX + player.radius && distY < rectHalfSizeY + player.radius) {
		const playerSat = new Circle(new Vector(player.x, player.y), player.radius);
		const res = new Response();
		const collision = testPolygonCircle(obstacle.sat, playerSat, res);
		if (collision) {
			player.x += res.overlapV.x;
			player.y += res.overlapV.y;
		}
	}
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

function collideArrowObstacle(arrow, obstacle) {
	const rectHalfSizeX = obstacle.width / 2;
	const rectHalfSizeY = obstacle.height / 2;
	const rectCenterX = obstacle.x + rectHalfSizeX;
	const rectCenterY = obstacle.y + rectHalfSizeY;
	const distX = Math.abs(arrow.x - rectCenterX);
	const distY = Math.abs(arrow.y - rectCenterY);
	if (distX < rectHalfSizeX + arrow.radius && distY < rectHalfSizeY + arrow.radius) {
		const arrowSat = new Circle(new Vector(arrow.x, arrow.y), arrow.radius);
		const res = new Response();
		const collision = testPolygonCircle(obstacle.sat, arrowSat, res);
		if (collision) {
			return { type: true, data: res };
		}
	}
	return { type: false };
}

if (module) {
	module.exports = { updatePlayer, copyInput, boundPlayer, collideArrowObstacle, collidePlayers, createInput }
}