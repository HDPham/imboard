import React from 'react';
import { Row, Col } from 'reactstrap';
import styles from '../../DssStyle.module.scss';
import PropTypes from 'prop-types';

function GameTable(props) {
  return (
    <Row
      className={
        props.sidePanel
          ? 'flex-center w-100 justify-content-xl-start'
          : 'flex-center w-100'
      }
    >
      {props.sidePanel && (
        <Col xs={12} md={4} lg={3}>
          <div id={styles['side-panel']} className="mx-auto border rounded">
            {props.sidePanel}
          </div>
        </Col>
      )}
      <Col xs={12} md={8} lg={7} xl={6} className="mt-4 mt-md-0">
        <Row
          id={styles['card-display']}
          className="border rounded px-5 flex-center font-weight-bold font-size-2"
        >
          {props.card}
        </Row>
      </Col>
    </Row>
  );
}

GameTable.propTypes = {
  sidePanel: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  card: PropTypes.string.isRequired,
};

export default GameTable;
