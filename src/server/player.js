module.exports = class Player {
	constructor() {
		this.radius = 50;
		this.x = Math.round(Math.random() * 500) + this.radius
		this.y = Math.round(Math.random() * 500) + this.radius
		this.xv = 0;
		this.yv = 0;
		this.dying = false;
		this.timer = 0;
		this.angle = 0;
		this.spaceLock = false;
		this.angleVel = 0;
		this.arrows = [];
		this.lastRecievedInput = { left: false, right: false, up: false, down: false }
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
		this.x = Math.round(Math.random() * 500) + this.radius
		this.y = Math.round(Math.random() * 500) + this.radius
		this.xv = 0;
		this.yv = 0;
		this.angleVel = 0;
		this.spaceLock = false;
		this.timer = 0;
		this.arrows = [];
		this.dying = false;
		this.respawn = false;
		this.radius = 50;
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
			angleVel: this.angleVel,
			spaceLock: this.spaceLock,
			arrows: this.arrows,
			// timer: this.timer,
		};
	}
}