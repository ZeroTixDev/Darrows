module.exports = function numArray() {
	return {
		highest: function (arr) {
			let h = -Infinity;
			for (let i = 0; i < arr.length; i++) {
				if (arr[i] > h) {
					h = arr[i]
				}
			}
			return h;
		},

		avg: function (arr) {
			return arr.reduce((a, b) => a + b, 0) / arr.length
		},
		
		lowest: function (arr) {
			let h = Infinity;
			for (let i = 0; i < arr.length; i++) {
				if (arr[i] < h) {
					h = arr[i]
				}
			}
			return h;
		}
	}
}