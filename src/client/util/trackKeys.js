function trackKeys(event) {
	if (event.repeat && !chatOpen) return event.preventDefault();
	if (event.code === 'Enter') {
		if (chatOpen && event.type === 'keydown') {
			ref.chatDiv.classList.add('hidden')
			if (chatTest(ref.chat.value)) {
				if (ref.chat.value.trim().toLowerCase() == '/help') {
					const div = document.createElement('div');
					div.classList.add('chat-message');
					div.innerHTML = `${'<span class="rainbow">[SERVER]</span> '}: <span style="color: #c4c4c4;">WASD to move, Space to start Arrowing, Release space to shoot arrow, Shift for character ability, Arrow Keys or Q/E to change arrow aim. Press V to change movement mode which will change movement to Arrow Keys and Aiming to A/D or Z/X. Changing your name can be done by using /name command in chat. Tab to see the leaderboard. R to toggle auto respawn and M to toggle the music.</span>`;
					ref.chatMessageDiv.appendChild(div)
					ref.chatMessageDiv.scrollTop = ref.chatMessageDiv.scrollHeight;
				} else {
					// if (ref.chat.value.toLowerCase() == "/char scry"){
					//     	backgroundMusic.pause();
					//   let idiotmusic = new Audio();
					//   idiotmusic.src = "./sounds/idiotmusic.mp3";
					//   idiotmusic.play();
					// }
					send({ chat: ref.chat.value })
				}
			}
			ref.chat.blur()
			ref.chat.value = '';
			chatOpen = false;
			return;
		} else if (event.type === 'keydown') {
			chatOpen = true;
			ref.chatDiv.classList.remove('hidden')
			ref.chat.focus()
			return;

		}
	}
	if (chatOpen) return;
	if (event.code === 'Space' && event.type === 'keydown' && !window.autoRespawn && iExist && dead) {
		send({ type: 'spawn' })
		ref.deathScreen.classList.add('hidden')
		ref.deathScreen.classList.remove('dAnim')
		overlaying = false;
		overlayAlpha = 0;
		return;
	}
	if (event.code === 'KeyM' && event.type === 'keydown') {
		window.music = !window.music;
		if (window.music) {
			backgroundMusic.volume = musicVolume;
		} else if (!window.music) {
			backgroundMusic.volume = 0;
		}
	}
	if (event.code === 'Tab') {
		window.tab = event.type === 'keydown';
		return event.preventDefault()
	}
	if (event.code === 'KeyV' && event.type === 'keydown')
		changeMovMode()
	if (event.code === 'KeyR' && event.type === 'keydown')
		window.autoRespawn = !window.autoRespawn;
	if (event.code === 'KeyN' && event.type === 'keydown')
		window.debug = !window.debug;
	// if (event.code === 'KeyL' && event.type === 'keydown') 
	// 	window._interpolate = !window._interpolate;
	if (event.code === 'KeyP' && event.type === 'keydown')
		window._predict = !window._predict;
	// if (event.code === 'KeyB'&& event.type === 'keydown') {
	// 	window.stutter = !window.stutter;
	// }
	if ((window.movementMode === 'wasd' && (event.code === 'ArrowLeft' || event.code === 'KeyQ'))
		|| (window.movementMode === 'arr' && (event.code === 'KeyA' || event.code === 'KeyZ'))) {
		input.arrowLeft = event.type === 'keydown'
		sendInput();
		inputMessageCount++;
	}
	if ((window.movementMode === 'wasd' && (event.code === 'ArrowRight' || event.code === 'KeyE'))
		|| (window.movementMode === 'arr' && (event.code === 'KeyD' || event.code === 'KeyX'))) {
		input.arrowRight = event.type === 'keydown'
		sendInput();
		inputMessageCount++;
	}
	if (event.key === 'Shift') {
		input.shift = event.type === 'keydown';
		sendInput();
		inputMessageCount++;
		event.preventDefault()
	}
	if (event.code == 'KeyT' && event.type === 'keydown')
		window.showSnapshots = !window.showSnapshots;
	if (window.movementMode === 'wasd') {
		if (inputCodes[event.code] === undefined) return;
		input[inputCodes[event.code].key] = event.type === "keydown";
		sendInput()
		inputMessageCount++;
	} else {
		if (arrInputCodes[event.code] === undefined) return;
		input[arrInputCodes[event.code].key] = event.type === 'keydown';
		sendInput();
		inputMessageCount++;
	}
}