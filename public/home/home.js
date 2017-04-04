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

  // Check database at intervals for updates in user number
  setInterval(function () {
    getUserNumber();
    if (globalUserNum === 1) $('#room1').text('Room 1:  ' + globalUserNum.toString() + ' User');
    if (globalUserNum > 1) $('#room1').text('Room 1:  ' + globalUserNum.toString() + ' Users');
  }, 500);

  $('#rooms').on('click', 'a', function (event) {
    let user = event.target.innerHTML.slice(9, 10);
    user = parseInt(user) + 1;

    // create or update tracker to keep track of numbers of users
    $.ajax({
      url: URL + '/notes/tracker',
      type: "PUT",
      data: sendObj('tracker', user),
      dataType: "json",
      contentType: "application/json"
    });

    if (user === 1) $('#room1').text('Room 1:  ' + user.toString() + ' User');
    if (user > 1) $('#room1').text('Room 1:  ' + user.toString() + ' Users');
    let roomUrl = URL + "/rooms/room1" + 'user' + user.toString();
    createUser(user);
    window.open(roomUrl);
  });

});