const { Server } = require('socket.io');
const server = require('../server');

const io =
  process.env.NODE_ENV === 'production'
    ? new Server(server)
    : new Server(server, {
        cors: {
          origin: 'http://localhost:3000',
        },
      });

module.exports = io;
