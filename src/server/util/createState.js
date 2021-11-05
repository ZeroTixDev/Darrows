const Obstacle = require('../obstacle.js');

map_json = '{"players":{},"arrows":{},"obstacles":[{"x":200,"y":1900,"width":0,"height":0,"type":"obstacle"},{"x":0,"y":2900,"width":100,"height":100,"type":"bounce"},{"x":2900,"y":0,"width":100,"height":100,"type":"bounce"},{"x":2200,"y":2600,"width":600,"height":200,"type":"obstacle"},{"x":200,"y":200,"width":600,"height":200,"type":"obstacle"},{"x":800,"y":200,"width":200,"height":1000,"type":"obstacle"},{"x":800,"y":1400,"width":1200,"height":200,"type":"obstacle"},{"x":1200,"y":0,"width":200,"height":1200,"type":"obstacle"},{"x":1600,"y":200,"width":600,"height":200,"type":"obstacle"},{"x":2600,"y":800,"width":0,"height":0,"type":"obstacle"},{"x":2400,"y":0,"width":200,"height":800,"type":"obstacle"},{"x":2800,"y":400,"width":200,"height":1000,"type":"obstacle"},{"x":1600,"y":1000,"width":1000,"height":200,"type":"obstacle"},{"x":1800,"y":400,"width":200,"height":600,"type":"obstacle"},{"x":2200,"y":1400,"width":200,"height":1200,"type":"obstacle"},{"x":2600,"y":1600,"width":200,"height":800,"type":"obstacle"},{"x":1800,"y":1800,"width":200,"height":1200,"type":"obstacle"},{"x":1400,"y":1600,"width":200,"height":1200,"type":"obstacle"},{"x":1000,"y":1800,"width":200,"height":1000,"type":"obstacle"},{"x":200,"y":2600,"width":1000,"height":200,"type":"obstacle"},{"x":200,"y":2200,"width":600,"height":200,"type":"obstacle"},{"x":0,"y":1800,"width":800,"height":200,"type":"obstacle"},{"x":400,"y":600,"width":200,"height":1000,"type":"obstacle"},{"x":200,"y":800,"width":200,"height":200,"type":"obstacle"},{"x":0,"y":1200,"width":200,"height":200,"type":"obstacle"},{"x":2800,"y":0,"width":200,"height":200,"type":"point"},{"x":0,"y":2800,"width":200,"height":200,"type":"point"}],"arena":{"width":3000,"height":3000}}'

map = JSON.parse(map_json)


obstacles = []

for (i in Object.keys(map.obstacles)) {
    obstacles[i] = new Obstacle(map.obstacles[i].x,map.obstacles[i].y,map.obstacles[i].width,map.obstacles[i].height,map.obstacles[i].type,map.obstacles[i].effect)
}

module.exports = function createState() {
	return	{
        players:{},
        arrows:{},
        obstacles:obstacles,
        arena: map.arena}
}
