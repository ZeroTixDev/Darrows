const { createInput } = require('../shared/func.js');

module.exports = class Player {
	constructor(id, arena) {
		this.radius = 40;
		this.x = Math.round(Math.random() * arena.width) + this.radius
		this.y = Math.round(Math.random() * arena.height) + this.radius;
		this._arena = arena;
		this.xv = 0;
		this.yv = 0;
		this.bxv = 0;
		this.byv = 0;
		this.id = id;
		this.dying = false;
		this.timer = 0;
		this.angle = 0;
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

		this.name = `Agent ${Math.ceil(Math.random() * 9)}${Math.ceil(Math.random() * 9)}`
	}
	stats() {
		return {
			kills: this.kills,
			deaths: this.deaths,
			arrowsHit: this.arrowsHit,
			arrowsShot: this.arrowsShot,
		}
	}
	accuracy() {
		if (this.arrowsShot === 0) {
			return 0;
		}
		return ((this.arrowsHit / this.arrowsShot) * 100).toFixed(0);
	}
	spawn() {
		
		this.x = Math.round(Math.random() * this._arena.width) + this.radius
		this.y = Math.round(Math.random() * this._arena.height) + this.radius
		this.xv = 0;
		this.yv = 0;
		this.bxv = 0;
		this.arrowsShot = 0;
		this.arrowsHit = 0;
		this.byv = 0;
		this.angleVel = 0;
		this.spaceLock = false;
		this.timer = 0;
		this.dying = false;
		this.respawn = false;
		this.radius = 40;
		this.arrowing = false;
		this.timer = 0;
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
		return {
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
			// timer: this.timer,
		};
	}
}