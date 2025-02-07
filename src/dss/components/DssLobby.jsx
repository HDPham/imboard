import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
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
import { setMyPlayer } from '../myPlayerSlice';
import { setRoom } from '../roomSlice';
import styles from '../DssStyle.module.scss';
import { dssSocket as socket } from '../../socketClient';
// import PropTypes from 'prop-types';

function DssLobby() {
  const [username, setUsername] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [alertText, setAlertText] = useState('');

  const { room, myPlayer } = useSelector((state) => ({
    room: state.room,
    myPlayer: state.myPlayer,
  }));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!room.inProgress) {
      dispatch(setMyPlayer(null));
    }
  }, [dispatch, room.inProgress]);

  useEffect(() => {
    socket.on('enter room', () => {
      if (myPlayer !== null) {
        navigate('/dss/room');
      }
    });

    socket.on('next round', (updatedRoom) => {
      dispatch(setRoom(updatedRoom));
    });

    socket.on('game over', (updatedRoom) => {
      dispatch(setRoom(updatedRoom));
    });

    return () => {
      socket.off('enter room');
      socket.off('next round');
      socket.off('game over');
    };
  }, [dispatch, navigate, myPlayer]);

  /**
   * Adds new player
   *
   * @param {Object} e
   */
  const addPlayer = (e) => {
    e.preventDefault();

    const newUsername = username.trim().replace(/\s{2,}/g, ' ');

    if (!newUsername) {
      setIsOpen(!isOpen);
      setAlertText('Please enter a name.');
      return;
    }

    const isUsernameTaken = room.players.some(
      (player) => player.username === newUsername,
    );

    if (isUsernameTaken) {
      setIsOpen(!isOpen);
      setAlertText('That name is already taken!');
      return;
    }

    socket.emit('add player', newUsername);
  };

  const startGame = () => socket.emit('start game');

  const handlePlayerNameChange = (e) => setUsername(e.target.value);

  const alertEnter = (e) => (e.style.transition = '');

  const alertExit = (e) => (e.style.transition = 'none');

  const alertExited = () => setIsOpen(true);

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
        {myPlayer === null && !room.inProgress && room.players.length <= 10 && (
          <Col xs={12} md={6}>
            <Form className="mt-md-rem-4" onSubmit={addPlayer}>
              <FormGroup>
                <Label>Enter Name</Label>
                <Input
                  type="text"
                  name="name"
                  className="w-auto mx-auto"
                  size="15"
                  maxLength="10"
                  required
                  onChange={handlePlayerNameChange}
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
                onEnter: alertEnter,
                onExit: alertExit,
                onExited: alertExited,
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
          {room.inProgress ? (
            <>
              <Link to="/dss/room" className="d-inline-block mt-3">
                <Button outline color="success">
                  {myPlayer ? 'Return to Game' : 'Spectate'}
                </Button>
              </Link>
              <div className="mt-3 text-center">
                Game is in progress
                <span className="d-inline-block align-bottom">
                  <span className={'d-block ' + styles.loading}>...</span>
                </span>
              </div>
            </>
          ) : (
            <Button
              outline
              color="success"
              className="mt-3"
              onClick={startGame}
              disabled={myPlayer === null || room.players.length < 3}
            >
              Start Game
            </Button>
          )}
        </Col>
      </Row>
      <Link to="/dss" className="position-absolute bottom-rem-1">
        <Button>&larr; Go Back</Button>
      </Link>
    </Container>
  );
}

export default DssLobby;
