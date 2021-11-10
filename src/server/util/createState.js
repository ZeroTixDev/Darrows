const Obstacle = require('../obstacle.js');
// const map = require('../map.json')[0]


module.exports = function createState(map) {
	const obstacles = [];

	for (let i = 0; i < map.obstacles.length; i++) {
		obstacles[i] = new Obstacle(map.obstacles[i].x, map.obstacles[i].y, map.obstacles[i].width, map.obstacles[i].height, map.obstacles[i].type);
	}
	return {
		players: {},
		arrows: {},
		obstacles,
		arena: map.arena,
	}
}