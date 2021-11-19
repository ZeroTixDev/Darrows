let count = 0;

module.exports = function createId() {
	count++;
	return `${count}f`;
}