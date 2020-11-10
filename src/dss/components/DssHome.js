import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Button } from 'reactstrap';
import Socials from '../../components/Socials';
import socket from '../../socket-client';
import PropTypes from 'prop-types';
import { DssContext } from '../context/DssState';

class DssHome extends Component {
	/**
	 * Returns random length-5 alphanumeric string
	 *
	 * @param {Object[]} rooms
	 */
	createRoomCode = rooms => {
		//
		let newRoomCode;
		const ALPHANUMERIC =
			'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const checkRoomCode = room => room.code === newRoomCode;

		do {
			newRoomCode = '';
			for (let i = 0; i < 5; i++) {
				newRoomCode +=
					ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
			}
		} while (rooms.some(checkRoomCode));

		return newRoomCode;
	};

	/**
	 * Creates new room
	 */
	createRoom = async () => {
		const rooms = await fetch('/api/rooms').then(res => res.json());
		const newRoomCode = this.createRoomCode(rooms);

		/**
		 * POST - Adds room
		 */
		const newRoom = await fetch('/api/rooms', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json;charset=UTF-8'
			},
			body: JSON.stringify({ code: newRoomCode })
		}).then(res => res.json());

		socket.emit('enter room [dss]', newRoom._id);
		this.context.setPlayer(null);
		this.context.setRoom(newRoom);
	};

	/**
	 * Enters new room
	 */
	enterRoom = async () => {
		await this.createRoom();
		this.props.history.push('/dss/lobby');
	};

	/**
	 * Leave Drunk, Stoned, or Stupid app
	 */
	leaveDss = () => {
		socket.emit('leave [dss]');
		this.props.history.push('/');
	};

	render() {
		return (
			<Container
				tag="main"
				className="d-flex-column vh-100 justify-content-center text-center"
			>
				<div className="fade-in d-flex-column mt-5 h-50 flex-center font-oswald">
					<h1 className="display-4 text-uppercase">
						<span className="position-relative">
							<span className="position-absolute text-danger title-not">
								Not{' '}
							</span>
							Drunk Stoned{' '}
							<span className="small text-danger line-through-0">or</span>{' '}
							Stupid
						</span>
					</h1>
					<div>
						<Button size="lg" className="mt-2 mx-2" onClick={this.enterRoom}>
							Create Room
						</Button>
						<Link
							to="/dss/join"
							className="d-inline-block align-middle mt-2 mx-2"
						>
							<Button size="lg">Join Room</Button>
						</Link>
					</div>
				</div>
				<Socials className="fade-in" />
				<Button
					className="position-absolute bottom-rem-1"
					onClick={this.leaveDss}
				>
					&larr; Go Back
				</Button>
			</Container>
		);
	}
}

DssHome.propTypes = { history: PropTypes.object.isRequired };
DssHome.contextType = DssContext;

export default DssHome;
