const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const userController = require('./userController');

const mongoUrl = 'mongodb://joeljoel:1music@ds149820.mlab.com:49820/excelsior';
const PORT = 3000;

mongoose.connect(mongoUrl, function () {
  // WARNING: every connection will drop database, comment this out when ready to deploy
  // mongoose.connection.db.dropDatabase();
});
mongoose.connection.once('open', () => {
  console.log('Connected to Database');
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res, next) => {
  res.sendFile(__dirname + '/public/home/home.html');
})

// check the database
app.get('/check', userController.getAllUsers);

app.get('/rooms/:room', (req, res) => {
  res.sendFile(__dirname + '/public/host/host.html');
});

// click event creates user from req.body (obj)
app.post('/create', userController.createUser);

// client side grabs username from url to generate this link to reach this route
app.get('/notes/:user', userController.getUser);

app.put('/notes/:user', userController.updateUser);

// // Delete a user from the database
// // localhost://3000/user/"name"
// app.delete('/:name', userController.deleteUser);

function onDrawConnection(socket) {
  console.log('Drawing socket connected');
  // Join room
  socket.on('room', (room) => {
    console.log('Joining ' + room);
    socket.join(room)
  });

  //Waits for drawing emit from main.js THEN broadcasts & emits the data to socket in main.js (line 32)
  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));

  //Waits for cleared emit from canvas.html THEN broadcasts & emits data to socket in canvas.html (line 35)
  socket.on('cleared', (data) => socket.broadcast.emit('clearCanvas', data));

}

//On initial server connection, socket passed to onDrawConnection function.
const drawNsp = io.of('/draw');
drawNsp.on('connection', onDrawConnection);

// Rooms namespace: save and show available rooms to users
const rooms = [];
const roomsNsp = io.of('/rooms');

roomsNsp.on('connection', (roomsSocket) => {
  console.log('Connection to lobby');

  // adds room to memory
  roomsSocket.on('createRoom', (roomName, cb) => {
    // check if room already there
    if (rooms.indexOf(roomName) > -1) {
      console.log('Room name already added');
      return;
    }

    rooms.push(roomName);

    // call cb on roomName
    // in this case, add room div to original emitting client (home.js)
    cb(roomName);
    roomsSocket.broadcast.emit('addRoomDiv', roomName);
  });

  // gives new connection current rooms
  roomsSocket.on('addExisting', (cb) => {
    console.log('Adding current rooms to new connection');
    cb(rooms);
  })
});

http.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));
