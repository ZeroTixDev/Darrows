const { createInput } = require('../shared/func.js');

module.exports = class Player {
	constructor(id) {
		this.radius = 45;
		this.x = Math.round(Math.random() * 2000) + this.radius
		this.y = Math.round(Math.random() * 1500) + this.radius
		this.xv = 0;
		this.yv = 0;
		this.id = id;
		this.dying = false;
		this.timer = 0;
		this.angle = 0;
		this.timerMax = 1;
		this.arrowing = false;
		this.spaceLock = false;
		this.timer = 0;
		this.angleVel = 0;
		this.input = createInput();
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
		this.y = Math.round(Math.random() * 1500) + this.radius
		this.xv = 0;
		this.yv = 0;
		this.angleVel = 0;
		this.spaceLock = false;
		this.timer = 0;
		this.dying = false;
		this.respawn = false;
		this.radius = 45;
		this.arrowing = false;
		this.timer = 0;
	}
	pack() {
		return {
			x: this.x,
			y: this.y,
			dying: this.dying,
			radius: this.radius,
			timer: this.timer,
			xv: this.xv,
			yv: this.yv,
			angle: this.angle,
			name: this.name,
			timer: this.timer,
			arrowing: this.arrowing,
			angleVel: this.angleVel,
			spaceLock: this.spaceLock,
			input: this.input,
			timerMax: this.timerMax,
			// timer: this.timer,
		};
	}
}