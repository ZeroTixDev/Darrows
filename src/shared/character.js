

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
			desc: 'Stops time for your newest arrow',
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
      desc: 'Place strategic points to redirect arrows',
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
			desc: 'Flank opponents using teleportation',
		}
	},
	Crescent: {
		Color: '#8f1ced',
		ArrowCdColor: '#4f008f',
		Name: 'Crescent',
		Passive: 'Move-Fast-Slow-Aim',
		Ability: { 
			name: 'Gravity',
		},
		Html: {
			color: '#8f1ced',
			nameColor: '#8f1ced',
			name: 'Crescent',
			desc: 'Gravitate your arrows towards you',
		},
	},
	// #fa2f20
	// #a6150a
	
	Harpazo: {
		Color: '#e09112',
		ArrowCdColor: '#a66f17',
		Name: 'Harpazo',
		Passive: 'Homing-Player',
		// Passive: 'Move-Fast-Slow-Aim',
		Ability: { 
			name: null,
		},
		Html: {
			color: '#e09112',
			nameColor: '#e09112',
			name: 'Harpazo',
			desc: 'Home players towards you',
		},
	},

	Vice: {
		Color: '#b8b8b8',
		ArrowCdColor: '#8f8f8f',
		Name: 'Vice',
		Passive: null,
		// Passive: 'Move-Fast-Slow-Aim',
		Ability: { 
			name: 'Arrow-Teleport',
		},
		Html: {
			color: '#b8b8b8',
			nameColor: '#b8b8b8',
			name: 'Vice',
			desc: 'Teleport to your arrows',
		},
	},

	Xerox: {
		Color: '#002dd1',
		ArrowCdColor: '#001d87',
		Name: 'Xerox',
		Passive: null,
		// Passive: 'Move-Fast-Slow-Aim',
		Ability: { 
			name: 'Clone',
		},
		Html: {
			color: '#002dd1',
			nameColor: '#002dd1',
			name: 'Xerox',
			desc: 'Confuse opponents with clones',
		},
	},
	// mince #edd011
	Mince: {
		Color: '#edd011',
		ArrowCdColor: '#877500',
		Name: 'Mince',
		Passive: null,
		// Passive: 'Move-Fast-Slow-Aim',
		Ability: { 
			name: 'Arrow-Split',
		},
		Html: {
			color: '#edd011',
			nameColor: '#edd011',
			name: 'Mince',
			desc: 'Split your arrows in half',
		},
	},
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