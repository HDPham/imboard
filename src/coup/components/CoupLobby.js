import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Badge,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  ListGroup,
  ListGroupItem,
} from 'reactstrap';
import { addPlayer } from '../roomSlice';
import { setMyPlayer } from '../myPlayerSlice';
import { coupSocket as socket } from '../../socketClient';
// import PropTypes from 'prop-types';

class CoupLobby extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      isOpen: false,
      alertText: '',
      isEnteringRoom: false,
    };
  }

  componentDidMount() {
    if (!this.props.room.inProgress) {
      this.props.setMyPlayer(null);
    }

    socket.on('enter room', () => {
      if (this.props.myPlayer !== null) {
        this.setState({ isEnteringRoom: true });
      }
    });
  }

  componentWillUnmount() {
    socket.off('enter room');
  }

  /**
   * Add new player
   *
   * @param {Object} e
   */
  addPlayer = async (e) => {
    e.preventDefault();

    const { room } = this.props;
    const { username, isOpen } = this.state;
    const newUsername = username.trim().replace(/\s{2,}/g, ' ');

    if (!newUsername) {
      this.setState({ isOpen: !isOpen, alertText: 'Please enter a name.' });
      return;
    }

    const isUsernameTaken = room.players.some(
      (player) => player.username === newUsername,
    );

    if (isUsernameTaken) {
      this.setState({
        isOpen: !isOpen,
        alertText: 'That name is already taken!',
      });
      return;
    }

    socket.emit('add player', newUsername);
  };

  startGame = () => socket.emit('start game');

  handlePlayerNameChange = (e) => this.setState({ username: e.target.value });

  alertEnter = (elem) => elem.removeAttribute('style');

  alertExit = (elem) => elem.style.setProperty('transition', 'none');

  alertExited = () => this.setState({ isOpen: true });

  render() {
    const { room, myPlayer } = this.props;
    const { username, isOpen, alertText, isEnteringRoom } = this.state;

    if (isEnteringRoom) {
      return <Navigate to="/coup/room" />;
    }

    return (
      <Container tag="main" className="vh-100">
        <Row className="h-25 align-items-center">
          <Col className="text-center h2">
            <span className="h6">Room Code:</span>
            <br />
            <Badge className="mt-2">{room.code}</Badge>
          </Col>
        </Row>
        <Row className="h-50 flex-center text-center">
          {myPlayer === null && !room.inProgress && room.players.length <= 6 && (
            <Col xs={12} md={6}>
              <Form className="mt-md-rem-4" onSubmit={this.addPlayer}>
                <FormGroup>
                  <Label>Enter Name</Label>
                  <Input
                    type="text"
                    name="name"
                    className="w-auto mx-auto"
                    value={username}
                    size="15"
                    maxLength="8"
                    required
                    onChange={this.handlePlayerNameChange}
                  />
                </FormGroup>
                <Button outline>Join</Button>
              </Form>
              <Alert
                className="mt-4"
                color="danger"
                isOpen={isOpen}
                transition={{
                  timeout: 150,
                  onEnter: this.alertEnter,
                  onExit: this.alertExit,
                  onExited: this.alertExited,
                }}
              >
                {alertText}
              </Alert>
            </Col>
          )}
          <Col xs={12} md={6}>
            <div>Lobby ({room.players.length}/6)</div>
            <ListGroup className="mt-3 mx-auto w-50">
              {room.players.length === 0 && (
                <ListGroupItem color="secondary"></ListGroupItem>
              )}
              {room.players.map((player) => (
                <ListGroupItem
                  className="font-weight-bold"
                  color="secondary"
                  key={player._id}
                >
                  {player.username}
                </ListGroupItem>
              ))}
            </ListGroup>
            {!room.inProgress ? (
              <Button
                outline
                color="success"
                className="mt-3"
                onClick={this.startGame}
                disabled={myPlayer === null || room.players.length < 2}
              >
                Start Game
              </Button>
            ) : myPlayer ? (
              <Link to="/coup/room" className="d-inline-block mt-3">
                <Button outline color="success">
                  Enter Room
                </Button>
              </Link>
            ) : (
              <div className="mt-3 h2">Game is in progress...</div>
            )}
          </Col>
        </Row>
        <Link to="/coup" className="position-absolute bottom-rem-1">
          <Button>&larr; Go Back</Button>
        </Link>
      </Container>
    );
  }
}

const mapStateToProps = (state) => ({
  room: state.room,
  myPlayer: state.myPlayer,
});

export default connect(mapStateToProps, { addPlayer, setMyPlayer })(CoupLobby);
