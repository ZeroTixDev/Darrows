module.exports = class Round {
	constructor() {
		this.roundTime = 120; // 2 minute
		this.time = this.roundTime;
		this.state = 'none'
	}
	start() {
		this.state = 'playing';
		this.time = this.roundTime;
	}
	tick(dt) {
		if (this.state === 'playing') {
			this.time -= dt;
			if (this.time <= 0) {
				// this.time = this.roundTime;
				this.ended = true;
			}
		}
	}
	end() {
		this.state = 'none';
		this.time = this.roundTime;
	}
	differencePack(round) {
		if (!round) {
			return this.pack()
		}
		const pack = this.pack();
		const diffPack = {};
		for (const key of Object.keys(pack)) {
			if (pack[key] === round[key]) {
				continue;
			}
			diffPack[key] = pack[key];
		}
		return diffPack;
	}
	pack() {
		return {
			state: this.state,
			time: Math.round(this.time),
		};
	}
}