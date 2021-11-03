
class CArrow {
	constructor(pack) {
		for (const key of Object.keys(pack)) {
			this[key] = pack[key]
		}
		this.pos = { x: this.x, y: this.y };
		this.lerpAngle = this.angle;
	}
	smooth(delta) {
		if (!_interpolate) {
			this.pos.x = this.x;
			this.pos.y = this.y;
			this.lerpAngle = this.angle;
			return;
		}

		this.pos.x = lerp(this.pos.x, this.x, delta );
		this.pos.y = lerp(this.pos.y, this.y, delta );
		const dtheta = this.angle - this.lerpAngle;
		if (dtheta > Math.PI) {
			this.lerpAngle += 2 * Math.PI;
		} else if (dtheta < -Math.PI) {
			this.lerpAngle -= 2 * Math.PI;
		}

		this.lerpAngle = lerp(this.lerpAngle, this.angle, delta / 1.5)
		// this.lerpAngle = this.angle;

	}
	Snap(data) {
		for (const key of Object.keys(data)) {
			this[key] = data[key]
		}
	}
}