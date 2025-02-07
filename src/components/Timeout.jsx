import React, { Component } from 'react';

const Timeout = (WrappedComponent) =>
  class extends Component {
    constructor(props) {
      super(props);
      this.timeouts = [];

      this.addTimeout = this.addTimeout.bind(this);
      this.clearTimeouts = this.clearTimeouts.bind(this);
    }

    addTimeout() {
      this.timeouts.push(setTimeout.apply(null, arguments));
    }

    clearTimeouts() {
      this.timeouts.forEach(clearTimeout);
    }

    componentWillUnmount() {
      this.clearTimeouts();
    }

    render() {
      return (
        <WrappedComponent
          timeouts={this.timeouts}
          setTimeout={this.addTimeout}
          clearTimeouts={this.clearTimeouts}
          {...this.props}
        />
      );
    }
  };

export default Timeout;
