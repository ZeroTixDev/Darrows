
module.exports = class Block {
	constructor(x, y, width, height, color) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.color = color;
	}
	pack() {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height,
			color: this.color,
		}
	}
}