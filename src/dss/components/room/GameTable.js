import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';
import styles from '../../DssStyle.module.scss';
import PropTypes from 'prop-types';

class GameTable extends Component {
	render() {
		return (
			<Row className="flex-center justify-content-xl-start w-100">
				<Col xs={12} md={4} lg={3}>
					<div
						id={styles['side-panel']}
						className="mx-auto border rounded"
					>
						{this.props.sidePanel}
					</div>
				</Col>
				<Col xs={12} md={8} lg={7} xl={6} className="mt-4 mt-md-0">
					<Row
						id={styles['card-display']}
						className="border rounded px-5 flex-center font-weight-bold font-size-2"
					>
						{this.props.cardState.cards[this.props.cardState.index]}
					</Row>
				</Col>
			</Row>
		);
	}
}

GameTable.propTypes = {
	sidePanel: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
		.isRequired,
	cardState: PropTypes.shape({
		cards: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
		index: PropTypes.number.isRequired
	}).isRequired
};

export default GameTable;
