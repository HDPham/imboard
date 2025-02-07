import React from 'react';
import { useSelector } from 'react-redux';
import { Button, ListGroup, ListGroupItem } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import GameTable from './GameTable';
import Vote from './Vote';
import styles from '../../DssStyle.module.scss';
import { dssSocket as socket } from '../../../socketClient';
// import PropTypes from 'prop-types';

function Stage1() {
  const { room, myPlayer } = useSelector((state) => ({
    room: state.room,
    myPlayer: state.myPlayer,
  }));
  const judge = room.players[room.currentTurn];
  const votedFor = room.players.find(
    (player) => player._id === myPlayer?.id,
  )?.votedFor;

  const votePlayer = (e) => {
    const isJudge = myPlayer?.id === judge._id;
    const isTargetJudge = e.currentTarget.value === judge._id;
    const targetPlayer = room.players.find(
      (player) => player._id === e.currentTarget.value,
    );
    const isAlreadySelected =
      !targetPlayer || targetPlayer.username === votedFor;

    if (
      !myPlayer ||
      !room.inProgress ||
      isJudge ||
      isTargetJudge ||
      isAlreadySelected
    ) {
      return;
    }

    socket.emit('player vote', targetPlayer.username);
  };

  const nextStage = () => {
    if (!myPlayer || myPlayer.id !== judge._id) {
      return;
    }

    const isAllPlayersReady = room.players.every(
      (player) => player.isReady || player._id === judge._id,
    );

    if (isAllPlayersReady) {
      socket.emit('next stage', 2);
    }
  };

  const readyPanel =
    room.inProgress && room.players.length > 0 ? (
      <ListGroup>
        {room.players
          .filter((player) => player._id !== judge._id)
          .map((player, index) => (
            <ListGroupItem key={player._id} className="text-white bg-dark">
              {player.username}
              {player.isReady && (
                <FontAwesomeIcon
                  icon={faCheck}
                  color="green"
                  className={`position-absolute ${styles['ready-icon']}`}
                />
              )}
            </ListGroupItem>
          ))}
      </ListGroup>
    ) : null;

  return (
    <>
      <GameTable sidePanel={readyPanel} card={room.card} />
      <div className="mt-5 font-weight-bold">
        Initial Voting Stage: Everyone, except the judge, chooses who they think
        the statement applies to most.
      </div>
      {room.inProgress && (
        <Vote votedFor={votedFor} handlePlayerButtonClick={votePlayer} />
      )}
      {room.inProgress && myPlayer?.id === judge._id && (
        <Button
          outline
          color="success"
          className="mt-3"
          onClick={nextStage}
          disabled={room.players.some(
            (player) => !player.isReady && player._id !== judge._id,
          )}
        >
          Next Stage
        </Button>
      )}
    </>
  );
}

export default Stage1;
