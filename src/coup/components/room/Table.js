import React, { Component } from 'react';
import { Row, Col, Badge } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faTimes } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import styles from '../../CoupStyle.module.scss';
import PropTypes from 'prop-types';
import { CoupContext } from '../../context/CoupState';

class Table extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(props, state) {
		/**
		 *
		 */
		if (
			props.room.inProgress &&
			props.room.players.length !== state.numPlayers
		) {
			const { room, currPlayer } = props;

			const playerIndex = room.players.findIndex(
				player => player.name === currPlayer.name
			);

			const order = [];
			for (
				let i = room.players.length - playerIndex - 1;
				i < room.players.length;
				i++
			) {
				order.push(i);
			}
			for (let i = 0; i < room.players.length - playerIndex - 1; i++) {
				order.push(i);
			}

			// 0
			// 0 1
			// 0 1 2
			// 1 0 2 3
			// 2 0 1 3 4
			// 3 1 0 2 4 5
			const layoutSm = [];
			for (let i = 0; i < room.players.length - 1; i++) {
				if (i % 2 === 0) {
					layoutSm.push(i);
				} else {
					layoutSm.unshift(i);
				}
			}
			if (layoutSm.length % 2 === 0) {
				layoutSm.reverse();
			}
			layoutSm.push(layoutSm.length);

			const orderSm = [];
			for (
				let i = room.players.length - playerIndex - 1;
				i < room.players.length;
				i++
			) {
				orderSm.push(layoutSm[i]);
			}
			for (let i = 0; i < room.players.length - playerIndex - 1; i++) {
				orderSm.push(layoutSm[i]);
			}

			return {
				players: room.players,
				numPlayers: room.players.length,
				order,
				orderSm
			};
		}

		if (props.room.inProgress && props.room.players !== state.players) {
			return { players: props.room.players };
		}

		return null;
	}

	render() {
		const {
			room,
			currPlayer,
			stage,
			turnPlayerName,
			timeLeft
		} = this.props;
		const { players, numPlayers, order, orderSm } = this.state;

		return (
			<Row
				id={styles.table}
				className="position-relative mt-md-vh-10 w-100 justify-content-between align-items-center text-center"
				data-num-players={numPlayers}
			>
				{[
					'Action Rebuttal',
					'Challenge Counteraction',
					'Results'
				].includes(stage) && (
					<Badge
						color="danger"
						className="position-absolute top-0 right-0"
					>
						{timeLeft}
					</Badge>
				)}
				{players.map((player, index) => (
					<Col
						key={player.name}
						xs={12}
						sm={
							(orderSm[index] === 0 && numPlayers % 2 === 0) ||
							player.name === currPlayer.name
								? 12
								: 5
						}
						className={`position-relative ${
							player.name === currPlayer.name
								? `mt-4`
								: 'mt-2 mt-sm-3'
						} order-${order[index]} order-sm-${
							orderSm[index]
						} ${classNames({
							[styles['bottom-1x']]:
								(players.length === 4 &&
									orderSm[index] !== 0 &&
									player.name !== currPlayer.name) ||
								(players.length === 5 &&
									player.name === currPlayer.name),
							[styles['bottom-2x']]:
								(players.length === 4 &&
									player.name === currPlayer.name) ||
								(players.length === 6 &&
									orderSm[index] !== 0 &&
									player.name !== currPlayer.name),
							[styles['bottom-4x']]:
								players.length === 6 &&
								player.name === currPlayer.name,
							[styles.left]:
								players.length === 5 && orderSm[index] === 0,
							[styles.right]:
								players.length === 5 && orderSm[index] === 1
						})}`}
					>
						<div
							className={`d-flex flex-center position-relative mx-auto rounded p-2 ${styles.player}`}
							data-turn={player.name === turnPlayerName}
							data-eliminated={player.isEliminated}
						>
							{!room.inProgress &&
								player.name === turnPlayerName && (
									<FontAwesomeIcon
										icon={faCrown}
										color={'yellow'}
										size="2x"
										className={styles['player-icon']}
									/>
								)}
							{player.isEliminated && (
								<FontAwesomeIcon
									icon={faTimes}
									color={'red'}
									size="2x"
									className={styles['player-icon']}
								/>
							)}
							<div>
								<span className="font-weight-bold">
									{player.name}
								</span>
								<br />
								Coins: {player.numCoins}
								<br />
								Influences Left: {player.numCards}
								<br />
								Lost Influence(s): [{player.faceUps.join(', ')}]
								<br />
								{player.name === currPlayer.name &&
									`Hand: [${currPlayer.cards.join(', ')}]`}
							</div>
						</div>
					</Col>
				))}
			</Row>
		);
	}
}

Table.propTypes = {
	stage: PropTypes.string.isRequired,
	turnPlayerName: PropTypes.string.isRequired,
	timeLeft: PropTypes.number.isRequired
};
Table.contextType = CoupContext;

export default Table;
