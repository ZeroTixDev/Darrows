module.exports = class Arrow {
	constructor(player) {
		this.x = player.x + Math.cos(player.angle) * (player.radius - player.arrowing * 20);
		this.y = player.y + Math.sin(player.angle) * (player.radius - player.arrowing * 20);
		this.angle = player.angle;
		this.radius = 10;
		this.life = 2.5;
		this.speed = 6 + (player.arrowing / 3) * 20;
		this.alpha = 1;
		this.dead = false;
		this.parent = player.id;
	}
	die() {
		this.dead = true;
		this.life = Math.min(this.life, 0.5)
	}
	update(arena) {
		if (!this.dead) {
			this.x += Math.cos(this.angle) * (this.speed * (60 * (1 / 60)));
			this.y += Math.sin(this.angle) * (this.speed * (60 * (1 / 60)));
		}
		this.life -= 1 / 60;
		if (this.life <= 0.5) {
			this.alpha = Math.max((this.life * 2) / 1, 0);
		}
		if (this.alpha <= 0) {
			this.alpha = 0;
		}
		if (this.life <= 0) {
			this.life = 0;
		}
		if (!this.dead && (this.x - this.radius < 0 || this.x + this.radius > arena.width || this.y - this.radius < 0 || this.y + this.radius > arena.height)) {
			// this.life = 0;
			this.dead = true;
			this.life = Math.min(this.life, 0.5);
		}
		if (this.dead) {
			this.radius += 20 * (1 / 60)
		}
	}
	differencePack(arrow) {
		if (!arrow) {
			return this.pack()
		}
		const pack = this.pack();
		const diffPack = {};
		for (const key of Object.keys(pack)) {
			if (pack[key] === arrow[key]) {
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
			alpha: Math.round(this.alpha * 100)/100,
			life: Math.round(this.life * 100)/100,
			angle: this.angle,
		}
	}
}