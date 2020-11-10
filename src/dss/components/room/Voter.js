import React, { Component } from 'react';
import { Row, Col, Button, Badge } from 'reactstrap';
import classNames from 'classnames';
import styles from '../../DssStyle.module.scss';
import PropTypes from 'prop-types';

class Voter extends Component {
	render() {
		return (
			<Row className="mt-2 align-items-center">
				{this.props.room.players.map((player, index) => (
					<Col
						key={player.name}
						className={`mt-4 ${styles['player-container']}`}
					>
						<Button
							value={player.name}
							data-score={player.score}
							data-index={index}
							className={classNames({
								'position-relative': true,
								'btn-active':
									player.name === this.props.chosenPlayerName,
								[styles['btn-player']]: true
							})}
							onClick={this.props.choosePlayer}
						>
							<Badge color="info">{player.score}</Badge>
							<b className="ml-2">{player.name}</b>
							{this.props.judgeName === player.name && (
								<img
									src="/judge_gravel.png"
									alt="Gravel"
									className="position-absolute"
									style={{}}
								/>
							)}
						</Button>
					</Col>
				))}
			</Row>
		);
	}
}

Voter.propTypes = {
	room: PropTypes.object.isRequired
};

export default Voter;
