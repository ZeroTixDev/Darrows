module.exports = class Round {
	constructor() {
		this.roundTime = 240; // 5minute -> 4minute
		this.time = this.roundTime;
		this.state = 'none';
		this.intermission = false;
		this.intermissionTime = 10;
		this.timeScale = 1;
	}
	start() {
		this.state = 'playing';
		this.time = this.roundTime;
		this.intermission = false;
		this.ended = false;
	}
	tick(dt) {
		this.time -= dt * this.timeScale;
		if (this.state === 'playing' && !this.intermission) {
			if (this.time <= 0) {
				// this.time = this.roundTime;
				this.ended = true;
				this.intermission = true;
				this.time = this.intermissionTime;
				this.interStart = true;
			}
		}
		if (this.intermission) {
			if (this.time <= 0) {
				this.intermission = false;
				this.ended = false;
				this.time = this.roundTime;
				return 'map-change';
			}
		}
		return 'tick';
	}
	end() {
		this.state = 'none';
		this.time = this.roundTime;
		this.intermission = false;
		this.ended = false;
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
			intermission: this.intermission,
			state: this.state,
			time: Math.round(this.time),
		};
	}
}