import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Table, Button } from 'reactstrap';
import GameTable from './GameTable';
import Vote from './Vote';
import styles from '../../DssStyle.module.scss';
import { dssSocket as socket } from '../../../socketClient';
// import PropTypes from 'prop-types';

function Stage2() {
  const [isReady, setIsReady] = useState(false);
  const [votedFor, setVotedFor] = useState(null);

  const { room, myPlayer } = useSelector((state) => ({
    room: state.room,
    myPlayer: state.myPlayer,
  }));
  const judge = room.players[room.currentTurn];
  const poll = new Map();
  room.players.forEach((player) => {
    if (!player.votedFor) {
      return;
    }

    const votedBy = poll.get(player.votedFor);

    if (votedBy) {
      votedBy.push(player.username);
    } else {
      poll.set(player.votedFor, [player.username]);
    }
  });

  const choosePlayer = (e) => {
    const isJudge = myPlayer?.id === judge._id;
    const isTargetJudge = e.currentTarget.value === judge._id;
    const isAlreadySelected = e.currentTarget.value === votedFor?.id;

    if (!room.inProgress || !isJudge || isTargetJudge || isAlreadySelected) {
      return;
    }

    const newVotedFor = room.players.find(
      (player) => player._id === e.currentTarget.value,
    );
    setVotedFor({ id: newVotedFor._id, username: newVotedFor.username });
    setIsReady(true);
  };

  const handleJudgeVoteClick = () => {
    socket.emit('judge vote', votedFor);
  };

  const pollPanel =
    poll.size > 0
      ? [...poll]
          .filter(([votedFor, voters]) => voters.length > 0)
          .map(([votedFor, voters]) => (
            <Table key={votedFor} borderless className="mb-0 text-white">
              <thead>
                <tr className="border-bottom">
                  <th className="p-2">
                    {voters.length === 1
                      ? `${votedFor} (1 vote)`
                      : `${votedFor} (${voters.length} votes)`}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">
                    {voters.length === 1
                      ? voters[0]
                      : voters.length === 2
                      ? voters.join(' & ')
                      : `${voters.slice(0, -1).join(', ')}, and ${
                          voters[voters.length - 1]
                        }`}
                  </td>
                </tr>
              </tbody>
            </Table>
          ))
      : null;

  return (
    <>
      <GameTable sidePanel={pollPanel} card={room.card} />
      <div className="mt-5 font-weight-bold">
        Discussion Stage: Judge makes final decision.
        {room.inProgress && myPlayer?.id !== judge._id && (
          <>
            <br />
            <span>{judge.username} is judging</span>
            <span className="d-inline-block align-bottom">
              <span className={'d-block ' + styles.loading}>...</span>
            </span>
          </>
        )}
      </div>
      {room.inProgress && (
        <Vote
          votedFor={votedFor?.username}
          handlePlayerButtonClick={choosePlayer}
        />
      )}
      {room.inProgress && myPlayer?.id === judge._id && (
        <Button
          outline
          color="success"
          className="mt-3"
          onClick={handleJudgeVoteClick}
          disabled={!isReady}
        >
          Submit
        </Button>
      )}
    </>
  );
}

export default Stage2;
