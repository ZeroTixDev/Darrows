
const { Circle, Vector, Response, testPolygonCircle } = require('sat')
const Arrow = require('../server/arrow.js');
const createInput = require('./createInput.js')


// console.log(createInput)


// console.log('example input', createInput())

function copyInput(input) {
	const copy = {};
	for (const key of Object.keys(input)) {
		copy[key] = input[key];
	}
	return copy;
}

function createClone(arena, obstacles, char) {
	const Player = require('../server/player.js');
	return new Player(Math.random(), arena, obstacles, char, true);
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
	return arrows[arrowCounter]
}

function updatePlayer(player, input, arena, obstacles, arrows, players, isClone=false) {
	if (!player) return;
	if (player.clones.length > 0) {
		// console.log('updating clones')
		player.changedClones = true;
		const cloneInput = {...input};
		if (player.arrowing <= 0) {
			cloneInput.up = input.down;
			cloneInput.down = input.up;
			cloneInput.left = input.right;
			cloneInput.right = input.left;
		}
		player.clones.forEach((clone) => updatePlayer(clone, cloneInput, arena, obstacles, arrows, players, true))
	}
	if (!player.dying) {
		player.spawnProtectionTimer += dt;
		if (player.passive && player.spawnProtectionTimer > 1.5/*0.75*/) {
			player.passive = false;
		}

		player.abilityCooldown -= dt;
		if (player.abilityCooldown <= 0) {
			player.abilityCooldown = 0;
		}

		const dir = {
			x: (input.right - input.left),
			y: (input.down - input.up),
		};
		const mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
		const normal = { x: dir.x / mag, y: dir.y / mag };

		// Kronos/Klaydo
		if (player.freezing) {
			player.timeSpentFreezing += dt;
		}

	

		if (player.character.Ability != null && !isClone) {
			// Xerox
			if (player.character.Ability.name === 'Clone') {
				if (input.shift && player.abilityCooldown <= 0 && player.clones.length < 1) {
					const clone = createClone(arena, obstacles, 'Xerox')
					const bruh = Math.random() < 0.5;
					clone.x = player.x;
					clone.y = player.y;
					if (bruh) {
						player.xv = -player.xv;
						player.yv = -player.yv;
					}
					// if (bruh) {
					// 	player.x += Math.cos(player.angle) * (player.radius / 2);
					// 	player.y += Math.sin(player.angle) * (player.radius / 2);
					// 	clone.x -= Math.cos(player.angle) * (player.radius / 2);
					// 	clone.y -= Math.sin(player.angle) * (player.radius / 2);
					// } else {
					// 	player.x -= Math.cos(player.angle) * (player.radius / 2);
					// 	player.y -= Math.sin(player.angle) * (player.radius / 2);
					// 	clone.x += Math.cos(player.angle) * (player.radius / 2);
					// 	clone.y += Math.sin(player.angle) * (player.radius / 2)
					// }
					clone.xv = player.xv;
					clone.yv = player.yv;
					clone.name = player.name;
					clone.passive = false;
					clone.angle = player.angle;
					clone.arrowing = player.arrowing;
					clone.lifeTime = 10//15;
					player.clones.push(clone)
					player.abilityCooldown = 8;
					player.maxCd = player.abilityCooldown;
					player.changedClones = true;
					// console.log(player.clones)
				}
				const deleteArr = [];
				player.clones.forEach((clone, i) => {
					clone.lifeTime -= dt;
					if (clone.lifeTime <= 0) {
						deleteArr.push(i)
					}
				})
				deleteArr.forEach((i) => {
					player.clones.splice(i, 1);
					player.changedClones = true;
				})
			}
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
						player.abilityCooldown = 0.5 + player.timeSpentFreezing * 0.8;
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
			// homing arrow for harpazo
			if (player.character.Passive === 'Slow-Arrow') {
				// for (const other of Object.values(players)) {
				// 	if (player.id === other.id) continue;
				// 	const distX = player.x - other.x;
				// 	const distY = player.y - other.y;
				// 	const dist = Math.sqrt(distX * distX + distY * distY);
				// 	if (dist < 300 + other.radius) {
				// 		const angle = Math.atan2(other.y - player.y, other.x - player.x);
				// 		other.xv -= Math.cos(angle) * 0.12;
				// 		other.yv -= Math.sin(angle) * 0.12;
				// 	}
				// }
			}
			if (player.character.Ability.name === 'Drone') {
				if (input.shift && player.abilityCooldown <= 0 && !player.hasDrone) {
					player.hasDrone = true;
					player.abilityCooldown = 10;
					player.maxCd = player.abilityCooldown;
					player.droneX = player.x + Math.cos(player.angle) * player.radius;
					player.droneY = player.y + Math.sin(player.angle) * player.radius;
				}
				
				if (player.hasDrone) {
					const angle = Math.atan2(player.y - player.droneY, player.x - player.droneX);
					if (player.teleportTimer === 0) {
						player.droneX += Math.cos(angle) * (175) * dt;
						player.droneY += Math.sin(angle) * (175) * dt;
					}
					if (input.shift && player.teleportTimer === 0 && player.abilityCooldown <= 0) {
						player.teleportTimer = 1;
					}
					if (player.teleportTimer > 0) {
						player.teleportTimer -= dt;
						if (player.teleportTimer <= 0) {
							player.teleportTimer = 0;
							player.hasDrone = false;
							player.x = player.droneX;
							player.y = player.droneY;
						}
					}
					// const distX = player.x - player.droneX;
					// const distY = player.y - player.droneY;
					// const dist = Math.sqrt(distX * distX + distY + distY);
					// if (dist <= 150) {
					// 	player.droneX = player.x + Math.cos(angle) * 150;
					// 	player.droneY = player.y + Math.sin(angle) * 150;
					// }
				} else {
					player.teleportTimer = 0;
				}
			}
			if (player.character.Ability.name === 'Arrow-Split') {
				if (input.shift && player.abilityCooldown <= 0) {
					let foundArrow = false;
					for (const arrowId of Object.keys(arrows)) {
						const arrow = arrows[arrowId];
						if (arrow.parent != player.id || arrow.dead) continue;
						foundArrow = true;
						if (arrow.toSplit == 0) {
							arrow.toSplit = 0.25; // half a second
							arrow.split = true;
						}
					}

					if (foundArrow) {
						player.abilityCooldown = 6;
						player.maxCd = player.abilityCooldown;
					}
				}
				for (const arrowId of Object.keys(arrows)) {
					const arrow = arrows[arrowId]
					if (!arrow.split) continue;
					arrow.toSplit -= dt;
					if (arrow.toSplit <= 0) {
						arrow.split = false;
						arrow.toSplit = 0;
						arrow.angle -= Math.PI / 2
						const mag = Math.sqrt(arrow.xv * arrow.xv + arrow.yv * arrow.yv) * 0.4;
						arrow.xv = Math.cos(arrow.angle) * mag;
						arrow.yv = Math.sin(arrow.angle) * mag;
						arrow.speed = mag;
						const createdArrow = createArrow(player, arrows, isClone);
						createdArrow.x = arrow.x;
						createdArrow.y = arrow.y;
						createdArrow.life = arrow.life;
						createdArrow.speed = mag;
						createdArrow.angle = arrow.angle + (Math.PI / 2) * 2;
						createdArrow.max = arrow.max;
						createdArrow.alpha = arrow.alpha;
						createdArrow.xv = Math.cos(createdArrow.angle) * mag;
						createdArrow.yv = Math.sin(createdArrow.angle) * mag;
					}
				}
			}
			if (player.character.Ability.name === 'Arrow-Teleport') {
				let newestArrow = null;
				for (const arrow of Object.values(arrows)) {
					if (arrow.parent != player.id) continue;
					if (newestArrow == null || arrow.c < newestArrow.c) {
						if (arrow.life > 2.75) {
							newestArrow = arrow;
						}
					}
				}
				if (newestArrow != null && input.shift && player.abilityCooldown <= 0) {
					player.abilityCooldown = 6;
					player.maxCd = player.abilityCooldown;
					player.x = newestArrow.x;
					player.y = newestArrow.y;
					newestArrow.life = 0;
					player.xv = newestArrow.xv;
					player.yv = newestArrow.yv;
				}
			}

			if (player.character.Ability.name === 'Gravity') {
				// const velAngle = Math.atan2(player.yv, player.xv);
				// const predictAmount = 100;
				// player.gravX = player.x + normal.x * predictAmount;
				// player.gravY = player.y + normal.y * predictAmount;
				if (input.shift && !player.passive && player.abilityCooldown <= 0) {
					for (const arrowId of Object.keys(arrows)) {
						if (arrows[arrowId].parent === player.id) {
							arrows[arrowId].gravity = true;
							player.usingGravity = true;
						}
					}
				}
				let hasGravityArrow = false;
				if (player.usingGravity) {
					for (const arrowId of Object.keys(arrows)) {
						if (arrows[arrowId].parent === player.id && arrows[arrowId].gravity) {
							hasGravityArrow = true;
						}
					}
				}

				if (hasGravityArrow) {
					player.gravityTime += dt;
				}

				if ((!input.shift && !player.passive && player.usingGravity) || (player.usingGravity && !player.passive && !hasGravityArrow && player.gravityTime > 0) || (player.usingGravity && !player.passive && player.gravityTime > 5)) {
					player.usingGravity = false;
					player.abilityCooldown = 2 + (player.gravityTime * 0.8);
					player.maxCd = player.abilityCooldown;
					// console.log(player.gravityTime, player.abilityCooldown)
					player.gravityTime = 0;
					for (const arrowId of Object.keys(arrows)) {
						if (arrows[arrowId].parent === player.id) {
							arrows[arrowId].gravity = false;
							// arrows[arrowId].die()
						}
					}
				}
			}
			if (player.character.Ability.name === 'Dash') {
				player.canDash = !player.passive && player.abilityCooldown <= 0 && (player.arrowing > 0 || player.lastDashForce != null);
				let should = true;
				if (player.arrowing > 0 && player.abilityCooldown <= 0 && !player.changedLastTime) {
					player.dashAngle = player.angle;
					player.lastDashForce = player.arrowing / 3;	
					should = false;
				}
				if (player.canDash && input.shift && should) {
					player.maxCd = 5;
					player.abilityCooldown = 5;
					const force = player.lastDashForce;
					player.bxv = Math.cos(player.dashAngle) * 1100 + (Math.cos(player.dashAngle) * (force) * 5750)
					player.byv = Math.sin(player.dashAngle) * 1100 + (Math.sin(player.dashAngle) * (force) * 5750)

				}
			}

			if (player.character.Ability.name === 'Flank-Around') {

				if (!player.passive && player.arrowing > 0 && player.abilityCooldown <= 0 && input.shift) {
					let shortestDistance = null;
					let otherId = null;
					for (const playerId of Object.keys(players)) {
						if (playerId === player.id) continue;
						const other = players[playerId];
						if (other.timer > 0 || (other.character.Name === 'Scry' && !other.showAim)) {
							continue;
						}
						const distX = player.x - other.x;
						const distY = player.y - other.y;
						const dist = Math.sqrt(distX * distX + distY * distY);
						if (dist < 400 + other.radius) {
							if (shortestDistance == null) {
								shortestDistance = dist;
								otherId = playerId;
							} else if (shortestDistance != null && dist < shortestDistance) {
								shortestDistance = dist;
								otherId = playerId;
							}
						}
					}
					if (otherId != null) {
						const other = players[otherId];
						player.abilityCooldown = 6;
						player.maxCd = 6;
						let teleportDist = Math.round((player.arrowing / 3) * 200);
						// let old = { x: player.x, y: player.y };
						let dest = {
							x: other.x + Math.cos(player.angle) * teleportDist,
							y: other.y + Math.sin(player.angle) * teleportDist,
						}
						player.x = dest.x;
						player.y = dest.y;
						while (player.intersectingObstacles(obstacles) && teleportDist > 0) {
							teleportDist -= 10;
							dest = {
								x: other.x + Math.cos(player.angle) * teleportDist,
								y: other.y + Math.sin(player.angle) * teleportDist,
							}
							player.x = dest.x;
							player.y = dest.y;
						}
					}
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


			if (player.character.Ability.name === 'Direct-Arrow') {
				if (!player.passive && player.arrowing > 0 && input.shift && player.canCreatePoint) {
					player.canCreatePoint = false;
					player.redirPoint = {
						x: player.x + Math.cos(player.angle) * (player.radius + 250),
						y: player.y + Math.sin(player.angle) * (player.radius + 250),
					};
					player.abilityCooldown = 8;
					player.maxCd = 8;
				}
				if (!player.passive) {
					player.canCreatePoint = player.abilityCooldown <= 0;
				}
				if (!player.passive && player.arrowing <= 0 && input.shift && player.redirPoint != null && player.canRedirect) {
					let newestArrow = null;
					for (const arrow of Object.values(arrows)) {
						if (arrow.parent != player.id || arrow.redirected) continue;
						if (newestArrow == null || (arrow.c < newestArrow.c)) {
							const distX = player.redirPoint.x - arrow.x;
							const distY = player.redirPoint.y - arrow.y;
							const dist = Math.sqrt(distX * distX + distY * distY);
							if (dist < 1250) {
								newestArrow = arrow;
							}
						}
					}
					if (newestArrow != null) {
						newestArrow.redirected = true;
						newestArrow.angle = Math.atan2(player.redirPoint.y - newestArrow.y, player.redirPoint.x - newestArrow.x);
						// const mag = Math.sqrt(newestArrow.xv * newestArrow.xv + newestArrow.yv * newestArrow.yv);
						const mag = newestArrow.speed;
						newestArrow.xv = Math.cos(newestArrow.angle) * mag;
						newestArrow.yv = Math.sin(newestArrow.angle) * mag;
					}
					player.canRedirect = false;
				}

				if (!input.shift && !player.passive && player.arrowing <= 0) {
					player.canRedirect = true;
				}
			}
		}


		let changedMovement = false;
		if (player.character.Passive != null) {
			if (player.character.Passive === 'Move-Fast-Slow-Aim') {
				player.xv += normal.x * ((player.arrowing > 0 ? player.speed * 0.65 : player.speed * 1.1) * dt);
				player.yv += normal.y * ((player.arrowing > 0 ? player.speed * 0.65 : player.speed * 1.1) * dt);
				changedMovement = true;
			}
		}

		if (!changedMovement) {
			player.xv += normal.x * ((player.arrowing > 0 ? player.speed * 0.75 : player.speed) * dt);
			player.yv += normal.y * ((player.arrowing > 0 ? player.speed * 0.75 : player.speed) * dt);
		}
		player.x += player.bxv * dt;
		player.y += player.byv * dt;
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
				// if (player.character.Ability != null && player.character.Ability.name === 'Gravity' && player.usingGravity) {
				// 	player.arrowing = 0;
				// 	player.timer = 0;
				// } else {
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
				// }
			} else {
				if (player.arrowing > 0 && player.timer <= 0 ) {
					// shoot
					player.arrowsShot++;
					const createdArrow = createArrow(player, arrows, isClone)
					player.timer = player.timerMax;
					// if (player.character.Ability.name === 'Clone') {
					// 	player.clones = [];
					// 	player.changedClones = true;
					// }
					if (player.character.Ability != null && player.character.Ability.name === 'Gravity' && player.usingGravity) {
						createdArrow.gravity = true;
					}
					if (player.character.Ability != null && player.character.Ability.name === 'Fake-Arrow') {
						player.noAim = 0;
						if (player.fakedArrowLastTime) {
							player.fakedArrowLastTime = false;
						} else if (player.fakedArrow) {
							player.fakedArrowLastTime = true;
						}
					}
					if (player.character.Ability != null && player.character.Ability.name === 'Dash') {
						player.changedLastTime = !player.changedLastTime;
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
		player.bxv *= Math.pow(0.7, dt * 60);
		player.byv *= Math.pow(0.7, dt * 60);


		if (!input.space) {
			player.spaceLock = false;
		}
		// player.angleVel *= 0;
	} else {
		if (player.clones.length > 0) {
			player.clones = [];
			player.changedClones = true;
		}
		player.life -=  2 * dt;
		// player.radius -= 20 * dt;
		// if (player.radius <= 1) {
		// 	player.radius = 1;
		// 	player.respawn = true;
		// }
		player.x += player.xv * (60 * dt);
		player.y += player.yv * (60 * dt);
		
	}




	// boundPlayer(player, arena, obstacles)




	player.timer -= dt;
	if (player.timer <= 0) {
		player.timer = 0;
	}

	// boundPlayer(player);
}


function boundPlayerObstacle(player, obstacle) {
	// console.log(player)
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
				player.score += 10 * dt;
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
	
	for (const player of Object.values(players)) {
		if (player.clones.length > 0) {
			player.clones.forEach((clone, i) => {
				keys.push({ clone: true, parent: player.id, index: i })
			})
		}
	}
	// console.log(keys)
	for (let i = 0; i < keys.length; i++) {
		const player1 = typeof keys[i] === 'object' && keys[i].clone
			? players[keys[i].parent].clones[keys[i].index]
			: players[keys[i]]
		for (let j = 0; j < keys.length; j++) {
			if (i >= j) continue;
			const player2 = typeof keys[j] === 'object' && keys[j].clone
				? players[keys[j].parent].clones[keys[j].index]
				: players[keys[j]]
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

	// drone to player collisions
	for (const playerId of Object.keys(players)) {
		let player = players[playerId];
		if (!player.hasDrone) continue;
		// own collision to drone
		const distX = player.x - player.droneX;
		const distY = player.y - player.droneY;
		if (distX * distX + distY * distY < player.radius * 2 * (player.droneRadius * 2)) {
			const magnitude = Math.sqrt(distX * distX + distY * distY) || 1;
			const xv = (distX / magnitude);
			const yv = (distY / magnitude);
			const oldP = { x: player.x, y: player.y }
			// player.x = player.droneX + ((player.radius + 0.05 + player.droneRadius) * (xv))
			// player.y = player.droneY + ((player.radius + 0.05 + player.droneRadius) * (yv));
			player.droneX = oldP.x - ((player.radius + player.droneRadius) * (xv));
			player.droneY = oldP.y - ((player.radius + player.droneRadius) * (yv))
		}
		for (const otherId of Object.keys(players)) {
			if (playerId === otherId) continue;
			let other = players[otherId];
			const distX = other.x - player.droneX;
			const distY = other.y - player.droneY;
			if (distX * distX + distY * distY < other.radius * 2 * (player.droneRadius * 2)) {
				const magnitude = Math.sqrt(distX * distX + distY * distY) || 1;
				const xv = (distX / magnitude);
				const yv = (distY / magnitude);
				const oldP = { x: other.x, y: other.y }
				// player.x = player.droneX + ((player.radius + 0.05 + player.droneRadius) * (xv))
				// player.y = player.droneY + ((player.radius + 0.05 + player.droneRadius) * (yv));
				player.droneX = oldP.x - ((other.radius + player.droneRadius) * (xv));
				player.droneY = oldP.y - ((other.radius + player.droneRadius) * (yv))
			}
		}
		const dronePlayer = { x: player.droneX, y: player.droneY, radius: player.droneRadius,
							xv: 0, yv: 0, score: 0};
		boundPlayer(dronePlayer, arena, obstacles);
		player.droneX = dronePlayer.x;
		player.droneY = dronePlayer.y;
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

// console.log(createInput)
module.exports = { updatePlayer, copyInput, boundPlayer, collidePlayers, createInput }
// }