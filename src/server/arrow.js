 const { Circle, Vector, Response, testPolygonCircle } = require('sat')

module.exports = class Arrow {
	constructor(player, fake = false) {
		this.x = player.x + Math.cos(player.angle) * (player.radius - player.arrowing * 20);
		this.y = player.y + Math.sin(player.angle) * (player.radius - player.arrowing * 20);
		this.angle = player.angle;
		this.radius = 10;
		this.life = 3.5;
		this.speed = (5 + (player.arrowing / 3) * 16) * 0.8;
		this.max = player.arrowing === 3;
		this.alpha = 1;
		this.dead = false;
		this.parent = player.id;
		this.xv = Math.cos(this.angle) * this.speed;
		this.yv = Math.sin(this.angle) * this.speed;
		this.slided = false;
		this.freezed = false;
		this.oldVel = { x: 0, y: 0 };
		this.c = 0; // counter of how long it lasts
		this.fake = fake;
		this.redirected = false;
		this.gravity = false;
	}
	freeze() {
		this.freezed = true;
		this.oldVel = { x: this.xv, y: this.yv }
		this.xv = 0;
		this.yv = 0;
	}
	unfreeze() {
		this.freezed = false;
		this.xv = this.oldVel.x;
		this.yv = this.oldVel.y;
	}
	die() {
		this.dead = true;
		this.life = Math.min(this.life, 0.5)
		this.xv = 0;
		this.yv = 0;
	}
	collide(arrow) {
		if (arrow.dead || this.dead) return;
		// if (arrow.freezed || this.freezed) return;
		if (this.fake && this.parent === arrow.parent) return;
		if (this.parent === arrow.parent) return;
		const distX = arrow.x - this.x;
		const distY = arrow.y - this.y;
		if (distX <= arrow.radius + this.radius && distY <= arrow.radius + this.radius) {
			const dist = Math.sqrt(distX * distX + distY * distY);
			if (dist < this.radius + arrow.radius) {
				if (this.freezed) {
					arrow.die();
				} else if (arrow.freezed) {
					this.die();
				} else {
					this.die();
					arrow.die();
				}
			}
		}
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
			if (Math.abs(relX) < Math.abs(relY) && obstacle.type !== 'point') {
				if (this.yv != 0) {
					if (relX < 0) {
						if (obstacle.type === 'bounce') {
							this.xv *= -0.95;
							this.angle = Math.atan2(this.yv, this.xv);
						} else {
							this.xv = 0;
							this.yv *= 0.95;
							if (this.angle < Math.PI / 2) {
								this.angle = Math.PI * 1.5;
							} else {
								this.angle = Math.PI / 2;
							}
						}
						this.slided = true;

					} else {

						if (obstacle.type === 'bounce') {
							this.xv *= -0.95;
							this.angle = Math.atan2(this.yv, this.xv);
						} else {
							this.xv = 0;
							this.yv *= 0.95;
							if (this.angle > 0) {
								this.angle = Math.PI / 2;
							} else {
								this.angle = -Math.PI / 2;
							}
						}
						this.slided = true;
					}
				} else {
					if (obstacle.type === 'bounce') {
						this.slided = true;
						this.xv *= -0.95;
						this.angle = Math.atan2(this.yv, this.xv);
					} else {
						this.die()
					}
				}
			} else if (obstacle.type !== 'point') {
				if (this.xv != 0) {
					if (relY > 0) {
						if (obstacle.type === 'bounce') {
							this.yv *= -0.9;
							this.angle = Math.atan2(this.yv, this.xv)
						} else {
							this.yv = 0;
							this.xv *= 0.95;
							if (this.angle < Math.PI / 2) {
								this.angle = -Math.PI * 2;
							} else {
								this.angle = Math.PI;
							}
						}
						this.slided = true;
					} else {
						if (obstacle.type === 'bounce') {
							this.yv *= -0.9;
							this.angle = Math.atan2(this.yv, this.xv)
						} else {
							this.yv = 0;
							this.xv *= 0.95;
							if (this.angle < -Math.PI / 2) {
								this.angle = Math.PI;
							} else {
								this.angle = 0;
							}
						}
						this.slided = true;
					}
				} else {
					if (obstacle.type === 'bounce') {
						this.yv *= -0.9;
						this.angle = Math.atan2(this.yv, this.xv)
						this.slided = true;
					} else {
						this.die()
					}
				}
			}
		}
		if (distX < rectHalfSizeX + this.radius && distY < rectHalfSizeY + this.radius) {
			const playerSat = new Circle(new Vector(this.x, this.y), this.radius);
			const res = new Response();
			const collision = testPolygonCircle(obstacle.sat, playerSat, res);
			if (collision) {
				if (obstacle.type !== 'point') {
					this.x += res.overlapV.x;
					this.y += res.overlapV.y;
				}
			}
		}
	}
	update(arena, obstacles, players) {
		this.c += dt
		if (!this.dead) {
			if (this.gravity) {
				// arrow is being pulled in
				for (const player of Object.values(players)) {
					if (player.id !== this.parent) continue;
					const angle = Math.atan2(player.y - this.y, player.x - this.x);
					const gravStrength = 25;
					this.xv += (Math.cos(angle) * gravStrength) * dt;
					this.yv += (Math.sin(angle) * gravStrength) * dt;
					break;
				}
				this.angle = Math.atan2(this.yv, this.xv)
			}
			if (this.xv > this.speed) {
				this.xv = this.speed;
			}

			if (this.xv < -this.speed) {
				this.xv = -this.speed;
			}

			if (this.yv > this.speed) {
				this.yv = this.speed;
			}

			if (this.yv < -this.speed) {
				this.yv = -this.speed;
			}

			this.x += this.xv * (60 * dt)
			this.y += this.yv * (60 * dt)
			for (const obstacle of obstacles) {
				this.collideArrowObstacle(obstacle)
			}
		}
		if ((this.freezed && this.dead) || !this.freezed) {
			this.life -= dt;
		}
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
			// this.radius += 20 * (1 / 60)
		}




	}
	differencePack(arrow) {
		if (!arrow) {
			return this.pack()
		}
		const pack = this.pack();
		const diffPack = {};
		for (const key of Object.keys(pack)) {
			if (pack[key] === arrow[key]) continue;
			diffPack[key] = pack[key];
		}
		return diffPack;
	}
	pack() {
		return {
			x: Math.round(this.x * 100) / 100,
			y: Math.round(this.y * 100) / 100,
			alpha: Math.round(this.alpha * 100) / 100,
			life: Math.round(this.life * 100) / 100,
			angle: this.angle,
			parent: this.parent,
			freezed: this.freezed,
			c: this.c,
			fake: this.fake,
			redirected: this.redirected,
			gravity: this.gravity,
		}
	}
}