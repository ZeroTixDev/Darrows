module.exports = class Player {
	constructor(x, y) {
		this.x = x;
		this.y = y;
    this.spawn = { x, y }
		this.radius = 30;
		this.xv = 0;
		this.yv = 0;
		this.lastRecievedInput = { left: false, right: false, up: false, down: false}
		this.name = `Guest ${Math.ceil(Math.random() * 9)}${Math.ceil(Math.random() * 9)}`
	}
	isDifferent(player) {
		return player.x !== this.x || player.y !== this.y || player.radius !== this.radius;
	}
	respawn() {
		this.x = this.spawn.x
		this.y = this.spawn.y;
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
			name: this.name,
      spawn: { x: this.spawn.x, y: this.spawn.y }
		};
	}
}