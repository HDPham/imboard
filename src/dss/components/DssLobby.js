import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
	Container,
	Row,
	Col,
	Badge,
	Form,
	FormGroup,
	Label,
	Input,
	Button,
	Alert,
	ListGroup,
	ListGroupItem
} from 'reactstrap';
import cards from '../cards';
import socket from '../../socket-client';
import PropTypes from 'prop-types';
import { DssContext } from '../context/DssState';

class DssLobby extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isOpen: false
		};
	}

	componentDidMount() {
		socket.on('start game', () => {
			this.props.history.push('/dss/room');
		});
	}

	/**
	 * Adds new player
	 *
	 * @param {Object} e
	 */
	addPlayer = e => {
		e.preventDefault();

		const newPlayerName = document.forms[0].name.value
			.replace(/\s{2,}/g, ' ')
			.trim();
		const isPlayerNameTaken = this.context.room.players.some(
			player => player.name === newPlayerName
		);

		if (isPlayerNameTaken) {
			this.setState({ isOpen: !this.state.isOpen });
		} else {
			this.context.setPlayer({
				name: newPlayerName,
				chosenPlayerName: ''
			});
			socket.emit('set player name [dss]', newPlayerName);
			this.context.updateRoomAllClients({
				...this.context.room,
				players: [
					...this.context.room.players,
					{ name: newPlayerName, score: 0, isReady: false }
				]
			});
		}
	};

	/**
	 * Starts new game
	 */
	startGame = () => {
		const updatedRoom = {
			...this.context.room,
			judgeIndex: Math.floor(
				Math.random() * this.context.room.players.length
			),
			inProgress: true
		};

		socket.emit('set room state [dss]', {
			stage: 1,
			cardIndex: Math.floor(Math.random() * cards.length),
			cards,
			poll: Object.fromEntries(
				this.context.room.players.map(player => [player.name, []])
			)
		});
		this.context.updateRoomAllClients(updatedRoom);
		socket.emit('start game [dss]');
	};

	alertEnter = e => (e.style.transition = '');

	alertExit = e => (e.style.transition = 'none');

	alertExited = () => this.setState({ isOpen: true });

	componentWillUnmount() {
		socket.off('start game');
	}

	render() {
		const { room, currPlayer } = this.context;

		return (
			<Container tag="main" className="vh-100">
				<Row className="h-25 align-items-center">
					<Col className="text-center h2">
						<span className="h6">Room Code:</span>
						<br />
						<Badge className="mt-2">{this.context.room.code}</Badge>
					</Col>
				</Row>
				<Row className="h-50 flex-center text-center">
					{currPlayer === null &&
						!room.inProgress &&
						room.players.length <= 10 && (
							<Col xs={12} md={6}>
								<Form
									className="mt-md-rem-4"
									onSubmit={this.addPlayer}
								>
									<FormGroup>
										<Label>Enter Name</Label>
										<Input
											type="text"
											name="name"
											className="w-auto mx-auto"
											size="15"
											maxLength="10"
											required
										/>
									</FormGroup>
									<Button outline>Join</Button>
								</Form>
								<Alert
									isOpen={this.state.isOpen}
									transition={{
										timeout: 150,
										onEnter: this.alertEnter,
										onExit: this.alertExit,
										onExited: this.alertExited
									}}
									color="danger"
									className="d-inline-block mt-3 mb-0"
								>
									That name is already taken!
								</Alert>
							</Col>
						)}
					<Col xs={12} md={6}>
						<div>Lobby ({room.players.length}/6)</div>
						<ListGroup className="mt-3 mx-auto w-50">
							{room.players.length === 0 && (
								<ListGroupItem color="secondary"></ListGroupItem>
							)}
							{room.players.map(player => (
								<ListGroupItem
									className="font-weight-bold"
									color="secondary"
									key={player.name}
								>
									{player.name}
								</ListGroupItem>
							))}
						</ListGroup>
						{room.inProgress ? (
							<>
								<Link
									to="/dss/room"
									className="d-inline-block mt-3"
								>
									<Button outline color="success">
										{currPlayer === null
											? 'Spectate'
											: 'Return to Game'}
									</Button>
								</Link>
								<div className="mt-3 text-center">
									Game is in progress...
								</div>
							</>
						) : (
							<Button
								outline
								color="success"
								className="mt-3"
								onClick={this.startGame}
								disabled={
									currPlayer === null ||
									room.players.length < 3
								}
							>
								Start Game
							</Button>
						)}
					</Col>
				</Row>
				<Link to="/dss" className="position-absolute bottom-rem-1">
					<Button>&larr; Go Back</Button>
				</Link>
			</Container>
		);
	}
}

DssLobby.propTypes = { history: PropTypes.object.isRequired };
DssLobby.contextType = DssContext;

export default DssLobby;
