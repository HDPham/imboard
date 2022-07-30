import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComment,
  faLongArrowAltLeft,
} from '@fortawesome/free-solid-svg-icons';
import styles from '../../CoupStyle.module.scss';
import { coupSocket as socket } from '../../../socketClient';

class Chat extends Component {
  mql = window.matchMedia('(min-width: 768px)');

  /**
   * Maintains scroll bar at the bottom of the chat when switching screen width display
   *
   * @param {Object} e
   */
  maintainScrollBottom(e) {
    const chatEl = document.querySelector('.chat');
    const chatBodyEl = chatEl.querySelector('.chat-body');
    const prevChatBodyClientHeight = chatBodyEl.clientHeight;
    if (e.matches) {
      const prevChatBodyScrollTop = chatBodyEl.scrollTop;

      chatEl.style.height = '100%';
      chatBodyEl.scrollTop =
        prevChatBodyScrollTop -
        chatBodyEl.clientHeight +
        prevChatBodyClientHeight;
    } else {
      chatEl.style.height = `${100 / 3}%`;
      chatBodyEl.scrollTop +=
        prevChatBodyClientHeight - chatBodyEl.clientHeight;
    }
  }

  componentDidMount() {
    socket.on('chat message', (playerName, message) => {
      const playerNameSpan = document.createElement('span');
      playerNameSpan.classList.add('font-weight-bold');
      playerNameSpan.textContent = playerName;

      const messageDiv = document.createElement('div');
      messageDiv.classList.add('text-break');
      messageDiv.append(playerNameSpan);
      messageDiv.append(`: ${message}`);

      const chatBodyEl = document.querySelector('.chat-body');
      const isScrollAtBottom =
        chatBodyEl.scrollTop + chatBodyEl.clientHeight >=
        chatBodyEl.scrollHeight;
      chatBodyEl.append(messageDiv);
      if (isScrollAtBottom) {
        messageDiv.scrollIntoView(false);
      }
    });

    document.querySelector('.chat-toggle > path').onclick = function () {
      document.querySelector('.chat').classList.remove('translate-left-100');
    };

    this.maintainScrollBottom(this.mql);
    this.mql.addEventListener('change', this.maintainScrollBottom);
  }

  /**
   * Emit message to server
   *
   * @param {Object} e
   */
  onKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      socket.emit(
        'chat message',
        this.props.myPlayer.username,
        e.currentTarget.value,
      );

      e.currentTarget.value = '';
    }
  };

  closeChat() {
    document.querySelector('.chat').classList.add('translate-left-100');
  }

  onClosedChat(e) {
    e.currentTarget.previousElementSibling.classList.toggle('invisible');
  }

  componentWillUnmount() {
    socket.off('chat message');
    this.mql.removeEventListener('change', this.maintainScrollBottom);
  }

  render() {
    return (
      <>
        <FontAwesomeIcon
          className={`chat-toggle ${styles['chat-toggle']}`}
          icon={faComment}
          color="#43464b"
          size="3x"
        />
        <div
          className={`chat d-flex-column position-fixed translate-left-100 ${styles.chat}`}
          onTransitionEnd={this.onClosedChat}
        >
          <div className={`text-right ${styles['bg-dark']}`}>
            <div
              className={`d-inline-block text-center ${styles['chat-icon-container']}`}
              onClick={this.closeChat}
            >
              <FontAwesomeIcon icon={faLongArrowAltLeft} />
            </div>
          </div>
          <div
            className={`chat-body p-2 overflow-auto ${styles['chat-body']}`}
          ></div>
          <textarea
            className={`p-2 rounded text-light ${styles['bg-dark']}`}
            onKeyPress={this.onKeyPress}
          />
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({ myPlayer: state.myPlayer });

export default connect(mapStateToProps)(Chat);
