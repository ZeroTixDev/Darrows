

const Character = {
	Default: {
		Color: '#292929',
		ArrowCdColor: '#616161',
		Name: 'Default',
		Passive: null,
		Ability: null,
	},
	Kronos: {
		Color: '#00b55b',
		ArrowCdColor: '#52c78d',
		Name: 'Kronos',
		Passive: null,
		Ability: {
			name: 'Freeze-Arrow',
			cooldown: 0,
		},
	},
}

module.exports = Character;