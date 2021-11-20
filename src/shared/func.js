
const { Circle, Vector, Response, testPolygonCircle } = require('sat')
const Arrow = require('../server/arrow.js');
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

let arrowCounter = 0;

function createArrow(player, arrows, fake = false) {
	arrowCounter++;
	arrows[arrowCounter] = new Arrow(player, fake)
}

function updatePlayer(player, input, arena, obstacles, arrows) {
	if (!player) return;
	if (!player.dying) {
		player.abilityCooldown -= dt;
		if (player.abilityCooldown <= 0) {
			player.abilityCooldown = 0;
		}

		// Kronos/Klaydo
		if (player.freezing) {
			player.timeSpentFreezing += dt;
		}

		if (player.character.Ability != null) {
			// Kronos/Klaydo
			if (player.character.Ability.name === 'Freeze-Arrow') {
				let newestArrow = null;
				let freezedArrow = false;
				for (const arrow of Object.values(arrows)) {
					if (arrow.parent != player.id) continue;
					if (newestArrow == null || arrow.c < newestArrow.c) {
						newestArrow = arrow;
					}
					if ((!input.shift && arrow.freezed) ||
						(arrow.freezed && player.timeSpentFreezing >= player.timeFreezeLimit) || (arrow.freezed && arrow.dead && arrow.life <= dt
							/* im using dt instead of 0 because player updates before arrow which detects deleting afterward*/)) {
						arrow.unfreeze();
						player.freezing = false;
						player.abilityCooldown = 0.5 + player.timeSpentFreezing * 1.5;
						player.maxCd = player.abilityCooldown;
						player.timeSpentFreezing = 0;
						// console.log(arrow)
					}
					if (arrow.freezed) {
						freezedArrow = true;
					}
				}
				if (newestArrow != null && !freezedArrow && input.shift && player.abilityCooldown <= 0) {
					newestArrow.freeze()
					// console.log(newestArrow)
					player.freezing = true;
				}
			}

			// Scry
			if (player.character.Ability.name === 'Fake-Arrow') {
				if (!player.passive && player.arrowing > 0 && !player.fakedArrowLastTime && input.shift && !player.fakedArrow) {
					createArrow(player, arrows, true);
					player.fakedArrow = true;
					player.noAim = player.noAimTime;
					player.showAim = false;
					// player.fakedArrowLastTime = true;
				}
				if (!player.passive && player.arrowing <= 0) {
					player.fakedArrow = false;
				}
				player.noAim -= dt;
				if (player.noAim <= 0) {
					player.showAim = true;
				}
			}
		}

		const dir = {
			x: (input.right - input.left),
			y: (input.down - input.up),
		};
		const mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
		const normal = { x: dir.x / mag, y: dir.y / mag };

		player.xv += normal.x * ((player.arrowing > 0 ? player.speed * 0.75 : player.speed) * dt);
		player.yv += normal.y * ((player.arrowing > 0 ? player.speed * 0.75 : player.speed) * dt);
		// if (input.space && player.timer <= 0) { // spacelock isnt being used rn
		// 	// create arrowx
		// 	player.xv -= Math.cos(player.angle) * 5;
		// 	player.yv -= Math.sin(player.angle) * 5;
		// 	player.timer = 0.9;
		// 	player.arrows.push(createArrow(player))
		// 	player.spaceLock = true;
		// }
		if (!player.passive) {
			if (input.space && player.timer <= 0) {
				player.arrowing += dt * 2;
				if (player.arrowing >= 3) {
					player.arrowing = 3;
				}
				if (input.arrowLeft) {
					player.angleVel -= 2.7 * dt;
				}
				if (input.arrowRight) {
					player.angleVel += 2.7 * dt;
				}
				player.angle += player.angleVel;
				player.angleVel = 0;
			} else {
				if (player.arrowing > 0 && player.timer <= 0) {
					// shoot
					player.arrowsShot++;
					createArrow(player, arrows)
					player.timer = player.timerMax;
					if (player.character.Ability != null && player.character.Ability.name === 'Fake-Arrow') {
						player.noAim = 0;
						if (player.fakedArrowLastTime) {
							player.fakedArrowLastTime = false;
						} else if (player.fakedArrow) {
							player.fakedArrowLastTime = true;
						}
					}
					// console.log('shoot', player.arrows)
				}
				player.arrowing = 0;
			}

			player.timer -= dt;
			if (player.timer <= 0) {
				player.timer = 0;
			}
		}



		player.x += player.xv * (60 * dt);
		player.y += player.yv * (60 * dt);

		// player.angle = input.angle;
		// player.angleVel *= 0.1;
		if (!player.passive) {
			if (player.angle > Math.PI) {
				player.angle -= Math.PI * 2;
			}
			if (player.angle < -Math.PI) {
				player.angle += Math.PI * 2
			}
		}
		player.xv *= Math.pow(player.fric, dt * 60);
		player.yv *= Math.pow(player.fric, dt * 60);


		if (!input.space) {
			player.spaceLock = false;
		}
		// player.angleVel *= 0;
	} else {
		player.radius -= 60 * dt;
		if (player.radius <= 1) {
			player.radius = 1;
			player.respawn = true;
		}
	}




	// boundPlayer(player, arena, obstacles)




	player.timer -= dt;
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
			if (obstacle.type === 'point' && !player.passive) {
				player.score += 5 * dt;
			} else {
				player.x += res.overlapV.x;
				player.y += res.overlapV.y;

				if (Math.abs(res.overlapV.y) > Math.abs(res.overlapV.x)) {
					if (obstacle.type == "obstacle") {
						player.yv = 0;
					}
					else if (obstacle.type == "bounce") {
						player.yv = Math.sign(res.overlapV.y) * obstacle.effect;
					}
				} else {
					if (obstacle.type == "obstacle") {
						player.xv = 0;
					}
					else if (obstacle.type == "bounce") {
						player.xv = Math.sign(res.overlapV.x) * obstacle.effect;
					}
				}
			}

		}
	}
}

function collidePlayers(players, arena, obstacles) {
	const keys = Object.keys(players)
	for (let i = 0; i < keys.length; i++) {
		const player1 = players[keys[i]];
		for (let j = 0; j < keys.length; j++) {
			if (i >= j) continue;
			const player2 = players[keys[j]];
			const distX = player1.x - player2.x;
			const distY = player1.y - player2.y;
			if (!player1.passive && !player2.passive &&
				distX * distX + distY * distY <
				player1.radius * 2 * (player2.radius * 2)
			) {
				const magnitude = Math.sqrt(distX * distX + distY * distY) || 1;
				const xv = (distX / magnitude);
				const yv = (distY / magnitude);
				const oldP = { x: player1.x, y: player1.y }
				player1.x = player2.x + ((player1.radius + 0.05 + player2.radius) * (xv))
				player1.y = player2.y + ((player1.radius + 0.05 + player2.radius) * (yv));
				player2.x = oldP.x - ((player1.radius + 0.05 + player2.radius) * (xv));
				player2.y = oldP.y - ((player1.radius + 0.05 + player2.radius) * (yv))
				// boundPlayer(player2, arena, obstacles)
			}
		}
		boundPlayer(player1, arena, obstacles)
	}
}

function boundPlayer(player, arena, obstacles) {
	for (const obstacle of obstacles) {
		boundPlayerObstacle(player, obstacle)
	}
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


// if (module) {
module.exports = { updatePlayer, copyInput, boundPlayer, collidePlayers, createInput }
// }