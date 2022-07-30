import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import {
  Container,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Alert,
} from 'reactstrap';
import { setRoom } from '../roomSlice';
import { coupSocket as socket } from '../../socketClient';

class CoupJoin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      roomCode: '',
      isOpen: false,
      isHidden: true,
      alertText: '',
      isEnteringLobby: false,
    };
  }

  componentDidMount() {
    socket.disconnect();

    socket.on('enter lobby', () => {
      this.setState({ isEnteringLobby: true });
    });

    socket.on('connect_error', (err) => {
      switch (err.message) {
        case 'Room not found':
          document.forms.join.room_code.setCustomValidity('Room not found.');
          document.forms.join.room_code.reportValidity();
          break;
        default:
          break;
      }
    });
  }

  componentWillUnmount() {
    socket.off('enter lobby');
    socket.off('connect_error');
  }

  handleJoinFormSubmit = async (e) => {
    e.preventDefault();

    if (
      this.props.room !== null &&
      this.props.room.code === this.state.roomCode
    ) {
      this.setState({ isEnteringLobby: true });
      return;
    }

    if (this.state.roomCode.length !== 6) {
      this.setState({
        isOpen: !this.state.isOpen,
        isHidden: false,
        alertText: 'Must be 6 characters long.',
      });
      return;
    }

    if (/[^0-9A-Za-z]/g.test(this.state.roomCode)) {
      this.setState({
        isOpen: !this.state.isOpen,
        isHidden: false,
        alertText:
          'Must only contain letters and/or numbers (i.e. a-z, A-Z, 0-9).',
      });
      return;
    }

    const newRoom = await fetch('/api/coup/rooms/' + this.state.roomCode).then(
      (res) => res.json(),
    );

    if (!newRoom) {
      this.setState({
        isOpen: !this.state.isOpen,
        isHidden: false,
        alertText: 'Room not found.',
      });
      return;
    }

    this.props.setRoom(newRoom);
    socket.auth = { roomId: newRoom._id };
    socket.connect();
  };

  handleRoomCodeChange = (e) => this.setState({ roomCode: e.target.value });

  onEnter = (elem) => elem.removeAttribute('style');

  onExit = (elem) => elem.style.setProperty('transition', 'none');

  onExited = () => this.setState({ isOpen: true });

  render() {
    if (this.state.isEnteringLobby) {
      return <Navigate to="/coup/lobby" />;
    }

    return (
      <Container tag="main" className="d-flex vh-100 align-items-center">
        <div className="d-flex-column w-100 align-items-center text-center">
          <Form
            className="text-center"
            name="join"
            onSubmit={this.handleJoinFormSubmit}
          >
            <FormGroup>
              <Label>Enter Room Code</Label>
              <Input
                type="text"
                name="room_code"
                className="w-auto mx-auto"
                value={this.state.roomCode}
                size="10"
                maxLength="6"
                autoComplete="off"
                required
                onChange={this.handleRoomCodeChange}
              />
            </FormGroup>
            <Button outline>Join</Button>
          </Form>
          <Alert
            className="mt-4"
            color="danger"
            hidden={this.state.isHidden}
            isOpen={this.state.isOpen}
            transition={{
              timeout: 150,
              onEnter: this.onEnter,
              onExit: this.onExit,
              onExited: this.onExited,
            }}
          >
            {this.state.alertText}
          </Alert>
        </div>
        <Link to="/coup" className="position-absolute bottom-rem-1">
          <Button>&larr; Go Back</Button>
        </Link>
      </Container>
    );
  }
}

// CoupJoin.contextType = CoupContext;
const mapStateToProps = (state) => ({ room: state.room });

export default connect(mapStateToProps, { setRoom })(CoupJoin);
