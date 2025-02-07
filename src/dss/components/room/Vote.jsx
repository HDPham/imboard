import React from 'react';
import { useSelector } from 'react-redux';
import { Row, Col, Button, Badge } from 'reactstrap';
import classNames from 'classnames';
import styles from '../../DssStyle.module.scss';
import judgeGravel from '../../../assets/judge_gravel.png';
// import PropTypes from 'prop-types';

function Vote(props) {
  const { room, myPlayer } = useSelector((state) => ({
    room: state.room,
    myPlayer: state.myPlayer,
  }));
  const judge = room.players[room.currentTurn];

  return (
    <Row className="mt-4 align-items-center">
      {room.players
        // .filter((player) => player._id !== judge._id)
        .map((player, index) => (
          <Col key={player._id} className={styles['player-container']}>
            <Button
              value={player._id}
              className={classNames({
                'position-relative': true,
                'btn-active': player.username === props.votedFor,
                [styles['btn-player']]: true,
              })}
              onClick={props.handlePlayerButtonClick}
            >
              <Badge color="info">{player.score}</Badge>&nbsp;
              <span className="fw-bold">
                {player._id === myPlayer?.id ? 'Me' : player.username}
              </span>
              {player._id === judge._id && (
                <img
                  src={judgeGravel}
                  alt="Gravel"
                  className="position-absolute"
                />
              )}
            </Button>
          </Col>
        ))}
    </Row>
  );
}

export default Vote;
