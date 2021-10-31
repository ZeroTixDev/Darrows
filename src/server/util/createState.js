const Obstacle = require('../obstacle.js');

module.exports = function createState() {
	return {
		players: {},
		arrows: {},
		
		obstacles: [
      new Obstacle(1000, 1000, 200, 200),
      new Obstacle(1000, 1800, 200, 200),
      new Obstacle(1800, 1000, 200, 200),
      new Obstacle(1800, 1800, 200, 200),
      new Obstacle(1450, 1450, 100, 100, 'bounce', 70),
      new Obstacle(0, 0, 20, 20, 'bounce', 40),
      new Obstacle(2980, 0, 20, 20, 'bounce', 40),
      new Obstacle(0, 2980, 20, 20, 'bounce', 40),
      new Obstacle(2980, 2980, 20, 20, 'bounce', 40),
    //   new Obstacle(1400, 150, 200, 20, 'bounce', 40),
      new Obstacle(1400, 300, 200, 20, 'bounce', 30),
      new Obstacle(1200, 100, 20, 300, 'obstacle', 40),
      new Obstacle(1780, 100, 20, 300, 'obstacle', 40),
      
      new Obstacle(100, 1100, 300, 800, 'obstacle', 40),
      new Obstacle(400, 1100, 100, 200, 'obstacle', 40),
      new Obstacle(400, 1400, 100, 200, 'obstacle', 40),
      new Obstacle(400, 1700, 100, 200, 'obstacle', 40),
      
      new Obstacle(1400, 2400, 100, 100, 'obstacle', 40),
      new Obstacle(1600, 2600, 100, 100, 'obstacle', 40),
      new Obstacle(1400, 2800, 100, 100, 'obstacle', 40),
      new Obstacle(1250, 2600, 5, 5, 'bounce', 1000),
      new Obstacle(1200, 2600, 50, 100, 'obstacle', 1000),
      new Obstacle(1255, 2600, 45, 100, 'obstacle', 1000),
      new Obstacle(1250, 2605, 5, 95, 'obstacle', 1000),
      new Obstacle(2100, 500, 100, 20, 'obstacle', 1000),
      new Obstacle(2800, 1000, 100, 20, 'obstacle', 1000),
      new Obstacle(2100, 1500, 100, 20, 'obstacle', 1000),
      new Obstacle(2800, 2000, 100, 20, 'obstacle', 1000),
      new Obstacle(2100, 2500, 100, 20, 'obstacle', 1000),

	  new Obstacle(2600, 0, 400, 200),
	  new Obstacle(2800, 200, 200, 200),

	  new Obstacle(1200, 1200, 600, 600, 'point'),
      
		],
		arena: {
			width: 3000,
			height: 3000,
		}
	}
}