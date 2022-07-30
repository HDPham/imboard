import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import classNames from 'classnames';
import styles from '../../CoupStyle.module.scss';
import PropTypes from 'prop-types';

class Stage2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isReady: false,
    };
    this.counteractions = [];

    if (props.action === 'Foreign Aid') {
      this.counteractions.push('Duke');
    } else {
      this.counteractions.push('Challenge');

      if (
        props.action === 'Captain' &&
        props.myPlayer.username === props.targetPlayerName
      ) {
        this.counteractions.push('Ambassador', 'Captain');
      }
      if (
        props.action === 'Assassin' &&
        props.myPlayer.username === props.targetPlayerName
      ) {
        this.counteractions.push('Contessa');
      }
    }
  }

  render() {
    return (
      <div className="mt-3 text-center">
        {this.counteractions.map((counteraction) => (
          <div key={counteraction} className="mt-2">
            <Button
              value={counteraction}
              className={classNames({
                [styles['btn-action']]: true,
                'btn-active': counteraction === this.props.counteraction,
              })}
              onClick={(e) => {
                this.setState({ isReady: true });
                this.props.chooseCounteraction(e);
              }}
            >
              {counteraction === 'Challenge'
                ? `Challenge ${this.props.turnPlayerName}`
                : `Block: ${counteraction} (${
                    this.props.myPlayer.cards.includes(counteraction)
                      ? 'Truth'
                      : 'Lie'
                  })`}
            </Button>
          </div>
        ))}
        <div className="mt-3">
          <Button
            outline
            onClick={this.props.submitCounteraction}
            disabled={!this.state.isReady}
          >
            Submit
          </Button>
        </div>
      </div>
    );
  }
}

Stage2.propTypes = {
  turnPlayerName: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired,
  targetPlayerName: PropTypes.string,
  counteraction: PropTypes.string.isRequired,
  chooseCounteraction: PropTypes.func.isRequired,
  submitCounteraction: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  room: state.room,
  myPlayer: state.myPlayer,
});

export default connect(mapStateToProps)(Stage2);
