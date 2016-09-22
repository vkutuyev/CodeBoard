app.controller('LobbyController', function($scope, $location, socket) {
    //////////////////////////////////////////
    ///            Lobby System            ///
    //////////////////////////////////////////
    //Checks the lobby
    if ($location.url() != '/') {
        var path = $location.url().split('/')[1];
        console.log(path);
        socket.emit('join_lobby', {path: path});
    }
    socket.on('join_lobby_success', function(data) {
        console.log('Success');
        console.log(data);
        $location.url('/');
    })
    socket.on('join_lobby_failure', function(data) {
        console.log('Failure');
        console.log(data);
    })
    //socket emit (checklobby)


    //////////////////////////////////////////
    ///           Scope Variables          ///
    //////////////////////////////////////////
    // Canvas
    $scope.fillStyle    = 'white';
    $scope.strokeStyle  = 'white';
    $scope.lineWidth    = 2;
    // Lobby
    $scope.showMenu = false;

    //////////////////////////////////////////
    ///        Initial Canvas Setup        ///
    //////////////////////////////////////////
    $('#drawBoard').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
    // Create mouse object to track mouse clicks/position
    var mouse = {
        click: false,
        moving: false,
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
    var boundRect   = canvas.getBoundingClientRect();
    // misc context/canvas settings
    context.lineCap     = 'round';
    context.lineJoin    = 'round';
    var dataURL;


    //////////////////////////////////////////
    ///          Canvas Drawing            ///
    //////////////////////////////////////////
    canvas.onmousedown = function(e){
        // Drawing or dragging
        if(!e.shiftKey) { mouse.click  = true; }
        else            { mouse.moving = true; }

        boundRect       = canvas.getBoundingClientRect();
        var posx        = e.clientX - boundRect.left;
        var posy        = e.clientY - boundRect.top;
        mouse.pos_prev  = {x: posx, y: posy};
        context.moveTo(posx, posy);
    }
    canvas.onmousemove = function(e){
        // Grab mouse coordinates
        var posx    = e.clientX - boundRect.left;
        var posy    = e.clientY - boundRect.top;
        mouse.pos   = {x: posx, y: posy};

        if(mouse.click){
            socket.emit('draw_line', {
                line: {
                    coords      : [mouse.pos, mouse.pos_prev],
                    strokeStyle : $scope.strokeStyle,
                    lineWidth   : $scope.lineWidth
                }
            });
            mouse.pos_prev = {x: posx, y: posy};
        }
        else if(mouse.moving){
            // Scroll screen by mouse movement
            var scrollDist = mouse.pos_prev.x - mouse.pos.x;
            document.getElementById('lobbyDiv').scrollLeft += scrollDist;
            mouse.pos_prev = {x: posx, y: posy};
        }
    }
    canvas.onmouseup = function(e){
        mouse.click = false;
        mouse.moving = false;
    };
    // Drawing the line from server
    socket.on('draw_line', function (data) {
        var line = data.line.coords;
        context.beginPath();
        context.moveTo(line[0].x, line[0].y);
        context.lineTo(line[1].x, line[1].y);
        context.strokeStyle = data.line.strokeStyle;
        context.lineWidth = data.line.lineWidth;
        context.stroke();
        context.closePath();
    });


    //////////////////////////////////////////
    ///         Keyboard Keypresses        ///
    //////////////////////////////////////////
    /*
    backspace   : 8
    tab         : 9
    space       : 32
    enter       : 13
    ;           : 186

    alt         : 91
    shift       : 16
    */
    $(document).on('keydown', function(e){
        if(e.shiftKey && !mouse.click){
            // Shift
            $('#drawBoard').css('cursor', 'move');
        }
        if(e.keyCode == 27){
            // Escape
            $('#drawBoard').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
            $scope.strokeStyle = 'white';
            $scope.lineWidth  = 2;
        }
    })

    $(document).on('keyup', function(e) {
        if(e.keyCode == 16){
            // Reset cursor on Shift lift
            $('#drawBoard').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
        }
    })


    //////////////////////////////////////////
    ///       Lobby Helper Functions       ///
    //////////////////////////////////////////
    $scope.menuClicked = function(show) {
        var midHeight = window.innerHeight / 2 + 25;
        if(show){
            $('#sidebar').animate({ left: -300}, 800);
            $('#menuHam').removeClass('fa-arrows-h arrowBG');
            $('#menuHam').addClass('fa-bars fa-2x');
            $('#menuHam').animate({ left: 25, top: 25}, 800);
        }
        else {
            $('#sidebar').animate({ left: 0}, 800);
            $('#menuHam').removeClass('fa-bars fa-2x');
            $('#menuHam').addClass('fa-arrows-h arrowBG');
            $('#menuHam').animate({ left: 300, top: midHeight}, 800);
        }
        $scope.showMenu = !$scope.showMenu;
    }

})
