'use strict';

// const roomName - the room name for socket.io
// sent by server then passed
// thru host.handlebars
// then canvas.handlebars

//Entire document contained in an anonymous function that calls itself
(() => {

  //Creates the socket instance, canvas, colors, and 2d context of the canvas
  const socket = io('/draw');
  const canvas = document.getElementsByClassName('whiteboard')[0];
  const context = canvas.getContext('2d');

  //color pick
  $("#yoyo").spectrum({
    color: "#f00"
  });

  // add click event to color picker to reenable drawing
  $('.sp-replacer.sp-light').click(() => {
    context.globalCompositeOperation = "source-over";
  });

  //extracting numbers from color picker values
  function grabNums(str) {
    let finalValues = [];
    let currentNum = [];
    let numbers = "0123456789".split("")

    for (let i = 0; i < str.length; i++) {
      if (numbers.indexOf(str[i]) !== -1) {
        currentNum.push(str[i])
      } else if (currentNum.length >= 1) {
        currentNum.join("");
        finalValues.push(currentNum);
        currentNum = [];
      }
    }

    return finalValues.map(function (e) {
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

    if (s == 0) {
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

    switch (i) {
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

  function rgbString(arr) {
    return "rgb(" + arr[0].toString() + ", " + arr[1].toString() + ", " + arr[2].toString() + ")";
  }

  function getCurrentColor() {
    //DICTATES THE COLOR OF STROKE
    let colorVal = grabNums($("#yoyo").val());
    return rgbString(hsvToRgb(colorVal[0], colorVal[1], colorVal[2]))
  }

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

  //Event listeners for touch, touch releases, touch going off canvas, and movement of touch
  canvas.addEventListener('touchstart', handleStart, false)
  canvas.addEventListener('touchend', handleEnd, false)
  canvas.addEventListener("touchcancel", handleCancel, false);
  canvas.addEventListener("touchmove", handleMove, false)

  var ongoingTouches = [];
  function copyTouch(touch) {
    return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
  }

  function ongoingTouchIndexById(idToFind) {
    for (var i = 0; i < ongoingTouches.length; i++) {
      var id = ongoingTouches[i].identifier;

      if (id == idToFind) {
        return i;
      }
    }
    return -1;    // not found
  }


  function handleStart(evt) {
    evt.preventDefault();
    console.log("touchstart.");
    var el = document.getElementsByTagName("canvas")[0];
    var ctx = el.getContext("2d");
    var touches = evt.changedTouches;

    for (var i = 0; i < touches.length; i++) {
      console.log("touchstart:" + i + "...");
      ongoingTouches.push(copyTouch(touches[i]));
      //var color = colorForTouch(touches[i]);
      ctx.beginPath();
      ctx.arc(touches[i].pageX, touches[i].pageY, 4, 0, 2 * Math.PI, false);  // a circle at the start
      ctx.fillStyle = getCurrentColor();
      ctx.fill();
      console.log("touchstart:" + i + ".");
    }
  }

  function handleMove(evt) {
    evt.preventDefault();
    var el = document.getElementsByTagName("canvas")[0];
    var ctx = el.getContext("2d");
    var touches = evt.changedTouches;

    for (var i = 0; i < touches.length; i++) {
      //var color = colorForTouch(touches[i]);
      var idx = ongoingTouchIndexById(touches[i].identifier);

      if (idx >= 0) {
        console.log("continuing touch " + idx);
        ctx.beginPath();
        console.log("ctx.moveTo(" + ongoingTouches[idx].pageX + ", " + ongoingTouches[idx].pageY + ");");
        ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
        console.log("ctx.lineTo(" + touches[i].pageX + ", " + touches[i].pageY + ");");
        ctx.lineTo(touches[i].pageX, touches[i].pageY);
        ctx.lineWidth = 5;
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = getCurrentColor();
        ctx.stroke();

        ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        console.log(".");
      } else {
        console.log("can't figure out which touch to continue");
      }
    }
  }

  function handleEnd(evt) {
    evt.preventDefault();
    console.log("touchend");
    var el = document.getElementsByTagName("canvas")[0];
    var ctx = el.getContext("2d");
    var touches = evt.changedTouches;

    for (var i = 0; i < touches.length; i++) {
      //var color = colorForTouch(touches[i]);
      var idx = ongoingTouchIndexById(touches[i].identifier);

      if (idx >= 0) {
        ctx.lineWidth = 4;
        ctx.fillStyle = getCurrentColor();
        ctx.beginPath();
        ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
        ctx.lineTo(touches[i].pageX, touches[i].pageY);
        ctx.fillRect(touches[i].pageX - 4, touches[i].pageY - 4, 8, 8);  // and a square at the end
        ongoingTouches.splice(idx, 1);  // remove it; we're done
      } else {
        console.log("can't figure out which touch to end");
      }
    }
  }

  function handleCancel(evt) {
    evt.preventDefault();
    console.log("touchcancel.");
    var touches = evt.changedTouches;

    for (var i = 0; i < touches.length; i++) {
      var idx = ongoingTouchIndexById(touches[i].identifier);
      ongoingTouches.splice(idx, 1);  // remove it; we're done
    }
  }

  //Creates a click event listener for eraser
  const eraser = document.getElementById('eraser');
  eraser.addEventListener('click', onEraser, false);
  eraser.addEventListener('touchstart', onEraser, false)
  eraser.addEventListener('touchmove', onEraser, false)

  //eraser.addEventListener('touchstart', onEraser, false)
  //Retrieves the specific color element from the DOM & sets current variable to new color value
  function onEraser(e) {
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = 'transparent black';
  }

  //Socket picks up the emit from socket (line 10) in server.js and passes the data to onDrawingEvent
  socket.on('drawing', onDrawingEvent);

  //Adds an event listener if the window is resized
  window.addEventListener('resize', onResize, false);
  onResize();

  //Responsible for drawing the line, parameters received from onMouseUp or onMouseMove or onDrawingEvent
  function drawLine(x0, y0, x1, y1, color, emit) {
    context.beginPath();

    // round line strokes
    context.lineCap = 'round';

    //Moves the path to the specified point in the canvas, without creating a line
    context.moveTo(x0, y0);

    //Adds a new point and creates a line TO that point FROM the last specified point
    context.lineTo(x1, y1);

    // brush color
    context.strokeStyle = color;

    // brush width
    // bigger if erasing
    if (context.globalCompositeOperation === 'destination-out') {
      context.lineWidth = 10;
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
    drawLine(current.x, current.y, e.clientX, e.clientY, getCurrentColor(), true);
  }

  //Draws line based on movement of mouse on x & y axis
  function onMouseMove(e) {
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, getCurrentColor(), true);
    current.x = e.clientX;
    current.y = e.clientY;
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
    //Clears the canvas content
    context.clearRect(0, 0, canvas.width, canvas.height);

    //Emits 'cleared' to server.js (line 13)
    socket.emit('cleared', roomName, {
      Darrick: 'Is the Best!',
    });
  }

  function saveCanvas() {
    console.log(!!canvas);
    var fullQuality = canvas.toDataURL();
    window.open(fullQuality);
  }

  //Accepts mass emit from line 14 of server.js to clear out it's context
  socket.on('clearCanvas', function (data) {
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
