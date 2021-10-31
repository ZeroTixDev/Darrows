const uuid = require('uuid');

module.exports = function createId() {
	return uuid.v4().slice(0, 3)
}