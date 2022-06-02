
window.render = () => {
	if (!arena) return;

	// drawArenaBackground('#b3b3b3')
	// drawArena('#d6d6d6');
	
	// drawArenaBackground('#750016');
	// drawArena('#a30321')
	// drawTiles('#750016')

	drawArenaBackground('#1f2229');
	drawArena('#323645')
	drawTiles('#1f2229');
	// drawTiles('gray');

	drawObstacles();
	drawBlocks();

	drawArrows();
	drawPlayers();
	drawHits();

	drawOverlay()
	drawIntermission();
	drawKillNotify();

	drawMinimap();
	drawDebugText();
	drawPanel();

	drawLeaderboard();
	drawApCounter();
	drawTimer();

	drawChat();
	drawDevModeIndicator();
	drawAbilityCooldown();
}

function drawArenaBackground(color) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawArena(color) {
	ctx.fillStyle = color;
	const pos = offset(0, 0)
	ctx.fillRect(pos.x, pos.y, arena.width, arena.height);
}

function drawTiles(color) {
	const tileSize = 100;
	const maxDistToCamera = 1000;
	const pos = offset(0, 0)

	ctx.globalAlpha = 0.8;
	ctx.strokeStyle = color;
	ctx.lineWidth = 1//0.5;
	for (let y = 0; y < arena.height; y += tileSize) {
		for (let x = 0; x < arena.width; x += tileSize) {
			if (Math.abs(x - camera.x) > maxDistToCamera ||
				Math.abs(y - camera.y) > maxDistToCamera) {
				continue;
			}
			ctx.strokeRect(pos.x + x, pos.y + y, tileSize, tileSize)
		}
	}
	ctx.globalAlpha = 1;
}

function drawObstacles() {
	for (const { x, y, width, height, type } of obstacles) {
		const pos = offset(x, y);

		if (type === 'obstacle') {
			// ctx.fillStyle = '#b3b3b3';
			// ctx.fillStyle = '#750016'
			ctx.fillStyle = '#1f2229'
		} else if (type === 'bounce') {
			ctx.fillStyle = '#32a852';
		} else if (type === 'point') {
			ctx.fillStyle = '#fcb000'
			ctx.globalAlpha = 0.5;
		}

		ctx.fillRect(pos.x, pos.y, width, height)
		ctx.globalAlpha = 1;
	}
}

function drawBlocks() {
	const pos = offset(0, 0)
	ctx.drawImage(blockCanvas, pos.x, pos.y, arena.width, arena.height)
}

function drawArrows() {
	for (const arrowId of Object.keys(arrows)) {
		const { lerpAngle, radius, life, alpha, parent, fake, server } = arrows[arrowId]
		const { x, y } = arrows[arrowId].pos;
		ctx.globalAlpha = fake && parent === selfId ? alpha * 0.5 : alpha; // life 
		if (fake && players[selfId]?.characterName === 'Xerox' && players[selfId].clones && players[selfId].clones.length > 0) {
			let trans = false;
			players[selfId].clones.forEach((clone) => {
				if (clone.id === arrows[arrowId].parent) {
					trans = true;
				}
			})
			if (trans) {
				ctx.globalAlpha = alpha * 0.5;
			}
		}
		const pos = offset(x, y);

		ctx.translate(pos.x, pos.y);
		ctx.rotate(lerpAngle + Math.PI / 2);

		ctx.fillStyle = '#ff0000';
		if (arrows[arrowId].freezed) {
			ctx.fillStyle = '#0055ff'
		}
		if (arrows[arrowId].gravity) {
			ctx.fillStyle = '#761dad'
		}
		if (arrows[arrowId].redirected) {
			ctx.fillStyle = '#780000'
		}

		if (players[arrows[arrowId].parent]?.characterName === 'Vice' && life > 2.75
		  && players[arrows[arrowId].parent]?.abilityCd <= 0) {
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 4;
		} else if (players[arrows[arrowId].parent]?.characterName === 'Mince'
			&& players[arrows[arrowId].parent]?.abilityCd <= 0){
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 4;
		}

		ctx.beginPath();
		ctx.rect(-6.25, -18.75, 12.5, 37.5);
		ctx.fill()

		if (players[arrows[arrowId].parent]?.characterName === 'Vice' && life > 2.75
		   && players[arrows[arrowId].parent]?.abilityCd <= 0) {
			ctx.stroke();
		} else if (players[arrows[arrowId].parent]?.characterName === 'Mince'
			&& players[arrows[arrowId].parent]?.abilityCd <= 0) {
			ctx.stroke()
		}

		ctx.rotate(-(lerpAngle + Math.PI / 2));
		ctx.translate(-pos.x, -pos.y);

		if (window.showSnapshots) {
			const pos = offset(server.x, server.y)
			ctx.translate(pos.x, pos.y);
			ctx.rotate(lerpAngle + Math.PI / 2);

			ctx.fillStyle = 'green';
			ctx.globalAlpha = 0.5;
			ctx.beginPath();
			ctx.rect(-6.25, -18.75, 12.5, 37.5);
			ctx.fill()

			ctx.rotate(-(lerpAngle + Math.PI / 2));
			ctx.translate(-pos.x, -pos.y);
		}

		ctx.globalAlpha = 1;

	}
}

function drawPlayers() {
	for (const playerId of Object.keys(players)) {
		const player = players[playerId];

		renderPlayerEntity(player, playerId, false);

		if (player.clones != null && Array.isArray(player.clones)) {
			for (const clone of player.clones) {
				// console.log(clone)
				renderPlayerEntity(clone, clone.id, true)
			}
		}
	}
}

function renderPlayerEntity(player, playerId, isClone) {
	const maxDistToCamera = 1000;
		if (Math.abs(player.pos.x - camera.x) > maxDistToCamera ||
			Math.abs(player.pos.y - camera.y) > maxDistToCamera) {
			return; // does not draw players that are not within view
		}

		const pos = offset(player.pos.x, player.pos.y)

		ctx.fillStyle = Character[player.characterName].Color;
		if (player.timer > 0
			|| (player.characterName === 'Scry' && !player.showAim)) {
			ctx.fillStyle = Character[player.characterName].ArrowCdColor;
		}

		if (player.passive) {
			ctx.globalAlpha = 0.3;
		}

		if (isClone && player.lifeTime < 1) {
			ctx.globalAlpha = (player.lifeTime / 1)
		}

		ctx.beginPath();
		ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
		ctx.fill();

		ctx.globalAlpha = 1;

		if (player.characterName === 'Stac') {
			if (player.point_x != null && player.point_y != null) {
				ctx.fillStyle = '#004f4f';
				const pointPos = offset(player.point_x, player.point_y);

				ctx.beginPath();
				ctx.arc(pointPos.x, pointPos.y, 10, 0, Math.PI * 2);
				ctx.fill()
			}
			if (playerId === selfId && player.arrowing > 0 && player.canCreatePoint) {
				ctx.fillStyle = '#004f4f';
				ctx.globalAlpha = 0.5;
				const preview = offset(
					player.pos.x + Math.cos(player.interpAngle) * (player.radius + 250),
					player.pos.y + Math.sin(player.interpAngle) * (player.radius + 250),
				);
				ctx.beginPath()
				ctx.arc(preview.x, preview.y, 10, 0, Math.PI * 2);
				ctx.fill();
				ctx.globalAlpha = 1;
			}
		}

		if (player.characterName === 'Harpazo') {
			ctx.globalAlpha = 0.15;
			ctx.fillStyle = '#de8c2f';
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, 300, 0, Math.PI * 2);
			ctx.fill();
			ctx.globalAlpha = 1;
		}

		if (player.characterName === 'Flank'
			&& !intermission
			&& player.abilityCd <= 0
			&& player.arrowing > 0
			&& !player.passive) {
			if (playerId === selfId) {
				ctx.globalAlpha = 0.15;
				ctx.fillStyle = '#059905';
				ctx.beginPath();
				ctx.arc(pos.x, pos.y, 400, 0, Math.PI * 2);
				ctx.fill();
			}

			ctx.fillStyle = '#024d02';
			let shortestDistance = null;
			let otherId = null;
			for (const pi of Object.keys(players)) {
				if (pi === playerId) continue;
				const other = players[pi];
				if (other.timer > 0 || (other.characterName === 'Scry' && !other.showAim)) {
					continue;
				}
				const distX = player.pos.x - other.pos.x;
				const distY = player.pos.y - other.pos.y;
				const dist = Math.sqrt(distX * distX + distY * distY);
				if (dist < 400 + other.radius) {
					if (shortestDistance == null) {
						shortestDistance = dist;
						otherId = pi;
					} else if (shortestDistance != null && dist < shortestDistance) {
						shortestDistance = dist;
						otherId = pi;
					}
				}
			}
			if (otherId != null) {
				const other = players[otherId];
				const dest = {
					x: other.pos.x + Math.cos(player.interpAngle) * ((player.arrowing / 3) * 200),
					y: other.pos.y + Math.sin(player.interpAngle) * ((player.arrowing / 3) * 200),
				}
				ctx.globalAlpha = 0.8;
				const destPos = offset(dest.x, dest.y);
				ctx.beginPath();
				ctx.arc(destPos.x, destPos.y, player.radius, 0, Math.PI * 2);
				ctx.fill()
				// ctx.fillStyle = 'black';
				// ctx.textAlign = 'center';
				// ctx.textBaseline = 'middle'
				// ctx.font = `22px ${window.font}`
				// ctx.fillText(`${player.name}`, destPos.x, destPos.y + player.radius * 1.5)
			}
			ctx.globalAlpha = 1;
		}

		if (player.canDash && player.characterName === 'Conquest') {
			const force = player.lastDashForce;
			let dashPos = offset(
				player.pos.x + Math.cos(player.iDashAngle) * 50 + Math.cos(player.iDashAngle) * (force) * 300,
				player.pos.y + Math.sin(player.iDashAngle) * 50 + Math.sin(player.iDashAngle) * (force) * 300,
			);

			ctx.globalAlpha = 0.4;
			ctx.fillStyle = '#cf3a02'
			if (player.arrowing > 0 && !player.changedLastTime) {
				ctx.fillStyle = '#330e00'
			}
			ctx.beginPath();
			ctx.arc(dashPos.x, dashPos.y, player.radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.globalAlpha = 1;
		}

		if (player.dying) {
			ctx.fillStyle = '#d40000';
			ctx.globalAlpha = 0.75;
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.globalAlpha = 1;
		}


		ctx.translate(pos.x, pos.y);
		ctx.rotate(player.interpAngle + Math.PI / 2);

		if (player.arrowing > 0 && (player.characterName !== 'Scry' || (player.characterName === 'Scry' && (playerId === selfId || player.showAim)))) {
			let ga = (player.characterName === 'Scry' && playerId === selfId && !player.showAim)
				? 0.5 : 1;
			if (isClone && player.lifeTime < 1) {
				ga = (player.lifeTime / 1)
			}
			
			ctx.beginPath();
			ctx.strokeStyle = 'white';
			ctx.lineWidth = 1;
			// bow strands
			ctx.lineTo(Math.cos(1.25 * Math.PI) * (60), Math.sin(1.25 * Math.PI) * (60));
			ctx.lineTo(-5, -30 + player.arrowing * 25);
			ctx.lineTo(5, -30 + player.arrowing * 25);
			ctx.lineTo(Math.cos(1.75 * Math.PI) * (60), Math.sin(1.75 * Math.PI) * (60));
			ctx.stroke();

			ctx.globalAlpha = 0.5 * ga;
			ctx.beginPath();
			ctx.strokeStyle = '#ff0000'
			// bow ray 
			ctx.lineTo(0, -60 + player.arrowing * 25);
			ctx.lineTo(0, -150);
			ctx.stroke();
			ctx.globalAlpha = 1 * ga;
			
			ctx.beginPath();
			// bow itself (arc)
			ctx.arc(0, 0, 60, 1.25 * Math.PI, 1.75 * Math.PI, false);
			ctx.lineWidth = 5;
			// ctx.strokeStyle = '#ff2626';
			ctx.strokeStyle = Character[player.characterName].Color
			if (player.characterName === 'Scry' && playerId === selfId && player.canFakeArrow) {
				ctx.strokeStyle = '#f700ff'
			}
			ctx.stroke();

			ctx.fillStyle = '#ff0000';
			if (player.characterName === 'Scry' && playerId === selfId && player.canFakeArrow) {
				ctx.fillStyle = '#ff0062'
			}

			// arrow on bow
			ctx.fillRect(-5, -60 + player.arrowing * 25, 10, 30);
			// if (player.characterName === 'Vice' && player.abilityCd <= 0) {
			// 	ctx.strokeStyle = 'black';
			// 	ctx.lineWidth = 4;
			// 	ctx.strokeRect(-5, -60 + player.arrowing * 25, 10, 30);
			// }
			ctx.globalAlpha = 1;
		}

		ctx.rotate(-(player.interpAngle + Math.PI / 2));
		ctx.translate(-pos.x, -pos.y);

		if (window.showSnapshots) {
			ctx.globalAlpha = 0.5;
			ctx.fillStyle = "green";
			ctx.beginPath();
			const pos = offset(player.server.x, player.server.y)
			ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.globalAlpha = 1;
		}

		ctx.fillStyle = 'white'//'black';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle'
		ctx.font = `22px ${window.font}`
	if (isClone && player.lifeTime < 1) {
			ctx.globalAlpha = (player.lifeTime / 1)
		}
		if (!player.dying) {
			ctx.fillText(`${player.name}`, pos.x, pos.y + player.radius * 1.5)
		}
	ctx.globalAlpha = 1;
}

function drawHits() {
	ctx.font = `25px ${window.font}`
	ctx.fillStyle = '#000000'
	for (const { x, y, score, timer } of hits) {
		const pos = offset(x, y);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		if (timer <= 0.5) {
			ctx.globalAlpha = (timer * 2)
		}
		ctx.fillText(`+${score}`, pos.x, pos.y);
		ctx.globalAlpha = 1;
	}
}

function drawOverlay() {
	ctx.beginPath();

	ctx.rect(0, 0, canvas.width, canvas.height);
	const outerRadius = canvas.width * 0.5;
	const innerRadius = canvas.height * 0.2;
	const grd = ctx.createRadialGradient(
		canvas.width / 2,
		canvas.height / 2,
		innerRadius,
		canvas.width / 2,
		canvas.height / 2,
		outerRadius
	);
	grd.addColorStop(0, 'rgba(0,0,0,0)');
	grd.addColorStop(1, 'rgba(0,0,0,' + window.darkness + ')');
	ctx.fillStyle = grd;
	ctx.fill();

	ctx.fillStyle = 'black';
	ctx.globalAlpha = !intermission ? overlayAlpha : 0.5;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.globalAlpha = window.redness;
	ctx.fillStyle = '#eb0000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.globalAlpha = 1;

	if (window.teamMode) {
		ctx.fillStyle = Character[players[selfId]?.characterName]?.Color;
		ctx.font = `30px ${window.font}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('[TEAMS]', canvas.width - 100, canvas.height - 50)
	}
}

function drawIntermission() {
	if (intermission && overlayAlpha <= 0) {
		ctx.fillStyle = 'white';
		ctx.fillText(`- ${interMissionMessage} - `, canvas.width / 2, canvas.height / 2 + 300);
	}
}

function drawKillNotify() {
	ctx.globalAlpha = killedNotifTime;
	ctx.fillStyle = '#0d0d0d';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = 'rgb(255, 0, 0)';
	ctx.font = `22px ${window.font}`
	ctx.fillText(`Eliminated`, 700, 725)
	const xOff = ctx.measureText('Eliminated').width;
	ctx.fillStyle = 'black'
	ctx.fillText(` ${killedPlayerName}`, 700 + xOff, 725);
	ctx.globalAlpha = 1;
}

function drawMinimap() {
	if ((players[selfId] != null && !players[selfId].dying) && !intermission) {

		const mwidth = 200;
		const mheight = 200;

		ctx.globalAlpha = 0.75;
		// ctx.fillStyle = '#707070';
		// ctx.fillStyle = '#a30321'
		ctx.fillStyle = '#323645'
		ctx.fillRect(0, canvas.height - mheight, mwidth, mheight);

		ctx.fillStyle = '#595959'
		for (const { x, y, width, height, type } of obstacles) {
			if (type == "obstacle") {
				// ctx.fillStyle = '#595959';
				// ctx.fillStyle = '#750016'
				ctx.fillStyle = '#1f2229'
			} else if (type == "bounce") {
				ctx.fillStyle = '#00fc08';
			} else if (type === 'point') {
				ctx.fillStyle = '#fcb000';
				ctx.globalAlpha = 0.4;
			}
			ctx.fillRect((x / arena.width) * mwidth, (canvas.height - mheight) + (y / arena.height) * mheight, (width / arena.width) * mwidth, (height / arena.height) * mheight)
			ctx.globalAlpha = 1;
		}


		for (const playerId of Object.keys(players)) {
			const player = players[playerId];
			if (player.dying) {
				ctx.fillStyle = '#ff0000';
				ctx.font = `25px ${window.font}`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText('X', (player.pos.x / arena.width) * mwidth, (canvas.height - mheight) + (player.pos.y / arena.height) * mheight)
			} else {
				if (playerId === selfId && player.characterName === 'Stac' && player.point_x != null && player.point_y != null) {
					ctx.fillStyle = '#13d1bb';
					ctx.beginPath();
					ctx.arc((player.point_x / arena.width) * mwidth, (canvas.height - mheight) + (player.point_y / arena.height) * mheight, (30 / arena.width) * mwidth, 0, Math.PI * 2);
					ctx.fill()
				}
				ctx.fillStyle = '#000000';
				// if (playerId === selfId) {
				// 	ctx.fillStyle = '#d91414'
				// }
				if (leader != null && playerId === leader.id) {
					ctx.fillStyle = '#f2cf1d'
				}
				ctx.beginPath();
				ctx.arc((player.pos.x / arena.width) * mwidth, (canvas.height - mheight) + (player.pos.y / arena.height) * mheight, (player.radius / arena.width) * mwidth, 0, Math.PI * 2)
				ctx.fill()
				if (player.clones.length > 0) {
					player.clones.forEach((clone) => {
						ctx.beginPath();
						ctx.arc((clone.pos.x / arena.width) * mwidth, (canvas.height - mheight) + (clone.pos.y / arena.height) * mheight, (clone.radius / arena.width) * mwidth, 0, Math.PI * 2)
						ctx.fill()
					})
				}
			}
		}
	}

	ctx.globalAlpha = 1;
}

function drawDebugText() {
	ctx.font = `18px ${window.font}`

	// ctx.fillStyle = 'rgb(100, 0, 0)';
	ctx.textAlign = 'left'
	ctx.fillStyle = 'white'
	if (window.debug) {
		ctx.fillText(`Players: ${Object.keys(players).length} | Download: ${stateMessageDisplay} msg/s (${(byteDisplay / 1000).toFixed(1)}kb/s | Upload: ${(uploadByteDisplay / 1000).toFixed(1)}kb/s | ${inputMessageDisplay} msg/s (inputs) | Ping: ${ping}ms | Spacing:[${lowest(spacings).toFixed(1)}, ${spacing.toFixed(1)}, ${highest(spacings).toFixed(1)}]ms | ServerSpacing: [${serverSpacing[0]}, ${serverSpacing[1]}, ${serverSpacing[2]}] | Angle: ${players[selfId] ?.angle.toFixed(1)}`
			, 200, 800);
		ctx.fillText(`Extralag: ${extraLag} | Interpolate: ${window._interpolate.toString().toUpperCase()} | Input Delay: ${Math.ceil((ping * 2) / (1000 / 60))} frames | Arrows: ${Object.keys(arrows).length} | ServerTickTime: ${serverTickMs}ms | ServerFrameTime: ${Math.round(serverTickMs / 60)}ms | ${window.fps}fps`
			, 200, 825)
	}
}

function drawPanel() {
	ctx.globalalpha = 1;
	ctx.fillStyle = '#0f0f0f';
	ctx.fillRect(canvas.width - 355, canvas.height - 30, 355, 30)

	ctx.beginPath();
	ctx.lineTo(canvas.width - 355, canvas.height - 30);
	ctx.lineTo(canvas.width - 380, canvas.height);
	ctx.lineTo(canvas.width - 355, canvas.height);
	ctx.fill()

	ctx.font = `15px ${window.font}`
	ctx.fillStyle = '#00ff59';

	ctx.fillText(`[R] Auto Respawn: ${window.autoRespawn ? 'On' : 'Off'}`, canvas.width - 160, canvas.height - 15)

	ctx.fillStyle = '#ddff00';

	ctx.fillText(`[L] ${window.movementMode === 'wasd' ? 'WASD' : 'ULDR'}`, canvas.width - 355, canvas.height - 15);

	ctx.fillStyle = '#00c8ff';

	ctx.fillText(`[M] Music: ${window.music ? 'On' : 'Off'}`, canvas.width - 270, canvas.height - 15)
}

function drawLeaderboard() {
	if (tab || intermission) {
		const sortedPlayers = Object.keys(players).sort((a, b) => players[b].score - players[a].score);
		ctx.globalAlpha = 0.8;
		ctx.fillStyle = 'black'
		const top = 200 - (25 + sortedPlayers.length * 25) / 2;
		ctx.fillRect(600, top, 400, 25 + sortedPlayers.length * 25);
		ctx.globalAlpha = 1;
		let index = 0;
		for (const id of sortedPlayers) {
			const { score, name } = players[id];
			const strScore = score <= 999 ? `${Math.floor(score)}` : `${Math.floor((score / 1000) * 100) / 100}k`
			ctx.fillStyle = '#c4c4c4';
			ctx.font = `20px ${font}`
			ctx.fillText(`${index + 1}.`, 610, top + 25 + index * 25)
			ctx.fillText(`${strScore}`, 990 - ctx.measureText(`${strScore}`).width, top + 25 + index * 25)
			index++;
			ctx.fillStyle = '#ff0000'
			if (id === selfId) {
				ctx.fillStyle = 'white'
			}
			ctx.fillText(`${iExist && !dead && players[selfId].dev ? `[${id}] ` : ''}${name}`, 640, top + index * 25)
		}
	}
}

function drawApCounter() {
	if (iExist && !dead) {
		const score = Math.round(players[selfId].score);

		ctx.fillStyle = '#0f0f0f';
		ctx.font = `20px ${font}`;

		ctx.fillRect(1500, 0, 100, 50);

		ctx.beginPath();
		ctx.lineTo(1500, 0);
		ctx.lineTo(1475, 0);
		ctx.lineTo(1500, 50);
		ctx.fill()

		ctx.fillStyle = 'white';
		ctx.textAlign = 'center'
		ctx.fillText(`${score} `, (1535), 25);
		ctx.fillStyle = '#ffc800';
		ctx.fillText(`ap`, 1545 + ctx.measureText(`${score} `).width / 2, 25)
	}
}

function drawTimer() {
	ctx.fillStyle = '#0f0f0f';
	ctx.fillRect(750, 0, 100, 40);

	ctx.beginPath();
	ctx.lineTo(750, 0);
	ctx.lineTo(725, 0);
	ctx.lineTo(750, 40);
	ctx.fill()

	ctx.beginPath();
	ctx.lineTo(850, 0);
	ctx.lineTo(875, 0);
	ctx.lineTo(850, 40);
	ctx.fill()

	ctx.fillStyle = 'white';
	ctx.textAlign = 'center';
	ctx.font = `25px ${font}`
	ctx.fillText(`${convert(roundTime)}`, 800, 20);
}

function drawChat() {
	if (!showChat) return;
	ctx.globalAlpha = 0.7;
	ctx.fillStyle = '#0f0f0f';
	ctx.fillRect(0, 0, 375, 250);
	if (chatOpen || ref.chat.value != '') {
		ctx.fillRect(0, 250, 350, 25);

		ctx.beginPath();
		ctx.lineTo(350, 250);
		ctx.lineTo(375, 250);
		ctx.lineTo(350, 250 + 25);
		ctx.fill()
	}
	ctx.globalAlpha = 1;
}

function drawDevModeIndicator() {
	if (players[selfId] && players[selfId].dev) {
		ctx.font = `25px ${font}`;
		ctx.fillStyle = `hsl(${ghue}, 70%, 80%)`;
		ctx.fillText('[DEV MODE]', 1400, 25);
	}
}

function drawAbilityCooldown() {
	actx.clearRect(0, 0, actx.canvas.width, actx.canvas.height);
	if (players[selfId] && !intermission) {
		actx.fillStyle = 'black';
		actx.globalAlpha = 0.7;
		actx.beginPath()
		actx.lineTo(30, 30)
		actx.arc(30, 30, 60, Math.PI * 2 * Math.max((players[selfId].abilityCooldown / players[selfId].maxCd), 0), 0);
		actx.fill()
		actx.globalAlpha = 1;
		if (players[selfId].abilityCd <= 0 && players[selfId].characterName === 'Klaydo') {
			actx.fillStyle = '#66000a';
			actx.globalAlpha = 0.7;
			actx.beginPath()
			actx.lineTo(30, 30)
			actx.arc(30, 30, 60, -Math.PI * 2 * Math.max((players[selfId].timeSpentFreezing / players[selfId].timeFreezeLimit), 0), 0);
			actx.fill()
		}
		ctx.drawImage(abilityCanvas, canvas.width / 2 - 30, canvas.height - 60, 60, 60)
	}
}