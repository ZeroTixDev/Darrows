

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
		this.ray = new Raycast({ x: this.x, y: this.y }, 0);
		this.interpAngle = pack.angle;
	}
	smooth(delta, isSelf) {


		if (isSelf) {
			this.pos.x = this.x;
			this.pos.y = this.y;
			this.interpAngle = this.angle;
			return;
		}


		// const now = window.performance.now();
		// const render_timestamp = now - 1000/60;

		// // Drop older positions.
		// while (this.buffer.length >= 2 && this.buffer[1].time <= render_timestamp) {
		// 	this.buffer.shift();
		// }

		// // Interpolate between the two surrounding authoritative positions.
		// if (this.buffer.length >= 2 && this.buffer[0].time <= render_timestamp && render_timestamp <= this.buffer[1].time) {
		// 	const x0 = this.buffer[0].x;
		// 	const x1 = this.buffer[1].x;
		// 	const y0 = this.buffer[0].y;
		// 	const y1 = this.buffer[1].y;
		// 	const t0 = this.buffer[0].time;
		// 	const t1 = this.buffer[1].time;

		// 	this.oldInterp = { x: x0, y: y0 };
		// 	this.newInterp = { x: x1, y: y1 };

		// 	this.interp.x = x0 + ((x1 - x0) * (render_timestamp - t0)) / (t1 - t0);
		// 	this.interp.y = y0 + ((y1 - y0) * (render_timestamp - t0)) / (t1 - t0);

		// 	this.name = `${(render_timestamp - t0).toFixed(1)}%`
		// }


		// this.pos.x = this.interp.x;
		// this.pos.y = this.interp.y;

		// console.log('lerping', this.name)
		const dt = Math.min(delta * 20, 1);
		this.pos.x = lerp(this.pos.x, this.x, dt);
		this.pos.y = lerp(this.pos.y, this.y, dt);

		const dtheta = this.angle - this.interpAngle;
         if (dtheta > Math.PI) {
            this.interpAngle += 2 * Math.PI;
         } else if (dtheta < -Math.PI) {
            this.interpAngle -= 2 * Math.PI;
         }
         this.interpAngle = lerp(this.interpAngle, this.angle, dt);

		// this.pos.x = this.x;
		// this.pos.y = this.y;

	}
	Snap(data) {
	// snapshots
		
		
		this.angleVel = data.angleVel;
		this.angle = data.angle;
		// this.ray.setRay({ x: this.ray.pos.x, y: this.ray.pos.y,}, this.angle)
		this.x = data.x;
		this.y = data.y;
		this.xv = data.xv;
		this.yv = data.yv;
		// this.timer = data.timer;
		// this.pos.x = data.x;
		// this.pos.y = data.y;
		this.server = { x: this.x, angle: this.angle, y: this.y, xv: this.xv, yv: this.yv };
		this.radius = data.radius;
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

function lerp(start, end, time) {
	return start * (1 - time) + end * time;
}