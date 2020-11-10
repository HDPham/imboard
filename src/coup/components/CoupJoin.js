import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
	Container,
	Button,
	Form,
	FormGroup,
	Label,
	Input,
	Alert
} from 'reactstrap';
import socket from '../../socket-client';
import PropTypes from 'prop-types';
import { CoupContext } from '../context/CoupState';

class CoupJoin extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isOpen: false,
			isHidden: true,
			alertText: ''
		};
	}

	componentDidMount() {
		socket.on('join room', newRoom => {
			if (newRoom !== null) {
				socket.emit('enter room [coup]', newRoom.code);
				this.context.setRoom(newRoom);

				this.props.history.push('/coup/lobby');
			} else {
				this.setState({
					isOpen: !this.state.isOpen,
					isHidden: false,
					alertText: 'That room does not exist'
				});
			}
		});
	}

	/**
	 * Checks if room already exists
	 */
	checkRoom = async e => {
		e.preventDefault();

		const newRoomCode = document.forms[0].code.value;

		if (
			this.context.room !== null &&
			this.context.room.code === newRoomCode
		) {
			this.props.history.push('/coup/lobby');
		} else if (/[0-9A-Za-z]{5}/.test(newRoomCode)) {
			socket.emit('join room [coup]', newRoomCode);
		} else {
			this.setState({
				isOpen: !this.state.isOpen,
				isHidden: false,
				alertText:
					'Must only contain letters and/or numbers (i.e. a-z, A-Z, 0-9)'
			});
		}
	};

	onEnter = e => (e.style.transition = '');

	onExit = e => (e.style.transition = 'none');

	onExited = () => this.setState({ isOpen: true });

	componentWillUnmount() {
		socket.off('join room');
	}

	render() {
		return (
			<Container tag="main" className="d-flex vh-100 align-items-center">
				<div className="d-flex-column w-100 align-items-center text-center">
					<Form className="text-center" onSubmit={this.checkRoom}>
						<FormGroup>
							<Label>Enter Room Code</Label>
							<Input
								type="text"
								name="code"
								className="w-auto mx-auto"
								size="10"
								minLength="5"
								maxLength="5"
								autoComplete="off"
								required
							/>
						</FormGroup>
						<Button outline>Enter</Button>
					</Form>
					<Alert
						isOpen={this.state.isOpen}
						transition={{
							timeout: 150,
							onEnter: this.onEnter,
							onExit: this.onExit,
							onExited: this.onExited
						}}
						color="danger"
						className="mt-4"
						hidden={this.state.isHidden}
					>
						{this.state.alertText}
					</Alert>
				</div>
				<Link to="/coup" className="position-absolute bottom-rem-1">
					<Button>&larr; Go Back</Button>
				</Link>
			</Container>
		);
	}
}

CoupJoin.propTypes = { history: PropTypes.object.isRequired };
CoupJoin.contextType = CoupContext;

export default CoupJoin;
