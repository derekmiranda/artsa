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
// app.delete('/:name', userController.deleteUser);

// used to store name and list of connected clients in a room
function Room(name, password) {
  this.name = name;
  this.clients = [];
  this.password = password;
}

// Rooms namespace: save and show available rooms to users
const rooms = [];
const passwords = [];
const roomsNsp = io.of('/rooms');

roomsNsp.on('connection', (roomsSocket) => {
  console.log('Connection to lobby');

  // adds room to memory
  roomsSocket.on('createRoom', (roomName, roomPassword, cb) => {
    // check if room already there
    if (rooms.some(room => room.name === roomName)) {
      return;
    }
    passwords.push({roomName: roomPassword})
    console.log("room password is", roomPassword.length)

    // add new room to rooms array
    const newRoom = new Room(roomName, roomPassword);
    rooms.push(newRoom);

    // call cb on roomName
    // in this case, add room div to original emitting client (home.js)
    cb(newRoom.name);
    roomsSocket.broadcast.emit('addRoomDiv', newRoom.name);
  });

  // gives new connection current rooms
  roomsSocket.on('addExisting', (cb) => {
    console.log('Adding current rooms to new connection');
    cb(rooms);
  })

  // stores brush stroke data for redrawing on late clients
  // const storedStrokeData = [];
  const storedStrokeData = {};

  function onDrawConnection(socket) {
    // storing room name
    let storedRoomName;

    // Join room
    socket.on('room', (roomName, restore) => {
      storedRoomName = roomName;

      // search for room w/in rooms and push new client id
      const emittingRoom = rooms.find(room => room.name === roomName);

      if (
        // stop function early if no emitting room found
        // prevent errors caused by nodemon server restart
        !emittingRoom ||
        // or if socket.id already pushed,
        // to prevent client id's from being pushed twice
        // TODO: due to weird bug where client id gets pushed twice
        // on commit a2555e87d3a70b55c84fcebdec790726426908e6
        emittingRoom.clients.indexOf(socket.id) > -1
      ) return;
      emittingRoom.clients.push(socket.id);
      socket.join(roomName);

      // send previous stroke data to new clients
      const prevRoomStrokes = storedStrokeData[roomName];
      if (prevRoomStrokes) restore(prevRoomStrokes);

      // tell home.js to update num users for that room
      roomsNsp.emit('updateUserCount', emittingRoom.name, emittingRoom.clients.length);
    });

    //Waits for drawing emit from canvas.js THEN broadcasts & emits the data to socket in canvas.js
    socket.on('drawing', (roomName, data) => {
      // make new array for roomName initialized with first data point
      if (!storedStrokeData[roomName]) {
        storedStrokeData[roomName] = [data];
      } else {
        // store brush strokes
        storedStrokeData[roomName].push(data);
      }
      socket.broadcast.to(roomName).emit('drawing', data);
    });

    //Waits for cleared emit from canvas.js THEN broadcasts & emits data to socket in canvas.js
    socket.on('cleared', (roomName, data) => socket.broadcast.to(roomName).emit('clearCanvas', data));

    // save current image for later clients
    socket.on('saveImageData', (imageData) => {
      storedImageData = imageData;
    });

    // Disconnect event
    socket.on('disconnect', () => {
      // no stored room name or empty rooms array
      if (!storedRoomName || !rooms.length) return;

      // search for room w/in rooms and remove id

      // index of id to remove
      const targetRoom = rooms.find(room => room.name === storedRoomName);

      // if can't find target room, exit
      if (!targetRoom) return;

      const disconnIdx = targetRoom.clients.indexOf(socket.id);

      // return if can't find socket.id in targetRoom clients
      // TODO: part of bug where client id gets pushed twice
      // inside Room.client array
      if (disconnIdx < 0) return;

      // remove id from room
      targetRoom.clients.splice(disconnIdx, 1);

      // tell home.js to update num users for that room
      roomsNsp.emit('updateUserCount', targetRoom.name, targetRoom.clients.length);
    });
  }

  //On initial server connection, socket passed to onDrawConnection function.
  const drawNsp = io.of('/draw');
  drawNsp.on('connection', onDrawConnection);


});

http.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));
