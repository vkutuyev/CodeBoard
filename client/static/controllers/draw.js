app.controller('DrawController', function($scope, $location, socket) {
    var roomId = $location.$$path.substr(1);
    socket.emit('DrawController', {lobby: roomId});
    // Block default right-click menu
    document.addEventListener("contextmenu", function(e){
        e.preventDefault();
    }, false);
    $('div.draw').ready(function() {
        console.log('Canvas Ready');
        // Create mouse object to track mouse clicks/position
        var mouse = {
            click: false,
            move: false,
            pos: {x:0, y:0},
            pos_prev: false
        };
        // get canvas element and create context
        var canvas  = document.getElementById('drawing');
        var context = canvas.getContext('2d');
        var width   = window.innerWidth;
        var height  = window.innerHeight;
        // set canvas to full browser width/height
        canvas.width = width;
        canvas.height = height;
        // register mouse event handlers
        canvas.onmousedown = function(e){
            if(e.which==1) {mouse.click = true; }
            if(e.which==3) {
                var menu = document.getElementById('rightmenu');
                menu.hidden = !menu.hidden;
                menu.style.top = e.clientY + 'px';
                menu.style.left = e.clientX + 'px';
            }
        };
        canvas.onmouseup = function(e){
            if(e.which==1){ mouse.click = false; }
        };
        canvas.onmousemove = function(e) {
            // normalize mouse position to range 0.0 - 1.0
            mouse.pos.x = e.clientX / width;
            mouse.pos.y = e.clientY / height;
            mouse.move = true;
        };
        // draw line received from server
        socket.on('test', function() {console.log('test')})
        socket.on('draw_line', function (data) {
            // console.log('data');
            var line = data.line;
            context.beginPath();
            context.moveTo(line[0].x * width, line[0].y * height);
            context.lineTo(line[1].x * width, line[1].y * height);
            context.strokeStyle = data.lineColor;
            context.lineWidth = data.penWidth;
            context.stroke();
        });
        // main loop, running every 25ms
        function mainLoop() {
            // check if the user is drawing
            if (mouse.click && mouse.move && mouse.pos_prev) {
                // send line to to the server
                socket.emit('draw_line', { path:{ line: [ mouse.pos, mouse.pos_prev ], lineColor: context.strokeStyle, penWidth: context.lineWidth }, lobby: roomId});
                mouse.move = false;
            }
            mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
            setTimeout(mainLoop, 25);
        }
        mainLoop();
        // reset function to clear canvas
        $('#resetbtn').on('click', function(){
            console.log("reset canvas");
            socket.emit('clear_board', {lobby: roomId});
        });
        socket.on('cleared', function(){
            canvas.width = canvas.width;
        });
        // Pen colors/sizes, reset buttons
        $('button').on('click', function(){
            if(this.id == 'color1'){ context.strokeStyle = 'blue'; }
            else if(this.id == 'color2'){ context.strokeStyle = 'red'; }
            else if(this.id == 'color3'){ context.strokeStyle = 'green'; }
            else if(this.id == 'color4'){ context.strokeStyle = 'yellow'; }
            else if(this.id == 'color5'){ context.strokeStyle = 'black'; }
            else if(this.id == 'eraser'){ context.strokeStyle = 'white'; }
            else if(this.id == 'width1'){
                context.lineWidth = 0.5;
                if(context.strokeStyle == '#ffffff'){ context.lineWidth = 6; }
            }
            else if(this.id == 'width2'){
                context.lineWidth = 2;
                if(context.strokeStyle == '#ffffff'){ context.lineWidth = 10; }
            }
            else if(this.id == 'width3'){
                context.lineWidth = 5;
                if(context.strokeStyle == '#ffffff'){ context.lineWidth = 25; }
            }
            // Eraser size reset
            if(context.strokeStyle != '#ffffff'){
                if(context.lineWidth > 5){
                    context.lineWidth = 5;
                }
            }
        }); // End of $button.on click
    })  // End of div.draw ready
})
