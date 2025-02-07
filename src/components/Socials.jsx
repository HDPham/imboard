import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import classNames from 'classnames';
import PropTypes from 'prop-types';

function Socials(props) {
  const { className } = props;

  return (
    <div className={classNames(className, 'text-center')}>
      <a
        title="Github"
        href="https://github.com/HDPham"
        target="_blank"
        rel="noopener noreferrer"
        className="d-inline-block"
      >
        <FontAwesomeIcon
          icon={faGithub}
          color="white"
          size="3x"
        ></FontAwesomeIcon>
      </a>
    </div>
  );
}

Socials.propTypes = {
  className: PropTypes.string,
};

export default Socials;
