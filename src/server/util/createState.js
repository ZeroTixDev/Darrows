const Obstacle = require('../obstacle.js');

module.exports = function createState() {
	return {
		players: {},
		arrows: {},
		obstacles: [
			new Obstacle(750, 400, 50, 200),
			new Obstacle(1150, 400, 50, 200),
			new Obstacle(1250, 900, 200, 200),
			new Obstacle(500, 1200, 300, 50),
			new Obstacle(800, 1200, 50, 300),
		],
		arena: {
			width: 2000,
			height: 2000,
		}
	}
}