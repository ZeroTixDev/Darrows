class Raycast {
	constructor(pos, angle) {
		this.pos = pos;
		this.angle = angle; // in radians
		this.direction = { x: Math.cos(this.angle), y: Math.sin(this.angle) }
	}
	setRay(pos, angle) {
		this.pos = pos;
		this.angle = angle;
		this.direction = { x: Math.cos(this.angle), y: Math.sin(this.angle) }
	}
	getDist(point1, point2) {
		return Math.sqrt(
			(point1.x - point2.x) * (point1.x - point2.x) +
			(point1.y - point2.y) * (point1.y - point2.y)
		);
	}
	cast(data, getData = false) {
		// objects -> [{ type: circle, x, y, radius } 
		// or { type: line, start: { x, y }, end: { x, y } }
		// or { type: rect, x, y, width, height }]
		const objects = [];

		for (const obj of data) {
			if (obj.type === 'line' || obj.type === 'circle') {
				objects.push(obj);
			} else if (obj.type === 'rect') {
				objects.push({ type: 'line', start: { x: obj.x, y: obj.y }, end: { x: obj.x + obj.width, y: obj.y } });
				objects.push({ type: 'line', start: { x: obj.x + obj.width, y: obj.y }, end: { x: obj.x + obj.width, y: obj.y + obj.height } });
				objects.push({ type: 'line', start: { x: obj.x + obj.width, y: obj.y + obj.height }, end: { x: obj.x, y: obj.y + obj.height } })
				objects.push({ type: 'line', start: { x: obj.x, y: obj.y + obj.height }, end: { x: obj.x, y: obj.y } });
			}
		}

		// window.data = objects;	

		// window.data = objects

		let bestDistance = Infinity;
		let id = null;
		let closestPoint = null
		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			let point = null;
			if (object.type === 'circle') {
				point = this.castCircle(object);
				// continue;
			} else if (object.type === 'line') {
				point = this.castLine(object);
			}
			if (point != null) {
				// window.data = point;
				// return point;
				const dist = this.getDist(this.pos, point);
				// console.log(dist)
				// return point;
				// window.data = dist;
				if (dist < bestDistance) {
					// window.data = point;
					bestDistance = dist;
					closestPoint = point;
					id = object.id;
				}
			}
		}
		// window.data = closestPoint;
		// if (bestDistance != null) {
		// window.data = closestPoint;
		return { point: closestPoint, id }
		// }
	}
	castLine(line) {
		const x1 = line.start.x;
		const y1 = line.start.y;
		const x2 = line.end.x;
		const y2 = line.end.y;

		const x3 = this.pos.x;
		const y3 = this.pos.y;
		const x4 = this.pos.x + this.direction.x;
		const y4 = this.pos.y + this.direction.y;

		const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

		if (den == 0) {
			// lines are completely parallel
			return null;
		}

		const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
		const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

		if (t > 0 && t < 1 && u > 0) {
			return new { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) }; // point
		} else {
			return null;
		}
	}
	castCircle(circle) {
		const rayToCircle = {
			x: circle.x - this.pos.x,
			y: circle.y - this.pos.y
		};
		const rayToCircleLengthSq = rayToCircle.x * rayToCircle.x + rayToCircle.y * rayToCircle.y;
		const projection = rayToCircle.x * this.direction.x + rayToCircle.y * this.direction.y;
		const dSq = rayToCircleLengthSq - (projection * projection);
		if (circle.radius * circle.radius - dSq < 0) {
			return null;
		}
		const circleDist = Math.sqrt(circle.radius * circle.radius - dSq);
		let time = 0; // amount of time from ray origin
		if (rayToCircleLengthSq < circle.radius * circle.radius) {
			// raycast inside the circle so the ordeer is reversed
			time = projection + circleDist
		} else {
			time = projection - circleDist;
		}

		if (time < 0) {
			return null; // its behind the raycast
		}
		return {
			x: this.pos.x + this.direction.x * time,
			y: this.pos.y + this.direction.y * time,
		}
	}
}

module.exports = Raycast;