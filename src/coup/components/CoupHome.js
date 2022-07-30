import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { Container, Button } from 'reactstrap';
import { setRoom } from '../roomSlice';
import { coupSocket as socket } from '../../socketClient';

class CoupHome extends Component {
  constructor(props) {
    super(props);
    this.state = { isEnteringLobby: false };
  }

  componentDidMount() {
    socket.disconnect();

    socket.on('enter lobby', () => {
      this.setState({ isEnteringLobby: true });
    });
  }

  componentWillUnmount() {
    socket.off('enter lobby');
  }

  /**
   * Create and set new room and enter /coup/lobby route
   */
  createRoom = async () => {
    const newRoom = await fetch('/api/coup/rooms', { method: 'POST' }).then(
      (res) => res.json(),
    );

    this.props.setRoom(newRoom);
    socket.auth = { roomId: newRoom._id };
    socket.connect();
    // this.setState({ isEnteringLobby: true });
  };

  render() {
    if (this.state.isEnteringLobby) {
      return <Navigate to="/coup/lobby" />;
    }

    return (
      <Container
        tag="main"
        className="d-flex-column vh-100 justify-content-center text-center"
      >
        <div className="fade-in d-flex-column mt-5 h-50 flex-center font-geo">
          <h1 className="display-4">
            <span className="position-relative">
              <span className="position-absolute text-danger title-not">
                not{' '}
              </span>
              coup
            </span>
          </h1>
          <div>
            <Button size="lg" className="mt-2 mx-2" onClick={this.createRoom}>
              Create Room
            </Button>
            <Link
              to="/coup/join"
              className="d-inline-block align-middle mt-2 mx-2"
            >
              <Button size="lg">Join Room</Button>
            </Link>
          </div>
        </div>
        <Link to="/" className="position-absolute bottom-rem-1">
          <Button>&larr; Go Back</Button>
        </Link>
      </Container>
    );
  }
}

export default connect(null, { setRoom })(CoupHome);
