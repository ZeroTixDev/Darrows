class CPlayer {
	constructor(pack) {
		this.x = pack.x;
		this.y = pack.y;
		this.xv = pack.xv;
		this.yv = pack.yv;
		this.radius = pack.radius;
		this.name = pack.name;
		this.pos = { x: this.x, y: this.y };
		this.interp = { x: this.x, y: this.y }
		this.snapshots = [];
		this.ticksBehind = 10;
	}
	smooth(delta, isSelf) {


		if (isSelf) {
			this.pos.x = this.x;
			this.pos.y = this.y;
			return;
		}

		const dt = Math.min(delta * 20, 1);

		this.pos.x = lerp(this.pos.x, this.x, dt)
		this.pos.y = lerp(this.pos.y, this.y, dt)

		// if (this.snapshots.length >= 1) {
		// 	// let index = 0;
		// 	// while (this.snapshots.length > 0 && this.snapshots[index].time > window.performance.now()) {
		// 	// 	this.snapshots.shift();
		// 	// }
		// 	if (this.snapshots[0] != undefined) {
		// 		const dt = Math.min(delta * 20, 1);
		// 		while (this.snapshots[0] != undefined && this.snapshots[0].time < window.performance.now()) {
		// 			this.snapshots.shift();
		// 		}
		// 		if (this.snapshots[0] !== undefined) {
		// 			this.pos.x = this.snapshots[0].x;
		// 			this.pos.y = this.snapshots[0].y;
		// 		}
		// 		this.interp.x = lerp(this.interp.x, this.pos.x, dt);
		// 		this.interp.y = lerp(this.interp.y, this.pos.y, dt);
		// 	}
		// }

	}
	Snap(data) {
		if (this.snapshots.length >= this.ticksBehind) {
			this.snapshots.shift();
		}
		this.snapshots.push({
			x: data.x,
			y: data.y,
			time: window.performance.now() + (1000/60) * (this.ticksBehind + 1),
		});
		this.x = data.x;
		this.y = data.y;
		this.xv = data.xv;
		this.yv = data.yv;
		this.radius = data.radius;
	}
}

function lerp(start, end, time) {
	return start * (1 - time) + end * time;
}