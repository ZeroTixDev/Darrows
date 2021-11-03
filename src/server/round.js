module.exports = class Round {
	constructor() {
		this.time = 0;
		this.roundTime = 60 * 3; // 3 minutes
		this.state = 'none'
	}
	start() {
		this.state = 'playing';
		this.time = 0;
	}
	tick(dt) {
		if (this.state === 'playing') {
			this.time += dt;
		}
	}
	end() {
		this.state = 'none';
		this.time = 0;
	}
	differencePack(player) {
		if (!player) {
			return this.pack()
		}
		const pack = this.pack();
		const diffPack = {};
		for (const key of Object.keys(pack)) {
			if (pack[key] === player[key]) {
				continue;
			}
			diffPack[key] = pack[key];
		}
		return diffPack;
	}
	pack() {
		return {
			state: this.state,
			time: Math.floor(this.time),
		};
	}
}