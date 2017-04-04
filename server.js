const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const exphbs = require('express-handlebars');
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

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res, next) => {
  res.sendFile(__dirname + '/public/home/home.html');
})

// check the database
app.get('/check', userController.getAllUsers);

app.get('/rooms/:room', (req, res) => {
  const roomName = req.params.room;
  res.render(__dirname + '/public/host/host.handlebars', { roomName });
});

// get isolated canvas for a specific room
app.get('/canvas/:room', (req, res) => {
  const roomName = req.params.room;
  res.render(__dirname + '/public/canvas/canvas.handlebars', { roomName });
})

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

  // Disconnect event
  socket.on('disconnect', (roomName) => {
    // search for room w/in rooms and increment numUsers
    const emittingRoom = rooms.find(room => room.name === roomName);

    if (emittingRoom) {
      emittingRoom.numUsers -= 1;
      console.log(`Num of users in ${emittingRoom.name}: ${emittingRoom.numUsers}`);
    }
  })

  // Join room
  socket.on('room', (roomName) => {
    console.log('Someone joined ' + roomName);

    // search for room w/in rooms and increment numUsers
    const emittingRoom = rooms.find(room => room.name === roomName);

    if (emittingRoom) {
      emittingRoom.numUsers += 1;
      console.log(`Num of users in ${emittingRoom.name}: ${emittingRoom.numUsers}`);
    }

    socket.join(roomName);
  });

  //Waits for drawing emit from canvas.js THEN broadcasts & emits the data to socket in canvas.js
  socket.on('drawing', (roomName, data) => socket.broadcast.to(roomName).emit('drawing', data));

  //Waits for cleared emit from canvas.js THEN broadcasts & emits data to socket in canvas.js
  socket.on('cleared', (roomName, data) => socket.broadcast.to(roomName).emit('clearCanvas', data));

}

//On initial server connection, socket passed to onDrawConnection function.
const drawNsp = io.of('/draw');
drawNsp.on('connection', onDrawConnection);

// Rooms namespace: save and show available rooms to users
function Room(name) {
  this.name = name;
  this.numUsers = 0;
}

const rooms = [];
const roomsNsp = io.of('/rooms');

roomsNsp.on('connection', (roomsSocket) => {
  console.log('Connection to lobby');

  // adds room to memory
  roomsSocket.on('createRoom', (roomName, cb) => {
    // check if room already there
    if (rooms.some(room => room.name === roomName)) {
      return;
    }

    const newRoom = new Room(roomName);
    rooms.push(newRoom);

    // call cb on roomName
    // in this case, add room div to original emitting client (home.js)
    cb(newRoom.name);
    roomsSocket.broadcast.emit('addRoomDiv', newRoom.name);
  });

  // gives new connection current rooms
  roomsSocket.on('addExisting', (cb) => {
    console.log('Adding current rooms to new connection');
    cb(rooms.map(room => room.name));
  })
});

http.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));
