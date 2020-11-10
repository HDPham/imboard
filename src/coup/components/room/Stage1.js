import React, { Component } from 'react';
import {
	Row,
	Col,
	Button,
	UncontrolledButtonDropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem,
	UncontrolledTooltip
} from 'reactstrap';
import classNames from 'classnames';
import styles from '../../CoupStyle.module.scss';
import PropTypes from 'prop-types';
import { CoupContext } from '../../context/CoupState';

class Stage1 extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isReady: false
		};
	}

	/**
	 * Returns action select/button jsx component
	 *
	 * @param {string} action
	 */
	applyButton = action => {
		const { room, currPlayer } = this.context;
		const {
			turnPlayerNumCoins,
			targetPlayerName,
			chooseActionSelect,
			chooseActionButton
		} = this.props;

		return (
			<Col key={action} xs={12} sm={4} lg={3} className="mt-2 mt-sm-3">
				{['Coup', 'Assassin', 'Captain'].includes(action) ? (
					<UncontrolledButtonDropdown key={action}>
						<DropdownToggle
							caret
							value={action}
							id={`select-${action}`}
							className={classNames({
								[styles['btn-action']]: true,
								'btn-active': action === this.props.action
							})}
							disabled={
								(action === 'Coup' && turnPlayerNumCoins < 7) ||
								(action === 'Assassin' &&
									turnPlayerNumCoins < 3)
							}
						>
							{action}
							{(action === 'Assassin' || action === 'Captain') &&
								` (${
									currPlayer.cards.includes(action)
										? 'Truth'
										: 'Lie'
								})`}
						</DropdownToggle>
						<DropdownMenu>
							{room.players
								.filter(player =>
									player.isEliminated
										? false
										: player.name !== currPlayer.name
								)
								.map(player => (
									<DropdownItem
										key={player.name}
										value={player.name}
										data-num-cards={player.numCards}
										active={
											action === this.props.action &&
											player.name === targetPlayerName
										}
										onClick={e => {
											this.setState({ isReady: true });
											chooseActionSelect(e);
										}}
									>
										{player.name}
									</DropdownItem>
								))}
						</DropdownMenu>
						{((action === 'Coup' && turnPlayerNumCoins < 7) ||
							(action === 'Assassin' &&
								turnPlayerNumCoins < 3)) && (
							<UncontrolledTooltip target={`select-${action}`}>
								Not enough coins!
							</UncontrolledTooltip>
						)}
					</UncontrolledButtonDropdown>
				) : (
					<Button
						key={action}
						value={action}
						className={classNames({
							[styles['btn-action']]: true,
							'btn-active': action === this.props.action
						})}
						onClick={e => {
							this.setState({ isReady: true });
							chooseActionButton(e);
						}}
					>
						{action}
						{(action === 'Duke' || action === 'Ambassador') &&
							` (${
								currPlayer.cards.includes(action)
									? 'Truth'
									: 'Lie'
							})`}
					</Button>
				)}
			</Col>
		);
	};

	render() {
		return (
			<div className="mt-2 w-100 text-center">
				<Row className="justify-content-center align-items-center">
					{['Income', 'Foreign Aid', 'Coup'].map(this.applyButton)}
				</Row>
				<Row className="justify-content-center align-items-center">
					{['Duke', 'Assassin', 'Ambassador', 'Captain'].map(
						this.applyButton
					)}
				</Row>
				<div className="mt-4">
					<Button
						outline
						onClick={this.props.submitAction}
						disabled={!this.state.isReady}
					>
						Submit
					</Button>
				</div>
			</div>
		);
	}
}

Stage1.propTypes = {
	turnPlayerNumCoins: PropTypes.number.isRequired,
	action: PropTypes.string.isRequired,
	targetPlayerName: PropTypes.string,
	chooseActionSelect: PropTypes.func.isRequired,
	chooseActionButton: PropTypes.func.isRequired,
	submitAction: PropTypes.func.isRequired
};
Stage1.contextType = CoupContext;

export default Stage1;
