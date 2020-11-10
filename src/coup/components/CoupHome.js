import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Button } from 'reactstrap';
import Socials from '../../components/Socials';
import socket from '../../socket-client';
import PropTypes from 'prop-types';
import { CoupContext } from '../context/CoupState';

class CoupHome extends Component {
	componentDidMount() {
		socket.emit('remove player [coup]');
		socket.emit('leave room [coup]');

		socket.on('create room', roomCodes => {
			const newRoomCode = this.createRoomCode(roomCodes);

			socket.emit('enter room [coup]', newRoomCode);
			this.context.setRoom({
				code: newRoomCode,
				players: [],
				turnIndex: -1,
				inProgress: false
			});

			this.props.history.push('/coup/lobby');
		});
	}

	/**
	 * Returns random length-5 alphanumeric string
	 *
	 * @param {string[]} roomCodes
	 */
	createRoomCode(roomCodes) {
		//
		let newRoomCode;
		const ALPHANUMERIC =
			'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

		do {
			newRoomCode = '';
			for (let i = 0; i < 5; i++) {
				newRoomCode +=
					ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
			}
		} while (roomCodes.includes(newRoomCode));

		return newRoomCode;
	}

	/**
	 * Creates a new room
	 */
	createRoom() {
		socket.emit('create room [coup]');
	}

	componentWillUnmount() {
		socket.off('create room');
	}

	render() {
		return (
			<Container
				tag="main"
				className="d-flex-column vh-100 justify-content-center text-center"
			>
				<div className="fade-in d-flex-column mt-5 h-50 flex-center font-geo">
					<h1 className="display-4">
						<span className="position-relative">
							<span className="position-absolute text-danger title-not">
								not{' '}
							</span>
							coup
						</span>
					</h1>
					<div>
						<Button size="lg" className="mt-2 mx-2" onClick={this.createRoom}>
							Create Room
						</Button>
						<Link
							to="/coup/join"
							className="d-inline-block align-middle mt-2 mx-2"
						>
							<Button size="lg">Join Room</Button>
						</Link>
					</div>
				</div>
				<Socials className="fade-in" />
				<Link to="/" className="position-absolute bottom-rem-1">
					<Button>&larr; Go Back</Button>
				</Link>
			</Container>
		);
	}
}

CoupHome.propTypes = { history: PropTypes.object.isRequired };
CoupHome.contextType = CoupContext;

export default CoupHome;
