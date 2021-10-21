const { Circle, Vector, Response, testPolygonCircle } = require('sat')

module.exports = class Arrow {
	constructor(player) {
		this.x = player.x + Math.cos(player.angle) * (player.radius - player.arrowing * 20);
		this.y = player.y + Math.sin(player.angle) * (player.radius - player.arrowing * 20);
		this.angle = player.angle;
		this.radius = 10;
		this.life = 2;
		this.speed = 6 + (player.arrowing / 3) * 20;
		this.alpha = 1;
		this.dead = false;
		this.parent = player.id;
		this.xv = Math.cos(this.angle) * this.speed;
		this.yv = Math.sin(this.angle) * this.speed;
	}
	die() {
		this.dead = true;
		this.life = Math.min(this.life, 0.5)
	}
	collideArrowObstacle(obstacle) {
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
				if (this.yv != 0) {
					if (relX < 0) {
						this.xv = 0;
						this.yv *= 0.7;
						this.angle = Math.PI / 2;

					} else {
						this.xv = 0;
						this.yv *= 0.7;
						this.angle = -Math.PI / 2;
					}
				} else {
					this.die()
				}
			} else {
				if (this.xv != 0) {
					if (relY > 0) {
						this.yv = 0;
						this.xv *= 0.7;
						this.angle = -Math.PI;
					} else {
						this.yv = 0;
						this.xv *= 0.7;
						this.angle = Math.PI;
					}
				} else {
					this.die()
				}
			}
		}
		if (distX < rectHalfSizeX + this.radius && distY < rectHalfSizeY + this.radius) {
			const playerSat = new Circle(new Vector(this.x, this.y), this.radius);
			const res = new Response();
			const collision = testPolygonCircle(obstacle.sat, playerSat, res);
			if (collision) {
				this.x += res.overlapV.x;
				this.y += res.overlapV.y;
			}
		}
	}
	update(arena, obstacles) {
		if (!this.dead) {
			this.x += this.xv * (60 * (1 / 60))
			this.y += this.yv * (60 * (1 / 60))
			for (const obstacle of obstacles) {
				this.collideArrowObstacle(obstacle)
			}
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
		if (!this.dead &&
			(this.x - this.radius < 0 || this.x + this.radius > arena.width || this.y - this.radius < 0 || this.y + this.radius > arena.height)) {
			this.die()
		}
		if (this.dead) {
			this.radius += 20 * (1 / 60)
		}


    // this.angle += 0.03;
    // this.xv = Math.cos(this.angle) * this.speed;
	// 	this.yv = Math.sin(this.angle) * this.speed;
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
			x: Math.round(this.x * 10) / 10,
			y: Math.round(this.y * 10) / 10,
			alpha: Math.round(this.alpha * 100) / 100,
			life: Math.round(this.life * 100) / 100,
			angle: this.angle,
		}
	}
}