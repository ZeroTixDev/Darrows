

class CPlayer {
	constructor(pack, isSelf) {
		this.x = pack.x;
		this.y = pack.y;
		this.xv = pack.xv;
		this.yv = pack.yv;
		this.radius = pack.radius;
		this.name = pack.name;
		this.server = { x: pack.x, y: pack.y, xv: pack.xv, yv: pack.yv }
		this.pos = { x: this.x, y: this.y };
		this.interp = { x: this.x, y: this.y }
		this.bufferQueueSize = 0;
		this.bufferQueue = [];
		this.buffer = [];
		this.isSelf = isSelf;
	}
	smooth(delta, isSelf) {


		if (isSelf) {
			this.pos.x = this.x;
			this.pos.y = this.y;
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


		// const dt = Math.min(delta * 30, 1);
		// this.pos.x = lerp(this.pos.x, this.x, dt);
		// this.pos.y = lerp(this.pos.y, this.y, dt);

		// this.pos.x = this.x;
		// this.pos.y = this.y;

	}
	Snap(data) {
		// if (this.isSelf && this.snapshots.length >= this.ticksBehind) {
		// 	this.snapshots.shift();
		// }
		// this.snapshots.push({
		// 	x: data.x,
		// 	y: data.y,
		// 	time: window.performance.now() + (1000 / 60) * (this.ticksBehind),
		// });
		if (!this.isSelf) {
			this.buffer.push({ time: window.performance.now() , x: data.x, y: data.y });
			// if (this.bufferQueue.length >= this.bufferQueueSize) {
			// 	this.buffer.push({ time: window.performance.now(), x: this.bufferQueue[0].x, y: this.bufferQueue[0].y });
			// 	this.bufferQueue.shift();
			// }
			// this.bufferQueue.push({ x: data.x, y: data.y })
		}
		this.x = data.x;
		this.y = data.y;
		this.xv = data.xv;
		this.yv = data.yv;
		this.pos.x = data.x;
		this.pos.y = data.y;
		this.server = { x: this.x, y: this.y, xv: this.xv, yv: this.yv };
		this.radius = data.radius;
		// this.name = this.bufferQueue.length;
	}
}

function lerp(start, end, time) {
	return start * (1 - time) + end * time;
}