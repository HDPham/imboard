module.exports = function (io, socket, socketData, storage) {
	socket.on('create room [coup]', () => {
		socket.emit(
			'create room',
			Array.from(storage.values()).map(entry => entry.room.code)
		);
	});

	socket.on('join room [coup]', roomCode => {
		socket.emit(
			'join room',
			storage.has(roomCode) ? storage.get(roomCode).room : null
		);
	});

	socket.on('enter room [coup]', roomId => {
		socketData.game = 'Coup';
		socket.join(roomId);

		socketData.roomId = roomId;

		if (!storage.has(roomId)) {
			storage.set(roomId, {
				room: {
					code: roomId,
					players: [],
					turnIndex: -1,
					inProgress: false
				},
				playerCardMap: new Map(),
				playerSocketMap: new Map()
			});
		}
	});

	socket.on('add player [coup]', playerName => {
		const { room, playerSocketMap } = storage.get(socketData.roomId);

		socketData.playerName = playerName;
		room.players.push({
			name: playerName,
			numCoins: 2,
			numCards: 2,
			faceUps: [],
			isEliminated: false
		});
		playerSocketMap.set(playerName, socket);

		io.to(socketData.roomId).emit('add player', playerName);
	});

	socket.on('update room (all clients) [coup]', room => {
		storage.get(socketData.roomId).room = room;
		io.to(socketData.roomId).emit('update room', room);
	});

	socket.on('start game [coup]', () => {
		storage.get(socketData.roomId).deck = [
			'Duke',
			'Duke',
			'Duke',
			'Assassin',
			'Assassin',
			'Assassin',
			'Contessa',
			'Contessa',
			'Contessa',
			'Captain',
			'Captain',
			'Captain',
			'Ambassador',
			'Ambassador',
			'Ambassador'
		];
		storage.get(socketData.roomId).playerCardMap.clear();
		io.to(socketData.roomId).emit('start game');
	});

	socket.on('draw cards [coup]', player => {
		const { deck, playerCardMap } = storage.get(socketData.roomId);

		for (let i = 0; i < 2; i++) {
			const randomIndex = Math.floor(Math.random() * deck.length);
			player.cards.push(deck[randomIndex]);
			deck.splice(randomIndex, 1);
		}

		playerCardMap.set(player.name, player.cards);
		socket.emit('update player', player);
	});

	socket.on('chat message [coup]', (playerName, message) => {
		io.to(socketData.roomId).emit('chat message', playerName, message);
	});

	socket.on('action [coup]', (action, targetPlayer, isTruth) => {
		storage.get(socketData.roomId).isTruth = isTruth;
		socket
			.to(socketData.roomId)
			.emit('action (others)', action, targetPlayer);
		socket.emit('action', action, targetPlayer);
	});

	socket.on('counteraction [coup]', (counteraction, blocker, isTruth) => {
		storage.get(socketData.roomId).isTruth = isTruth;
		io.to(socketData.roomId).emit('counteraction', counteraction, blocker);
	});

	socket.on('challenge [coup]', (challenger, defendant, action) => {
		const { deck, playerCardMap, playerSocketMap, isTruth } = storage.get(
			socketData.roomId
		);

		// Defendant is telling the truth -> Replaces shown card
		if (isTruth) {
			deck.push(action);
			const randomIndex = Math.floor(Math.random() * deck.length);

			playerCardMap
				.get(defendant.name)
				.splice(playerCardMap.get(defendant.name).indexOf(action), 1);
			playerCardMap.get(defendant.name).push(deck[randomIndex]);
			deck.splice(randomIndex, 1);

			playerSocketMap.get(defendant.name).emit('update player', {
				name: defendant.name,
				cards: playerCardMap.get(defendant.name),
				isEliminated: false
			});
		}

		io.to(socketData.roomId).emit(
			'challenge',
			challenger,
			defendant,
			isTruth
		);
	});

	socket.on('transition to exchange [coup]', () => {
		io.to(socketData.roomId).emit('transition to exchange');
	});

	socket.on('transition to removal [coup]', loserName => {
		io.to(socketData.roomId).emit(
			'transition to removal',
			loserName,
			storage.get(socketData.roomId).isTruth
		);
	});

	socket.on('return cards [coup]', (playerName, keptCardIndexes) => {
		const { deck, playerCardMap } = storage.get(socketData.roomId);
		const playerCards = playerCardMap.get(playerName);
		const returnedCards = playerCards.filter(
			(card, index) => !keptCardIndexes.includes(index)
		);

		playerCardMap.set(
			playerName,
			playerCards.filter((card, index) => keptCardIndexes.includes(index))
		);
		deck.push(...returnedCards);

		io.to(socketData.roomId).emit('display results', 'Ambassador', true);
	});

	socket.on(
		'remove cards [coup]',
		(action, isRoundOver, playerName, keptCardIndexes = []) => {
			const {
				room,
				playerCardMap,
				playerSocketMap,
				isTruth
			} = storage.get(socketData.roomId);
			const player = room.players.find(
				player => player.name === playerName
			);
			const playerCards = playerCardMap.get(playerName);
			const keptCards = playerCards.filter((card, index) =>
				keptCardIndexes.includes(index)
			);
			const removedCards = playerCards.filter(
				(card, index) => !keptCardIndexes.includes(index)
			);

			playerCardMap.set(playerName, keptCards);
			player.faceUps = [...player.faceUps, ...removedCards];
			player.numCards = keptCards.length;
			player.isEliminated = keptCards.length === 0;

			playerSocketMap.get(playerName).emit('update player', {
				name: playerName,
				cards: keptCards,
				isEliminated: player.isEliminated
			});
			io.to(socketData.roomId).emit('update room', room);
			io.to(socketData.roomId).emit(
				'display results',
				action,
				isRoundOver,
				isTruth,
				removedCards
			);
		}
	);

	socket.on('display results [coup]', action => {
		io.to(socketData.roomId).emit('display results', action, true);
	});

	socket.on('next round [coup]', nextTurnIndex => {
		const { room } = storage.get(socketData.roomId);
		room.turnIndex = nextTurnIndex;

		io.to(socketData.roomId).emit('update room', room);
		io.to(socketData.roomId).emit('next round');
	});

	socket.on('end game [coup]', () => {
		const { room, playerSocketMap } = storage.get(socketData.roomId);

		playerSocketMap.clear();
		room.players = [];
		room.inProgress = false;

		io.to(socketData.roomId).emit('update room', room);
	});
};
