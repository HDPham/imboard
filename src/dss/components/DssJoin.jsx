import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
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
import { dssSocket as socket } from '../../socketClient';
// import PropTypes from 'prop-types';

function DssJoin() {
  const [roomCode, setRoomCode] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [alertText, setAlertText] = useState('');

  const room = useSelector((state) => state.room);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('enter lobby', () => {
      navigate('/dss/lobby');
    });

    return () => {
      socket.off('enter lobby');
    };
  }, [navigate]);

  /**
   * Enter room if room exists
   *
   * @param {Object} e
   */
  const handleJoinFormSubmit = async (e) => {
    e.preventDefault();

    if (room !== null && room.code === roomCode) {
      navigate('/dss/lobby');
      return;
    }

    if (roomCode.length !== 6) {
      setIsOpen(!isOpen);
      setIsHidden(false);
      setAlertText('Must be 6 characters long.');
      return;
    }

    if (/[^0-9A-Za-z]/g.test(roomCode)) {
      setIsOpen(!isOpen);
      setIsHidden(false);
      setAlertText(
        'Must only contain letters and/or numbers (i.e. a-z, A-Z, 0-9).',
      );
      return;
    }

    const newRoom = await fetch('/api/dss/rooms/' + roomCode).then((res) =>
      res.json(),
    );

    if (!newRoom) {
      setIsOpen(!isOpen);
      setIsHidden(false);
      setAlertText('Room not found.');
    }

    dispatch(setRoom(newRoom));
    socket.auth = { roomId: newRoom._id };
    socket.connect();
  };

  const handleRoomCodeChange = (e) => setRoomCode(e.target.value);

  const onEnter = (e) => (e.style.transition = '');

  const onExit = (e) => (e.style.transition = 'none');

  const onExited = () => setIsOpen(true);

  return (
    <Container tag="main" className="d-flex vh-100 align-items-center">
      <div className="d-flex-column w-100 align-items-center text-center">
        <Form onSubmit={handleJoinFormSubmit}>
          <FormGroup>
            <Label>Enter Room Code</Label>
            <Input
              type="text"
              name="room_code"
              className="w-auto mx-auto"
              size="10"
              maxLength="6"
              autoComplete="off"
              required
              onChange={handleRoomCodeChange}
            />
          </FormGroup>
          <Button outline>Enter</Button>
        </Form>
        <Alert
          isOpen={isOpen}
          transition={{
            timeout: 150,
            onEnter: onEnter,
            onExit: onExit,
            onExited: onExited,
          }}
          color="danger"
          className="mt-4"
          hidden={isHidden}
        >
          {alertText}
        </Alert>
      </div>
      <Link to="/dss" className="position-absolute bottom-rem-1">
        <Button>&larr; Go Back</Button>
      </Link>
    </Container>
  );
}

export default DssJoin;
