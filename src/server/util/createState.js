const Obstacle = require('../obstacle.js');
const fs = require('fs')

map_json = fs.readFileSync('./map.json')

map = JSON.parse(map_json)


obstacles = []

for (i in Object.keys(map.obstacles)) {
    obstacles[i] = new Obstacle(map.obstacles[i].x,map.obstacles[i].y,map.obstacles[i].width,map.obstacles[i].height,map.obstacles[i].type)
}

module.exports = function createState() {
	return	{
        players:{},
        arrows:{},
        obstacles:obstacles,
        arena: map.arena}
}
