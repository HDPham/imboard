import React, { Component } from 'react';
import { Button } from 'reactstrap';
import classNames from 'classnames';
import styles from '../../CoupStyle.module.scss';
import PropTypes from 'prop-types';

class Stage3 extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isReady: false
		};
	}

	render() {
		return (
			<div className="mt-4 text-center">
				<div>
					<Button
						className={classNames({
							[styles['btn-action']]: true,
							'btn-active': this.state.isReady
						})}
						onClick={() => this.setState({ isReady: true })}
					>
						Challenge {this.props.blocker.name}
					</Button>
				</div>
				<div className="mt-3">
					<Button
						outline
						onClick={this.props.submitChallenge.bind(
							null,
							this.props.blocker,
							this.props.counteraction
						)}
						disabled={!this.state.isReady}
					>
						Submit
					</Button>
				</div>
			</div>
		);
	}
}

Stage3.propTypes = {
	counteraction: PropTypes.string.isRequired,
	blocker: PropTypes.exact({
		name: PropTypes.string.isRequired,
		numCards: PropTypes.number.isRequired
	}).isRequired,
	submitChallenge: PropTypes.func.isRequired
};

export default Stage3;
