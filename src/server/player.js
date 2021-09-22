module.exports = class Player {
	constructor() {
		this.x = Math.round(Math.random() * 500)
		this.y = Math.round(Math.random() * 500);
		this.radius = 30;
		this.xv = 0;
		this.yv = 0;
		this.angle = 0;
		this.lastRecievedInput = { left: false, right: false, up: false, down: false }
		this.name = `Guest ${Math.ceil(Math.random() * 9)}${Math.ceil(Math.random() * 9)}`
	}
	isDifferent(player) {
		return player.angle !== this.angle || player.x !== this.x || player.y !== this.y || player.radius !== this.radius;
	}
	respawn() {
		this.x = Math.round(Math.random() * 500)
		this.y = Math.round(Math.random() * 500);
		this.xv = 0;
		this.yv = 0;
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
		};
	}
}