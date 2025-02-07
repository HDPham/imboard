import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Button } from 'reactstrap';
import { setRoom } from '../roomSlice';
import { dssSocket as socket } from '../../socketClient';
// import PropTypes from 'prop-types';

function DssHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    socket.disconnect();

    socket.on('enter lobby', () => {
      navigate('/dss/lobby');
    });

    return () => {
      socket.off('enter lobby');
    };
  }, [navigate]);

  /**
   * Create and set new room
   * Enter /dss/lobby route
   */
  const createRoom = async () => {
    const newRoom = await fetch('/api/dss/rooms', { method: 'POST' }).then(
      (res) => res.json(),
    );

    dispatch(setRoom(newRoom));
    socket.auth = { roomId: newRoom._id };
    socket.connect();
  };

  return (
    <Container
      tag="main"
      className="d-flex-column vh-100 justify-content-center text-center"
    >
      <div className="fade-in d-flex-column mt-5 h-50 flex-center font-oswald">
        <h1 className="display-4 text-uppercase">
          <span className="position-relative">
            <span className="position-absolute text-danger title-not">
              Not{' '}
            </span>
            Drunk Stoned{' '}
            <span className="small text-danger line-through-0">or</span> Stupid
          </span>
        </h1>
        <div>
          <Button size="lg" className="mt-2 mx-2" onClick={createRoom}>
            Create Room
          </Button>
          <Link
            to="/dss/join"
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

export default DssHome;
