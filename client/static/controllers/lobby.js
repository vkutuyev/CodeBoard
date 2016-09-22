app.controller('LobbyController', function($scope, $location, socket) {
    //////////////////////////////////////////
    ///           Scope Variables          ///
    //////////////////////////////////////////
    // Canvas
    $scope.fillStyle    = 'white';
    $scope.strokeStyle  = 'white';
    $scope.lineWidth    = 4;
    // Sidebar
    $scope.menuOpen     = false;
    $scope.clicked      = false;
    // Lobby
    $scope.currentLobby;    // Being used to check for on/offline status
    $scope.lobby_name   = 'Create Lobby';
    $scope.join_lobby   = 'Join Lobby';
    // Random UI
    $scope.scrollMsg    = true;

    //////////////////////////////////////////
    ///            Lobby System            ///
    //////////////////////////////////////////
    //Checks the lobby
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
        $scope.join_lobby_error = '';
        if (data.success) {
            console.log('Success');
            console.log(data);
            $location.url('/');
            $scope.currentLobby = data.lobby_data.id;
        } else {
            $scope.join_lobby_error = 'Could not find the specified lobby';
            console.log('Failure');
            console.log(data);
        }
    })
    $scope.createLobby = function() {
        var path = $scope.lobby_name;
        console.log('Creating lobby', path);
        socket.emit('create_lobby', {path: path});
    }
    $scope.joinLobby = function() {
        var path = $scope.join_lobby;
        console.log('Joining lobby', path);
        socket.emit('join_lobby', {path: path});
    }
     //socket emit (checklobby)

    //////////////////////////////////////////
    ///        Initial Canvas Setup        ///
    //////////////////////////////////////////
    // Create mouse object and pos array to track mouse clicks/position
    var mouse = {
        click: false,
        moving: false,
        pos: {x:0, y:0},
        pos_prev: false
    };
    var pts = [];
    // get canvas element and create context
    var canvas         = document.getElementById('drawBoard');
    var context        = canvas.getContext('2d');
    // set canvas size properties
    var width          = window.innerWidth*2;
    var height         = window.innerHeight;
    canvas.width       = width;
    canvas.height      = height;
    var boundRect      = canvas.getBoundingClientRect();
    // misc context/canvas settings
    context.lineCap    = 'round';
    context.lineJoin   = 'round';
    var dataURL;
    // Creating a temp canvas
    var tmp_canvas      = document.getElementById('tmp_canvas');
    var tmp_ctx         = tmp_canvas.getContext('2d');
    tmp_canvas.width    = canvas.width;
    tmp_canvas.height   = canvas.height;
    tmp_ctx.lineCap     = context.lineCap;
    tmp_ctx.lineJoin    = context.lineJoin;
    // Default mouse cursor
    $('#tmp_canvas').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});


    //////////////////////////////////////////
    ///          Canvas Drawing            ///
    //////////////////////////////////////////
    tmp_canvas.onmousedown = function(e){
        e.preventDefault();
        if($scope.currentLobby) {
            console.log('Drawing online');
            boundRect = canvas.getBoundingClientRect();
        }
        else {
            console.log('Drawing offline');
            boundRect = tmp_canvas.getBoundingClientRect();
        }
        // Drawing or dragging
        if(!e.shiftKey) { mouse.click  = true; }
        else            { mouse.moving = true; }

        var pos         = mouseCoords(e);
        mouse.pos_prev  = pos;
        context.moveTo(pos.x, pos.y);
        // If offline
        if(!$scope.currentLobby){
            context.beginPath();
        }
    }
    tmp_canvas.onmousemove = function(e){
        e.preventDefault();
        // If drawing
        if(mouse.click){
            mouse.pos = mouseCoords(e);
            // If offline
            if(!$scope.currentLobby){
                pts.push({x: mouse.pos.x, y: mouse.pos.y});
		        onPaint();
            }
            // If connected
            else {
                socket.emit('draw_line', {
                    line: {
                        coords      : [mouse.pos, mouse.pos_prev],
                        strokeStyle : $scope.strokeStyle,
                        lineWidth   : $scope.lineWidth
                    }
                });
            }
            mouse.pos_prev = mouse.pos;
        }
        // If dragging
        else if(mouse.moving){
            mouse.pos = mouseCoords(e);
            // Fade out tutorial msg
            if($scope.scrollMsg){
                hideScrollMsg();
            }
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
            $('#tmp_canvas').css('cursor', 'ew-resize');
        }
        if(e.keyCode == 27){
            // Escape
            $('#tmp_canvas').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
            $scope.strokeStyle = 'white';
            $scope.lineWidth  = 2;
        }
    })

    $(document).on('keyup', function(e) {
        if(e.keyCode == 16){
            // Reset cursor on Shift lift
            $('#tmp_canvas').css({'cursor':"url('../img/cursor/marker_"+$scope.strokeStyle+"_sm.png'), auto"});
        }
    })


    //////////////////////////////////////////
    ///         UI Key/mouse events        ///
    //////////////////////////////////////////
    // Side menu hiding/sliding
    $('#sideBorder').on('mousedown', function(e) {
        e.preventDefault();
        if($scope.menuOpen){
            $scope.clicked = true;
        }
    })
    $('#sideBorder').on('mousemove', function(e) {
        // Stop sidebar dragging from highlighting text inside
        e.preventDefault();
    })
    $(document).on('mousemove', function(e){
        if($scope.menuOpen && $scope.clicked){
            if(e.pageX > 300){
                $('#menuHam').css('left', e.pageX);
                $('#sidebar').css('width', e.pageX);
                $('#sideBorder').css('left', e.pageX);
            }
        }
    })
    $('#menuHam').on('mouseup', function(e){
        if(!$scope.menuOpen){
            $('#sidebar').animate({ left: 0}, 800);
            $('#sideBorder').animate({ left: 290 }, 800);
            $('#menuHam').animate({
                left: 295, top: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0
            }, 800);
            $scope.menuOpen = true;
        }
        else{
            $('#sidebar').animate({ left: -300, width: 300}, 600);
            $('#sideBorder').animate({ left: 290 }, 800);
            $('#menuHam').animate({
                left: 10, top: 10, borderTopLeftRadius: 15, borderBottomLeftRadius: 15, borderTopRightRadius: 15
            }, 600);
            $scope.menuOpen = false;
        }
    })
    // Cursor change
    $('#sideBorder').on('mouseover', function(e){
        $('#sideBorder').css('cursor', 'ew-resize');
    })
    $('#menuHam').on('mouseover', function(e){
        $('#menuHam').css('cursor', 'pointer');
    })
    // Detecting scroll to hide message
    $('.lobby').on('scroll', function() {
        hideScrollMsg();
    })

    //////////////////////////////////////////
    ///            Mouseup Resets          ///
    //////////////////////////////////////////
    $(document).on('mouseup', function(e){
        $scope.clicked  = false;
        mouse.click     = false;
        mouse.moving    = false;
        // If drawing offline
        if(!$scope.currentLobby){
            var dist = document.getElementById('lobbyDiv').scrollLeft;
            // Writing down to real canvas now
    		context.drawImage(tmp_canvas, dist, 0);
    		// Clearing tmp canvas
    		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
    		// Emptying up Pencil Points
    		pts = [];
        }
    })


    //////////////////////////////////////////
    ///           Helper Functions         ///
    //////////////////////////////////////////
    // Normal functions
    var mouseCoords = function(e) {
            var posx = e.clientX - boundRect.left;
            var posy = e.clientY - boundRect.top;
            return { x: posx, y: posy };
        },
        hideScrollMsg = function() {
            $('#scrollPop').animate({ opacity: 0 }, 2000);
            $scope.scrollMsg = false;
        },
        onPaint = function() {
            tmp_ctx.strokeStyle = $scope.strokeStyle;
            tmp_ctx.lineWidth   = $scope.lineWidth;
    		// Saving all the points in an array
    		pts.push({x: mouse.pos.x, y: mouse.pos.y});
    		if (pts.length < 3) {
    			var b = pts[0];
    			tmp_ctx.beginPath();
    			tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
    			tmp_ctx.fill();
    			tmp_ctx.closePath();
    			return;
    		}
    		// Tmp canvas is always cleared up before drawing.
    		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
    		tmp_ctx.beginPath();
    		tmp_ctx.moveTo(pts[0].x, pts[0].y);

            $scope.test = 0;
    		for (var i = 1; i < pts.length - 2; i++) {
                $scope.test++;
    			var c = (pts[i].x + pts[i + 1].x) / 2;
    			var d = (pts[i].y + pts[i + 1].y) / 2;
    			tmp_ctx.quadraticCurveTo(pts[i].x, pts[i].y, c, d);
    		}
    		// For the last 2 points
    		tmp_ctx.quadraticCurveTo( pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y );
    		tmp_ctx.stroke();
    	};
    // Scope functions
    $scope.setOnOff = function(onoff) {
        if(onoff == 'on'){
            $scope.currentLobby = 'test';
        }
        else {
            $scope.currentLobby = null;
        }
    }
})
