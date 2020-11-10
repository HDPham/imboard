import React, { Component } from 'react';
import { Table, Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import GameTable from './GameTable';
import Voter from './Voter';
import classNames from 'classnames';
import styles from '../../DssStyle.module.scss';
import socket from '../../../socket-client';
import PropTypes from 'prop-types';
import { DssContext } from '../../context/DssState';

class Stage1 extends Component {
	choosePlayer = e => {
		const { room, currPlayer, judgeName, setPlayer } = this.context;

		const isPlayer = currPlayer !== null,
			isJudge = currPlayer?.name === judgeName,
			isNomineeButton =
				e.currentTarget.value === currPlayer?.chosenPlayerName,
			isJudgeButton = e.currentTarget.value === judgeName;

		if (
			isPlayer &&
			!isJudge &&
			!isNomineeButton &&
			!isJudgeButton &&
			room.inProgress
		) {
			// Set current player isReady flag to true -> Update current room
			const updatedRoom = {
				...room,
				players: [...room.players]
			};
			const updatedPoll = { ...this.props.poll };

			const currPlayerIndex = updatedRoom.players.findIndex(
				player => player.name === currPlayer.name
			);
			updatedRoom.players[currPlayerIndex] = {
				...room.players[currPlayerIndex]
			};
			updatedRoom.players[currPlayerIndex].isReady = true;

			updatedPoll[e.currentTarget.value].push(currPlayer.name);
			if (currPlayer.chosenPlayerName !== '') {
				updatedPoll[currPlayer.chosenPlayerName].splice(
					updatedPoll[currPlayer.chosenPlayerName].indexOf(
						currPlayer.name
					),
					1
				);
			}

			setPlayer({
				name: currPlayer.name,
				chosenPlayerName: e.currentTarget.value
			});
			this.context.updateRoomAllClients(updatedRoom);
			socket.emit('update room state (all clients) [dss]', {
				poll: updatedPoll
			});
		}
	};

	nextStage = () => {
		this.context.updateRoomAllClients({
			...this.context.room,
			players: this.context.room.players.map(player => ({
				...player,
				isReady: false
			}))
		});
		socket.emit('update room state (all clients) [dss]', { stage: 2 });
	};

	render() {
		const { room, currPlayer, judgeName } = this.context;

		const readyPanel = (
			<Table dark className="mb-0 rounded">
				<tbody>
					{room.players
						.filter(player => player.name !== judgeName)
						.map((player, index) => (
							<tr key={player.name}>
								<th
									scope="row"
									className={classNames({
										'border-0': index === 0,
										'position-relative': true
									})}
								>
									{player.name}
									{player.isReady && (
										<FontAwesomeIcon
											icon={faCheck}
											color="green"
											className={`position-absolute ${styles['ready-icon']}`}
										/>
									)}
								</th>
							</tr>
						))}
				</tbody>
			</Table>
		);

		return (
			<>
				<GameTable
					sidePanel={readyPanel}
					cardState={this.props.cardState}
				/>
				<div className="mt-5 font-weight-bold">
					Initial Voting Stage: Everyone, except the judge, chooses
					who they think the statement applies to most
				</div>
				<Voter
					room={room}
					judgeName={judgeName}
					chosenPlayerName={currPlayer.chosenPlayerName}
					choosePlayer={this.choosePlayer}
				/>
				{currPlayer.name === judgeName && (
					<Button
						outline
						color="success"
						className="mt-3"
						onClick={this.nextStage}
						disabled={
							!room.players.every(
								player =>
									player.isReady || player.name === judgeName
							)
						}
					>
						Next Stage
					</Button>
				)}
			</>
		);
	}
}

Stage1.propTypes = {
	cardState: PropTypes.shape({
		index: PropTypes.number.isRequired,
		cards: PropTypes.arrayOf(PropTypes.string).isRequired
	}).isRequired,
	poll: PropTypes.object.isRequired
};
Stage1.contextType = DssContext;

export default Stage1;
