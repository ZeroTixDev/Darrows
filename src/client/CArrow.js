
class CArrow {
	constructor(pack, isSelf) {
		for (const key of Object.keys(pack)) {
			this[key] = pack[key]
		}
		this.pos = { x: this.x, y: this.y };
	}
	smooth(delta) {


		if (!_interpolate) {
			this.pos.x = this.x;
			this.pos.y = this.y;
			return;
		}

		this.pos.x = lerp(this.pos.x, this.x, delta );
		this.pos.y = lerp(this.pos.y, this.y, delta );
		// console.log(this)

	}
	Snap(data) {
		for (const key of Object.keys(data)) {
			this[key] = data[key]
		}
	}
}

function lerp(start, end, dt) {
	return (1 - dt) * start + dt * end;
}