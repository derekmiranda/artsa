// const URL = 'http://ec2-52-89-83-246.us-west-2.compute.amazonaws.com:3000';
const URL = 'http://localhost:3000';
let globalUserNum = 0;

// if (process.env.NODE_ENV === 'test') {
//   writeLocation = `${__dirname}/../test/db.test.json`;
//   //gamesList = require(writeLocation);
// }
function sendObj(user, notes) {
  var obj = {
    user: user,
    notes: notes
  }
  return JSON.stringify(obj);
}

function createUser(userNumber) {
  $.ajax({
    url: URL + '/create',
    type: "POST",
    data: sendObj('user' + userNumber.toString(), ''),
    dataType: "json",
    contentType: "application/json"
  });
}

function getUserNumber() {
  $.get(URL + '/notes/tracker', function (data) {
    globalUserNum = parseInt(data.notes);
  });

}

$(document).ready(function () {
  const roomsContainer = $('#rooms');

  // Check database at intervals for updates in user number
  // setInterval(function () {
  //   getUserNumber();
  //   if (globalUserNum === 1) $('#room1').text('Room 1:  ' + globalUserNum.toString() + ' User');
  //   if (globalUserNum > 1) $('#room1').text('Room 1:  ' + globalUserNum.toString() + ' Users');
  // }, 500);

  // // Go to room
  // roomsContainer.on('click', 'a', function (event) {
  //   let user = event.target.innerHTML.slice(9, 10);
  //   user = parseInt(user) + 1;

  //   // // create or update tracker to keep track of numbers of users
  //   // $.ajax({
  //   //   url: URL + '/notes/tracker',
  //   //   type: "PUT",
  //   //   data: sendObj('tracker', user),
  //   //   dataType: "json",
  //   //   contentType: "application/json"
  //   // });

  //   if (user === 1) $('#room1').text('Room 1:  ' + user.toString() + ' User');
  //   if (user > 1) $('#room1').text('Room 1:  ' + user.toString() + ' Users');
  //   let roomUrl = URL + "/rooms/room1" + 'user' + user.toString();
  //   createUser(user);

  //   window.open(roomUrl);
  // });

  const roomDivs = [];
  const roomNameInput = $('input#room-name');
  createRoomsSocket();

  function createRoomsSocket() {

    // Rooms socket namespace
    const roomsSocket = io('/rooms');

    // Adds rooms previously before going to home page
    function addExistingRooms(rooms) {
      rooms.forEach(room => {
        const roomDiv = createRoomDiv(room.name, room.clients.length);
        roomDivs.push(roomDiv);
        roomsContainer.append(roomDiv);
      });
    }

    roomsSocket.on('connect', () => {
      roomsSocket.emit('addExisting', addExistingRooms);
    });

    // append room div to UI
    function appendRoomDiv(roomName) {
      const newRoomDiv = createRoomDiv(roomName);
      roomDivs.push(newRoomDiv);
      roomsContainer.append(newRoomDiv);
    }

    // Add new room to room list
    $('form#create-room').submit((event, elem) => {
      event.preventDefault();
      const roomNameVal = roomNameInput.val().trim();

      // clear input box
      roomNameInput.val('');

      if (!roomNameVal) return false;

      roomsSocket.emit('createRoom', roomNameVal, appendRoomDiv);
    });

    // add room divs on valid name submit
    roomsSocket.on('addRoomDiv', appendRoomDiv);

    function updateUserCount(roomName, numUsers) {
      // get roomName span tag w/ roomName inside
      const roomNameTag = $(`span.roomName:contains(${roomName})`);
      console.log('Room name tag: '+roomNameTag);

      // get sibling of roomNameTag to get numUsersTag
      const numUsersTag = roomNameTag.siblings('span.numUsers');

      // change num w/in numUsersTag
      console.log('Num users: '+numUsers);
      numUsersTag.text(numUsers);
  };

    roomsSocket.on('updateUserCount', updateUserCount);
  }

  function createRoomDiv(roomName, numUsers = 0) {
    const newLinkDiv = $(
      `<div class='link-div well'>
          <a href="./rooms/${roomName}">
          </a>
        </div>`
    );
    newLinkDiv.find('a').append(
      `<span class='roomName'>${roomName}</span>: 
      <span class='numUsers'>${numUsers}</span> users`
    );
    return newLinkDiv;
  }

});
