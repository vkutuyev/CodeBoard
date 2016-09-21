app.controller('LobbyController', function($scope, $location, socket) {

    //////////////////////////////////////////
    ///        Initial Canvas Setup        ///
    //////////////////////////////////////////
    $('#drawBoard').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
    // Create mouse object to track mouse clicks/position
    var mouse = {
        click: false,
        pos: {x:0, y:0},
        pos_prev: false
    };
    // get canvas element and create context
    var canvas      = document.getElementById('drawBoard');
    var context     = canvas.getContext('2d');
    // set canvas size properties
    var width       = window.innerWidth*2;
    var height      = window.innerHeight;
    canvas.width    = width;
    canvas.height   = height;
    var boundRect;
    // misc context/canvas settings
    context.lineCap     = 'round';
    context.lineJoin    = 'round';
    context.strokeStyle = 'white';
    context.fillStyle   = 'white';
    context.lineWidth   = 2;
    var dataURL;


    //////////////////////////////////////////
    ///          Canvas Drawing            ///
    //////////////////////////////////////////
    canvas.onmousedown = function(e){
        mouse.click     = true;
        boundRect       = canvas.getBoundingClientRect();
        var posx        = e.clientX - boundRect.left;
        var posy        = e.clientY - boundRect.top;
        mouse.pos_prev  = {x: posx, y: posy};
        context.closePath();
        context.moveTo(posx, posy);
    }
    canvas.onmousemove = function(e){
        if(mouse.click){
            var posx    = e.clientX - boundRect.left;
            var posy    = e.clientY - boundRect.top;
            mouse.pos   = {x: posx, y: posy};
            socket.emit('draw_line', { path: {line: [mouse.pos, mouse.pos_prev]} });
            mouse.pos_prev = {x: posx, y: posy};
        }
    }
    canvas.onmouseup = function(e){
        mouse.click = false;
        context.stroke();
    };
    // Drawing the line from server
    socket.on('draw_line', function (data) {
        var line = data.line;
        context.beginPath();
        context.moveTo(line[0].x, line[0].y);
        context.lineTo(line[1].x, line[1].y);
        context.stroke();
    });
})
