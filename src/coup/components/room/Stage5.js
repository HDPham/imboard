import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Form, FormGroup, Label, Input, Button } from 'reactstrap';
import { coupSocket as socket } from '../../../socketClient';
import PropTypes from 'prop-types';

class Stage5 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isReady: false,
    };
    this.keptCardIndex = -1;
  }

  chooseCard = (e) => {
    this.keptCardIndex = Number(e.currentTarget.value);
    this.setState({ isReady: true });
  };

  submitCard = (e) => {
    e.preventDefault();

    socket.emit(
      'remove player cards',
      this.props.myPlayer.id,
      'Removal',
      this.props.isRoundOver,
      [this.keptCardIndex],
    );
  };

  render() {
    return (
      <Form className="mt-4 text-center" onSubmit={this.submitCard}>
        <FormGroup tag="fieldset">
          <legend>Pick a card to keep</legend>
          {this.props.myPlayer.cards.map((card, index) => (
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

const mapStateToProps = (state) => ({
  room: state.room,
  myPlayer: state.myPlayer,
});

export default connect(mapStateToProps)(Stage5);
