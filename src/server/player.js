const { createInput } = require('../shared/func.js');
const Character = require('../shared/character.js');

module.exports = class Player {
	constructor(id, arena, obstacles, character = 'Default') {
		this.character = Character[character];
		this.radius = 40;
		this.spawn(obstacles, arena)
		this.xv = 0;
		this.yv = 0;
		this.bxv = 0;
		this.byv = 0;
		this.id = id;
		this.dying = false;
		this.timer = 0;
		this.angle = -Math.PI / 2;
		this.timerMax = 1.5;
		this.arrowing = false;
		this.spaceLock = false;
		this.timer = 0;
		this.angleVel = 0;
		this.input = createInput();
		this.chatMessage = '';
		this.chatMessageTimer = 0;
		this.fric = 0.955;
		this.bfric = 0.985;
		this.chatMessageTime = 8;
		this.kills = 0;
		this.speed = 25;
		this.deaths = 0;
		this.arrowsHit = 0;
		this.arrowsShot = 0;
		this.score = 0;
		this.dev = false;
		this.passive = false;
		

		this.abilityCooldown = 0;
		this.maxCd = 0;
		
		// Kronos
		this.timeSpentFreezing = 0;
		this.freezing = false;
		this.timeFreezeLimit = 4;

		this.name = `Agent ${Math.ceil(Math.random() * 9)}${Math.ceil(Math.random() * 9)}`
	}
	spawn(obstacles, arena) {
		this.x = Math.round(Math.random() * arena.width) + this.radius
		this.y = Math.round(Math.random() * arena.height) + this.radius;
		this.spawnFix(obstacles);
		this.score = 0;
		this.arrowsHit = 0;
		this.arrowsShot = 0;
		this.deaths = 0;
		this.kills = 0;
	}
	addScore(s) {
		this.score += s;
	}
	negateScore(s) {
		this.score -= s;
		if (this.score <= 0) {
			this.score = 0;
		}
	}
	stats() {
		return {
			kills: this.kills,
			deaths: this.deaths,
			arrowsHit: this.arrowsHit,
			arrowsShot: this.arrowsShot,
			score: this.score,
			dev: this.dev,
			character: this.character,
		}
	}
	accuracy() {
		if (this.arrowsShot === 0) {
			return 0;
		}
		return ((this.arrowsHit / this.arrowsShot) * 100).toFixed(0);
	}
	spawnFix(obstacles) {
		for (const obstacle of obstacles) {
			const rectHalfSizeX = obstacle.width / 2
			const rectHalfSizeY = obstacle.height / 2
			const rectCenterX = obstacle.x + rectHalfSizeX;
			const rectCenterY = obstacle.y + rectHalfSizeY;
			const distX = Math.abs(this.x - rectCenterX);
			const distY = Math.abs(this.y - rectCenterY);
			if ((distX < rectHalfSizeX + this.radius) && (distY < rectHalfSizeY + this.radius)) {
				let relX;
				if (this.x > rectCenterX) {
					relX = this.x - this.radius - rectCenterX - rectHalfSizeX;
				}
				else {
					relX = - rectCenterX + rectHalfSizeX + this.x + this.radius;
				}
				let relY;
				if (this.y > rectCenterY) {
					relY = this.y - this.radius - rectCenterY - rectHalfSizeY;
				}
				else {
					relY = - rectCenterY + rectHalfSizeY + this.y + this.radius;
				}
				if (Math.abs(relX) < Math.abs(relY)) {
					if (relX < 0) {
						this.x = rectCenterX + rectHalfSizeX + this.radius;
						this.xv = 0;
					} else {
						this.x = rectCenterX - rectHalfSizeX - this.radius;
						this.xv = 0;
					}
				} else {
					if (relY > 0) {
						this.y = rectCenterY - rectHalfSizeY - this.radius;
						this.yv = 0;
					} else {
						this.y = rectCenterY + rectHalfSizeY + this.radius;
						this.yv = 0;
					}
				}
			}
		}
	}
	differencePack(player) {
		if (!player) {
			return this.pack()
		}
		const pack = this.pack();
		const diffPack = {};
		for (const key of Object.keys(pack)) {
			if (pack[key] === player[key]) {
				continue;
			}
			diffPack[key] = pack[key];
		}
		return diffPack;
	}
	pack() {
		const obj =  {
			x: Math.round(this.x * 10) / 10,
			y: Math.round(this.y * 10) / 10,
			dying: this.dying,
			radius: this.radius,
			timer: Math.round(this.timer * 100) / 100,
			// xv: this.xv,
			// yv: this.yv,
			angle: this.angle,
			name: this.name,
			// timer: this.timer,
			arrowing: this.arrowing,
			// angleVel: this.angleVel,
			// spaceLock: this.spaceLock,
			timerMax: this.timerMax,
			score: Math.round(this.score),
			dev: this.dev,
			passive: this.passive,
			characterName: this.character.Name,
			abilityCd: Math.round(this.abilityCooldown * 100) / 100,
			maxCd: this.maxCd,
			// timer: this.timer,
		};

		if (this.character.Name === 'Kronos') {
			obj.timeSpentFreezing = this.timeSpentFreezing;
			obj.timeFreezeLimit = this.timeFreezeLimit;
		}


		return obj;
	}
}