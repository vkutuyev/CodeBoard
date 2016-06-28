app.controller('DrawController', function($scope, $location) {
    var roomId = $location.$$path.substr(1);

    document.addEventListener("contextmenu", function(e){
        e.preventDefault();
    }, false);

    $('div.draw').ready(function() {
        console.log('Canvas Ready');
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
        var socket  = io.connect();

        // set canvas to full browser width/height
        canvas.width = width;
        canvas.height = height;

        // register mouse event handlers
        canvas.onmousedown = function(e){
            if(e.which==1) {mouse.click = true; }
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
        socket.on('draw_line', function (data) {
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
                socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev ], lineColor: context.strokeStyle, penWidth: context.lineWidth });
                mouse.move = false;
            }
            mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
            setTimeout(mainLoop, 25);
        }
        mainLoop();


        $('#resetbtn').on('click', function(){      // reset function to clear canvas
            console.log("reset canvas");
            socket.emit('clear_board');
        });

        socket.on('cleared', function(){
            canvas.width = canvas.width;
        });

        $('button').on('click', function(){             // Pen colors/sizes, reset buttons
            switch(this.id){
                case 'color1':
                context.strokeStyle = 'blue'
                break;
                case 'color2':
                context.strokeStyle = 'red'
                break;
                case 'color3':
                context.strokeStyle = 'green'
                break;
                case 'color4':
                context.strokeStyle = 'yellow'
                break;
                case 'color5':
                context.strokeStyle = 'black'
                break;
                case 'width1':
                context.lineWidth = 0.5
                break;
                case 'width2':
                context.lineWidth = 2
                break;
                case 'width3':
                context.lineWidth = 5
                break;
            }
        });
    })
})