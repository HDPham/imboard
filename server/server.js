const http = require('http');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const config = require('./config');

// Create app
const app = express();

// HTTP Server
const server = http.createServer(app);

const { NODE_ENV, MONGO_URI, MONGO_DB_NAME } = config;
const db = `${MONGO_URI}/${MONGO_DB_NAME}`;

mongoose
  .connect(db)
  .then(() => console.log('MongoDB connected...'))
  .catch((err) => console.error(err));

app.use(express.json());

// Rooms API Routes
app.use('/api/dss/rooms', require('./route/api/dssRooms'));
app.use('/api/coup/rooms', require('./route/api/coupRooms'));

if (NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'build', 'index.html'));
  });
}

module.exports = server;
