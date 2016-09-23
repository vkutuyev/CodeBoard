app.controller('LobbyController', function($scope, $location, socket) {
    //////////////////////////////////////////
    ///           Scope Variables          ///
    //////////////////////////////////////////
    // Canvas
    $scope.fillStyle    = 'white';
    $scope.strokeStyle  = 'white';
    $scope.lineWidth    = 3;
    // Sidebar
    $scope.menuOpen     = false;
    $scope.clicked      = false;
    // Lobby
    $scope.currentLobby;    // Being used to check for on/offline status
    $scope.lobby_name;
    $scope.join_lobby;
    // Random UI
    $scope.scrollMsg    = true;
    // Shapes
    $scope.shape        = {
        type: '',
        startX: '',
        startY: '',
        width: '',
        height: '',
        drawing: false
    }

    //////////////////////////////////////////
    ///            Lobby System            ///
    //////////////////////////////////////////
    //Checks the lobby
    if ($location.url() != '/') {
        var path = $location.url().split('/')[1];
        // console.log(path);
        socket.emit('join_lobby', {path: path});
    }
    socket.on('create_lobby_status', function(data) {
        if (data.success) {
            socket.emit('join_lobby', {path: data.path})
        } else {
            // console.log('Creating lobby failure');
        }
    })
    socket.on('join_lobby_status', function(data) {
        $scope.join_lobby_error = '';
        if (data.success) {
            // console.log('Success');
            // console.log(data);
            $location.url('/');
            $scope.currentLobby = data.lobby_data.id;
            // Clear canvas and load savestate
            context.fillRect(0,0,canvas.width,canvas.height);
            if(data.lobby_data.savestate) {
                var board    = new Image;
                board.src    = data.lobby_data.savestate;
                board.onload = function() {
                    context.drawImage(board, 0, 0);
                }
            }
        } else {
            $scope.join_lobby_error = 'Could not find the specified lobby';
            // console.log('Failure');
            // console.log(data);
        }
    })
    $scope.createLobby = function(save) {
        var path  = $scope.lobby_name;
        $scope.lobby_name = '';
        var board = canvas.toDataURL();
        // console.log('Creating lobby', path);
        // Save current board as savestate or clear canvas if joining new lobby
        if(save) {
            if(!$scope.currentLobby){
                context.fillRect(0,0,canvas.width,canvas.height);
                socket.emit('create_lobby', {path: path, canvas: board});
            }
            else {
                socket.emit('save_lobby', {path: $scope.currentLobby, canvas: board});
            }
        }
        else {
            context.fillRect(0,0,canvas.width,canvas.height);
            socket.emit('create_lobby', {path: path});
        }
    }
    $scope.joinLobby = function() {
        var path = $scope.join_lobby;
        // console.log('Joining lobby', path);
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
    context.fillStyle  = 'black';
    context.lineCap    = 'round';
    context.lineJoin   = 'round';
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
        // Temp blurring for toolbar //
        $('#sizeBox').blur();        //
        $('#sizeSlide').blur();      //
        ///////////////////////////////

        // Drawing or dragging
        if(!e.shiftKey) { mouse.click  = true; }
        else            { mouse.moving = true; }

        // Grab current mouse pos
        var pos         = mouseCoords(e);
        mouse.pos_prev  = pos;

        if($scope.shape.type) {
            $scope.shape.drawing = true;
            $scope.shape.startX  = mouseCoords(e).x;
            $scope.shape.startY  = mouseCoords(e).y;
        }
        else {
            if($scope.currentLobby) {
                boundRect = canvas.getBoundingClientRect();
            }
            else {
                boundRect = tmp_canvas.getBoundingClientRect();
            }
            context.moveTo(pos.x, pos.y);
            // If offline
            if(!$scope.currentLobby){
                context.beginPath();
            }
        }
    }
    tmp_canvas.onmousemove = function(e){
        e.preventDefault();
        if($scope.shape.drawing && !mouse.moving) {
            var coords = mouseCoords(e);
            $scope.shape.width = coords.x - $scope.shape.startX;
            $scope.shape.height = coords.y - $scope.shape.startY;
        }
        else {
            // If drawing
            if(mouse.click){
                mouse.pos = mouseCoords(e);
                pts.push(mouse.pos);
                // If offline
                if(!$scope.currentLobby){
                    onPaint(pts, $scope.strokeStyle, $scope.lineWidth, 'off');
                }
                // If connected
                else {
                    socket.emit('draw_line', {
                        line: { pts: pts, strokeStyle: $scope.strokeStyle, lineWidth: $scope.lineWidth},
                        lobby: $scope.currentLobby
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
    }
    // Drawing the line from server
    socket.on('draw_line', function (data) {
        onPaint(data.line.pts, data.line.strokeStyle, data.line.lineWidth, 'on');
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
            $scope.fillStyle   = 'white';
            $scope.lineWidth   = 3;
            // Temp blurring for toolbar //
            $('#sizeBox').val(3);        //
            $('#sizeSlide').val(3);      //
            ///////////////////////////////
            $scope.shape.type = null;
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
    ///            Mouseup Events          ///
    //////////////////////////////////////////
    $(document).on('mouseup', function(e){
        if($scope.shape.type && $scope.shape.drawing && !mouse.moving){
            drawShape();
            $scope.shape.drawing = false;
        }
        // If drawing offline
        if(!$scope.currentLobby){
            var dist = document.getElementById('lobbyDiv').scrollLeft;
            // Writing down to real canvas now
    		context.drawImage(tmp_canvas, dist, 0);
    		// Clearing tmp canvas
    		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
        }
        // If connected
        else{
            var boardState = canvas.toDataURL();
            socket.emit('savestate', { canvas: boardState, lobby: $scope.currentLobby});
        }
        // Resetting variables
        $scope.clicked  = false;
        mouse.click     = false;
        mouse.moving    = false;
        pts = [];
    })


    //////////////////////////////////////////
    ///           Helper Functions         ///
    //////////////////////////////////////////
    // Controller functions
    var mouseCoords = function(e) {
            var posx = e.clientX - boundRect.left;
            var posy = e.clientY - boundRect.top;
            return { x: posx, y: posy };
        },
        hideScrollMsg = function() {
            $('#scrollPop').animate({ opacity: 0 }, 2000);
            $scope.scrollMsg = false;
        },
        onPaint = function(ptsArr, color, penWidth, status) {
            if(status == 'off'){
                t_ctx = tmp_ctx;
                t_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
            }
            else if(status == 'on'){
                t_ctx = context;
            }
            t_ctx.strokeStyle = color;
            t_ctx.lineWidth   = penWidth;
    		if (ptsArr.length < 3) {
    			var b = ptsArr[0];
    			t_ctx.beginPath();
    			t_ctx.arc(b.x, b.y, t_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
    			t_ctx.fill();
    			t_ctx.closePath();
    			return;
    		}
            t_ctx.beginPath();
            t_ctx.moveTo(ptsArr[0].x, ptsArr[0].y);
    		for (var i = 1; i < ptsArr.length - 2; i++) {
    			var c = (ptsArr[i].x + ptsArr[i + 1].x) / 2;
    			var d = (ptsArr[i].y + ptsArr[i + 1].y) / 2;
    			t_ctx.quadraticCurveTo(ptsArr[i].x, ptsArr[i].y, c, d);
    		}
    		// For the last 2 points
    		t_ctx.quadraticCurveTo( ptsArr[i].x, ptsArr[i].y, ptsArr[i + 1].x, ptsArr[i + 1].y );
    		t_ctx.stroke();
    	},
        drawShape = function() {
            console.log('drawing');
            var dist = document.getElementById('lobbyDiv').scrollLeft;
            if($scope.shape.type == 'rectF'){
                context.fillStyle = $scope.fillStyle;
                context.fillRect($scope.shape.startX + dist, $scope.shape.startY, $scope.shape.width, $scope.shape.height);
            }
            if($scope.shape.type == 'rectH'){
                context.strokeStyle = $scope.strokeStyle;
                context.strokeRect($scope.shape.startX + dist, $scope.shape.startY, $scope.shape.width, $scope.shape.height);
            }
            if($scope.shape.type == 'circF' || $scope.shape.type == 'circH' ){
                var w2            = $scope.shape.width * $scope.shape.width,
                    h2            = $scope.shape.height * $scope.shape.height,
                    radius        = Math.sqrt(w2+h2),
                    startAngle    = 0,
                    endAngle      = Math.PI*2;
                context.beginPath();
            	context.arc($scope.shape.startX + dist, $scope.shape.startY, radius, startAngle, endAngle, true);
            	context.closePath();
                if($scope.shape.type == 'circF') {
                    context.fillStyle = $scope.fillStyle;
                    context.fill();
                }
                else {
                    context.strokeStyle = $scope.strokeStyle;
                    context.stroke();
                }
            }
            // Set background back to black
            context.fillStyle = 'black';
        };

        // Scope functions
        $scope.changeColor = function(color) {
            $scope.strokeStyle = color;
            $scope.fillStyle   = color;
            if(!$scope.shape.type){
                $('#tmp_canvas').css({'cursor':"url('../img/cursor/marker_"+$scope.strokeStyle+"_sm.png'), auto"});
            }
        }
        $scope.changeWidth = function(width) {
            $scope.lineWidth = width;
        }
        $scope.setShape = function(shape) {
            if(shape) {
                $('#tmp_canvas').css('cursor', 'crosshair');
                $scope.shape.type = shape;
            }
            else {
                $('#tmp_canvas').css({'cursor':"url('../img/cursor/marker_"+$scope.strokeStyle+"_sm.png'), auto"});
                $scope.shape.type = null;
            }
        }

})
