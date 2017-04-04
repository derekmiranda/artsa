// const serverUrl = 'http://ec2-52-89-83-246.us-west-2.compute.amazonaws.com:3000';
const serverUrl = 'http://localhost:3000';

function sendObj(user, notes) {
  var obj = {
    user: user,
    notes: notes
  }
  return JSON.stringify(obj);
}

$(document).ready(function () {
  let user = window.location.pathname.slice(12);
  let notesUrl = serverUrl + '/notes/' + user;

  $.get("https://api.mlab.com/api/1/databases/excelsior/collections/users?apiKey=Q_zO8p5Jdg_fL7Ux27vBBVCrv37XPyBe",
  function (data) {
    for(let i = 0; i < data.length; i++){
      if (data[i].user === user.toString()){
        $('#notes').val(data[i].notes);
      }
    }
  });

  $('#save').on('click', function (event) {
    let notes = $('#notes').val();
    $.ajax({
      url: serverUrl + '/notes/' + user,
      type: "PUT",
      data: sendObj(user, notes),
      dataType: "json",
      contentType: "application/json"
    });
    $('#saveDate').text('Saved at ' + new Date());
    //window.open(notesUrl);
  });

  $('#leave').on('click', function (event) {
    window.open(notesUrl);
  });
});
