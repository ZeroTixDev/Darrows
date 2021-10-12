const { createInput } = require('../shared/func.js');

module.exports = class Player {
	constructor(id) {
		this.radius = 40;
		this.x = Math.round(Math.random() * 2000) + this.radius
		this.y = Math.round(Math.random() * 2000) + this.radius
		this.xv = 0;
		this.yv = 0;
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
		this.chatMessageTime = 8;
		this.kills = 0;
		this.name = `${Math.ceil(Math.random() * 9)}${Math.ceil(Math.random() * 9)}`
	}
	isDifferent(player) {
		for (const key of Object.keys(player)) {
			if (this[key] !== player[key]) {
				return true;
			}
		}
		return false;
	}
	spawn() {
		this.x = Math.round(Math.random() * 2000) + this.radius
		this.y = Math.round(Math.random() * 2000) + this.radius
		this.xv = 0;
		this.yv = 0;
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
			x: Math.round(this.x * 10)/10,
			y: Math.round(this.y * 10)/10,
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