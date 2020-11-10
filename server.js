const http = require('http');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
// const config = require('config');
const config = require('./config');

// Create app
const app = express();

// HTTP Server
const server = http.createServer(app);

// const db = config.get('mongoDB');
const { MONGO_URI, MONGO_DB_NAME } = config;
const db = `${MONGO_URI}/${MONGO_DB_NAME}`;

mongoose
	.connect(db, {
		useCreateIndex: true,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false
	})
	.then(() => console.log('MongoDB connected...'))
	.catch(err => console.error(err));

app.use(express.json());

// Rooms API Routes
app.use('/api/rooms', require('./route/api/rooms'));

if (process.env.NODE_ENV === 'production') {
	// Set static folder
	app.use(express.static('build'));

	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
	});
}

module.exports = server;
