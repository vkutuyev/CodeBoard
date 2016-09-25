app.controller('LobbyController', function($scope, $location, socket) {
    //////////////////////////////////////////
    ///           Scope Variables          ///
    //////////////////////////////////////////
    // Canvas
    $scope.fillStyle    = '#ffffff';
    $scope.strokeStyle  = '#ffffff';
    $scope.lineWidth    = 3;
    $scope.buffer       = 0;
    // Sidebar
    $scope.menuOpen     = false;
    $scope.clicked      = false;
    // Lobby
    $scope.currentLobby;
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
    // Browser checks
    var isFirefox = typeof InstallTrigger !== 'undefined';
    var isChrome = !!window.chrome && !!window.chrome.webstore;

    //////////////////////////////////////////
    ///           Document Ready           ///
    //////////////////////////////////////////
    $(document).ready(function() {
        // Initialize color picker wheel
        $('#colorPicker').farbtastic(function callback(color){
            $scope.fillStyle = color;
            $scope.strokeStyle = color;
            $('#color').val(color);
            $('#color').css('background', color);
        });
    })

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
            if (data.lobby_data.savestate) {
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
        var board = canvas.toDataURL();
        $scope.lobby_name = '';
        // console.log('Creating lobby', path);
        // Save current board as savestate or clear canvas if joining new lobby
        if (save) {
            if (!$scope.currentLobby) {
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
        dragging: false,
        pos: {x:0, y:0},
        pos_prev: false
    };
    var pts = [];
    // get canvas element and create context
    var canvas         = document.getElementById('drawBoard');
    var context        = canvas.getContext('2d');
    // set canvas size properties
    var width          = 2000;
    var height         = 1500;
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
    // $('#tmp_canvas').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
    $('#tmp_canvas').css('cursor', 'cell');


    //////////////////////////////////////////
    ///          Canvas Drawing            ///
    //////////////////////////////////////////
    tmp_canvas.onmousedown = function(e) {
        e.preventDefault();
        // Drawing or dragging
        if (!e.shiftKey && e.button == 0) {
            mouse.click  = true;
        }
        else if (e.shiftKey || e.button == 2) {
            mouse.dragging = true;
            $('#tmp_canvas').css('cursor', '-webkit-grabbing');
            $('#tmp_canvas').css('cursor', '-moz-grabbing');
        }
        // Grab current mouse pos
        var pos = mouseCoords(e);
        context.moveTo(pos.x, pos.y);
        // Connected
        if ($scope.currentLobby) {
            if ($scope.shape.type) { boundRect = tmp_canvas.getBoundingClientRect(); }
            else                   { boundRect = canvas.getBoundingClientRect(); }
        }
        // Offline
        else {
            boundRect = tmp_canvas.getBoundingClientRect();
            if (!$scope.shape.type) { context.beginPath(); }
        }
        // Drawing shape
        if ($scope.shape.type && mouse.click) {
            $scope.shape.drawing = true;
            $scope.shape.startX  = pos.x;
            $scope.shape.startY  = pos.y;
        }
    }
    tmp_canvas.onmousemove = function(e) {
        e.preventDefault();
        // Drawing shape
        if ($scope.shape.drawing && !mouse.dragging) {
            var coords          = mouseCoords(e);
            $scope.shape.width  = coords.x - $scope.shape.startX;
            $scope.shape.height = coords.y - $scope.shape.startY;
            tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
            drawShape(tmp_ctx, $scope.shape.type, $scope.strokeStyle, $scope.fillStyle, $scope.lineWidth, $scope.shape.startX, $scope.shape.startY, $scope.shape.width, $scope.shape.height, 0, 0);
        }
        else {
            mouse.pos = mouseCoords(e);
            // Drawing
            if (mouse.click && !mouse.dragging) {
                pts.push(mouse.pos);
                // Offline
                if (!$scope.currentLobby) {
                    onPaint(pts, $scope.strokeStyle, $scope.lineWidth, 'off');
                }
                // Connected
                else {
                    // Send coords every X mousemoves to help with socket lag/overload
                    if ($scope.buffer == 2) {
                        socket.emit('draw_line', {
                            line: { pts: pts, strokeStyle: $scope.strokeStyle, lineWidth: $scope.lineWidth},
                            lobby: $scope.currentLobby
                        });
                        $scope.buffer = 0;
                    }
                    else { $scope.buffer++; }
                }
            }
            // Dragging
            else if (mouse.dragging) {
                // Fade out tutorial msg
                if ($scope.scrollMsg) { hideScrollMsg(); }
                // Scroll screen by mouse movement
                var scrollX = mouse.pos_prev.x - mouse.pos.x;
                var scrollY = mouse.pos_prev.y - mouse.pos.y;
                // Ignore huge scroll changes caused by desyncs/miscalcs
                if (Math.abs(scrollX) < 100 && Math.abs(scrollY) < 100) {
                    document.getElementById('lobbyDiv').scrollLeft += scrollX;
                    document.getElementById('lobbyDiv').scrollTop  += scrollY;
                }
            }
            mouse.pos_prev = mouse.pos;
        }
    }

    // Socket functions
    socket.on('draw_line', function (data) {
        onPaint(data.line.pts, data.line.strokeStyle, data.line.lineWidth, 'on');
    });
    socket.on('draw_shape', function(shape) {
        drawShape(context, shape.type, shape.strokeStyle, shape.fillStyle, shape.lineWidth, shape.startX, shape.startY, shape.width, shape.height, shape.distX, shape.distY);
    })
    socket.on('board_clear', function() {
        context.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
    })

    //////////////////////////////////////////
    ///            Mouseup Events          ///
    //////////////////////////////////////////
    $(document).on('mouseup', function(e) {
        var distX = document.getElementById('lobbyDiv').scrollLeft;
        var distY = document.getElementById('lobbyDiv').scrollTop;
        // Dragging
        if (mouse.dragging) {
            if (e.button == 2) {
                if ($scope.shape.type) {
                    $('#tmp_canvas').css('cursor', 'crosshair');
                }
                else {
                    $('#tmp_canvas').css('cursor', 'cell');
                }
            }
            else {
                $('#tmp_canvas').css('cursor', '-webkit-grab');
                $('#tmp_canvas').css('cursor', '-moz-grab');
            }
        }
        // Offline
        if (!$scope.currentLobby) {
            // Drawing shape
            if ($scope.shape.type && $scope.shape.drawing && !mouse.dragging) {
                drawShape(context, $scope.shape.type, $scope.strokeStyle, $scope.fillStyle, $scope.lineWidth, $scope.shape.startX, $scope.shape.startY, $scope.shape.width, $scope.shape.height, distX, distY);
                $scope.shape.drawing = false;
            }
            context.drawImage(tmp_canvas, distX, distY);
        }
        // Connected
        else{
            // Drawing Shape
            if ($scope.shape.type && $scope.shape.drawing && !mouse.dragging) {
                socket.emit('draw_shape', {
                    lobby: $scope.currentLobby, type: $scope.shape.type, strokeStyle: $scope.strokeStyle, fillStyle: $scope.fillStyle, lineWidth: $scope.lineWidth, startX: $scope.shape.startX, startY: $scope.shape.startY, width: $scope.shape.width, height: $scope.shape.height, distX: distX, distY: distY
                })
                $scope.shape.drawing = false;
            }
            var boardState = canvas.toDataURL();
            socket.emit('savestate', { canvas: boardState, lobby: $scope.currentLobby});
        }
        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
        // Resetting variables
        $scope.clicked  = false;
        mouse.click     = false;
        mouse.dragging  = false;
        pts = [];
    })

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
    $(document).on('keydown', function(e) {
        if (e.shiftKey && !mouse.click) {
            // Shift
            // $('#tmp_canvas').css('cursor', 'ew-resize');
            $('#tmp_canvas').css('cursor', '-webkit-grab');
            $('#tmp_canvas').css('cursor', '-moz-grab');
        }
        if (e.keyCode == 27) {
            // Escape
            $('#tmp_canvas').css('cursor', 'cell');
            $scope.strokeStyle = 'white';
            $scope.fillStyle   = 'white';
            $scope.lineWidth   = 3;
            // Temp values for toolbar   //
            $('#sizeBox').val(3);        //
            $('#sizeSlide').val(3);      //
            ///////////////////////////////
            $scope.shape.type = null;
        }
    })

    $(document).on('keyup', function(e) {
        if (e.keyCode == 16) {
            if (mouse.dragging) {
                mouse.dragging  = false;
                mouse.click     = false;
            }
            // Reset cursor on Shift lift
            if ($scope.shape.type) {
                $('#tmp_canvas').css('cursor', 'crosshair');
            }
            else {
                $('#tmp_canvas').css('cursor', 'cell');
            }
        }
    })


    //////////////////////////////////////////
    ///         UI Key/mouse events        ///
    //////////////////////////////////////////
    // Side menu hiding/sliding
    $('#sideBorder').on('mousedown', function(e) {
        e.preventDefault();
        if ($scope.menuOpen) {
            $scope.clicked = true;
        }
    })
    $('#sideBorder').on('mousemove', function(e) {
        // Stop sidebar dragging from highlighting text inside
        e.preventDefault();
    })
    $(document).on('mousemove', function(e) {
        if ($scope.menuOpen && $scope.clicked) {
            if (e.pageX > 300) {
                $('#menuHam').css('left', e.pageX);
                $('#sidebar').css('width', e.pageX);
                $('#sideBorder').css('left', e.pageX);
            }
        }
    })
    $('#menuHam').on('mouseup', function(e) {
        if (!$scope.menuOpen) {
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
    $('#sideBorder').on('mouseover', function(e) {
        $('#sideBorder').css('cursor', 'ew-resize');
    })
    $('#menuHam').on('mouseover', function(e) {
        $('#menuHam').css('cursor', 'pointer');
    })
    // Detecting scroll to hide message
    $('.lobby').on('scroll', function() {
        hideScrollMsg();
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
            if (status == 'off') {
                t_ctx = tmp_ctx;
                t_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
            }
            else if (status == 'on') {
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
        drawShape = function(con, type, strCol, filCol, lineWidth, startX, startY, width, height, scrLeft, scrTop) {
            var distX               = scrLeft,
                distY               = scrTop,
                shapeContext        = con;
            shapeContext.lineWidth  = lineWidth;
            if (type == 'rectF') {
                shapeContext.fillStyle = filCol;
                shapeContext.fillRect(startX + distX, startY + distY, width, height);
            }
            if (type == 'rectH') {
                shapeContext.strokeStyle = strCol;
                shapeContext.strokeRect(startX + distX, startY + distY, width, height);
            }
            if (type == 'circF' || type == 'circH' ) {
                var w2            = width * width,
                    h2            = height * height,
                    radius        = Math.sqrt(w2+h2),
                    startAngle    = 0,
                    endAngle      = Math.PI*2;
                shapeContext.beginPath();
            	shapeContext.arc(startX + distX, startY + distY, radius, startAngle, endAngle, true);
            	shapeContext.closePath();
                if (type == 'circF') {
                    shapeContext.fillStyle = filCol;
                    shapeContext.fill();
                }
                else {
                    shapeContext.strokeStyle = strCol;
                    shapeContext.stroke();
                }
            }
            shapeContext.fillStyle = 'black';
        };

        // Scope functions
        $scope.changeWidth = function(width) {
            $scope.lineWidth = width;
        }
        $scope.setShape = function(shape) {
            if (shape) {
                $('#tmp_canvas').css('cursor', 'crosshair');
                $scope.shape.type = shape;
            }
            else {
                $('#tmp_canvas').css('cursor', 'cell');
                $scope.shape.type = null;
            }
        }
        $scope.clearCanvas = function() {
            if ($scope.currentLobby) {
                socket.emit('board_clear', $scope.currentLobby);
            }
            else {
                tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        $scope.saveCanvas = function() {
            // Draw black background 'under' canvas
            var oldCanv = context.getImageData(0, 0, width, height);
            var compositeOperation = context.globalCompositeOperation;
            context.globalCompositeOperation = "destination-over";
            context.fillStyle = 'black';
            context.fillRect(0, 0, width, height);
            // Save canvas
            var board    = canvas.toDataURL('image/png'),
                fileName = 'whiteboard.png',
                link     = document.createElement('a');
            link.setAttribute('download', fileName);
            link.setAttribute('id', 'canvLink');
            link.setAttribute('href', board);
            if(isFirefox){
                document.body.appendChild(link);
            }
            link.click();
            // Reset canvas and remove black background
            context.clearRect(0, 0, width, height);
            context.putImageData(oldCanv, 0, 0);
            context.globalCompositeOperation = compositeOperation;
        }
        $scope.loadCanvas = function() {
            var loadedCanv = document.getElementById('canvFile'),
                file       = loadedCanv.files[0];
            // Check for image file
            if (file.type.split('/')[0] != 'image') {
                alert('File must be an image.');
            }
            else {
                var fr = new FileReader();
                fr.readAsDataURL(file);
                fr.onload = createImage;
            }
            function createImage() {
                context.clearRect(0, 0, width, height);
                img         = new Image();
                img.src     = fr.result;
                // Check image and scale down if it's too big
                var scale = 1;
                if (img.width > 2000 && img.height < 1500) {
                    scale = 2000 / img.width;
                }
                else if (img.width < 2000 && img.height > 1500 ) {
                    scale = 1500 / img.height;
                }
                else if (img.width > 2000 && img.height > 1500) {
                    scale = Math.min(2000/img.width, 1500/img.height);
                }
                img.onload = context.drawImage(img, 0, 0, img.width*scale, img.height*scale);
            }
        }

})
