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
		this.fric = 0.955;
		this.bfric = 0.985;
		this.kills = 0;
		this.speed = 20;
		this.deaths = 0;
		this.arrowsHit = 0;
		this.arrowsShot = 0;
		this.score = 0;
		this.dev = false;
		this.passive = true;
		this.spawnProtectionTimer = 0;
		

		this.abilityCooldown = 0;
		this.maxCd = 0;
		
		// Kronos/Klaydo
		this.timeSpentFreezing = 0;
		this.freezing = false;
		this.timeFreezeLimit = 4;

		// Scry
		this.fakedArrow = false;
		this.fakedArrowLastTime = false;
		this.showAim = true;
		this.noAimTime = 1;
		this.noAim = 0;

		// Stac/Director
		this.redirPoint = null;
		this.canCreatePoint = true;
		this.canRedirect = true;

		// Conquest
		this.canDash = false;
		this.dashAngle = 0;
		this.changedLastTime = false;
		

		// Crescent
		this.usingGravity = false;
		this.gravityTime = 0;
		this.gravX = null;
		this.gravY = null;

		this.name = `Agent ${Math.ceil(Math.random() * 9)}${Math.ceil(Math.random() * 9)}`
	}
	spawn(obstacles, arena) {
		this.score = 0;
		this.arrowsHit = 0;
		this.arrowsShot = 0;
		this.deaths = 0;
		this.kills = 0;
		this.x = Math.round(Math.random() * arena.width) + this.radius
		this.y = Math.round(Math.random() * arena.height) + this.radius;
		if (this.intersectingObstacles(obstacles)) {
			this.spawn(obstacles, arena);
		}
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
	intersectingObstacles(obstacles) {
		for (const obstacle of obstacles) {
			const rectHalfSizeX = obstacle.width / 2
			const rectHalfSizeY = obstacle.height / 2
			const rectCenterX = obstacle.x + rectHalfSizeX;
			const rectCenterY = obstacle.y + rectHalfSizeY;
			const distX = Math.abs(this.x - rectCenterX);
			const distY = Math.abs(this.y - rectCenterY);
			if ((distX < rectHalfSizeX + this.radius) && (distY < rectHalfSizeY + this.radius)) {
				return true;
			}
		}
		return false;
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
			x: Math.round(this.x * 100) / 100,
			y: Math.round(this.y * 100) / 100,
			xv: this.xv,
			yv: this.yv,
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
			abilityCd: this.abilityCooldown,
			maxCd: this.maxCd,
			// timer: this.timer,
		};

		if (this.character.Name === 'Crescent') {
			// obj.gravX = Math.round(this.gravX);
			// obj.gravY = Math.round(this.gravY);
			obj.usingGravity = this.usingGravity;
		}

		if (this.character.Name === 'Conquest') {
			obj.canDash = this.canDash;
			obj.lastDashForce = this.lastDashForce;
			obj.dashAngle = this.dashAngle;
			obj.changedLastTime = this.changedLastTime;
		}

		if (this.character.Name === 'Stac') {
			obj.point_x = this.redirPoint === null ? null: this.redirPoint.x;
			obj.point_y = this.redirPoint === null ? null: this.redirPoint.y;
			obj.canCreatePoint = this.canCreatePoint;
		}

		if (this.character.Name === 'Klaydo') {
			obj.timeSpentFreezing = Math.round(this.timeSpentFreezing * 100)/100;
			obj.timeFreezeLimit = Math.round(this.timeFreezeLimit * 100) / 100;
		}

		if (this.character.Name === 'Scry') {
			obj.showAim = this.showAim;
			obj.canFakeArrow = !this.fakedArrowLastTime && !this.fakedArrow;
		}


		return obj;
	}
}