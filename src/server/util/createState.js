const Obstacle = require('../obstacle.js');
const Block = require('../block.js');


module.exports = function createState(map) {
	const obstacles = [];

	for (let i = 0; i < map.obstacles.length; i++) {
		obstacles[i] = new Obstacle(map.obstacles[i].x, map.obstacles[i].y, map.obstacles[i].width, map.obstacles[i].height, map.obstacles[i].type);
	}

	const blocks = [];
	if (map.blocks != undefined) {
		for (let i = 0; i < map.blocks.length; i++) {
			blocks[i] = new Block(map.blocks[i].x, map.blocks[i].y, map.blocks[i].width, map.blocks[i].height, map.blocks[i].color);
		}
	}

	return {
		players: {},
		arrows: {},
		obstacles,
		arena: map.arena,
		blocks,
	}
}