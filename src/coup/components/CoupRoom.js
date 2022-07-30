import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Badge, Container, Button } from 'reactstrap';
import Chat from './room/Chat';
import Table from './room/Table';
import Stage1 from './room/Stage1';
import Stage2 from './room/Stage2';
import Stage3 from './room/Stage3';
import Stage4 from './room/Stage4';
import Stage5 from './room/Stage5';
import styles from '../CoupStyle.module.scss';
import { coupSocket as socket } from '../../socketClient';
// import PropTypes from 'prop-types';

class CoupRoom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stage: 'Choose Action',
      logContent:
        props.room.players[props.room.currentTurn].username +
        ' is choosing an action!',
      turnPlayer: { ...props.room.players[props.room.currentTurn] },
      action: '',
      targetPlayer: null,
      blocker: null,
      counteraction: '',
      defendantName: '',
      challengerName: '',
      loserName: '',
      isTruthful: false,
      timeLeft: 0,
    };
    this.isChallenge = false;
    this.isRoundOver = true;
    this.isGameOver = false;
  }

  componentDidMount() {
    /**
     * Copies and returns a player object in player list
     *
     * @param {Object[]} players
     * @param {string} playerName
     */
    function copyPlayer(players, playerName) {
      const playerIndex = players.findIndex(
        (player) => player.username === playerName,
      );
      players[playerIndex] = { ...players[playerIndex] };
      return players[playerIndex];
    }

    /**
     * Action was not challenged -> Apply action
     */
    const contestableActions = () => {
      const updatedRoom = {
        ...this.props.room,
        players: [...this.props.room.players],
      };
      const updatedTurnPlayer = copyPlayer(
        updatedRoom.players,
        this.props.room.players[this.props.room.currentTurn].username,
      );

      switch (this.state.action) {
        case 'Foreign Aid':
          updatedTurnPlayer.coinCount += 2;
          break;
        case 'Assassin':
          updatedTurnPlayer.coinCount -= 3;

          socket.emit('update room', updatedRoom);

          if (this.state.targetPlayer.cardCount === 1) {
            socket.emit(
              'remove player cards',
              this.state.targetPlayer._id,
              this.state.action,
              true,
            );
          } else {
            socket.emit(
              'transition to removal',
              this.state.targetPlayer.username,
            );
          }

          return;
        case 'Ambassador':
          socket.emit('draw 2 cards');
          socket.emit('transition to exchange');

          return;
        case 'Duke':
          updatedTurnPlayer.coinCount += 3;
          break;
        case 'Captain':
          const updatedTargetPlayer = copyPlayer(
            updatedRoom.players,
            this.state.targetPlayer.username,
          );
          if (updatedTargetPlayer.coinCount < 2) {
            updatedTurnPlayer.coinCount += updatedTargetPlayer.coinCount;
            updatedTargetPlayer.coinCount = 0;
          } else {
            updatedTurnPlayer.coinCount += 2;
            updatedTargetPlayer.coinCount -= 2;
          }
          break;
        default:
          break;
      }

      socket.emit('update room', updatedRoom);
      socket.emit('display results', this.state.action);
    };

    const removeCardTransition = (targetUsername) => {
      clearInterval(this.timerId);

      const {
        turnPlayer,
        action,
        blocker,
        counteraction,
        challengerName,
        defendantName,
        isTruthful,
      } = this.state;
      let logContent = null;

      if (this.isChallenge) {
        logContent = (
          <>
            {challengerName} challenges {defendantName}'s{' '}
            {blocker === null ? action : `block with ${counteraction}`}
            .<br />
            {defendantName}{' '}
            {isTruthful ? (
              <>
                is telling the Truth.
                <br />
                {defendantName} gets a new card
              </>
            ) : (
              'Lied'
            )}
            .<br />
            {targetUsername} loses a card.
          </>
        );
      } else {
        logContent = (
          <>
            {turnPlayer.username} uses {action} on {targetUsername}.<br />
            {targetUsername} loses a card.
          </>
        );
      }

      this.setState({
        stage: 'Influence Removal',
        logContent,
        loserName: targetUsername,
      });
    };

    socket.on('action', (action, targetPlayer) => {
      this.setState({ action, targetPlayer }, () => {
        const { room } = this.props;
        const { turnPlayer } = this.state;

        const updatedRoom = { ...room, players: [...room.players] };
        const updatedTurnPlayer = copyPlayer(
          updatedRoom.players,
          turnPlayer.username,
        );

        if (action === 'Income') {
          updatedTurnPlayer.coinCount++;

          socket.emit('update room', updatedRoom);
          socket.emit('display results', action);

          return;
        }

        if (action === 'Coup') {
          updatedTurnPlayer.coinCount -= 7;

          socket.emit('update room', updatedRoom);

          if (this.state.targetPlayer.cardCount === 1) {
            socket.emit('remove player cards', targetPlayer._id, action, true);
          } else {
            socket.emit('transition to removal', targetPlayer.username);
          }

          return;
        }

        this.setState(
          {
            stage: 'Action Rebuttal',
            logContent: (
              <>
                {turnPlayer.username} uses {action}
                {targetPlayer && ` on ${targetPlayer.username}`}.
                <br />
                Other players can choose to challenge!
              </>
            ),
            timeLeft: 15,
          },
          () => {
            this.timerId = setInterval(() => {
              if (this.state.timeLeft === 0) {
                clearInterval(this.timerId);
                contestableActions();
              } else {
                this.setState({
                  timeLeft: this.state.timeLeft - 1,
                });
              }
            }, 1000);
          },
        );
      });
    });

    socket.on('action (others)', (action, targetPlayer) => {
      this.setState({ action, targetPlayer }, () => {
        if (action === 'Income' || action === 'Coup') {
          return;
        }

        this.setState(
          {
            stage: 'Action Rebuttal',
            logContent: (
              <>
                {this.state.turnPlayer.username} uses {action}
                {targetPlayer && ` on ${targetPlayer.username}`}.
              </>
            ),
            timeLeft: 15,
          },
          () => {
            this.timerId = setInterval(() => {
              if (this.state.timeLeft === 0) {
                clearInterval(this.timerId);
              } else {
                this.setState({
                  timeLeft: this.state.timeLeft - 1,
                });
              }
            }, 1000);
          },
        );
      });
    });

    socket.on('counteraction', (counteraction, blocker) => {
      clearInterval(this.timerId);

      this.setState({
        stage: 'Challenge Counteraction',
        logContent: (
          <>
            {this.state.turnPlayer.username} uses {this.state.action}
            {this.state.targetPlayer &&
              ` on
						${this.state.targetPlayer.username}`}
            .<br />
            {blocker.username} blocks with {counteraction}.<br />
            {this.props.myPlayer.username === blocker.username &&
              'Other players can choose to challenge!'}
          </>
        ),
        counteraction,
        blocker,
        timeLeft: 15,
      });

      this.timerId = setInterval(() => {
        if (this.state.timeLeft === 0) {
          clearInterval(this.timerId);
          if (this.props.myPlayer.username === blocker.username) {
            socket.emit('display results', 'Counter');
          }
        } else {
          this.setState({ timeLeft: this.state.timeLeft - 1 });
        }
      }, 1000);
    });

    socket.on('challenge', (challenger, defendant, isTruthful) => {
      clearInterval(this.timerId);

      const loser = isTruthful ? challenger : defendant;
      const isBlocking = this.state.blocker !== null;
      const isSituation1 =
        this.state.action === 'Assassin' &&
        challenger.username === this.state.targetPlayer.username &&
        isTruthful;
      const isSituation2 =
        this.state.action === 'Assassin' &&
        this.state.counteraction === 'Contessa' &&
        !isTruthful;

      this.isChallenge = true;
      this.isRoundOver =
        (isBlocking && isTruthful) ||
        (!isBlocking && !isTruthful) ||
        isSituation1 ||
        isSituation2;
      this.setState(
        {
          challengerName: challenger.username,
          defendantName: defendant.username,
          isTruthful,
        },
        () => {
          const isEliminated =
            loser.cardCount === 1 || isSituation1 || isSituation2;

          if (isEliminated) {
            if (this.props.myPlayer.username === loser.username) {
              socket.emit(
                'remove player cards',
                loser._id,
                'Challenge',
                this.isRoundOver,
              );
            }
          } else {
            removeCardTransition(loser.username);
          }
        },
      );
    });

    socket.on('transition to exchange', () => {
      clearInterval(this.timerId);

      this.setState({
        stage: 'Ambassador Exchange',
        logContent: `${this.state.turnPlayer.username} exchanging cards with court deck.`,
      });
    });

    socket.on('transition to removal', removeCardTransition);

    socket.on('display results', (action, isRoundOver, removedCards) => {
      clearInterval(this.timerId);

      const {
        turnPlayer,
        targetPlayer,
        blocker,
        challengerName,
        defendantName,
        loserName,
        isTruthful,
      } = this.state;
      let logContent = null;
      let timeLeft = 5;

      const { currentTurn } = this.props.room;
      let nextTurnIndex = currentTurn;
      do {
        nextTurnIndex =
          nextTurnIndex >= this.props.room.players.length - 1
            ? 0
            : nextTurnIndex + 1;
      } while (this.props.room.players[nextTurnIndex].isEliminated);

      switch (action) {
        case 'Income':
          logContent = (
            <>
              {turnPlayer.username} uses {action}.<br />
              {turnPlayer.username} takes 1 coin.
            </>
          );
          break;
        case 'Foreign Aid':
          logContent = `${turnPlayer.username} takes 2 coins.`;
          break;
        case 'Coup':
          logContent = (
            <>
              {turnPlayer.username} use {action} on {targetPlayer.username}.
              <br />
              {targetPlayer.username} loses {removedCards.join(' & ')}.<br />
              {targetPlayer.username} has no more cards left and is eliminated.
            </>
          );
          timeLeft = 10;
          break;
        case 'Duke':
          logContent = `${turnPlayer.username} takes 3 coins.`;
          break;
        case 'Assassin':
          logContent = (
            <>
              {turnPlayer.username} assassinates {targetPlayer.username}.
              <br />
              {targetPlayer.username} loses {removedCards.join(' & ')}.<br />
              {targetPlayer.username} has no more cards left and is eliminated.
            </>
          );
          timeLeft = 10;
          break;
        case 'Ambassador':
          logContent = `${turnPlayer.username} finished card exchange.`;
          break;
        case 'Captain':
          logContent = `${turnPlayer.username} stole from ${targetPlayer.username}.`;
          break;
        case 'Counter':
          logContent = `Block succeeded.`;
          break;
        case 'Challenge':
          logContent = (
            <>
              {challengerName} challenges {defendantName}'s{' '}
              {blocker === null
                ? this.state.action
                : `block with ${this.state.counteraction}`}
              .<br />
              {defendantName}{' '}
              {isTruthful ? (
                <>
                  is telling the Truth.
                  <br />
                  {defendantName} gets a new card
                </>
              ) : (
                'Lied'
              )}
              .<br />
              {isTruthful ? challengerName : defendantName} loses{' '}
              {removedCards.join(' & ')}.
              <br />
              {isTruthful ? challengerName : defendantName} has no more cards
              left and is eliminated.
            </>
          );
          timeLeft = 10;
          break;
        case 'Removal':
          logContent = `${loserName} gets rid of ${removedCards.join(' & ')}`;
          break;
        default:
          break;
      }

      this.setState({
        stage: 'Results',
        logContent,
        timeLeft,
      });

      this.timerId = setInterval(() => {
        if (this.state.timeLeft === 0) {
          clearInterval(this.timerId);

          if (
            this.props.myPlayer.username ===
            this.props.room.players[currentTurn].username
          ) {
            if (isRoundOver) {
              socket.emit('next round', nextTurnIndex);
            } else {
              contestableActions();
            }
          }
        } else {
          this.setState({ timeLeft: this.state.timeLeft - 1 });
        }
      }, 1000);
    });

    socket.on('next round', () => {
      clearInterval(this.timerId);

      const { room, myPlayer } = this.props;
      const turnPlayer = room.players[room.currentTurn];

      const isGameOver =
        room.players.reduce(
          (numPlayerLeft, player) =>
            player.isEliminated ? numPlayerLeft : numPlayerLeft + 1,
          0,
        ) <= 1;

      if (isGameOver) {
        this.isGameOver = true;
        this.setState({
          stage: 'Game Over',
          logContent: `${turnPlayer.username} wins!`,
          turnPlayer,
        });

        if (myPlayer.id === turnPlayer._id) {
          socket.emit('end game');
        }
      } else {
        this.isChallenge = false;
        this.isRoundOver = true;
        this.setState({
          stage: 'Choose Action',
          logContent: `${turnPlayer.username} is choosing an action!`,
          turnPlayer,
          action: '',
          targetPlayer: null,
          blocker: null,
          counteraction: '',
          defendantName: '',
          challengerName: '',
          loserName: '',
        });
      }
    });

    socket.on('player left', (removedPlayerId, isRemovingCurrPlayer) => {
      const removedPlayer = this.props.room.players.find(
        (player) => player._id === removedPlayerId,
      );

      if (
        this.isChallenge &&
        this.state.stage === 'Influence Removal' &&
        this.state.loserName !== removedPlayer.username &&
        isRemovingCurrPlayer
      ) {
        this.isRoundOver = true;

        return;
      }

      const { room, myPlayer } = this.props;
      let nextTurnIndex = room.currentTurn;

      do {
        nextTurnIndex =
          nextTurnIndex >= room.players.length - 1 ? 0 : nextTurnIndex + 1;
      } while (room.players[nextTurnIndex].isEliminated);

      if (myPlayer.username === room.players[nextTurnIndex].username) {
        const isGameOver =
          room.players.reduce(
            (numPlayerLeft, player) =>
              player.isEliminated ? numPlayerLeft : numPlayerLeft + 1,
            0,
          ) <= 1;

        if (isGameOver || isRemovingCurrPlayer) {
          socket.emit('next round', nextTurnIndex);
        } else if (
          this.isChallenge &&
          this.state.stage === 'Influence Removal' &&
          this.state.loserName === removedPlayer.username &&
          !isRemovingCurrPlayer
        ) {
          contestableActions();
        }
      }
    });
  }

  /**
   * Sets action that targets anther player
   *
   * @param {Object} e
   */
  chooseActionSelect = (e) => {
    this.setState({
      action: e.currentTarget.parentElement.previousElementSibling.value,
      targetPlayer: {
        username: e.currentTarget.value,
        cardCount: Number(e.currentTarget.dataset.cardCount),
      },
    });
  };

  /**
   * Sets action with no target player
   *
   * @param {Object} e
   */
  chooseActionButton = (e) => {
    this.setState({
      action: e.currentTarget.value,
      targetPlayer: null,
    });
  };

  /**
   * Emits action to server
   */
  submitAction = () => {
    socket.emit('action', this.state.action, this.state.targetPlayer);
  };

  /**
   * Sets counteraction
   */
  chooseCounteraction = (e) => {
    this.setState({
      counteraction: e.currentTarget.value,
    });
  };

  /**
   * Emits counteraction to server
   */
  submitCounteraction = () => {
    if (this.state.counteraction === 'Challenge') {
      this.submitChallenge(this.state.turnPlayer, this.state.action);
    } else {
      const blocker = this.props.room.players.find(
        (player) => player._id === this.props.myPlayer.id,
      );

      socket.emit('counteraction', this.state.counteraction, blocker);
    }
  };

  /**
   * Emits challenge to server
   *
   * @param {Object} defendant
   * @param {string} action
   */
  submitChallenge = (defendant, action) => {
    const prosecutor = this.props.room.players.find(
      (player) => player._id === this.props.myPlayer.id,
    );

    socket.emit('challenge', prosecutor, defendant, action);
  };

  componentWillUnmount() {
    clearInterval(this.timerId);
    socket.off('action');
    socket.off('action (others)');
    socket.off('counteraction');
    socket.off('challenge');
    socket.off('transition to removal');
    socket.off('transition to exchange');
    socket.off('display results');
    socket.off('next round');
    socket.off('player left');

    // if (!this.isGameOver) {
    //   socket.emit('remove player [coup]');
    // }
    // this.props.setPlayer(null);
  }

  render() {
    const { myPlayer } = this.props;
    const {
      stage,
      logContent,
      turnPlayer,
      action,
      targetPlayer,
      counteraction,
      blocker,
      loserName,
      timeLeft,
    } = this.state;

    return (
      <Container
        tag="main"
        className="d-flex-column position-relative pt-3 pb-6 py-md-0 min-vh-100 align-items-center"
      >
        <Chat />
        {['Action Rebuttal', 'Challenge Counteraction', 'Results'].includes(
          stage,
        ) && (
          <Badge color="danger" className={styles.timer}>
            {timeLeft}
          </Badge>
        )}
        <Table turnPlayerName={turnPlayer.username} />
        <div className="mt-4 text-center">{logContent}</div>
        {stage === 'Choose Action' &&
          myPlayer.username === turnPlayer.username && (
            <Stage1
              turnPlayerNumCoins={turnPlayer.coinCount}
              action={action}
              targetPlayerName={targetPlayer?.username}
              chooseActionSelect={this.chooseActionSelect}
              chooseActionButton={this.chooseActionButton}
              submitAction={this.submitAction}
            />
          )}
        {stage === 'Action Rebuttal' &&
          (myPlayer.isEliminated
            ? false
            : myPlayer.username !== turnPlayer.username) && (
            <Stage2
              turnPlayerName={turnPlayer.username}
              action={action}
              targetPlayerName={targetPlayer?.username}
              counteraction={counteraction}
              chooseCounteraction={this.chooseCounteraction}
              submitCounteraction={this.submitCounteraction}
            />
          )}
        {stage === 'Challenge Counteraction' &&
          (myPlayer.isEliminated
            ? false
            : myPlayer.username !== blocker.username) && (
            <Stage3
              counteraction={counteraction}
              blocker={blocker}
              submitChallenge={this.submitChallenge}
            />
          )}
        {stage === 'Ambassador Exchange' &&
          myPlayer.username === turnPlayer.username && (
            <Stage4 turnPlayerNumCards={turnPlayer.cardCount} />
          )}
        {stage === 'Influence Removal' && myPlayer.username === loserName && (
          <Stage5 isRoundOver={this.isRoundOver} />
        )}
        {stage === 'Game Over' && (
          <Link to="/coup/lobby" replace className="mt-3">
            <Button outline color="success">
              New Game
            </Button>
          </Link>
        )}
      </Container>
    );
  }
}

const mapStateToProps = (state) => ({
  room: state.room,
  myPlayer: state.myPlayer,
});

export default connect(mapStateToProps)(CoupRoom);
