app.controller('LobbyController', function($scope, $location, socket) {
    //////////////////////////////////////////
    ///           Scope Variables          ///
    //////////////////////////////////////////
    // Tabulations
    $scope.menu_tab     = 0;       //menu == 0, chat == 1, code == 2
    //menu
    $scope.menu_create_active = 0;
    //Chat
    $scope.chat_name    = undefined;
    $scope.messages     = [];
    $scope.users        = {};
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
    $scope.showColor    = false;
    $scope.showLoad     = false;
    $scope.filePicked   = null;
    // Shapes
    $scope.shape        = {
        type: '',
        startX: '',
        startY: '',
        width: '',
        height: '',
        drawing: false
    }
    // Typing
    $scope.typing       = false;
    $scope.textType     = false;
    $scope.codeType     = false;
    $scope.typeClicked  = false;
    $scope.textSize     = 12;
    // Browser checks
    var isFirefox = typeof InstallTrigger !== 'undefined';
    var isChrome = !!window.chrome && !!window.chrome.webstore;


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
        },
        drawText = function(text, mouseX, mouseY, scrLeft, scrTop, color, font) {
            context.fillStyle    = color;
            context.font         = font + 'px Raleway';
            context.textBaseline = 'middle';
            context.fillText(text, mouseX + scrLeft, mouseY + scrTop);
            context.fillStyle    = 'black';
            if ($scope.currentLobby) {
                var boardState = canvas.toDataURL();
                socket.emit('savestate', boardState);
            }
        },
        drawCode = function(codeArr, mouseX, mouseY, scrLeft, scrTop, color, font) {
            var lineOffset       = 0;
            context.fillStyle    = color;
            context.font         = font + 'px Source Code Pro';
            context.textBaseline = 'middle';
            for (line of codeArr) {
                context.fillText(line, mouseX + scrLeft, mouseY + scrTop + lineOffset);
                lineOffset      += font*1.41;
            }
            context.fillStyle    = 'black';
            if ($scope.currentLobby) {
                var boardState = canvas.toDataURL();
                socket.emit('savestate', boardState);
            }
        };
    // Scope functions
    $scope.menu_tab_change = function(menu) {
        $scope.menu_tab = menu;
    }
    $scope.menu_active = function(item) {
        switch (item) {
            case 1:
                $scope.menu_new_active    = 0;
                $scope.menu_create_active = 1;
                $scope.menu_join_active   = 0;
                setTimeout(function(){
                    $('#menu_create_send').focus();
                }, 10);
                break;
            case 2:
                $scope.menu_new_active    = 0;
                $scope.menu_create_active = 0;
                $scope.menu_join_active   = 1;
                setTimeout(function(){
                    $('#menu_join_send').focus();
                }, 10);
                break;
        }
    }
    $scope.menu_new_send = function(event) {
        switch (event.keyCode) {
            case 13:
                $scope.createLobby();
                $scope.menu_new_active = 0;
                break;
            case 27:
                $scope.menu_new_active = 0;
                break;
        }
    }
    $scope.menu_create_send = function(event) {
        switch (event.keyCode) {
            case 13:
                $scope.createLobby('save');
                $scope.menu_create_active = 0;
                break;
            case 27:
                $scope.menu_create_active = 0;
                break;
        }
    }
    $scope.menu_join_send = function(event) {
        switch (event.keyCode) {
            case 13:
                $scope.joinLobby();
                $scope.menu_join_active = 0;
                break;
            case 27:
                $scope.menu_join_active = 0;
                break;
        }
    }
    $scope.clearCanvas = function() {
        if ($scope.currentLobby) {
            socket.emit('board_clear');
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
        // PUT IN REAL FILE CHECKS LATER
        // Check for image file
        // if (file.type.split('/')[0] != 'image') {
        //     alert('File must be an image.');
        // }
        var image = $scope.filePicked || file;
        $scope.createImage(image);
        $scope.filePicked = null;
        $scope.toggleLoad(true);
    }
    $scope.createImage = function(image) {
        var fr = new FileReader();
        fr.readAsDataURL(image);
        fr.onload = function() {
            context.clearRect(0, 0, width, height);
            var source  = fr.result,
                img     = new Image();
                img.src = source;
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
            $scope.showNotification('Image Loaded');
        }
    }
    $scope.showNotification = function(msg, type) {
        $('#notifDiv').css('top', -35);
        $('#notifDiv').stop();
        switch (type) {
            case 'good': $('#notifDiv').css('background', 'rgb(127, 224, 42)'); break;
            case 'bad': $('#notifDiv').css('background', 'rgb(198, 49, 16)'); break;
            default: $('#notifDiv').css('background', 'rgb(60, 134, 232)'); break;
        }
        $('#notifSpan').text(msg);
        $('#notifDiv').animate({'top': 0}, 500).delay(2000).animate({'top': -35}, 400);
    }
    $scope.changeInput = function(input) {
        $('.toolBtn').stop();
        $('.toolBtn').css('opacity', 1);
        $('.toolBtn').removeClass('activeBtn');
        // Reset/clear text and code divs
        $('#textDiv').attr('hidden', true);
        $('#codeDiv').attr('hidden', true);
        $('#textInput').val('');
        $('#codeInput').val('');
        $('#textInput').blur();
        $('#codeInput').blur();
        // Reset color from eraser
        if ($scope.strokeStyle == '#000000') {
            $scope.strokeStyle = '#ffffff';
        }
        // Drawing
        if (input != 'text' && input != 'code') {
            $('#toolSize').attr('hidden', false);
            $('#textSize').attr('hidden', true);
            if (input == 'brush') {
                $($('.toolBtn')[0]).css('opacity', 0);
                $($('.toolBtn')[0]).animate({ opacity: 1}, 500);
                $($('.toolBtn')[0]).addClass('activeBtn');
                $('#tmp_canvas').css('cursor', 'cell');
                $scope.shape.type  = null;
                $scope.typing      = false;
                $scope.typeClicked = false;
            }
            else if (input == 'eraser') {
                $($('.toolBtn')[1]).css('opacity', 0);
                $($('.toolBtn')[1]).animate({ opacity: 1}, 500);
                $($('.toolBtn')[1]).addClass('activeBtn');
                $('#tmp_canvas').css('cursor', 'cell');
                $scope.shape.type  = null;
                $scope.typing      = false;
                $scope.typeClicked = false;
                $scope.strokeStyle = '#000000';
            }
            else {
                var ind;
                switch (input) {
                    case 'rectF': ind = 4; break;
                    case 'rectH': ind = 5; break;
                    case 'circF': ind = 6; break;
                    case 'circH': ind = 7; break;
                }
                $($('.toolBtn')[ind]).css('opacity', 0);
                $($('.toolBtn')[ind]).animate({ opacity: 1}, 500);
                $($('.toolBtn')[ind]).addClass('activeBtn');
                $('#tmp_canvas').css('cursor', 'crosshair');
                $scope.shape.type  = input;
                $scope.typing      = false;
                $scope.typeClicked = false;
            }
        }
        // Typing
        else {
            $('#toolSize').attr('hidden', true);
            $('#textSize').attr('hidden', false);
            $scope.typing     = true;
            $scope.shape.type = null;
            $('#tmp_canvas').css('cursor', 'text');
            if (input == 'text') {
                $($('.toolBtn')[2]).css('opacity', 0);
                $($('.toolBtn')[2]).animate({ opacity: 1}, 500);
                $($('.toolBtn')[2]).addClass('activeBtn');
                $scope.textType = true;
                $scope.codeType = false;
            }
            if (input == 'code') {
                $($('.toolBtn')[3]).css('opacity', 0);
                $($('.toolBtn')[3]).animate({ opacity: 1}, 500);
                $($('.toolBtn')[3]).addClass('activeBtn');
                $scope.textType = false;
                $scope.codeType = true;
            }
        }
    }
    $scope.toggleColor = function(show) {
        $('#pickerDiv').attr('hidden', show);
        $scope.showColor = !show;
    }
    $scope.toggleLoad = function(load) {
        $('#fileInput').attr('hidden', load);
        $scope.showLoad = !load;
    }


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
            $('#toolColorBox').css('background', color);
        });

        // File drop
        var fileDrop = document.getElementById('fileDrop');
        fileDrop.addEventListener('dragover', fileDragOver, false);
        fileDrop.addEventListener('drop', fileDropHandler, false);
        function fileDragOver(e) {
            e.stopPropagation();
            e.preventDefault();
        }
        function fileDropHandler(e) {
            e.stopPropagation();
            e.preventDefault();
            var image = e.dataTransfer.files[0];
            $scope.filePicked = image;
            var canvFile = $("#canvFile");
            canvFile.replaceWith( canvFile = canvFile.clone( true ) );
        }
    })

    //////////////////////////////////////////
    ///            Code Editor             ///
    //////////////////////////////////////////

    var editor;
    setTimeout(function () {
        editor = ace.edit('editor');
        editor.setTheme('ace/theme/sqlserver');
        editor.getSession().setMode('ace/mode/javascript');
        editor.getSession().setUseWrapMode(false);
        editor.$blockScrolling = Infinity;
    }, 10);
    $('#editor').on('keyup', function(e) {
        editor.resize();
        if ($scope.currentLobby) {
            socket.emit('code_edit', { id: socket.currentId(), code: editor.getValue()});
        }
    })

    socket.on('code_edit', function(data) {
        if (socket.currentId() != data.id) {
            editor.setValue(data.code);
        }
    });

    //////////////////////////////////////////
    ///            Lobby System            ///
    //////////////////////////////////////////
    //Checks the lobby
    if ($location.url() != '/') {
        var path = $location.url().split('/')[1];
        socket.emit('join_lobby', {path: path});
    }
    socket.on('create_lobby_status', function(data) {
        if (data.success) {
            context.fillRect(0, 0, canvas.width, canvas.height);
            socket.emit('join_lobby', {path: data.path})
        } else {
            $scope.showNotification('Lobby Already Exists', 'bad');
        }
    })
    socket.on('join_lobby_status', function(data) {
        if (data.success) {
            // $location.url('/');
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
            //Setting the new stuff
            $scope.users    = data.lobby_data.users;
            $scope.messages = data.lobby_data.chatlog;
            editor.setValue(data.lobby_data.textCode);
            var msg = 'Joined lobby: ' + data.lobby_data.id;
            $scope.showNotification(msg, 'good');
        } else {
            var msg = 'Lobby not found: ' + data.lobby_data;
            $scope.showNotification(msg, 'bad');
        }
    })
    $scope.createLobby = function(save) {
        var path  = $scope.lobby_name;
        var board = canvas.toDataURL();
        $scope.lobby_name = '';
        // Save current board as savestate or clear canvas if joining new lobby
        if (save) {
            if (!$scope.currentLobby) {
                socket.emit('create_lobby', {path: path, canvas: board});
            }
            else {
                socket.emit('save_lobby', {path: $scope.currentLobby, canvas: board});
            }
        }
        else {
            socket.emit('create_lobby', {path: path});
        }
    }
    $scope.joinLobby = function() {
        var path = $scope.join_lobby;
        socket.emit('join_lobby', {path: path});
    }

    //////////////////////////////////////////
    ///             Chat System            ///
    //////////////////////////////////////////
    $scope.enterChat = function() {
        $scope.chat_name = $scope.enter_chat_name;
        var name = $scope.chat_name;
        socket.emit('user_send', {name: name});
        $scope.enter_chat_name = '';
    }
    $scope.chat_send_message = function() {
        var message = $scope.chat_message;
        socket.emit('message_send', {message: message});
        $scope.chat_message = '';
    }
    socket.on('messages_receive', function(data) {
        //Data must be an array of messages
        $scope.messages = data.messages;
    })
    socket.on('users_receive', function(data) {
        //Data must be an array of users
        $scope.users = data.users;
    })



    //////////////////////////////////////////
    ///        Initial Canvas Setup        ///
    //////////////////////////////////////////
    // Create mouse object and pos array to track mouse clicks/position
    var mouse = {
        click: false,
        dragging: false,
        pos: {x:0, y:0},
        pos_prev: false,
        typeX: 0,
        typeY: 0
    };
    var pts = [];
    $scope.changeInput('brush');
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
    var tmp_canvas     = document.getElementById('tmp_canvas');
    var tmp_ctx        = tmp_canvas.getContext('2d');
    tmp_canvas.width   = canvas.width;
    tmp_canvas.height  = canvas.height;
    tmp_ctx.lineCap    = context.lineCap;
    tmp_ctx.lineJoin   = context.lineJoin;
    $('#tmp_canvas').css('cursor', 'cell');


    //////////////////////////////////////////
    ///          Canvas Drawing            ///
    //////////////////////////////////////////
    tmp_canvas.onmousedown = function(e) {
        e.preventDefault();
        // Removing focus from any input fields
        $('#color').blur();
        $('#toolSizeBoxValue').blur();
        $('#toolSizeSlideValue').blur();
        $('#textSizeBoxValue').blur();
        $('#textSizeSlideValue').blur();
        // Drawing or dragging
        if (!e.shiftKey && e.button == 0) {
            mouse.click  = true;
        }
        else if (e.shiftKey || e.button == 2) {
            mouse.dragging = true;
            $('#tmp_canvas').css('cursor', '-webkit-grabbing');
            $('#tmp_canvas').css('cursor', '-moz-grabbing');
        }
        // Connected
        if ($scope.currentLobby) {
            if ($scope.shape.type || $scope.typing) { boundRect = tmp_canvas.getBoundingClientRect(); }
            else                   { boundRect = canvas.getBoundingClientRect(); }
        }
        // Offline
        else {
            boundRect = tmp_canvas.getBoundingClientRect();
            if (!$scope.shape.type) { context.beginPath(); }
        }
        // Grab current mouse pos
        mouse.pos = mouseCoords(e);
        context.moveTo(mouse.pos.x, mouse.pos.y);
        // Drawing shape
        if ($scope.shape.type && mouse.click) {
            $scope.shape.drawing = true;
            $scope.shape.startX  = mouse.pos.x;
            $scope.shape.startY  = mouse.pos.y;
        }
        // Typing
        if ($scope.typing && mouse.click) {
            $scope.typeClicked = true;
            mouse.typeX = mouse.pos.x;
            mouse.typeY = mouse.pos.y;
            if ($scope.textType) {
                // Place typing textarea
                $('#textDiv').attr('hidden', false);
                $('#textDiv').css('left', mouse.pos.x-1);
                $('#textDiv').css('top', mouse.pos.y-$scope.textSize*2/3-1);
                $('#textInput').css('color', $scope.fillStyle);
                $('#textInput').css('font-size', $scope.textSize);
                $('#textInput').focus();
            }
            if ($scope.codeType) {
                // Place coding textarea
                if ($('#codeInput').val() == '') {
                    $('#codeInput').css('width', 250);
                    $('#codeInput').css('height', 150);
                }
                $('#codeDiv').attr('hidden', false);
                $('#codeDiv').css('left', mouse.pos.x-2);
                $('#codeDiv').css('top', mouse.pos.y-$scope.textSize*2/3-2);
                $('#codeInput').css('color', $scope.fillStyle);
                $('#codeInput').css('font-size', $scope.textSize);
                $('#codeInput').focus();
            }
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
            // Drawing
            if (mouse.click && !mouse.dragging && !$scope.typing) {
                mouse.pos = mouseCoords(e);
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
                            line: { pts: pts, strokeStyle: $scope.strokeStyle, lineWidth: $scope.lineWidth}
                        });
                        $scope.buffer = 0;
                    }
                    else { $scope.buffer++; }
                }
            }
            // Dragging
            else if (mouse.dragging) {
                mouse.pos = mouseCoords(e);
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
    socket.on('draw_text', function(data) {
        drawText(data.val, data.mX, data.mY, data.sL, data.sT, data.color, data.font);
    })
    socket.on('draw_code', function(data) {
        drawCode(data.arr, data.mX, data.mY, data.sL, data.sT, data.color, data.font);
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
                if  ($scope.shape.type) { $('#tmp_canvas').css('cursor', 'crosshair'); }
                else if ($scope.typing) { $('#tmp_canvas').css('cursor', 'text'); }
                else                    { $('#tmp_canvas').css('cursor', 'cell'); }
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
                    type: $scope.shape.type, strokeStyle: $scope.strokeStyle, fillStyle: $scope.fillStyle, lineWidth: $scope.lineWidth, startX: $scope.shape.startX, startY: $scope.shape.startY, width: $scope.shape.width, height: $scope.shape.height, distX: distX, distY: distY
                })
                $scope.shape.drawing = false;
            }
            var boardState = canvas.toDataURL();
            socket.emit('savestate', boardState);
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
    // Automatically expand code textarea
    $('#codeInput').on('keyup', function(e) {
        var input = $('#codeInput').val().split('\n');
        var max = 0;
        for (line of input) {
            if (line.length > max) {
                max = line.length
            }
        }
        $('#codeInput').css('width', max*$scope.textSize/1.2);
        $('#codeInput').css('height', input.length*$scope.textSize*2);
    })
    $(document).on('keydown', function(e) {
        if (e.shiftKey && !mouse.click) {   // Shift
            $('#tmp_canvas').css('cursor', '-webkit-grab');
            $('#tmp_canvas').css('cursor', '-moz-grab');
        }
        if (e.keyCode == 13 && !e.shiftKey) {              // Enter
            // Typing
            if ($scope.typeClicked) {
                var scrLeft = document.getElementById('lobbyDiv').scrollLeft;
                var scrTop  = document.getElementById('lobbyDiv').scrollTop;
                if (e.target.id == 'textInput') {
                    e.preventDefault();
                    if ($scope.currentLobby) {
                        socket.emit('draw_text', { val: e.target.value, mX: mouse.typeX, mY: mouse.typeY, sL: scrLeft, sT: scrTop, color: $scope.fillStyle, font: $scope.textSize });
                    }
                    else {
                        drawText(e.target.value, mouse.typeX, mouse.typeY, scrLeft, scrTop, $scope.fillStyle, $scope.textSize);
                    }
                    $('#textDiv').attr('hidden', true);
                    $('#textInput').val('');
                }
                if (e.target.id == 'codeInput' && !e.shiftKey) {
                    e.preventDefault();
                    var codeArr = $('#codeInput').val().split('\n');
                    if ($scope.currentLobby) {
                        socket.emit('draw_code', { arr: codeArr, mX: mouse.typeX, mY: mouse.typeY, sL: scrLeft, sT: scrTop, color: $scope.fillStyle, font: $scope.textSize });
                    }
                    else {
                        drawCode(codeArr, mouse.typeX, mouse.typeY, scrLeft, scrTop, $scope.fillStyle, $scope.textSize);
                    }
                    $('#codeDiv').attr('hidden', true);
                    $('#codeInput').val('');
                }
                $scope.typeClicked = false;
            }
        }
        if (e.keyCode == 27 && !e.shiftKey) {              // Escape
            // Close sidebar menu if open
            if ($scope.menuOpen) {
                $('#sidebar').animate({ left: -300, width: 300}, 600);
                $('#sideBorder').animate({ left: 290 }, 600);
                $('#menuHam').animate({
                    left: 10, top: 10, borderTopLeftRadius: 15, borderBottomLeftRadius: 15, borderTopRightRadius: 15
                }, 600);
                $scope.menuOpen = false;
            }
            else if ($scope.showLoad) {
                $scope.toggleLoad(true);
            }
            else if ($scope.showColor) {
                $('#pickerDiv').attr('hidden', true);
                $scope.showColor = false;
            }
            else {
                // Drawing reset
                $('#tmp_canvas').css('cursor', 'cell');
                $scope.strokeStyle = '#ffffff';
                $scope.fillStyle   = '#ffffff';
                $scope.lineWidth   = 3;
                $scope.shape.type = null;
                // Typing reset
                $scope.typing      = false;
                $scope.typeClicked = false;
                $('#textInput').blur();
                $('#codeInput').blur();
                $('#textDiv').attr('hidden', true);
                $('#codeDiv').attr('hidden', true);
                $scope.changeInput('brush');
                // Toolbar values/focus reset
                $('#clearBtn').blur();
                $('#color').blur();
                $('#color').val('#ffffff');
                $('#color').css('background', '#ffffff');
                $('#toolColorBox').css('background', '#ffffff');
                $('#toolSizeBoxValue').blur();
                $('#toolSizeSlideValue').blur();
                $('#toolSizeBoxValue').val(3);
                $('#toolSizeSlideValue').val(3);
                $('#textSizeBoxValue').blur();
                $('#textSizeSlideValue').blur();
                $('#textSizeBoxValue').val(12);
                $('#textSizeSlideValue').val(12);
            }
        }
    })

    $(document).on('keyup', function(e) {
        // Keyboard shortcuts
        if (!$scope.typeClicked && !$scope.menuOpen && !e.shiftKey) {
            switch (e.key) {
                case 'b': $scope.changeInput('brush'); break;
                case 'e': $scope.changeInput('eraser');break;
                case 't': $scope.changeInput('text');  break;
                case 'c': $scope.changeInput('code');  break;
                case 'q': $scope.changeInput('rectF'); break;
                case 'w': $scope.changeInput('rectH'); break;
                case 'a': $scope.changeInput('circF'); break;
                case 's': $scope.changeInput('circH'); break;
            }
        }
        if (e.keyCode == 16) {      // Shift
            if (mouse.dragging) {
                mouse.dragging  = false;
                mouse.click     = false;
            }
            // Reset cursor on Shift lift
            if ($scope.shape.type) {
                $('#tmp_canvas').css('cursor', 'crosshair');
            }
            else if ($scope.typing) {
                $('#tmp_canvas').css('cursor', 'text');
            }
            else {
                $('#tmp_canvas').css('cursor', 'cell');
            }
        }
        if (e.shiftKey && e.keyCode == 27 && !$scope.menuOpen) {    // Shift + Esc
            $('#sidebar').animate({ left: 0}, 800);
            $('#sideBorder').animate({ left: 290 }, 800);
            $('#menuHam').animate({
                left: 295, top: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0
            }, 800);
            $scope.menuOpen = true;
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
            if (e.pageX > 289) {
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
            $('#sideBorder').animate({ left: 290 }, 600);
            $('#menuHam').animate({
                left: 10, top: 10, borderTopLeftRadius: 15, borderBottomLeftRadius: 15, borderTopRightRadius: 15
            }, 600);
            $scope.menuOpen = false;
        }
    })

    // Handling focus/shortcuts in toolbar
    // Color picker
    $('#color').on('focus', function(e) {
        $scope.typeClicked = true;
    })
    $('#color').on('focusout', function(e) {
        $scope.typeClicked = false;
    })
    $('#color').on('keydown', function(e) {
        // Set color and lose focus on Enter
        if (e.keyCode == 13) {
            var color = $('#color').val();
            $scope.fillStyle = color;
            $scope.strokeStyle = color;
            $('#color').val(color);
            $('#color').css('background', color);
            $('#toolColorBox').css('background', color);
            $('#color').blur();
        }
    })
    // Brush size input/slider
    $('#toolSizeBoxValue').on('focus', function(e) {
        $scope.typeClicked = true;
    })
    $('#toolSizeBoxValue').on('focusout', function(e) {
        $scope.typeClicked = false;
    })
    $('#toolSizeBoxValue').on('keydown', function(e) {
        // Set size and lose focus on Enter
        if (e.keyCode == 13) {
            var size = $('#toolSizeBoxValue').val();
            $scope.lineWidth = size;
            $('#toolSizeBoxValue').val(size);
            $('#toolSizeSliderValue').val(size);
            $('#toolSizeBoxValue').blur();
        }
    })
    // Text size input/slider
    $('#textSizeBoxValue').on('focus', function(e) {
        $scope.typeClicked = true;
    })
    $('#textSizeBoxValue').on('focusout', function(e) {
        $scope.typeClicked = false;
    })
    $('#textSizeBoxValue').on('keydown', function(e) {
        // Set size and lose focus on Enter
        if (e.keyCode == 13) {
            var size = $('#textSizeBoxValue').val();
            $scope.lineWidth = size;
            $('#textSizeBoxValue').val(size);
            $('#textSizeSliderValue').val(size);
            $('#textSizeBoxValue').blur();
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
    $('.toolBtn').on('mouseover', function(e) {
        $('.toolBtn').css('cursor', 'pointer');
    })

})
