
window.render = () => {
	try {
		ctx.fillStyle = '#b3b3b3'
		ctx.fillRect(0, 0, canvas.width, canvas.height);


		ctx.fillStyle = '#d6d6d6';
		const a = offset(0, 0);

		if (!arena) return;
		ctx.fillRect(a.x, a.y, arena.width, arena.height);

		const tileSize = 200;
		const maxDistToCamera = 900;

		ctx.globalAlpha = 0.8;
		ctx.strokeStyle = 'gray';
		ctx.lineWidth = 0.2;
		for (let y = 0; y < arena.height; y += tileSize) {
			for (let x = 0; x < arena.width; x += tileSize) {
				if (Math.abs(x - camera.x) > maxDistToCamera ||
					Math.abs(y - camera.y) > maxDistToCamera) {
					continue;
				}
				ctx.strokeRect(a.x + x, a.y + y, tileSize, tileSize)
			}
		}
		ctx.globalAlpha = 1;

		if (window.showSnapshots) {
			ctx.globalAlpha = 0.5;
			for (const playerId of Object.keys(shotPlayers)) {
				const player = shotPlayers[playerId];
				ctx.fillStyle = 'orange'
				ctx.beginPath();
				const pos = offset(player.pos.x, player.pos.y)
				ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = 'black';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle'
				ctx.fillText(player.name, pos.x, pos.y - player.radius * 1.5)
			}
			ctx.globalAlpha = 1
		}

		for (const { x, y, width, height, type } of obstacles) {
			const pos = offset(x, y);
			if (type == "obstacle") {
				ctx.fillStyle = '#b3b3b3';
			}
			else if (type == "bounce") {
				ctx.fillStyle = '#32a852';
			}
			if (type === 'point') {
				ctx.fillStyle = '#fcb000'
				ctx.strokeStyle = '#fcb000';
				ctx.lineWidth = 10;
				ctx.strokeRect(pos.x, pos.y, width, height)
				ctx.globalAlpha = 0.3;
			}
			ctx.fillRect(pos.x, pos.y, width, height)
			ctx.globalAlpha = 1;
		}

		for (const arrowId of Object.keys(arrows)) {
			// console.log(arrows[arrowId])
			const { lerpAngle, radius, life, alpha } = arrows[arrowId]
			const { x, y } = arrows[arrowId].pos;
			ctx.globalAlpha = alpha; // life 
			// ctx.fillStyle = '#d93311';
			// ctx.strokeStyle = '#a30800';
			// ctx.beginPath();
			const pos = offset(x, y);

			ctx.translate(pos.x, pos.y);
			ctx.rotate(lerpAngle + Math.PI / 2);
			ctx.fillStyle = '#ff0000';
			ctx.beginPath();
			ctx.rect(-6.25, -18.75, 12.5, 37.5);
			ctx.fill()
			ctx.rotate(-(lerpAngle + Math.PI / 2));
			ctx.translate(-pos.x, -pos.y);
		}
		ctx.globalAlpha = 1;


		for (const playerId of Object.keys(players)) {
			const player = players[playerId];

			if (window.showSnapshots) {
			}

			const pos = offset(player.pos.x, player.pos.y)



			// ctx.fillStyle = "#a37958";
			ctx.fillStyle = '#292929';
			if (leader != null && playerId === leader.id) {
				ctx.fillStyle = ' #deae12'
			}
			if (player.timer > 0) {
				ctx.fillStyle = '#616161'
				if (leader != null && playerId === leader.id) {
					ctx.fillStyle = '#c2ac65'
				}
			}
			// ctx.strokeStyle = '#363636';
			ctx.lineWidth = 2.5;
			ctx.beginPath();
			// const pos = offset(player.pos.x, player.pos.y)

			ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
			ctx.fill();

			if (player.dying) {
				ctx.fillStyle = '#d40000';
				ctx.globalAlpha = 0.5;
				ctx.beginPath();
				ctx.arc(pos.x, pos.y, player.radius, 0, Math.PI * 2);
				ctx.fill();
				ctx.globalAlpha = 1;
			}


			ctx.translate(pos.x, pos.y);
			ctx.rotate(player.interpAngle + Math.PI / 2);

			if (player.arrowing <= 0) {
				// ctx.beginPath()
				// ctx.strokeStyle = '#363636';
				// ctx.arc(
				// 	(-player.radius / 1.4) + 10 * player.timer * 3,
				// 	(-player.radius / 1.2) + 25 * player.timer * 3,
				// 	(player.radius / 3.3),
				// 	0,
				// 	Math.PI * 2
				// );
				// ctx.fill();
				// ctx.stroke();
				// ctx.beginPath();
				// ctx.arc(
				// 	(player.radius / 1.4) - 10 * player.timer * 3,
				// 	(-player.radius / 1.2) + 25 * player.timer * 3,
				// 	(player.radius / 3.3),
				// 	0,
				// 	Math.PI * 2
				// );
				// ctx.fill();
				// ctx.stroke();
				// ^hands
			} else {
				ctx.beginPath();
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 1;
				ctx.lineTo(Math.cos(1.25 * Math.PI) * (60), Math.sin(1.25 * Math.PI) * (60));
				ctx.lineTo(-5, -30 + player.arrowing * 25);
				ctx.lineTo(5, -30 + player.arrowing * 25);
				ctx.lineTo(Math.cos(1.75 * Math.PI) * (60), Math.sin(1.75 * Math.PI) * (60));
				ctx.stroke();

				ctx.globalAlpha = 0.5;
				ctx.beginPath();
				ctx.strokeStyle = '#ff0000'
				ctx.lineTo(0, -60 + player.arrowing * 25);
				ctx.lineTo(0, -150);
				ctx.stroke();
				ctx.globalAlpha = 1;

				ctx.beginPath();
				ctx.arc(0, 0, 60, 1.25 * Math.PI, 1.75 * Math.PI, false);
				ctx.lineWidth = 5;
				ctx.strokeStyle = '#ff2626';
				ctx.stroke();

				ctx.fillStyle = '#ff0000';
				ctx.fillRect(-5, -60 + player.arrowing * 25, 10, 30);

			}

			// ctx.restore();
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
			ctx.fillStyle = 'black';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle'
			ctx.font = `22px ${window.font}`
			if (!player.dying) {
				ctx.fillText(`${player.name}`, pos.x, pos.y + player.radius * 1.5)
			}

			if (player.chatMessageTimer > 0) {
				ctx.globalAlpha = player.chatMessageTimer > 0.5 ? 1 : (player.chatMessageTimer * 2) / 1;
				ctx.fillText(player.chatMessage, pos.x, pos.y - player.radius * 1.5)
				ctx.globalAlpha = 1;
			}
		}


		ctx.globalAlpha = 1;



		// ctx.fillStyle = "green";
		// ctx.beginPath();
		// const pos = offset(rotator.x, rotator.y)
		// ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
		// ctx.fill();

		ctx.globalAlpha = window.redness;
		ctx.fillStyle = '#eb0000';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 1;

		ctx.globalAlpha = killedNotifTime;
		ctx.fillStyle = '#0d0d0d';
		// ctx.fillRect(600, 700, 400, 50);
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = 'rgb(255, 0, 0)';
		ctx.font = `22px ${window.font}`
		ctx.fillText(`Eliminated`, 700, 725)
		const xOff = ctx.measureText('Eliminated').width;
		ctx.fillStyle = 'black'
		ctx.fillText(` ${killedPlayerName}`, 700 + xOff, 725);
		ctx.globalAlpha = 1;


		// minimap

		if (players[selfId] != null && !players[selfId].dying) {

			const mwidth = 200;
			const mheight = 200;

			ctx.globalAlpha = 0.75;
			ctx.fillStyle = '#707070';
			ctx.fillRect(0, canvas.height - mheight, mwidth, mheight);

			ctx.fillStyle = '#595959'
			for (const { x, y, width, height, type } of obstacles) {
				if (type == "obstacle") {
					ctx.fillStyle = '#595959';
				}
				else if (type == "bounce") {
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
					ctx.fillStyle = '#000000';
					if (leader != null && playerId === leader.id) {
						ctx.fillStyle = '#ffc400'
					}
					ctx.beginPath();
					ctx.arc((player.pos.x / arena.width) * mwidth, (canvas.height - mheight) + (player.pos.y / arena.height) * mheight, 4, 0, Math.PI * 2)
					ctx.fill()
				}
			}
		}

		ctx.globalAlpha = 1;



		ctx.font = `18px ${window.font}`

		ctx.fillStyle = 'rgb(100, 0, 0)';
		ctx.textAlign = 'left'
		if (window.debug) {
			ctx.fillText(`Players: ${Object.keys(players).length} | Download: ${stateMessageDisplay} msg/s (${(byteDisplay / 1000).toFixed(1)}kb/s | Upload: ${(uploadByteDisplay / 1000).toFixed(1)}kb/s | ${inputMessageDisplay} msg/s (inputs) | Ping: ${ping}ms | Spacing:[${lowest(spacings).toFixed(1)}, ${spacing.toFixed(1)}, ${highest(spacings).toFixed(1)}]ms | ServerSpacing: [${serverSpacing[0]}, ${serverSpacing[1]}, ${serverSpacing[2]}] | Angle: ${players[selfId] ?.angle.toFixed(1)}`, 10, 50);
			ctx.fillText(`Extralag: ${extraLag} | Interpolation: ${window.delta.toFixed(1)} / 1 | Interpolate: ${window._interpolate.toString().toUpperCase()} | Input Delay: ${Math.ceil((ping * 2) / (1000 / 60))} frames | Arrows: ${Object.keys(arrows).length} | ServerTickTime: ${serverTickMs}ms | ServerFrameTime: ${Math.round(serverTickMs / 60)}ms | ${window.fps}fps`, 10, 20)
		}

		ctx.fillStyle = '#242424';
		ctx.fillRect(canvas.width - 200, canvas.height - 30, 200, 30)

		ctx.font = `16px ${window.font}`
		

		if (window.autoRespawn) {
			ctx.fillStyle = '#00ff59';
			ctx.fillText("Auto Respawn", canvas.width - 125, canvas.height - 15)
		} else {
			ctx.globalAlpha = 0.6;
			ctx.fillStyle = '#00ff84';
			ctx.fillText("Auto Respawn", canvas.width - 125, canvas.height - 15)
			ctx.globalAlpha = 1;
		}

		ctx.fillStyle = '#4cfc00';

		if (window.movementMode === 'wasd') {
			ctx.fillText('WASD', canvas.width - 180, canvas.height - 15);
		} else {
			ctx.fillText('ULDR', canvas.width - 180, canvas.height - 15)
		}

		if (tab) {
			const sortedPlayers = Object.keys(players).sort((a, b) => players[b].score - players[a].score);
			ctx.globalAlpha = 0.8;
			ctx.fillStyle = 'black'
			const top = 200 - (25 + sortedPlayers.length * 25) / 2;
			ctx.fillRect(600, top, 400, 25 + sortedPlayers.length * 25);
			ctx.globalAlpha = 1;
			let index = 0;
			for (const id of sortedPlayers) {
				const { score, name } = players[id];
				const strScore = score < 999 ? `${Math.round(score)}`: `${Math.round((score / 1000) * 100) / 100}k`
				ctx.fillStyle = '#c4c4c4';
				ctx.font = `20px ${font}`
				ctx.fillText(`${index + 1}.`, 610, top + 25 + index * 25)
				ctx.fillText(`${strScore}`, 990 - ctx.measureText(`${strScore}`).width, top + 25 + index * 25)
				index++;
				ctx.fillStyle = '#ff0000'
				if(id === selfId) {
					ctx.fillStyle = 'white'
				}
				ctx.fillText(`${name}`, 640, top + index * 25)
			}
				// ctx.strokeStyle = 'black';
				// ctx.lineWidth = 1;
				// ctx.beginPath();
				// ctx.lineTo(600, top + 12.5 + index * 25);
				// ctx.lineTo(1000, top + 12.5 + index * 25);
				// ctx.stroke()
			} else if (iExist && !dead) {
				const score = Math.round(players[selfId].score);

				ctx.fillStyle = '#242424';
				ctx.font = `20px ${font}`;

				// ctx.globalAlpha = 0.8;
				ctx.fillRect(1500, 0, 100, 50);

				ctx.beginPath();
				ctx.lineTo(1500, 0);
				ctx.lineTo(1475, 0);
				ctx.lineTo(1500, 50);
				ctx.fill()

				// ctx.globalAlpha = 1;
				
				ctx.fillStyle = 'white';
				ctx.textAlign = 'center'
				ctx.fillText(`${score} `, (1535), 25);
				ctx.fillStyle = '#ffc800';
				ctx.fillText(`ap`, 1545 + ctx.measureText(`${score} `).width / 2, 25)

				
			}
		

		// if (leader != null) {
		// 	ctx.globalAlpha = 0.9;
		// 	// ctx.fillStyle = '#303030';
		// 	// ctx.fillRect(canvas.width - 350, 0, 350, 100)

		// 	ctx.fillStyle = 'black'

		// 	ctx.fillText('Current King', canvas.width - ctx.measureText('Current King').width * 1.75, 20);

		// 	ctx.strokeStyle = 'black';
		// 	ctx.lineWidth = 3;
		// 	ctx.beginPath();
		// 	ctx.lineTo(canvas.width - ctx.measureText('Current King').width * 2.3, 45);
		// 	ctx.lineTo(canvas.width - ctx.measureText('Current King').width / 5, 45);
		// 	ctx.stroke()
		// 	const width = ctx.measureText('Current King').width
		// 	ctx.textAlign = 'center'
		// 	ctx.fillStyle = 'black'
		// 	ctx.font = `22px ${window.font}`
		// 	ctx.fillText(`${leader.name} with ${leader.kills} eliminations`, canvas.width - width * 1.25, 70);
		// 	ctx.globalAlpha = 1;
		// }
	} catch (err) {
		document.body.innerHTML = err + 'from render' + JSON.stringify(leader);
	}
}	