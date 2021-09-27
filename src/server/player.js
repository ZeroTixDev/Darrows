module.exports = class Player {
	constructor() {
		this.x = Math.round(Math.random() * 500)
		this.y = Math.round(Math.random() * 500);
		this.radius = 30;
		this.xv = 0;
		this.yv = 0;
		// this.timer = 0;
		this.angle = 0;
		this.angleVel = 0;
		this.lastRecievedInput = { left: false, right: false, up: false, down: false }
		this.name = `Guest ${Math.ceil(Math.random() * 9)}${Math.ceil(Math.random() * 9)}`
	}
	isDifferent(player) {
		for (const key of Object.keys(player)) {
			if (this[key] !== player[key]) {
				return true;
			}
		}
		return false;
	}
	respawn() {
		this.x = Math.round(Math.random() * 500)
		this.y = Math.round(Math.random() * 500);
		this.xv = 0;
		this.yv = 0;
		this.angleVel = 0;
		// this.timer = 0;
	}
	pack() {
		return {
			x: this.x,
			y: this.y,
			radius: this.radius,
			xv: this.xv,
			yv: this.yv,
			angle: this.angle,
			name: this.name,
			angleVel: this.angleVel,
			// timer: this.timer,
		};
	}
}