app.controller('LobbyController', function($scope, $location, socket) {
    //////////////////////////////////////////
    ///           Scope Variables          ///
    //////////////////////////////////////////
    // Canvas
    $scope.fillStyle    = 'white';
    $scope.strokeStyle  = 'white';
    $scope.lineWidth    = 2;
    // Sidebar
    $scope.menuOpen     = false;
    $scope.clicked      = false;
    $scope.dragging     = false;

    //////////////////////////////////////////
    ///            Lobby System            ///
    //////////////////////////////////////////
    //Checks the lobby
    $scope.currentLobby
    if ($location.url() != '/') {
        var path = $location.url().split('/')[1];
        console.log(path);
        socket.emit('join_lobby', {path: path});
    }
    socket.on('create_lobby_status', function(data) {
        if (data.success) {
            socket.emit('join_lobby', {path: data.path})
        } else {
            console.log('Creating lobby failure');
        }
    })
    socket.on('join_lobby_status', function(data) {
        if (data.success) {
            console.log('Success');
            console.log(data);
            $location.url('/');
            $scope.currentLobby = data.lobby_data.id
        } else {
            console.log('Failure');
            console.log(data);
        }
    })
    $scope.lobby_name = 'HELLLOOOO'
    $scope.createLobby = function() {
        var path = $scope.lobby_name;
        console.log('Creating lobby', path);
        socket.emit('create_lobby', {path: path});
    }
     //socket emit (checklobby)

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
        var pos         = mouseCoords(e);
        mouse.pos_prev  = pos;
        context.moveTo(pos.x, pos.y);
    }
    canvas.onmousemove = function(e){
        mouse.pos = mouseCoords(e);

        if(mouse.click){
            socket.emit('draw_line', {
                line: {
                    coords      : [mouse.pos, mouse.pos_prev],
                    strokeStyle : $scope.strokeStyle,
                    lineWidth   : $scope.lineWidth
                }
            });
        }
        else if(mouse.moving){
            // Scroll screen by mouse movement
            var scrollDist = mouse.pos_prev.x - mouse.pos.x;
            document.getElementById('lobbyDiv').scrollLeft += scrollDist;
        }
        mouse.pos_prev = mouse.pos;
    }
    // Drawing the line from server
    socket.on('draw_line', function (data) {
        var line = data.line.coords;
        context.beginPath();
        context.moveTo(line[0].x, line[0].y);
        context.lineTo(line[1].x, line[1].y);
        context.strokeStyle = data.line.strokeStyle;
        context.lineWidth   = data.line.lineWidth;
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
            $('#drawBoard').css({'cursor':"url('../img/cursor/marker_"+$scope.strokeStyle+"_sm.png'), auto"});
        }
    })


    //////////////////////////////////////////
    ///         UI Key/mouse events        ///
    //////////////////////////////////////////
    // Side menu hiding/sliding
    $('#menuHam').on('mousedown', function(e) {
        if($scope.menuOpen){
            $scope.clicked = true;
        }
    })
    $(document).on('mousemove', function(e){
        if($scope.menuOpen && $scope.clicked){
            $scope.dragging = true;
            if(e.pageX > 310){
                $('#menuHam').css('left', e.pageX-20);
                $('#sidebar').css('width', e.pageX-10);
            }
        }
    })
    $('#menuHam').on('mouseup', function(e){
        if(!$scope.menuOpen){
            $('#sidebar').animate({ left: 0}, 800);
            $('#menuHam').removeClass('fa-bars fa-2x');
            $('#menuHam').addClass('fa-arrows-h arrowBG');
            $('#menuHam').animate({ left: 295, top: 0}, 800);
            $scope.menuOpen = true;
        }
        else{
            if($scope.clicked && !$scope.dragging){
                $('#sidebar').animate({ left: -300, width: 300}, 600);
                $('#menuHam').removeClass('fa-arrows-h arrowBG');
                $('#menuHam').addClass('fa-bars fa-2x');
                $('#menuHam').animate({ left: 25, top: 25}, 600);
                $scope.menuOpen = false;
            }
        }
    })

    //////////////////////////////////////////
    ///            Mouseup Resets          ///
    //////////////////////////////////////////
    $(document).on('mouseup', function(e){
        $scope.clicked = false;
        $scope.dragging = false;
        mouse.click = false;
        mouse.moving = false;
    })


    //////////////////////////////////////////
    ///           Helper Functions         ///
    //////////////////////////////////////////
    var mouseCoords = function(e) {
        var posx    = e.clientX - boundRect.left;
        var posy    = e.clientY - boundRect.top;
        return { x: posx, y: posy };
    }

})
