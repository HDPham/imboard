import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Button } from 'reactstrap';
import Stage1 from './room/Stage1';
import Stage2 from './room/Stage2';
import socket from '../../socket-client';
import { DssContext } from '../context/DssState';

class DssRoom extends Component {
	constructor(props) {
		super(props);
		this.state = {
			stage: 1,
			cardIndex: -1,
			cards: [],
			poll: {}
		};
	}

	componentDidMount() {
		socket.on('update room state', roomState => this.setState(roomState));

		socket.emit('initialize room state [dss]');
	}

	componentWillUnmount() {
		socket.off('update room state');
	}

	render() {
		const { room } = this.context;
		const { stage, cardIndex, cards, poll } = this.state;

		return (
			<Container
				tag="main"
				className="d-flex-column flex-center min-vh-100 py-4 text-center"
			>
				{stage === 1 && (
					<Stage1 cardState={{ index: cardIndex, cards }} poll={poll} />
				)}
				{stage === 2 && (
					<Stage2
						players={room.players}
						cardState={{ index: cardIndex, cards }}
						poll={poll}
					/>
				)}
				{!room.inProgress && (
					<Link to="/dss/lobby" className="mt-3">
						<Button outline color="success">
							New Game
						</Button>
					</Link>
				)}
			</Container>
		);
	}
}

DssRoom.contextType = DssContext;

export default DssRoom;
