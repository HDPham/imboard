import React, { Component } from 'react';
import { Form, FormGroup, Label, Input, Button } from 'reactstrap';
import socket from '../../../socket-client';
import PropTypes from 'prop-types';
import { CoupContext } from '../../context/CoupState';

class Stage4 extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isReady: false
		};
		this.keptCardIndexes = [];
		this.numChecks = 0;
	}

	/**
	 * Adds/removes card indexes to list
	 *
	 * @param {Object} e
	 */
	chooseCard = e => {
		if (
			e.currentTarget.checked &&
			this.numChecks === this.props.turnPlayerNumCards
		) {
			e.preventDefault();
			return;
		}

		if (e.currentTarget.checked) {
			this.keptCardIndexes.push(Number(e.currentTarget.value));
			this.numChecks++;
		} else {
			this.keptCardIndexes.splice(
				this.keptCardIndexes.indexOf(Number(e.currentTarget.value)),
				1
			);
			this.numChecks--;
		}

		if (this.numChecks < this.props.turnPlayerNumCards) {
			this.setState({ isReady: false });
		} else {
			this.setState({ isReady: true });
		}
	};

	/**
	 * Emits indexes of cards to keep to server
	 *
	 * @param {Object} e
	 */
	exchangeCards = e => {
		e.preventDefault();

		this.context.setPlayer({
			...this.context.currPlayer,
			cards: this.context.currPlayer.cards.filter((card, index) =>
				this.keptCardIndexes.includes(index)
			)
		});

		socket.emit(
			'return cards [coup]',
			this.context.currPlayer.name,
			this.keptCardIndexes
		);
	};

	render() {
		return (
			<Form className="mt-4 text-center" onSubmit={this.exchangeCards}>
				<FormGroup tag="fieldset">
					<legend>
						Pick{' '}
						{this.props.turnPlayerNumCards === 2
							? 'two cards'
							: 'a card'}{' '}
						to keep
					</legend>
					{this.context.currPlayer.cards.map((card, index) => (
						<FormGroup check key={index}>
							<Label check>
								<Input
									type="checkbox"
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

Stage4.propTypes = { turnPlayerNumCards: PropTypes.number.isRequired };
Stage4.contextType = CoupContext;

export default Stage4;
