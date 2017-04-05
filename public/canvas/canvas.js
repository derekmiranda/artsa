'use strict';

// const roomName - the room name for socket.io
// sent by server then passed
// thru host.handlebars
// then canvas.handlebars

//Entire document contained in an anonymous function that calls itself
(() => {

  //color pick
  $("#yoyo").spectrum({
  color: "#f00"
  })

  //extracting numbers from color picker values
  function grabNums(str){
    let finalValues = [];
    let currentNum = [];
    let numbers="0123456789".split("")

    for(let i=0; i < str.length; i++){
      if (numbers.indexOf(str[i]) !== -1){
        currentNum.push(str[i])
      } else if (currentNum.length >= 1){
        currentNum.join("");
        finalValues.push(currentNum);
        currentNum = [];
      }
    }

    return finalValues.map(function(e){
      return Number(e.join(""));
    });
  }

  //color picker value coverter
  function hsvToRgb(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if(s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;

        case 1:
            r = q;
            g = v;
            b = p;
            break;

        case 2:
            r = p;
            g = v;
            b = t;
            break;

        case 3:
            r = p;
            g = q;
            b = v;
            break;

        case 4:
            r = t;
            g = p;
            b = v;
            break;

        default: // case 5:
            r = v;
            g = p;
            b = q;
    }

    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}

function rgbString(arr){
  return "rgb(" + arr[0].toString() + ", " + arr[1].toString() + ", " + arr[2].toString() + ")";
}


  //Creates the socket instance, canvas, colors, and 2d context of the canvas
  const socket = io('/draw');
  const canvas = document.getElementsByClassName('whiteboard')[0];
  const colors = document.getElementsByClassName('color');
  const context = canvas.getContext('2d');
  const url = new URL(window.location);

  // connect confirm
  socket.on('connect', () => {
    socket.emit('room', roomName || 'default');
  });

  let current = {
    color: 'black',
  };

  //Flag variable initialized at false & used to notify if drawing is occurring
  let drawing = false;

  //Event listeners for clicks, click releases, mouse going off canvas, and movement of mouse
  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  //Creates a click event listener for each color div written in canvas.html
  // for (let i = 0; i < colors.length; i++) {
  //
  //   colors[i].addEventListener('click', onColorUpdate, false);
  // }



  //Socket picks up the emit from socket (line 10) in server.js and passes the data to onDrawingEvent
  socket.on('drawing', onDrawingEvent);

  //Adds an event listener if the window is resized
  window.addEventListener('resize', onResize, false);
  onResize();

  //Responsible for drawing the line, parameters received from onMouseUp or onMouseMove or onDrawingEvent
  function drawLine(x0, y0, x1, y1, color, emit) {
    context.beginPath();

    //Moves the path to the specified point in the canvas, without creating a line
    context.moveTo(x0, y0);

    //Adds a new point and creates a line TO that point FROM the last specified point
    context.lineTo(x1, y1);

    //DICTATES THE COLOR OF STROKE
    let colorVal = grabNums($("#yoyo").val())
    context.strokeStyle = rgbString(hsvToRgb(colorVal[0], colorVal[1], colorVal[2]))

    //Checks if client has selected the eraser and makes lineWidth larger for faster erasing
    if (context.strokeStyle == '#ffffff') {
      context.lineWidth = 100;
    } else {
      context.lineWidth = 5;
    }



    //Actually draws the path you have defined with all those moveTo() and lineTo() methods
    context.stroke();

    context.closePath();

    //Checks if emit from socket has ended & subsequently ends function
    if (!emit) { return; }
    let w = canvas.width;
    let h = canvas.height;

    //Emits the the beginning of drawing with the object of values as the callback
    socket.emit('drawing', roomName, {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

  //When mouse is clicked handler
  function onMouseDown(e) {
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY;
  }

  //resets flag variable & calls drawline function with values of prev position, new position & color
  function onMouseUp(e) {
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
  }

  //Draws line based on movement of mouse on x & y axis
  function onMouseMove(e) {
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  //Retrieves the specific color element from the DOM & sets current variable to new color value
  function onColorUpdate(e) {
    current.color = e.target.className.split(' ')[1];
  }

  //This limits the number of events per second. Functional without it, but limits burdening the server with updates
  function throttle(callback, delay) {
    let previousCall = new Date().getTime();
    return function () {
      let time = new Date().getTime();
      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  //Takes in data from socket & sets height/width of canvas & draws line based off data received
  function onDrawingEvent(data) {
    let w = canvas.width;
    let h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  //Function to adjust canvas to size of window
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }


  //Triggered off Clear Canvas button click
  function clearCanvas() {
    let canvas = document.getElementsByClassName('whiteboard')[0];
    let context = canvas.getContext('2d');

    //Clears the canvas content
    context.clearRect(0, 0, canvas.width, canvas.height);

    //Emits 'cleared' to server.js (line 13)
    socket.emit('cleared', roomName, {
      Darrick: 'Is the Best!',
    });
  }

  function saveCanvas() {
    var canvas = document.getElementsByClassName('whiteboard')[0]; console.log(!!canvas);
    var fullQuality = canvas.toDataURL();
    window.open(fullQuality);
  }

  //Accepts mass emit from line 14 of server.js to clear out it's context
  socket.on('clearCanvas', function (data) {
    let canvas = document.getElementsByClassName('whiteboard')[0];
    let context = canvas.getContext('2d');

    //Clears the canvas content
    context.clearRect(0, 0, canvas.width, canvas.height);
  });

  // clearCanvas click handler
  const clearCanvasBtn = document.getElementById('clearCanvas');
  clearCanvasBtn.addEventListener('click', clearCanvas);

  // saveCanvas click handler
  const saveCanvasBtn = document.getElementById('saveCanvas');
  saveCanvasBtn.addEventListener('click', saveCanvas);
})();
