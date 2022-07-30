import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button, Container, Modal, ModalBody } from 'reactstrap';
import Stage1 from './room/Stage1';
import Stage2 from './room/Stage2';
import Timeout from '../../components/Timeout';
import styles from '../DssStyle.module.scss';
import { setRoom } from '../roomSlice';
import { dssSocket as socket } from '../../socketClient';

function DssRoom(props) {
  const [isTransitionModalActive, setIsTransitionModalActive] = useState(false);
  const [isEndModalActive, setIsEndModalActive] = useState(false);
  const [modalText, setModalText] = useState('');

  const { setTimeout, clearTimeouts } = props;

  const dispatch = useDispatch();
  const room = useSelector((state) => state.room);
  const judge = room.players[room.currentTurn];

  useEffect(() => {
    let placeholderRoom = null;

    socket.on('next round', (updatedRoom, message) => {
      setIsTransitionModalActive(true);
      setModalText(message);
      placeholderRoom = updatedRoom;

      setTimeout(() => {
        const modalEl = document.querySelector('.modal');
        modalEl.classList.remove('show');
        setTimeout(() => {
          setModalText('Next round!');
          modalEl.classList.add('show');
          setTimeout(() => {
            setIsTransitionModalActive(false);
            dispatch(setRoom(updatedRoom));
            placeholderRoom = null;
          }, 3000);
        }, 500);
      }, 6000);
    });

    socket.on('game over', (updatedRoom, message) => {
      setIsEndModalActive(true);
      setModalText(message);
      placeholderRoom = updatedRoom;

      setTimeout(() => {
        setIsEndModalActive(false);
        dispatch(setRoom(updatedRoom));
        placeholderRoom = null;
      }, 6000);
    });

    socket.on('clear timeouts', () => {
      setIsTransitionModalActive(false);
      setIsEndModalActive(false);
      clearTimeouts();
      placeholderRoom = null;
    });

    return () => {
      socket.off('next round');
      socket.off('game over');
      socket.off('clear timeouts');

      if (placeholderRoom) {
        dispatch(setRoom(placeholderRoom));
      }
    };
  }, [dispatch, setTimeout, clearTimeouts, judge?.username]);

  return (
    <Container
      tag="main"
      className="d-flex-column flex-center min-vh-100 py-4 text-center"
    >
      {room.stage === 1 && <Stage1 />}
      {room.stage === 2 && <Stage2 />}
      {!room.inProgress && (
        <Link to="/dss/lobby" className="mt-3">
          <Button outline color="success">
            New Game
          </Button>
        </Link>
      )}
      <Modal
        isOpen={isTransitionModalActive || isEndModalActive}
        centered={true}
        contentClassName={styles['modal-transition']}
      >
        <ModalBody className="text-center display-4">{modalText}</ModalBody>
      </Modal>
    </Container>
  );
}

export default Timeout(DssRoom);
