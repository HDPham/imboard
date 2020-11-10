import React, { Component } from 'react';
import { Container, Button } from 'reactstrap';
import { Link, Prompt } from 'react-router-dom';
import Chat from './room/Chat';
import Table from './room/Table';
import Stage1 from './room/Stage1';
import Stage2 from './room/Stage2';
import Stage3 from './room/Stage3';
import Stage4 from './room/Stage4';
import Stage5 from './room/Stage5';
import socket from '../../socket-client';
import PropTypes from 'prop-types';
import { CoupContext } from '../context/CoupState';

class CoupRoom extends Component {
	constructor(props, context) {
		super(props);
		this.state = {
			stage: 'Choose Action',
			logContent: `${
				context.room.players[context.room.turnIndex].name
			} is choosing an action!`,
			turnPlayer: context.room.players[context.room.turnIndex],
			action: '',
			targetPlayer: null,
			blocker: null,
			counteraction: '',
			defendantName: '',
			challengerName: '',
			loserName: '',
			timeLeft: 0
		};
		this.isChallenge = false;
		this.isRoundOver = true;
		this.isGameOver = false;
	}

	componentDidMount() {
		socket.on('start game', () => this.props.history.push('/coup/lobby'));

		/**
		 * Copies and returns a player object in player list
		 *
		 * @param {Object[]} players
		 * @param {string} playerName
		 */
		function copyPlayer(players, playerName) {
			const playerIndex = players.findIndex(
				player => player.name === playerName
			);
			players[playerIndex] = { ...players[playerIndex] };
			return players[playerIndex];
		}

		/**
		 * Action was not challenged -> Apply action
		 */
		const contestableActions = () => {
			const updatedRoom = {
				...this.context.room,
				players: [...this.context.room.players]
			};
			const updatedTurnPlayer = copyPlayer(
				updatedRoom.players,
				this.context.room.players[this.context.room.turnIndex].name
			);

			switch (this.state.action) {
				case 'Assassin':
					updatedTurnPlayer.numCoins -= 3;

					socket.emit(
						'update room (all clients) [coup]',
						updatedRoom
					);

					if (this.state.targetPlayer.numCards === 1) {
						socket.emit(
							'remove cards [coup]',
							this.state.action,
							true,
							this.state.targetPlayer.name
						);
					} else {
						socket.emit(
							'transition to removal [coup]',
							this.state.targetPlayer.name
						);
					}

					return;
				case 'Ambassador':
					socket.emit('draw cards [coup]', this.context.currPlayer);
					socket.emit('transition to exchange [coup]');

					return;
				case 'Duke':
					updatedTurnPlayer.numCoins += 3;
					break;
				case 'Captain':
					const updatedTargetPlayer = copyPlayer(
						updatedRoom.players,
						this.state.targetPlayer.name
					);
					if (updatedTargetPlayer.numCoins < 2) {
						updatedTurnPlayer.numCoins +=
							updatedTargetPlayer.numCoins;
						updatedTargetPlayer.numCoins = 0;
					} else {
						updatedTurnPlayer.numCoins += 2;
						updatedTargetPlayer.numCoins -= 2;
					}
					break;
				default:
					break;
			}

			socket.emit('update room (all clients) [coup]', updatedRoom);
			socket.emit('display results [coup]', this.state.action);
		};

		socket.on('action', (action, targetPlayer) => {
			this.setState({ action, targetPlayer }, () => {
				const { room } = this.context;
				const { turnPlayer } = this.state;

				const updatedRoom = { ...room, players: [...room.players] };
				const updatedTurnPlayer = copyPlayer(
					updatedRoom.players,
					turnPlayer.name
				);

				if (action === 'Income') {
					updatedTurnPlayer.numCoins++;

					socket.emit(
						'update room (all clients) [coup]',
						updatedRoom
					);
					socket.emit('display results [coup]', action);

					return;
				}

				if (action === 'Coup') {
					updatedTurnPlayer.numCoins -= 7;

					socket.emit(
						'update room (all clients) [coup]',
						updatedRoom
					);

					if (this.state.targetPlayer.numCards === 1) {
						socket.emit(
							'remove cards [coup]',
							action,
							true,
							targetPlayer.name
						);
					} else {
						socket.emit(
							'transition to removal [coup]',
							targetPlayer.name
						);
					}

					return;
				}

				this.setState(
					{
						stage: 'Action Rebuttal',
						logContent: (
							<>
								{turnPlayer.name} uses {action}
								{targetPlayer && ` on ${targetPlayer.name}`}.
								<br />
								Other players can choose to challenge!
							</>
						),
						timeLeft: 15
					},
					() => {
						this.timerId = setInterval(() => {
							if (this.state.timeLeft === 0) {
								clearInterval(this.timerId);
								contestableActions();
							} else {
								this.setState({
									timeLeft: this.state.timeLeft - 1
								});
							}
						}, 1000);
					}
				);
			});
		});

		socket.on('action (others)', (action, targetPlayer) => {
			this.setState({ action, targetPlayer }, () => {
				if (action === 'Income' || action === 'Coup') {
					return;
				}

				this.setState(
					{
						stage: 'Action Rebuttal',
						logContent: (
							<>
								{this.state.turnPlayer.name} uses {action}
								{targetPlayer && ` on ${targetPlayer.name}`}.
							</>
						),
						timeLeft: 15
					},
					() => {
						this.timerId = setInterval(() => {
							if (this.state.timeLeft === 0) {
								clearInterval(this.timerId);
							} else {
								this.setState({
									timeLeft: this.state.timeLeft - 1
								});
							}
						}, 1000);
					}
				);
			});
		});

		socket.on('counteraction', (counteraction, blocker) => {
			clearInterval(this.timerId);

			this.setState({
				stage: 'Challenge Counteraction',
				logContent: (
					<>
						{this.state.turnPlayer.name} uses {this.state.action}
						{this.state.targetPlayer &&
							` on
						${this.state.targetPlayer.name}`}
						.<br />
						{blocker.name} blocks with {counteraction}.<br />
						{this.context.currPlayer.name === blocker.name &&
							'Other players can choose to challenge!'}
					</>
				),
				counteraction,
				blocker,
				timeLeft: 15
			});

			this.timerId = setInterval(() => {
				if (this.state.timeLeft === 0) {
					clearInterval(this.timerId);
					if (this.context.currPlayer.name === blocker.name) {
						socket.emit('display results [coup]', 'Counter');
					}
				} else {
					this.setState({ timeLeft: this.state.timeLeft - 1 });
				}
			}, 1000);
		});

		socket.on('challenge', (challenger, defendant, isTruth) => {
			clearInterval(this.timerId);

			const loser = isTruth ? challenger : defendant;
			const isBlocking = this.state.blocker !== null;
			const isSituation1 =
				this.state.action === 'Assassin' &&
				challenger.name === this.state.targetPlayer.name &&
				isTruth;
			const isSituation2 =
				this.state.action === 'Assassin' &&
				this.state.counteraction === 'Contessa' &&
				!isTruth;

			this.isChallenge = true;
			this.isRoundOver =
				(isBlocking && isTruth) ||
				(!isBlocking && !isTruth) ||
				isSituation1 ||
				isSituation2;
			this.setState(
				{
					challengerName: challenger.name,
					defendantName: defendant.name
				},
				() => {
					if (this.context.currPlayer.name === loser.name) {
						const isEliminated =
							loser.numCards === 1 ||
							isSituation1 ||
							isSituation2;

						if (isEliminated) {
							socket.emit(
								'remove cards [coup]',
								'Challenge',
								this.isRoundOver,
								loser.name
							);
						} else {
							socket.emit(
								'transition to removal [coup]',
								loser.name
							);
						}
					}
				}
			);
		});

		socket.on('transition to exchange', () => {
			clearInterval(this.timerId);

			this.setState({
				stage: 'Ambassador Exchange',
				logContent: `${this.state.turnPlayer.name} exchanging cards with court deck.`
			});
		});

		socket.on('transition to removal', (loserName, isTruth) => {
			clearInterval(this.timerId);

			const {
				turnPlayer,
				action,
				blocker,
				counteraction,
				challengerName,
				defendantName
			} = this.state;
			let logContent = null;

			if (this.isChallenge) {
				logContent = (
					<>
						{challengerName} challenges {defendantName}'s{' '}
						{blocker === null
							? action
							: `block with ${counteraction}`}
						.<br />
						{defendantName}{' '}
						{isTruth ? (
							<>
								is telling the Truth.
								<br />
								{defendantName} gets a new card
							</>
						) : (
							'Lied'
						)}
						.<br />
						{loserName} loses a card.
					</>
				);
			} else {
				logContent = (
					<>
						{turnPlayer.name} uses {action} on {loserName}.<br />
						{loserName} loses a card.
					</>
				);
			}

			this.setState({
				stage: 'Influence Removal',
				logContent,
				loserName
			});
		});

		socket.on(
			'display results',
			(action, isRoundOver, isTruth, removedCards) => {
				clearInterval(this.timerId);

				const {
					turnPlayer,
					targetPlayer,
					blocker,
					challengerName,
					defendantName,
					loserName
				} = this.state;
				let logContent = null;
				let timeLeft = 5;

				let nextTurnIndex = this.context.room.turnIndex;
				do {
					nextTurnIndex =
						nextTurnIndex >= this.context.room.players.length - 1
							? 0
							: nextTurnIndex + 1;
				} while (this.context.room.players[nextTurnIndex].isEliminated);

				switch (action) {
					case 'Income':
						logContent = (
							<>
								{turnPlayer.name} uses {action}.<br />
								{turnPlayer.name} takes 1 coin.
							</>
						);
						break;
					case 'Foreign Aid':
						logContent = `${turnPlayer.name} takes 2 coins.`;
						break;
					case 'Coup':
						logContent = (
							<>
								{turnPlayer.name} use {action} on{' '}
								{targetPlayer.name}.<br />
								{targetPlayer.name} loses{' '}
								{removedCards.join(' & ')}.<br />
								{targetPlayer.name} has no more cards left and
								is eliminated.
							</>
						);
						timeLeft = 10;
						break;
					case 'Duke':
						logContent = `${turnPlayer.name} takes 3 coins.`;
						break;
					case 'Assassin':
						logContent = (
							<>
								{turnPlayer.name} assassinates{' '}
								{targetPlayer.name}.<br />
								{targetPlayer.name} loses{' '}
								{removedCards.join(' & ')}.<br />
								{targetPlayer.name} has no more cards left and
								is eliminated.
							</>
						);
						timeLeft = 10;
						break;
					case 'Ambassador':
						logContent = `${turnPlayer.name} finished card exchange.`;
						break;
					case 'Captain':
						logContent = `${turnPlayer.name} stole from ${targetPlayer.name}.`;
						break;
					case 'Counter':
						logContent = `Block succeeded.`;
						break;
					case 'Challenge':
						logContent = (
							<>
								{challengerName} challenges {defendantName}'s{' '}
								{blocker === null
									? this.state.action
									: `block with ${this.state.counteraction}`}
								.<br />
								{defendantName}{' '}
								{isTruth ? (
									<>
										is telling the Truth.
										<br />
										{defendantName} gets a new card
									</>
								) : (
									'Lied'
								)}
								.<br />
								{isTruth
									? challengerName
									: defendantName} loses{' '}
								{removedCards.join(' & ')}.
								<br />
								{isTruth ? challengerName : defendantName} has
								no more cards left and is eliminated.
							</>
						);
						timeLeft = 10;
						break;
					case 'Removal':
						logContent = `${loserName} gets rid of ${removedCards.join(
							' & '
						)}`;
						break;
					default:
						break;
				}

				this.setState({
					stage: 'Results',
					logContent,
					timeLeft
				});

				this.timerId = setInterval(() => {
					if (this.state.timeLeft === 0) {
						clearInterval(this.timerId);

						if (
							this.context.currPlayer.name ===
							this.context.room.players[nextTurnIndex].name
						) {
							if (isRoundOver) {
								socket.emit('next round [coup]', nextTurnIndex);
							} else {
								contestableActions();
							}
						}
					} else {
						this.setState({ timeLeft: this.state.timeLeft - 1 });
					}
				}, 1000);
			}
		);

		socket.on('next round', () => {
			clearInterval(this.timerId);

			const { room, currPlayer } = this.context;
			const turnPlayer = room.players[room.turnIndex];

			const isGameOver =
				room.players.reduce(
					(numPlayerLeft, player) =>
						player.isEliminated ? numPlayerLeft : numPlayerLeft + 1,
					0
				) <= 1;

			if (isGameOver) {
				this.isGameOver = true;
				this.setState({
					stage: 'Game Over',
					logContent: `${turnPlayer.name} wins!`,
					turnPlayer
				});

				if (currPlayer.name === turnPlayer.name) {
					socket.emit('end game [coup]', turnPlayer.name);
				}
			} else {
				this.isChallenge = false;
				this.isRoundOver = true;
				this.setState({
					stage: 'Choose Action',
					logContent: `${turnPlayer.name} is choosing an action!`,
					turnPlayer,
					action: '',
					targetPlayer: null,
					blocker: null,
					counteraction: '',
					defendantName: '',
					challengerName: '',
					loserName: ''
				});
			}
		});

		socket.on('player left', (removedPlayerName, isTurnPlayerRemoved) => {
			console.log(`${removedPlayerName} left...`);
			if (
				this.isChallenge &&
				this.state.stage === 'Influence Removal' &&
				this.state.loserName !== removedPlayerName &&
				isTurnPlayerRemoved
			) {
				this.isRoundOver = true;

				return;
			}

			const { room, currPlayer } = this.context;
			let nextTurnIndex = room.turnIndex;

			do {
				nextTurnIndex =
					nextTurnIndex >= room.players.length - 1
						? 0
						: nextTurnIndex + 1;
			} while (room.players[nextTurnIndex].isEliminated);

			if (currPlayer.name === room.players[nextTurnIndex].name) {
				const isGameOver =
					room.players.reduce(
						(numPlayerLeft, player) =>
							player.isEliminated
								? numPlayerLeft
								: numPlayerLeft + 1,
						0
					) <= 1;

				if (isGameOver || isTurnPlayerRemoved) {
					socket.emit('next round [coup]', nextTurnIndex);
				} else if (
					this.isChallenge &&
					this.state.stage === 'Influence Removal' &&
					this.state.loserName === removedPlayerName &&
					!isTurnPlayerRemoved
				) {
					contestableActions();
				}
			}
		});
	}

	/**
	 * Sets action that targets anther player
	 *
	 * @param {Object} e
	 */
	chooseActionSelect = e => {
		this.setState({
			action: e.currentTarget.parentElement.previousElementSibling.value,
			targetPlayer: {
				name: e.currentTarget.value,
				numCards: Number(e.currentTarget.dataset.numCards)
			}
		});
	};

	/**
	 * Sets action with no target player
	 *
	 * @param {Object} e
	 */
	chooseActionButton = e => {
		this.setState({
			action: e.currentTarget.value,
			targetPlayer: null
		});
	};

	/**
	 * Emits action to server
	 */
	submitAction = () => {
		socket.emit(
			'action [coup]',
			this.state.action,
			this.state.targetPlayer,
			this.context.currPlayer.cards.includes(this.state.action)
		);
	};

	/**
	 * Sets counteraction
	 */
	chooseCounteraction = e => {
		this.setState({
			counteraction: e.currentTarget.value
		});
	};

	/**
	 * Emits counteraction to server
	 */
	submitCounteraction = () => {
		if (this.state.counteraction === 'Challenge') {
			this.submitChallenge(this.state.turnPlayer, this.state.action);
		} else {
			socket.emit(
				'counteraction [coup]',
				this.state.counteraction,
				{
					name: this.context.currPlayer.name,
					numCards: this.context.currPlayer.cards.length
				},
				this.context.currPlayer.cards.includes(this.state.counteraction)
			);
		}
	};

	/**
	 * Emits challenge to server
	 *
	 * @param {Object} defendant
	 * @param {string} action
	 */
	submitChallenge = (defendant, action) => {
		socket.emit(
			'challenge [coup]',
			{
				name: this.context.currPlayer.name,
				numCards: this.context.currPlayer.cards.length
			},
			defendant,
			action
		);
	};

	componentWillUnmount() {
		clearInterval(this.timerId);
		socket.off('start game');
		socket.off('action');
		socket.off('action (others)');
		socket.off('counteraction');
		socket.off('challenge');
		socket.off('transition to removal');
		socket.off('transition to exchange');
		socket.off('display results');
		socket.off('next round');
		socket.off('player left');

		if (!this.isGameOver) {
			socket.emit('remove player [coup]');
		}
		this.context.setPlayer(null);
	}

	render() {
		const { room, currPlayer } = this.context,
			{
				stage,
				logContent,
				turnPlayer,
				action,
				targetPlayer,
				counteraction,
				blocker,
				loserName,
				timeLeft
			} = this.state;

		return (
			<Container
				tag="main"
				className="d-flex-column position-relative pt-3 pb-6 py-md-0 min-vh-100 align-items-center"
			>
				<Prompt
					when={!this.isGameOver}
					message="You are currently in a game. Leave now?"
				/>
				<Chat />
				<Table
					room={room}
					currPlayer={currPlayer}
					stage={stage}
					turnPlayerName={turnPlayer.name}
					timeLeft={timeLeft}
				/>
				<div className="mt-4 text-center">{logContent}</div>
				{stage === 'Choose Action' &&
					currPlayer.name === turnPlayer.name && (
						<Stage1
							turnPlayerNumCoins={turnPlayer.numCoins}
							action={action}
							targetPlayerName={targetPlayer?.name}
							chooseActionSelect={this.chooseActionSelect}
							chooseActionButton={this.chooseActionButton}
							submitAction={this.submitAction}
						/>
					)}
				{stage === 'Action Rebuttal' &&
					(currPlayer.isEliminated
						? false
						: currPlayer.name !== turnPlayer.name) && (
						<Stage2
							turnPlayerName={turnPlayer.name}
							action={action}
							targetPlayerName={targetPlayer?.name}
							counteraction={counteraction}
							chooseCounteraction={this.chooseCounteraction}
							submitCounteraction={this.submitCounteraction}
						/>
					)}
				{stage === 'Challenge Counteraction' &&
					(currPlayer.isEliminated
						? false
						: currPlayer.name !== blocker.name) && (
						<Stage3
							counteraction={counteraction}
							blocker={blocker}
							submitChallenge={this.submitChallenge}
						/>
					)}
				{stage === 'Ambassador Exchange' &&
					currPlayer.name === turnPlayer.name && (
						<Stage4 turnPlayerNumCards={turnPlayer.numCards} />
					)}
				{stage === 'Influence Removal' &&
					currPlayer.name === loserName && (
						<Stage5 isRoundOver={this.isRoundOver} />
					)}
				{stage === 'Game Over' && (
					<Link to="/coup/lobby" replace className="mt-3">
						<Button outline color="success">
							New Game
						</Button>
					</Link>
				)}
			</Container>
		);
	}
}

CoupRoom.propTypes = { history: PropTypes.object.isRequired };
CoupRoom.contextType = CoupContext;

export default CoupRoom;
