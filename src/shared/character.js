

const Character = {
	Default: {
		Color: '#292929',
		ArrowCdColor: '#616161',
		Name: 'Default',
		Passive: null,
		Ability: null,
		Html: {
			color: '#292929',
			name: 'Default',
			nameColor: '#999999',
		}
	},
	Kronos: {
		Color: '#00b55b',
		ArrowCdColor: '#52c78d',
		Name: 'Kronos',
		Passive: null,
		Ability: {
			name: 'Freeze-Arrow',
		},
		Html: {
			color: '#00b55b',
			nameColor: '#00b55b',
			name: 'Kronos'
		},
	},
	Scry: {
		Color: '#e34b69',
		ArrowCdColor: '#e0778c',
		Name: 'Scry',
		Passive: null,
		Ability: {
			name: 'Fake-Arrow',
		},
		Html: {
			color: '#e34b69',
			nameColor: '#e34b69',
			name: 'Scry'
		},
	},
}

module.exports = Character;