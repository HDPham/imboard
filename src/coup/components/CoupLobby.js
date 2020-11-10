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
import socket from '../../socket-client';
import PropTypes from 'prop-types';
import { CoupContext } from '../context/CoupState';

class CoupLobby extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isOpen: false
		};
	}

	componentDidMount() {
		socket.on('start game', () => {
			if (this.context.currPlayer !== null) {
				socket.emit('draw cards [coup]', this.context.currPlayer);
				this.props.history.push('/coup/room');
			}
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
				cards: [],
				isEliminated: false
			});
			socket.emit('add player [coup]', newPlayerName);
		}
	};

	/**
	 * Starts new game
	 */
	startGame = () => {
		socket.emit('update room (all clients) [coup]', {
			...this.context.room,
			turnIndex: Math.floor(
				Math.random() * this.context.room.players.length
			),
			inProgress: true
		});
		socket.emit('start game [coup]');
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
						<Badge className="mt-2">{room.code}</Badge>
					</Col>
				</Row>
				<Row className="h-50 flex-center text-center">
					{currPlayer === null &&
						!room.inProgress &&
						room.players.length <= 6 && (
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
											maxLength="8"
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
							<div className="mt-3 h2">
								Game is in progress...
							</div>
						) : (
							<Button
								outline
								color="success"
								className="mt-3"
								onClick={this.startGame}
								disabled={
									currPlayer === null ||
									room.players.length < 2
								}
							>
								Start Game
							</Button>
						)}
					</Col>
				</Row>
				<Link to="/coup" className="position-absolute bottom-rem-1">
					<Button>&larr; Go Back</Button>
				</Link>
			</Container>
		);
	}
}

CoupLobby.propTypes = { history: PropTypes.object.isRequired };
CoupLobby.contextType = CoupContext;

export default CoupLobby;
