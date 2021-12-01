

ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
ws.binaryType = 'arraybuffer'

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


// window.textures = {
// 	Kronos: new Image(),
// }

// textures.Kronos.src = './gfx/kronos-ability.png';

window.backgroundMusic1 = new Audio();
backgroundMusic1.src = './sounds/bella-ciao-s.mp3';
backgroundMusic1.volume = musicVolume;
// backgroundMusic1.playbackRate = 10;

window.backgroundMusic2 = new Audio();
backgroundMusic2.src = './sounds/bella-ciao-l.mp3';
backgroundMusic2.volume = musicVolume;
// backgroundMusic2.playbackRate = 10;

ws.onopen = () => {

	ws.onmessage = (msg) => {
		if (window.stutter) return;

		const obj = msgpack.decode(new Uint8Array(msg.data));

		if (obj.type === 'stats' && autoRespawn) {
			return send({ type: 'spawn' })
		}
		// setTimeout(() => {
		processMessage(obj)
		// }, 0)

		byteCount += msg.data.byteLength;
	};

	ws.onclose = () => {
		if (!window.kicked) {
			alert('Disconnected.')
		}
	};

	ref.playButton.addEventListener('click', () => {
		ref.menuDiv.classList.add('hidden');
		ref.gameDiv.classList.remove('hidden');
		document.onkeydown = null;
		startGame()
		backgroundMusic1.play()
		backgroundMusic1.onended = () => {
			backgroundMusic2.play();
		};
		backgroundMusic2.onended = () => {
			backgroundMusic1.play()
		};
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