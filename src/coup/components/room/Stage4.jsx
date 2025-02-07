import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Form, FormGroup, Label, Input, Button } from 'reactstrap';
import { setMyPlayer, keepCards } from '../../myPlayerSlice';
import { coupSocket as socket } from '../../../socketClient';
import PropTypes from 'prop-types';

class Stage4 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isReady: false,
    };
    this.keepCardIndexes = [];
    this.numChecks = 0;
  }

  /**
   * Adds/removes card indexes to list
   *
   * @param {Object} e
   */
  chooseCard = (e) => {
    if (
      e.currentTarget.checked &&
      this.numChecks === this.props.turnPlayerNumCards
    ) {
      e.preventDefault();
      return;
    }

    if (e.currentTarget.checked) {
      this.keepCardIndexes.push(Number(e.currentTarget.value));
      this.numChecks++;
    } else {
      this.keepCardIndexes.splice(
        this.keepCardIndexes.indexOf(Number(e.currentTarget.value)),
        1,
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
  exchangeCards = (e) => {
    e.preventDefault();

    this.props.keepCards(this.keepCardIndexes);

    socket.emit('return cards', this.keepCardIndexes);
  };

  render() {
    return (
      <Form className="mt-4 text-center" onSubmit={this.exchangeCards}>
        <FormGroup tag="fieldset">
          <legend>
            Pick {this.props.turnPlayerNumCards === 2 ? 'two cards' : 'a card'}{' '}
            to keep
          </legend>
          {this.props.myPlayer.cards.map((card, index) => (
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

const mapStateToProps = (state) => ({
  room: state.room,
  myPlayer: state.myPlayer,
});

export default connect(mapStateToProps, { setMyPlayer, keepCards })(Stage4);
