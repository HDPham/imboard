import React, { Component } from 'react';
import { Form, FormGroup, Label, Input, Button } from 'reactstrap';
import socket from '../../../socket-client';
import PropTypes from 'prop-types';
import { CoupContext } from '../../context/CoupState';

class Stage5 extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isReady: false
		};
		this.keptCardIndex = -1;
	}

	chooseCard = e => {
		this.keptCardIndex = Number(e.currentTarget.value);
		this.setState({ isReady: true });
	};

	submitCard = e => {
		e.preventDefault();

		socket.emit(
			'remove cards [coup]',
			'Removal',
			this.props.isRoundOver,
			this.context.currPlayer.name,
			[this.keptCardIndex]
		);
	};

	render() {
		return (
			<Form className="mt-4 text-center" onSubmit={this.submitCard}>
				<FormGroup tag="fieldset">
					<legend>Pick a card to keep</legend>
					{this.context.currPlayer.cards.map((card, index) => (
						<FormGroup check key={index}>
							<Label check>
								<Input
									type="radio"
									name="card"
									value={index}
									onClick={this.chooseCard}
								/>{' '}
								{card}
							</Label>
						</FormGroup>
					))}
				</FormGroup>
				<Button outline disabled={!this.state.isReady}>
					Submit
				</Button>
			</Form>
		);
	}
}

Stage5.propTypes = { isRoundOver: PropTypes.bool.isRequired };
Stage5.contextType = CoupContext;

export default Stage5;
