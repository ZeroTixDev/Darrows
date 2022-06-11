

ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
ws.binaryType = 'arraybuffer'
window.disconnected = false;

window.Characters = Object.keys(Character);
window.characterIndex = 0;
const pastHeroIndex = localStorage.getItem('hero_index');
if (pastHeroIndex != null) {
	characterIndex = pastHeroIndex;
} else {
	localStorage.setItem('hero_index', characterIndex)
}

if (Characters[characterIndex] == undefined) {
	characterIndex = 0;
}

changeHero(Characters[characterIndex]);

ref.rightArrow.addEventListener('mousedown', () => {
	if (characterIndex >= Characters.length - 1) {
		characterIndex = 0;
	} else {
		characterIndex++;
	}
	localStorage.setItem('hero_index', characterIndex)
	changeHero(Characters[characterIndex])
});

ref.leftArrow.addEventListener('mousedown', () => {
	if (characterIndex <= 0) {
		characterIndex = Characters.length - 1;
	} else {
		characterIndex--;
	}
	localStorage.setItem('hero_index', characterIndex)
	changeHero(Characters[characterIndex]);
});

function changeHero(char) {
	ref.heroName.innerText = Character[char].Html.name;
	ref.heroName.style.color = Character[char].Html.nameColor;
	ref.heroDesc.style.color = Character[char].Html.nameColor;
	ref.heroDesc.innerText = Character[char].Html.desc;
	ref.heroSpan.style.background = Character[char].Html.color;
}


window.bg = new Audio();
bg.src = './sounds/zero-hour.mp3';
bg.volume = musicVolume;
bg.loop = true;



window.menuReq = requestAnimationFrame(menuUpdate);
let menuX = window.innerWidth / 2;
let menuY = window.innerHeight / 2;
// let t = 0;
// let mangle = null;
// let mag = null;
// let targetX = menuX;
// let targetY = menuY;


// document.onmousemove = (e) => {
// 	const x = e.pageX;
// 	const y = e.pageY;
// 	mangle = Math.atan2(window.innerHeight / 2 - y, window.innerWidth / 2 - x);
// 	const dist = Math.sqrt((x - window.innerWidth / 2) * (x - window.innerWidth / 2) + (y - window.innerHeight / 2) * (y - window.innerHeight / 2));	
// 	mag = dist * 0.02;
// }



function menuUpdate()  {
	// if (mangle != null) {
	// 	targetX = window.innerWidth / 2 + Math.cos(mangle) * mag;
	// 	targetY = window.innerHeight / 2 + Math.sin(mangle) * mag;
	// } else {
	// 	targetX = window.innerWidth / 2;
	// 	targetY = window.innerHeight / 2;
	// }

	// menuX += (targetX - menuX) * 0.5;
	// menuY += (targetY - menuY) * 0.5;



	// ref.menuDiv.style.left = `calc(${Math.round(menuX - window.innerWidth / 2)}px)`;
	// ref.menuDiv.style.top = `caflc( ${Math.round(menuY - window.innerHeight / 2)}px)`

	menuReq = requestAnimationFrame(menuUpdate);
}

ws.onopen = () => {

	setTimeout(() => {
		ref.menuGui.classList.remove('invis')
	}, 300);

	ws.onmessage = (msg) => {
		if (window.stutter) return;

		const obj = msgpack.decode(new Uint8Array(msg.data));

		if (obj.type === 'stats' && autoRespawn) {
			return send({ type: 'spawn' })
		}
		// setTimeout(() => {
		if (extraLag > 0) {
			setTimeout(() => {
				processMessage(obj)
			}, extraLag);
		} else {
			processMessage(obj)
		}
		// }, 0)

		byteCount += msg.data.byteLength;
	};

	ws.onclose = () => {
		if (!window.kicked) {
			window.disconnected = true;
			// alert('Disconnected.')
		}
	};

	ref.playButton.addEventListener('click', () => {
		ref.menuDiv.classList.add('hidden');
		ref.gameDiv.classList.remove('hidden');
		document.onkeydown = null;
		document.onmousemove = null;
		document.body.style.backgroundColor = '#0f0f0f'
		startGame()
		bg.play()
		fullscreen()
		cancelAnimationFrame(menuReq)
	})

	document.onkeydown = (e) => {
		if (e.code === 'Enter' || e.code === 'Space') {
			ref.playButton.click();
			document.onkeydown = null;
			e.preventDefault()
			e.stopPropagation()
			return;
		}
		if (e.repeat) return;
		if (e.code === 'ArrowRight') {
			if (characterIndex >= Characters.length - 1) {
				characterIndex = 0;
			} else {
				characterIndex++;
			}
			localStorage.setItem('hero_index', characterIndex)
			changeHero(Characters[characterIndex]);
			e.preventDefault()
			e.stopPropagation();
			return;
		}
		if (e.code === 'ArrowLeft') {
			if (characterIndex <= 0) {
				characterIndex = Characters.length - 1;
			} else {
				characterIndex--;
			}
			localStorage.setItem('hero_index', characterIndex)
			changeHero(Characters[characterIndex]);
			e.preventDefault();
			e.stopPropagation();
			return;
		}
	}
}