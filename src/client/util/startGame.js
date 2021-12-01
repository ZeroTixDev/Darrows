function startGame() {
	run(); // starts event loop

	window.addEventListener("keydown", trackKeys);
	window.addEventListener("keyup", trackKeys);

	window.addEventListener('resize', () => {
		resize([canvas, gui])
	})

	canvas.addEventListener('mousemove', (event) => {
		const bound = canvas.getBoundingClientRect();
		mouse.x = Math.round((event.pageX - bound.left) / getScale());
		mouse.y = Math.round((event.pageY - bound.top) / getScale());
	});

	canvas.addEventListener('contextmenu', (event) => {
		return event.preventDefault();
	})

	ref.chat.onblur = () => {
		chatOpen = false;
	}



		setInterval(() => {
			send({ ping: Date.now() })
		}, 500);
		setInterval(() => {
			stateMessageDisplay = stateMessageCount;
			stateMessageCount = 0;
			inputMessageDisplay = inputMessageCount;
			inputMessageCount = 0;
			byteDisplay = byteCount;
			byteCount = 0;
			uploadByteDisplay = uploadByteCount;
			uploadByteCount = 0;
		}, 1000);
		send({ joinE: true, character: Characters[characterIndex] })
		if (localStorage.getItem('name') != null) {
			send({
				chat: `/name ${localStorage.getItem('name')}`
			});
			console.log(`Name: ${localStorage.getItem('name')}`)
		}
}