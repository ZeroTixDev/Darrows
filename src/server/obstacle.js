const { Box, Vector } = require('sat')

module.exports = class Obstacle {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.sat = new Box(new Vector(x, y), width, height).toPolygon();
	}
	pack() {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height,
		}
	}
}