import React, { Component } from 'react';
import { Table, Button, Modal, ModalBody } from 'reactstrap';
import GameTable from './GameTable';
import Voter from './Voter';
import Timeout from '../../../components/Timeout';
import styles from '../../DssStyle.module.scss';
import socket from '../../../socket-client';
import PropTypes from 'prop-types';
import { DssContext } from '../../context/DssState';

class Stage2 extends Component {
	constructor(props, context) {
		super(props);

		this.state = {
			isReady: false,
			chosenButton: null,
			isTransitionModalActive: false,
			isEndModalActive: false,
			modalText: '',
			isTransitioning: false,
			initialRoom: context.room
		};
	}

	componentDidMount() {
		this.context.setPlayer({
			name: this.context.currPlayer.name,
			chosenPlayerName: ''
		});

		socket.on('round transition', (updatedRoom, chosenPlayerName) => {
			this.setState({
				isTransitionModalActive: true,
				modalText: `${this.context.judgeName} chose ${chosenPlayerName}`,
				isTransitioning: true,
				roomPlaceholder: updatedRoom
			});
		});
		socket.on('game over transition', loserName => {
			this.setState({
				isEndModalActive: true,
				modalText: `${loserName} Lost!`,
				isTransitioning: true
			});
		});

		socket.on('start game', () => {
			socket.emit('initialize room state');
		});
	}

	componentDidUpdate(prevProps, prevState) {
		if (
			prevState.isTransitionModalActive !==
				this.state.isTransitionModalActive &&
			this.state.isTransitionModalActive
		) {
			this.props.setTimeout(() => {
				const modalEl = document.querySelector('div.modal');
				modalEl.classList.remove('show');
				this.props.setTimeout(() => {
					this.setState({ modalText: 'Next round!' });
					modalEl.classList.add('show');
					this.props.setTimeout(() => {
						this.setState({ isTransitionModalActive: false });
					}, 3000);
				}, 500);
			}, 6000);
		}

		if (
			prevState.isEndModalActive !== this.state.isEndModalActive &&
			this.state.isEndModalActive
		) {
			this.props.setTimeout(() => {
				this.setState({ isEndModalActive: false });
			}, 6000);
		}
	}

	choosePlayer = e => {
		const isJudge =
				this.context.currPlayer?.name === this.context.judgeName,
			isNomineeButton =
				e.currentTarget.value === this.state.chosenButton?.value,
			isJudgeButton = e.currentTarget.value === this.context.judgeName;

		if (
			isJudge &&
			!isNomineeButton &&
			!isJudgeButton &&
			this.context.room.inProgress
		) {
			// Activate chosen player's button
			this.setState({
				isReady: true,
				chosenButton: e.currentTarget
			});
		}
	};

	processJudgeVote = () => {
		const { room, updateRoomAllClients } = this.context;
		const { cardState } = this.props;
		const { chosenButton } = this.state;

		const updatedScore = Number(chosenButton.dataset.score) + 1;

		const updatedRoom = {
			...room,
			players: [...room.players]
		};
		updatedRoom.players[chosenButton.dataset.index] = {
			...room.players[chosenButton.dataset.index]
		};
		updatedRoom.players[chosenButton.dataset.index].score = updatedScore;

		if (updatedScore < 7) {
			// Continue Game
			const updatedCards = [...cardState.cards];
			updatedCards.splice(cardState.cardIndex, 1);

			const nextCardIndex = Math.floor(
				Math.random() * updatedCards.length
			);

			updatedRoom.judgeIndex =
				room.judgeIndex < room.players.length - 1
					? room.judgeIndex + 1
					: 0;

			socket.emit('set room state [dss]', {
				stage: 1,
				cardIndex: nextCardIndex,
				cards: updatedCards,
				poll: {}
			});
			socket.emit(
				'round transition [dss]',
				updatedRoom,
				chosenButton.value
			);
		} else {
			// Game Over
			updatedRoom.inProgress = false;
			updatedRoom.players = [];
			updatedRoom.judgeIndex = -1;

			socket.emit('game over transition [dss]', chosenButton.value);
		}

		updateRoomAllClients(updatedRoom);
	};

	onClosed = () => {
		if (this.context.room.inProgress) {
			socket.emit('update room state (all clients) [dss]', {
				stage: 1,
				poll: Object.fromEntries(
					this.context.room.players.map(player => [player.name, []])
				)
			});
		} else {
			this.context.setPlayer(null);
			socket.emit('set player name [dss]', '');
		}
	};

	componentWillUnmount() {
		socket.off('round transition');
		socket.off('game over transition');
		socket.off('start game');
	}

	render() {
		const { currPlayer } = this.context,
			{ cardState, poll } = this.props,
			{
				initialRoom: room,
				chosenButton,
				isReady,
				isTransitionModalActive,
				isEndModalActive,
				modalText
			} = this.state;
		const judgeName = room.players[room.judgeIndex].name;

		const pollPanel = Object.entries(poll)
			.filter(entry => entry[1].length > 0)
			.map(([nominee, voters]) => (
				<Table key={nominee} borderless className="mb-0 text-white">
					<thead>
						<tr className="border-bottom">
							<th scope="row" className="p-2">
								{voters.length === 1
									? `${nominee} (1 vote)`
									: `${nominee} (${voters.length} votes)`}
							</th>
						</tr>
						<tr>
							<td className="p-2 pb-0">
								{voters.length === 1
									? voters[0]
									: voters.length === 2
									? voters.join(' & ')
									: `${voters.slice(0, -1).join(', ')}, and ${
											voters[voters.length - 1]
									  }`}
							</td>
						</tr>
					</thead>
				</Table>
			));

		return (
			<>
				<GameTable sidePanel={pollPanel} cardState={cardState} />
				<div className="mt-5 font-weight-bold">
					Discussion Stage: Judge makes final decision
				</div>
				{room.inProgress && (
					<div className="mt-3">
						<span>{judgeName} is judging</span>
						<span className="d-inline-block align-bottom">
							<div className={styles.loading}>...</div>
						</span>
					</div>
				)}
				<Voter
					room={room}
					judgeName={judgeName}
					chosenPlayerName={chosenButton?.value}
					choosePlayer={this.choosePlayer}
				/>
				{room.inProgress && currPlayer?.name === judgeName && (
					<Button
						outline
						color="success"
						className="mt-3"
						onClick={this.processJudgeVote}
						disabled={!isReady}
					>
						Submit
					</Button>
				)}
				<Modal
					isOpen={isTransitionModalActive || isEndModalActive}
					onClosed={this.onClosed}
					centered={true}
					contentClassName={styles['modal-transition']}
				>
					<ModalBody className="text-center display-4">
						{modalText}
					</ModalBody>
				</Modal>
			</>
		);
	}
}

Stage2.propTypes = {
	cardState: PropTypes.shape({
		index: PropTypes.number.isRequired,
		cards: PropTypes.arrayOf(PropTypes.string).isRequired
	}).isRequired,
	poll: PropTypes.object.isRequired
};
Stage2.contextType = DssContext;

export default Timeout(Stage2);
