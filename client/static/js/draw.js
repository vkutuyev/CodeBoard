var colCount = 0;
var color = ['blue', 'red', 'green', 'yellow'];

$('button').on('click', function(){
    switch(this.id){
        case 'color1':
            console.log('color1');
            colCount=0
            break;
        case 'color2':
            console.log('color2');
            colCount=1
            break;
        case 'color3':
            console.log('color3');
            colCount=2
            break;
        case 'color4':
            console.log('color4');
            colCount=3
            break;
    }
});

document.addEventListener("DOMContentLoaded", function() {
    var mouse = {
        click: false,
        move: false,
        pos: {x:0, y:0},
        pos_prev: false
    };

    // get canvas element and create context
    var canvas  = document.getElementById('drawing');
    var context = canvas.getContext('2d');
    var width   = window.innerWidth - 100;
    var height  = window.innerHeight - 100;
    var socket  = io.connect();

    // set canvas to full browser width/height
    canvas.width = width;
    canvas.height = height;

    // register mouse event handlers
    canvas.onmousedown = function(e){ mouse.click = true; };
    canvas.onmouseup = function(e){ mouse.click = false; };

    canvas.onmousemove = function(e) {
        // normalize mouse position to range 0.0 - 1.0
        mouse.pos.x = e.clientX / width;
        mouse.pos.y = e.clientY / height;
        mouse.move = true;
    };

    // draw line received from server
    socket.on('draw_line', function (data) {
        var line = data.line;
        context.beginPath();
        context.moveTo(line[0].x * width, line[0].y * height);
        context.lineTo(line[1].x * width, line[1].y * height);
        context.strokeStyle = color[colCount];
        context.stroke();
    });

    // main loop, running every 25ms
    function mainLoop() {
        // check if the user is drawing
        if (mouse.click && mouse.move && mouse.pos_prev) {
            // send line to to the server
            socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev ] });
            mouse.move = false;
        }
        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
        setTimeout(mainLoop, 50);
    }
    mainLoop();

    // reset button to clear canvas
    $('#resetbtn').on('click', function(){
        console.log("reset canvas");
        canvas.width = width;
    });


});
