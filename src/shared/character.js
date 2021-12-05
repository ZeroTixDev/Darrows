

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
			nameColor: '#ababab',
			desc: 'No Passive or Ability',
		}
	},
	Klaydo: {
		Color: '#00b55b',
		ArrowCdColor: '#52c78d',
		Name: 'Klaydo',
		Passive: null,
		Ability: {
			name: 'Freeze-Arrow',
		},
		Html: {
			color: '#00b55b',
			nameColor: '#00b55b',
			name: 'Klaydo',
			desc: 'Ceases time for your newest arrow',
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
			name: 'Scry',
			desc: 'Shoot fake arrows to deceive opponents',
		},
	},
  Stac: {
		Color: '#0eab85',
		ArrowCdColor: '#80baac',
		Name: 'Stac',
		Passive: null,
		Ability: {
			name: 'Direct-Arrow'
		},
		Html: {
			color: '#0eab85',
			nameColor: '#0eab85',
			name: 'Kai',
      desc: 'Uses strategic points to direct arrows',
		}
  },
	Conquest: {
		Color: '#b74f0e',
		ArrowCdColor: '#b8764d',
		Name: 'Conquest',
		Passive: null,
		Ability: {
			name: 'Dash',
		},
		Html: {
			color: '#b74f0e',
			nameColor: '#b74f0e',
			name: 'Conquest',
			desc: 'Bash into your opponents',
		}
	},
	Flank: {
		Color: '#007800',
		ArrowCdColor: '#509450',
		Name: 'Flank',
		Passive: null,
		Ability: {
			name: 'Flank-Around',
		},
		Html: {
			color: '#007800',
			nameColor: '#007800',
			name: 'Excorpio',
			desc: 'Flanks opponents via teleportation',
		}
	},
	// Crescent: {
	// 	Color: '#7325b3',
	// 	ArrowCdColor: '#8956b3',
	// 	Name: 'Crescent',
	// 	Passive: 'Move-Fast-Slow-Aim',
	// 	Ability: { 
	// 		name: 'Gravity',
	// 	},
	// 	Html: {
	// 		color: '#7325b3',
	// 		nameColor: '#7325b3',
	// 		name: 'Crescent',
	// 		desc: 'Gravitate arrows towards you',
	// 	},
	// },
//   ZeroTix: {
// 		Color: '#fce0bd',
//  		ArrowCdColor: '#fce0bd',
//  		Name: 'ZeroTix',
//  		Passive: null,
//  		Ability: { 
//  			name: 'ZeroTix',
//  		},
//  		Html: {
//  			color: '#fce0bd',
//  			nameColor: '#fce0bd',
//  			name: 'ZeroTix',
//  			desc: 'undefined',
//  		},
//  	},
  
}

module.exports = Character;