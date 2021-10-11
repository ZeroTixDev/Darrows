
class CPlayer {
	constructor(pack, isSelf) {
		for (const key of Object.keys(pack)) {
			this[key] = pack[key]
		}
		this.server = { x: pack.x, y: pack.y, xv: pack.xv, yv: pack.yv }
		this.pos = { x: this.x, y: this.y };
		this.interp = { x: this.x, y: this.y }
		this.bufferQueueSize = 0;
		this.bufferQueue = [];
		this.buffer = [];
		this.isSelf = isSelf;
		// this.ray = new Raycast({ x: this.x, y: this.y }, 0);
		this.interpAngle = pack.angle;
	}
	smooth(delta, isSelf) {


		if (!_interpolate) {
			this.pos.x = this.x;
			this.pos.y = this.y;
			this.interpAngle = this.angle;
			return;
		}

		this.pos.x = lerp(this.pos.x, this.x, delta);
		this.pos.y = lerp(this.pos.y, this.y, delta);

		const dtheta = this.angle - this.interpAngle;
		if (dtheta > Math.PI) {
			this.interpAngle += 2 * Math.PI;
		} else if (dtheta < -Math.PI) {
			this.interpAngle -= 2 * Math.PI;
		}
		this.interpAngle = lerp(this.interpAngle, this.angle, delta);



		// this.interpAngle = this.angle;
		// this.pos.x = this.x;
		// this.pos.y = this.y;

		// this.pos.x = this.x;
		// this.pos.y = this.y;

	}
	Snap(data) {
		// snapshots
		for (const key of Object.keys(data)) {
			// if (key === 'angle' && window._predict) {
			// 	continue;
			// }
			this[key] = data[key]
		}

		// this.angleVel = data.angleVel;
		// this.angle = data.angle;
		// // this.ray.setRay({ x: this.ray.pos.x, y: this.ray.pos.y,}, this.angle)
		// this.x = data.x;
		// this.y = data.y;
		// this.xv = data.xv;
		// this.yv = data.yv;
		// this.arrowing = data.arrowing;
		// this.dying = data.dying;
		// this.input = data.input;
		// this.timer = data.timer;
		// this.spaceLock = data.spaceLock;
		// this.arrows = data.arrows;
		// this.timer = data.timer;
		// this.pos.x = data.x;
		// this.pos.y = data.y;
		this.server = { x: this.x, angle: this.angle, y: this.y, xv: this.xv, yv: this.yv };
		// this.radius = data.radius;
		// this.name = this.bufferQueue.length;
	}
	pack() {
		return {
			x: this.x,
			y: this.y,
			radius: this.radius,
			name: this.name,
		};
	}
}

function lerp(start, end, dt) {
	return (1 - dt) * start + dt * end;
}