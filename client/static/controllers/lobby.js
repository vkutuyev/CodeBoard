Array.prototype.returnThisMode = function(mode) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].toLowerCase() == mode) {
            return i;
        }
    }
    return false;
}
app.controller('LobbyController', function($http, $scope, $location, socket) {
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
    $scope.colorDrop    = false;
    $scope.showLoad     = false;
    $scope.filePicked   = null;
    $scope.movingView   = false;
    $scope.minimapOpen  = true;
    $scope.showHelp     = false;
    $scope.showPop      = false;
    // File Sharing
    $scope.showChatFile = false;
    $scope.lobbyFile    = null; //qwe
    // Screenshots
    $scope.screenshots  = {};
    // Shapes
    $scope.shape        = {
        type: '',
        startX: '',
        startY: '',
        width: '',
        height: '',
        drawing: false
    };
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
            $('#scrollPop').fadeOut(2000);
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
            if (type == 'line' || type == 'arrow') {
                var lineX = width + distX;
                var lineY = height + distY;
                // Line
                shapeContext.beginPath();
                shapeContext.moveTo(startX + distX, startY + distY);
                shapeContext.lineTo(lineX, lineY);
                shapeContext.strokeStyle = strCol;
                shapeContext.lineWidth   = lineWidth;
                shapeContext.lineCap     = 'round';
                shapeContext.lineJoin    = 'round';
                if (type == 'arrow') {
                    // Arrowhead dimensions
                    var lineAngle     = Math.atan2(height - startY, width - startX);
                    var arrHeadLen    = lineWidth * 10;
                    var arrHeadTopAng = lineAngle + Math.PI + .3;
                    var arrHeadBotAng = lineAngle + Math.PI - .3;
                    var topx = (lineX) + Math.cos(arrHeadTopAng) * arrHeadLen;
                    var botx = (lineX) + Math.cos(arrHeadBotAng) * arrHeadLen;
                    var topy = (lineY) + Math.sin(arrHeadTopAng) * arrHeadLen;
                    var boty = (lineY) + Math.sin(arrHeadBotAng) * arrHeadLen;
                    // Drawing the arrowhead
                    shapeContext.moveTo(topx, topy);
                    shapeContext.lineTo(lineX, lineY);
                    shapeContext.lineTo(botx, boty);
                    var cpx = (topx + lineX + botx) / 3;
                    var cpy = (topy + lineY + boty) / 3;
                    shapeContext.quadraticCurveTo(cpx, cpy, topx, topy);
                    shapeContext.fillStyle = filCol;
                    shapeContext.fill();
                }
                shapeContext.stroke();
                shapeContext.closePath();
            }
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
        },
        updateMinimap = function() {
            min_ctx.clearRect(0, 0, minimap.width, minimap.height);
            min_ctx.drawImage(canvas, 0, 0, minimap.width, minimap.height);
        };
        updateViewbox = function(x, y) {
            var width  = window.innerWidth  / 10,
                height = window.innerHeight / 10;
            view_ctx.clearRect(0, 0, viewbox.width, viewbox.height);
            view_ctx.strokeStyle = 'red';
            view_ctx.lineWidth   = 1;
            view_ctx.strokeRect(x / 10, y / 10, width, height);
        };

    // Scope functions
    $scope.menu_tab_selection = function(menu_tab) {
        $scope.menu_tab = menu_tab;
        switch (menu_tab) {
            case 1:
                setTimeout(function() {
                    $('.chat_enter_name_input').focus();
                    $('.chat_input_textarea').focus();
                }, 0)
            case 2:
                setTimeout(function () {
                    editor.focus();
                    var row = editor.session.getLength() - 1
                    var column = editor.session.getLine(row).length // or simply Infinity
                    editor.gotoLine(row + 1, column)
                }, 0);
        }
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
    $scope.menu_create_send = function(event) {
        switch (event.keyCode) {
            case 13:
                if (!$scope.lobby_name) {
                    $scope.showNotification('Must Enter Lobby Name', 'bad');
                    $('#menu_create_send').fadeOut(300).fadeIn(300).fadeOut(300).fadeIn(300);
                }
                else {
                    $scope.createLobby();
                    $scope.menu_create_active = 0;
                }
                break;
            case 27:
                $scope.menu_create_active = 0;
                break;
        }
    }
    $scope.menu_join_send = function(event) {
        switch (event.keyCode) {
            case 13:
                if (!$scope.join_lobby) {
                    $scope.showNotification('Must Enter Lobby Name', 'bad');
                    $('#menu_join_send').fadeOut(300).fadeIn(300).fadeOut(300).fadeIn(300);
                }
                else {
                    $scope.joinLobby();
                    $scope.menu_join_active = 0;
                }
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
            updateMinimap();
        }
    }
    $scope.saveCanvas = function() {
        $('#saveBtn').blur();
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
    $scope.loadCanvas = function(image) {
        $scope.toggleLoad(true);
        // Process image data
        var fr = new FileReader();
        fr.readAsDataURL(image);
        fr.onload = function() {
            context.clearRect(0, 0, width, height);
            var source  = fr.result,
                img     = new Image();
                img.src = source;
            // Check image and scale down if it's too big
            var scale = 1;
            if (img.width > 1950 && img.height < 1460) {
                scale = 1950 / img.width;
            }
            else if (img.width < 1950 && img.height > 1460 ) {
                scale = 1460 / img.height;
            }
            else if (img.width > 1950 && img.height > 1460) {
                scale = Math.min(1950/img.width, 1460/img.height);
            }
            img.onload = function() {
                if ($scope.currentLobby) {
                    socket.emit('load_image', {src: img.src, scale: scale});
                }
                else {
                    context.drawImage(img, 0, 0, img.width*scale, img.height*scale);
                    $scope.showNotification('Image Loaded');
                    updateMinimap();
                }
            }
        }
    }
    $scope.loadReset = function() {
        $scope.filePicked = null;
        $('#fileInput').css('height', 180);
        $('#fileSubDiv').attr('hidden', true).css('opacity', 0);
        var canvFile = $("#canvFile");
        canvFile.replaceWith( canvFile = canvFile.clone( true ) );
        canvFile = document.getElementById('canvFile');
        canvFile.addEventListener('change', $scope.fileSelect, false);
    }
    $scope.showNotification = function(msg, type) {
        $('#notifDiv').css('top', -35);
        $('#notifDiv').stop();
        switch (type) {
            case 'good': $('#notifDiv').css('background', 'rgb(127, 224, 42)'); break;
            case 'bad':  $('#notifDiv').css('background', 'rgb(198, 49, 16)');  break;
            default:     $('#notifDiv').css('background', 'rgb(60, 134, 232)'); break;
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
                $scope.colorDrop   = false;
            }
            else if (input == 'eraser') {
                $($('.toolBtn')[1]).css('opacity', 0);
                $($('.toolBtn')[1]).animate({ opacity: 1}, 500);
                $($('.toolBtn')[1]).addClass('activeBtn');
                $('#tmp_canvas').css('cursor', 'cell');
                $scope.shape.type  = null;
                $scope.typing      = false;
                $scope.typeClicked = false;
                $scope.colorDrop   = false;
                $scope.strokeStyle = '#000000';
            }
            else if (input == 'drop') {
                $($('.toolBtn')[10]).css('opacity', 0);
                $($('.toolBtn')[10]).animate({ opacity: 1}, 500);
                $($('.toolBtn')[10]).addClass('activeBtn');
                $('#tmp_canvas').css({'cursor':"url('../img/dropper-small.png'), auto"});
                $scope.colorDrop   = true;
                $scope.shape.type  = null;
                $scope.typing      = false;
                $scope.typeClicked = false;
            }
            else {
                var ind;
                switch (input) {
                    case 'line' : ind = 4; break;
                    case 'arrow': ind = 5; break;
                    case 'rectF': ind = 6; break;
                    case 'rectH': ind = 7; break;
                    case 'circF': ind = 8; break;
                    case 'circH': ind = 9; break;
                }
                $($('.toolBtn')[ind]).css('opacity', 0);
                $($('.toolBtn')[ind]).animate({ opacity: 1}, 500);
                $($('.toolBtn')[ind]).addClass('activeBtn');
                $('#tmp_canvas').css('cursor', 'crosshair');
                $scope.shape.type  = input;
                $scope.typing      = false;
                $scope.typeClicked = false;
                $scope.colorDrop   = false;
            }
        }
        // Typing
        else {
            $('#toolSize').attr('hidden', true);
            $('#textSize').attr('hidden', false);
            $scope.typing     = true;
            $scope.shape.type = null;
            $scope.colorDrop  = false;
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
        if (!show) { $('#pickerDiv').fadeIn(500);  }
        else       { $('#pickerDiv').fadeOut(500); }
        $scope.showColor = !show;
    }
    $scope.toggleLoad = function(load) {
        $('#loadBtn').blur();
        $scope.showLoad = !load;
        if (load) {
            $('#fileInput').fadeOut(300);
            $scope.loadReset();
            $('#loadBtn').css({
                background: 'white', color: 'black', border: '1px solid rgb(168, 168, 168)', boxShadow: 'none'
            });
        }
        else {
            $('#fileInput').fadeIn(300);
            $('#loadBtn').css({
                background: 'rgb(5, 187, 160)', color: 'black', border: '1px solid black', boxShadow: '0px 0px 2px black'
            });
        }
    }
    $scope.fileSelect = function(e) {
        if (e.target.files[0]) {
            $scope.fileCheck(e.target.files[0]);
        }
    }
    $scope.fileCheck = function(image) {
        var type = image.type;
        if (type == 'image/gif' || type == 'image/png' || type == 'image/jpg' || type == 'image/jpeg') {
            $scope.filePicked = image;
            // Format name for display
            var name = image.name;
            if (image.name.length > 20) {
                var nameArr = image.name.split('.');
                name = '';
                for (var i = 0; i < nameArr.length-1; i++) { name += nameArr[i]; }
                name = name.substring(0,15);
                name += '...' + nameArr[nameArr.length-1];
            }
            // Format size for display
            var size = '' + image.size;
            var formSize = '';
            if (size.length > 6) {
                formSize  = size.substring(0, size.length-6) + '.';
                formSize += size.substring(size.length-6, size.length-5) + ' MB';
            }
            else {
                formSize  = size.substring(0, size.length-3) + ' KB';
            }
            // Set upload display
            $('#fileName').text(name);
            $('#fileSize').text(formSize);
            // Show bottom section
            $('#fileInput').animate({height: 250}, 300);
            $('#fileSubDiv').attr('hidden', false).delay(300).animate({opacity: 1}, 300);
        }
        else {
            $scope.showNotification('Must select an image file (png, jpg, gif)', 'bad');
        }
    }
    $scope.toggleScreenshots = function() {
        $('.shotNameInput').val('');
        for (var i = 0; i < 3; i++) {
            $($('.shotNameInput')[i]).val($scope.screenshots[i].name);
            if ($scope.screenshots[i].img) {
                $($('.shotFirst')[i]).css('color', 'green');
            }
            else {
                $($('.shotFirst')[i]).css('color', 'black');
            }
        }
        $('.shotFirst i').on('mouseover', function(e) {
            var screenshot = $scope.screenshots[e.target.id].img;
            if (screenshot) {
                $scope.showScreenshot(screenshot, e);
            }
        })
        $('.shotFirst i').on('mouseout', function(e) {
            $('#shotPreview').fadeOut(300);
        })
        // Canvas screenshot saving on Enter
        $('.shotNameInput').unbind('keyup');
        $('.shotNameInput').on('keyup', function(e) {
            if (e.keyCode == 13) {
                $($('.shotNameInput')[e.target.title]).blur();
                $scope.saveScreenshot(e.target.title);
            }
        })
    }
    $scope.showScreenshot = function(screenshot, e) {
        var mouse       = mouseCoords(e);
        var preview     = new Image();
        preview.src = screenshot;
        preview.width  = 400;
        preview.height = 300;
        $('#shotPreview').html(preview);
        $('#shotPreview').css({top: e.pageY-320, left: e.pageX+25});
        $('#shotPreview').fadeIn(500);
    }
    $scope.saveScreenshot = function(ind) {
        var board = canvas.toDataURL(),
            name  = $('.shotNameInput')[ind].value,
            time  = moment().format('M/D h:mma');
        if (name) {
            socket.emit('screenshot', { index: ind, name: name, canvas: board, time: time });
            $scope.showNotification('Canvas Saved', 'good');
        }
        else {
            $scope.showNotification('Must enter canvas name.', 'bad');
            $($('.shotNameInput')[ind]).fadeTo(250, 0.2).fadeTo(250, 1).fadeTo(250, 0.2).fadeTo(250, 1);
        }
    }
    $scope.loadScreenshot = function(ind) {
        var img = $scope.screenshots[ind].img;
        if (img) {
            socket.emit('load_image', {src: img, scale: 1});
        }
    }
    $scope.toggleMinimap = function(show) {
        if (show) {
            $('#minimapBtnHelpDiv').stop().animate({right: 115}, 400);
            $('#minimap').stop().animate({right: -122}, 400);
            $('#viewbox').stop().animate({right: -122}, 400);
            $('#minimapBtn').stop().animate({right: 83}, 400)
            $('#minimapBtn').removeClass('fa-angle-double-right').addClass('fa-angle-double-left');
            $scope.minimapOpen = false;
        }
        else {
            $('#minimapBtnHelpDiv').stop().animate({right: 320}, 400);
            $('#minimap').stop().animate({right: 83}, 400);
            $('#minimapBtn').stop().animate({right: 288}, 400);
            $('#viewbox').stop().animate({right: 83}, 400);
            $('#minimapBtn').removeClass('fa-angle-double-left').addClass('fa-angle-double-right');
            $scope.minimapOpen = true;
        }
    }
    $scope.toggleHelp = function() {
        if (!$scope.showHelp) {
            $('#helpDiv').css({
                color: 'black', background: 'rgb(5, 187, 160)', border: '1px solid black', boxShadow: '0px 0px 2px black'
            });
            $('.helpDiv').fadeIn(600);
        }
        else {
            $('#helpDiv').css({
                color: 'rgb(168,168,168)', background: 'white', border: '1px solid rgb(198, 198, 198)', boxShadow: 'none'
            });
            $('.helpDiv').fadeOut(600);
        }
        $scope.showHelp = !$scope.showHelp;
    }
    $scope.togglePop = function(name, func, args) {
        if (!args) { args = ''; }
        var text = {
            'clear' : "Clear canvas for lobby?\nUnsaved changes will be lost.",
            'load'  : "Overwrite canvas with image?\nUnsaved changes will be lost.",
            'screen': "Overwrite canvas with screenshot?\nUnsaved changes will be lost."
        }
        $scope.showPop = !$scope.showPop;
        $('#popText').text(text[name]);
        if ($scope.showPop) {
            // Prevent screenshot loading popup if no screenshot is saved
            if (name == 'screen') {
                if (!$scope.screenshots[args].name) {
                    $scope.showPop = !$scope.showPop;
                    return;
                }
            }
            $('#popBack').fadeTo(400, 0.5);
            $('#popMain').fadeIn(400);
            var callback = function() {
                func(args);
                $('#popConfBtn').unbind();
                $('#popBack').fadeOut(400);
                $('#popMain').fadeOut(400);
                $scope.showPop = false;
            };
            $('#popConfBtn').bind('click', callback);
        }
        else {
            $('#popBack').fadeOut(400);
            $('#popMain').fadeOut(400);
        }
    }
    $scope.sampleColor = function(coords) {
        var distX = document.getElementById('lobbyDiv').scrollLeft;
        var distY = document.getElementById('lobbyDiv').scrollTop;
        var x = coords.x + distX;
        var y = coords.y + distY;
        var rgb = context.getImageData(x, y, 1, 1).data;
        var r = rgb[0].toString(16);
        var g = rgb[1].toString(16);
        var b = rgb[2].toString(16);
        r = r.length == 1 ? "0"+r : r;
        g = g.length == 1 ? "0"+g : g;
        b = b.length == 1 ? "0"+b : b;
        var hex = '#'+r+g+b;
        var picker = $.farbtastic('#colorPicker');
        $scope.fillStyle   = hex;
        $scope.strokeStyle = hex;
        $('#color').val(hex);
        $('#color').css('background', hex);
        $('#toolColorBox').css('background', hex);
        picker.setColor(hex);
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

        // Chat file check
        var chatFile = document.getElementById('chat_file_input');
        chatFile.addEventListener('change', $scope.chatFileSelect, false);
        // Canvas file check/drop
        var fileDrop = document.getElementById('fileDrop'),
            canvFile = document.getElementById('canvFile');
        canvFile.addEventListener('change', $scope.fileSelect, false);
        fileDrop.addEventListener('dragover', fileDragOver, false);
        fileDrop.addEventListener('drop', fileDropHandler, false);
        function fileDragOver(e) {
            e.stopPropagation();
            e.preventDefault();
        }
        function fileDropHandler(e) {
            e.stopPropagation();
            e.preventDefault();
            $scope.fileCheck(e.dataTransfer.files[0]);
        }

        // Code Editor Message
        var editMsg = "";
                    // + "/*";
                    // + "\n\t\t\t\t" +" "+" "+ "&lt;/>"
                    // + "\n\t\t\t"   +" "+" "+ "Code Editor"
                    // + "\n*/\n";
        $('#editor').html(editMsg);

        // Help message pop-up
        var msg = '<i class="fa fa-arrow-up" aria-hidden="true"></i>\nClick Me';
        $('#helpMsgPop').html(msg);
        $('#helpMsgPop').delay(1000).fadeIn(800).delay(3000).fadeOut(800);

    })

    //////////////////////////////////////////
    ///            Code Editor             ///
    //////////////////////////////////////////
    $scope.modes = ['JavaScript', 'PHP', 'SQL', 'Python']
    $scope.code_edit_mode = $scope.modes[0];
    var editor;
    setTimeout(function () {
        editor = ace.edit('editor');
        editor.setTheme('ace/theme/sqlserver');
        editor.getSession().setMode('ace/mode/javascript');
        editor.getSession().setUseWrapMode(false);
        editor.getSession().setUseWorker(false);
        editor.$blockScrolling = Infinity;
    }, 0);
    $('#editor').on('keyup', function(e) {
        editor.resize();
        if ($scope.currentLobby) {
            socket.emit('code_edit', { id: socket.currentId(), code: editor.getValue()});
        }
    })
    $scope.change_code_edit_mode = function() {
        var mode = $scope.code_edit_mode.toLowerCase();
        editor.getSession().setMode('ace/mode/'+mode);

        if ($scope.currentLobby) {
            socket.emit('code_edit_mode_switching', {mode: mode});
        }
    }
    socket.on('code_edit', function(data) {
        if (socket.currentId() != data.id) {
            editor.setValue(data.code);
        }
    });
    socket.on('code_edit_mode_switch', function(data) {
        if (socket.currentId() != data.id) {
            $scope.code_edit_mode = $scope.modes[$scope.modes.returnThisMode(data.mode)];
            var mode = $scope.code_edit_mode.toLowerCase();
            editor.getSession().setMode('ace/mode/'+mode);
        }
    })


    //////////////////////////////////////////
    ///            Lobby System            ///
    //////////////////////////////////////////
    //Checks the lobby
    $http.get('/session/getLobby').success(function(data) {
        if (data.lobby) {
            socket.emit('join_lobby', {path: data.lobby});
        }
    });
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
            $http.post('/session/setLobby', {lobby: data.lobby_data.id});
            $('.shotNameInput').val('');
            $scope.join_lobby = '';
            $scope.currentLobby = data.lobby_data.id;
            // Clear canvas and load savestate
            context.fillRect(0,0,canvas.width,canvas.height);
            if (data.lobby_data.savestate) {
                var board    = new Image;
                board.src    = data.lobby_data.savestate;
                board.onload = function() {
                    context.drawImage(board, 0, 0);
                    updateMinimap();
                }
            }
            // Setting the new stuff
            $scope.users       = data.lobby_data.users;
            $scope.messages    = data.lobby_data.chatlog;
            $scope.screenshots = data.lobby_data.screenshots;
            editor.setValue(data.lobby_data.textCode);
            $scope.code_edit_mode = $scope.modes[$scope.modes.returnThisMode(data.lobby_data.modeCode)];
            editor.getSession().setMode('ace/mode/'+ data.lobby_data.modeCode);
            $scope.showChatFile = true;
            $scope.toggleChatFile();
            var msg = 'Joined Lobby: ' + data.lobby_data.id;
            $scope.showNotification(msg, 'good');
            setTimeout(function(){
                $scope.toggleScreenshots();
            }, 100);
        } else {
            var msg = 'Lobby not found: ' + data.lobby_data;
            $scope.showNotification(msg, 'bad');
            $http.post('/session/setLobby', {lobby: ''});
        }
    })
    $scope.createLobby = function() {
        var path  = $scope.lobby_name;
        var board = canvas.toDataURL();
        $scope.lobby_name = '';
        // Create new lobby with existing board/code
        socket.emit('create_lobby', {path: path, canvas: board, code: editor.getValue()});
    }
    $scope.joinLobby = function() {
        var path = $scope.join_lobby;
        $scope.join_lobby = '';
        socket.emit('join_lobby', {path: path});
    }
    $scope.leaveLobby = function() {
        $('#leaveBtn').blur();
        socket.emit('leave_lobby', {path: $scope.currentLobby});
        $scope.currentLobby = '';
        $scope.chat_name    = '';
        $scope.screenshots  = [];
        $http.post('/session/setLobby', {lobby: ''});
        $scope.showNotification('Offline Mode');
    }

    //////////////////////////////////////////
    ///             Chat System            ///
    //////////////////////////////////////////
    $scope.enterChat = function() {
        if ($scope.enter_chat_name) {
            var nameCheck = true;
            for (var user in $scope.users) {
                if ($scope.users[user].name == $scope.enter_chat_name) {
                    nameCheck = false;
                    break;
                }
            }
            if (!nameCheck) {
                $scope.showNotification('Name Taken, Please Choose Another', 'bad');
            }
            else {
                $scope.chat_name = $scope.enter_chat_name;
                if ($scope.chat_name.length > 20) {
                    $scope.chat_name = $scope.chat_name.substring(0, 20) + "...";
                }
                socket.emit('user_send', {name: $scope.chat_name});
                $scope.enter_chat_name = '';
                setTimeout(function () {
                    $('.chat_input_textarea').focus();
                    $('.chat_message_show').scrollTop($('.chat_message_show')[0].scrollHeight);
                    if ($scope.messages) {
                        var userLength = $('.chatNameSpan').length;
                        for (var i = 0; i < userLength; i++) {
                            if ($('.chatNameSpan')[i].innerHTML == $scope.chat_name) {
                                $($('.chatName')[i]).css('background', 'rgb(169, 196, 224)');
                            }
                        }
                    }
                }, 0);
            }
        }
        else {
            $scope.showNotification('Must Enter Name', 'bad');
        }
    }
    $scope.chat_send_message = function() {
        if ($scope.chat_message) {
            var count   = $scope.messages.length-1,
                time    = moment().format('k:mm'),
                name    = $scope.chat_name;
            while (count >=0) {
                if ($scope.messages[count].name == $scope.chat_name) {
                    name = '';
                    break;
                }
                else if ($scope.messages[count].name == '') { count--; }
                else { break; }
            }
            socket.emit('message_send', {name: name, message: $scope.chat_message, time: time});
            $scope.chat_message = '';
        }
    }
    $scope.toggleChatFile = function() {
        $scope.showChatFile = !$scope.showChatFile;
        if ($scope.showChatFile) {
            // Show
            $('#chat_file_div').css('width', '5').css('height', '5');
            $('#chat_file_head').css('display', 'none');
            $('#chat_file_info').css('display', 'none');
            $('.chat_file').css('display', 'none');
            $('#chat_file_div').fadeIn(5).animate({width: '300', height: '150'}, 400);;
            setTimeout(function () {
                $('#chat_file_head').css('display', 'block');
                $('.chat_file').css('display', 'block');
            }, 450);
        }
        else {
            // Hide and reset file input
            $('#chat_file_div').fadeOut(200);
            setTimeout(function () {
                $scope.chatFile = null;
            }, 300);
            var input = $("#chat_file_input");
            input.replaceWith( input = input.clone( true ) );
            input = document.getElementById('chat_file_input');
            input.addEventListener('change', $scope.chatFileSelect, false);
        }
    }
    $scope.chatFileSelect = function() {
        var file = document.getElementById('chat_file_input').files[0];
        if (file) {
            if (file.size < 50000000) {
                // Format size for display
                var size = '' + file.size;
                var formSize = '';
                if (size.length > 6) {
                    formSize  = size.substring(0, size.length-6) + '.';
                    formSize += size.substring(size.length-6, size.length-5) + ' MB';
                }
                else if (size.length > 3) {
                    formSize = size.substring(0, size.length-3) + 'kb';
                }
                else {
                    formSize = size + 'b';
                }
                // Format name for display
                var name = file.name;
                var formName = '';
                if (name.length > 25) {
                    formName = name.substring(0, 15) + '...';
                    formName += name.substring(name.length-7);
                }
                else { formName = name; }
                // Display file
                $scope.chatFile = file.name;
                $('.chat_file_name').text(formName);
                $('.chat_file_size').text(formSize);
                $('.chat_file').fadeOut(400);
                $('#chat_file_info').delay(400).fadeIn(200);
            }
            else {
                // File too big
                $scope.showNotification('File must be smaller than 50MB in size', 'bad');
                var input = $("#chat_file_input");
                input.replaceWith( input = input.clone( true ) );
                input = document.getElementById('chat_file_input');
                input.addEventListener('change', $scope.chatFileSelect, false);
            }
        }
    }
    $scope.chatFileReset = function() {
        // Reset File
        $scope.chatFile = null;
        var input = $("#chat_file_input");
        input.replaceWith( input = input.clone( true ) );
        input = document.getElementById('chat_file_input');
        input.addEventListener('change', $scope.chatFileSelect, false);
        // Reset window
        $('#chat_file_info').fadeOut(400);
        $('.chat_file').delay(400).fadeIn(200);
    }
    //qwe
    $scope.chatFileUpload = function() {
        var file = document.getElementById('chat_file_input').files[0];
        console.log('upload file: ', file);
    }

    socket.on('messages_receive', function(messages) {
        var scrHeight = $('.chat_message_show')[0].scrollHeight,
            scrTop    = $('.chat_message_show')[0].scrollTop,
            height    = parseInt($('.chat_message_show')[0].style.height);
        //Data must be an array of messages
        $scope.messages = messages;
        setTimeout(function() {
            if (scrTop + height == scrHeight) {
                $('.chat_message_show').stop().animate({ scrollTop: scrHeight }, 800);
            }
            var userLength = $('.chatNameSpan').length;
            for (var i = 0; i < userLength; i++) {
                if ($('.chatNameSpan')[i].innerHTML == $scope.chat_name) {
                    $($('.chatName')[i]).css('background', '#aac5e1');
                }
            }
        }, 0);
    })
    socket.on('users_receive', function(data) {
        //Data must be an array of users
        $scope.users = data.users;
        $('.chat_message_show').height(Math.abs(parseInt($('#menuLine').offset().top)-parseInt($('.chat_input').offset().top))-(3*parseInt($('#menuLine').css('margin-bottom'))));
        if (!data.left && (data.name != $scope.chat_name)) {
            $scope.showNotification(data.name + ' Has Joined Chat');
        }
        else if (data.left) {
            var name = data.name == "No name" ? "Anonymous User" : "User " + data.name;
            $scope.showNotification(name + ' Has Left Chat');
        }
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
    // Setting up minimap canvas
    var minimap        = document.getElementById('minimap');
    var min_ctx        = minimap.getContext('2d');
    minimap.width      = 200;
    minimap.height     = 150;
    // Setting up viewbox canvas
    var viewbox        = document.getElementById('viewbox');
    var view_ctx       = viewbox.getContext('2d');
    viewbox.width      = 200;
    viewbox.height     = 150;
    updateViewbox(0, 0);

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
            if ($scope.shape.type || $scope.typing || $scope.colorDrop) {
                boundRect = tmp_canvas.getBoundingClientRect();
            }
            else { boundRect = canvas.getBoundingClientRect(); }
        }
        // Offline
        else {
            boundRect = tmp_canvas.getBoundingClientRect();
            if (!$scope.shape.type) { context.beginPath(); }
        }
        // Grab current mouse pos
        mouse.pos = mouseCoords(e);
        context.moveTo(mouse.pos.x, mouse.pos.y);
        // Color dropper
        if ($scope.colorDrop && mouse.click) {
            $scope.sampleColor(mouse.pos);
        }
        // Drawing shape
        if ($scope.shape.type && mouse.click && !$scope.colorDrop) {
            $scope.shape.drawing = true;
            $scope.shape.startX  = mouse.pos.x;
            $scope.shape.startY  = mouse.pos.y;
        }
        // Typing
        if ($scope.typing && mouse.click && !$scope.colorDrop) {
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
        // Color dropper
        if ($scope.colorDrop && mouse.click) {
            var coords = mouseCoords(e);
            $scope.sampleColor(coords);
        }
        // Drawing shape
        if ($scope.shape.drawing && !mouse.dragging && !$scope.colorDrop) {
            var coords = mouseCoords(e);
            if ($scope.shape.type == 'line' || $scope.shape.type == 'arrow') {
                $scope.shape.width  = coords.x;
                $scope.shape.height = coords.y;
            }
            else {
                $scope.shape.width  = coords.x - $scope.shape.startX;
                $scope.shape.height = coords.y - $scope.shape.startY;
            }
            tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
            drawShape(tmp_ctx, $scope.shape.type, $scope.strokeStyle, $scope.fillStyle, $scope.lineWidth, $scope.shape.startX, $scope.shape.startY, $scope.shape.width, $scope.shape.height, 0, 0);
        }
        else {
            // Drawing
            if (mouse.click && !mouse.dragging && !$scope.typing && !$scope.colorDrop) {
                mouse.pos = mouseCoords(e);
                pts.push(mouse.pos);
                // Offline
                if (!$scope.currentLobby) {
                    onPaint(pts, $scope.strokeStyle, $scope.lineWidth, 'off');
                }
                // Connected
                else {
                    if (pts.length > 1) {
                        var last = pts.length-1;
                        socket.emit('draw_line', {
                            line: [pts[last], pts[last-1]], strokeStyle: $scope.strokeStyle, lineWidth: $scope.lineWidth
                        });
                    }
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
                updateViewbox(document.getElementById('lobbyDiv').scrollLeft, document.getElementById('lobbyDiv').scrollTop);
            }
            mouse.pos_prev = mouse.pos;
        }
    }

    // Socket functions
    socket.on('draw_line', function (data) {
        var line = data.line;
        context.beginPath();
        context.moveTo(line[0].x, line[0].y);
        context.lineTo(line[1].x, line[1].y);
        context.strokeStyle = data.strokeStyle;
        context.lineWidth = data.lineWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.stroke();
        context.closePath();
    });
    socket.on('draw_shape', function(shape) {
        drawShape(context, shape.type, shape.strokeStyle, shape.fillStyle, shape.lineWidth, shape.startX, shape.startY, shape.width, shape.height, shape.distX, shape.distY);
        var boardState = canvas.toDataURL();
        socket.emit('savestate', boardState);
    })
    socket.on('board_clear', function() {
        context.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
        updateMinimap();
    })
    socket.on('draw_text', function(data) {
        drawText(data.val, data.mX, data.mY, data.sL, data.sT, data.color, data.font);
        updateMinimap();
    })
    socket.on('draw_code', function(data) {
        drawCode(data.arr, data.mX, data.mY, data.sL, data.sT, data.color, data.font);
        updateMinimap();
    })
    socket.on('load_image', function(data) {
        var img = new Image();
        img.src = data.src;
        img.onload = function() {
            context.drawImage(img, 0, 0, img.width*data.scale, img.height*data.scale);
            $scope.showNotification('Image Loaded');
            updateMinimap();
            var boardState = canvas.toDataURL();
            socket.emit('savestate', boardState);
        }
    })
    socket.on('screenshot', function(screenshots) {
        $scope.screenshots = screenshots;
        $scope.toggleScreenshots();
    })
    socket.on('upadteMap', function() {
        updateMinimap();
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
                else if ($scope.colorDrop) {
                    $('#tmp_canvas').css({'cursor':"url('../img/dropper-small.png'), auto"});
                }
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
            if (!mouse.dragging && !$scope.typing && mouse.click) {
                context.drawImage(tmp_canvas, distX, distY);
                updateMinimap();
            }
        }
        // Connected
        else{
            // Drawing Shape
            if ($scope.shape.type && $scope.shape.drawing && !mouse.dragging) {
                socket.emit('draw_shape', {
                    type: $scope.shape.type, strokeStyle: $scope.strokeStyle, fillStyle: $scope.fillStyle, lineWidth: $scope.lineWidth, startX: $scope.shape.startX, startY: $scope.shape.startY, width: $scope.shape.width, height: $scope.shape.height, distX: distX, distY: distY
                });
                $scope.shape.drawing = false;
            }
            if (!mouse.dragging && !$scope.typing && mouse.click) {
                var boardState = canvas.toDataURL();
                socket.emit('savestate', boardState);
            }
        }
        // Clearing temp canvas
        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
        // Resetting variables
        $scope.clicked   = false;
        mouse.click      = false;
        mouse.dragging   = false;
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
    $('.chat_input').keydown(function(e) {
        if (e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            $('.chat_send_form').submit();
        }
    })
    $('.chat_send_form').submit(function(e) {
        e.preventDefault();
    })
    $(document).on('keydown', function(e) {
        if (e.shiftKey && !mouse.click) {      // Shift
            $('#tmp_canvas').css('cursor', '-webkit-grab');
            $('#tmp_canvas').css('cursor', '-moz-grab');
        }
        if (e.keyCode == 13 && !e.shiftKey) {  // Enter
            // Pop-up
            if ($scope.showPop) {
                e.preventDefault();
                $('#popConfBtn').trigger('click');
            }
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
                    updateMinimap();
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
                    updateMinimap();
                }
                $scope.typeClicked = false;
            }
        }
        if (e.keyCode == 27 && !e.shiftKey) {  // Escape
            if (!$scope.menuOpen) {         // Side menu closed
                if ($scope.showPop) {
                    $scope.togglePop();
                }
                else if ($scope.showHelp) {
                    $scope.toggleHelp();
                }
                else if ($scope.showLoad) {
                    $scope.toggleLoad(true);
                }
                else if ($scope.showColor) {
                    $('#pickerDiv').fadeOut(300);
                    $scope.showColor = false;
                }
                else {
                    // Drawing reset
                    $('#tmp_canvas').css('cursor', 'cell');
                    $scope.strokeStyle = '#ffffff';
                    $scope.fillStyle   = '#ffffff';
                    $scope.lineWidth   = 3;
                    $scope.shape.type  = null;
                    $scope.colorDrop   = false;
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
            else {  // Side menu open
                if ($scope.showPop) {
                    $scope.togglePop();
                }
            }
        }   // End of Escape
        if (e.shiftKey && e.keyCode == 27) {    // Shift + Esc
            e.preventDefault();
            // Close/open sidebar menu
            if ($scope.menuOpen) {
                $('#sidembarMenuBtnHelpDiv').stop().animate({left: 60, top: 18}, 600);
                $('#sidebar').stop().animate({ left: -380, width: 380}, 600);
                $('#sideBorder').stop().animate({ left: -10 }, 600);
                $('#menuHam').stop().animate({
                    left: 10, top: 10, borderTopLeftRadius: 15, borderBottomLeftRadius: 15, borderTopRightRadius: 15
                }, 600);
                $scope.menuOpen = false;
            }
            else {
                $('#sidembarMenuBtnHelpDiv').stop().animate({left: 394, top: 53}, 600);
                $('#sidebar').stop().animate({ left: 0}, 600);
                $('#sideBorder').stop().animate({ left: 380 }, 600);
                $('#menuHam').stop().animate({
                    left: 385, top: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0
                }, 600);
                $scope.menuOpen = true;
            }
        }
        if (e.shiftKey && e.keyCode == 9) { // Shift + Tab
            e.preventDefault();
            // Close/open minimap
            $scope.toggleMinimap($scope.minimapOpen);
        }
        if (e.key == 'h') {
            if (!$scope.menuOpen && !$scope.typing) {
                $scope.toggleHelp();
            }
        }
    })

    $(document).on('keyup', function(e) {
        // Keyboard shortcuts for Canvas
        if (!$scope.typeClicked && !$scope.menuOpen && !e.shiftKey) {
            switch (e.key) {
                case 'b': $scope.changeInput('brush'); break;
                case 'e': $scope.changeInput('eraser');break;
                case 't': $scope.changeInput('text');  break;
                case 'c': $scope.changeInput('code');  break;
                case 'q': $scope.changeInput('line');  break;
                case 'w': $scope.changeInput('arrow'); break;
                case 'a': $scope.changeInput('rectF'); break;
                case 's': $scope.changeInput('rectH'); break;
                case 'z': $scope.changeInput('circF'); break;
                case 'x': $scope.changeInput('circH'); break;
                case 'g': $scope.changeInput('drop');  break;
                case 'f': $scope.toggleColor($scope.showColor); break;
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
            else if ($scope.colorDrop) {
                $('#tmp_canvas').css({'cursor':"url('../img/dropper-small.png'), auto"});
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
            if (e.pageX > 380) {
                $('#sidembarMenuBtnHelpDiv').css('left', e.pageX + 14);
                $('#menuHam').css('left', e.pageX + 5);
                $('#sidebar').css('width', e.pageX);
                $('#sideBorder').css('left', e.pageX);
            }
        }
    })
    // Side menu closing/opening
    $('#menuHam').on('mouseup', function(e) {
        if (!$scope.menuOpen) {
            $('#sidembarMenuBtnHelpDiv').stop().animate({left: 394, top: 53}, 600);
            $('#sidebar').animate({ left: 0}, 600);
            $('#sideBorder').animate({ left: 380 }, 600);
            $('#menuHam').animate({
                left: 390, top: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0
            }, 600);
            $scope.menuOpen = true;
        }
        else{
            $('#sidembarMenuBtnHelpDiv').stop().animate({left: 60, top: 18}, 600);
            $('#sidebar').animate({ left: -380, width: 380}, 600);
            $('#sideBorder').animate({ left: -10 }, 600);
            $('#menuHam').animate({
                left: 10, top: 10, borderTopLeftRadius: 15, borderBottomLeftRadius: 15, borderTopRightRadius: 15
            }, 600);
            $scope.menuOpen = false;
        }
    })
    // Minimap view movement
    $('#viewbox').on('mousedown', function(e) {
        e.preventDefault();
        var divX    = e.pageX - this.offsetLeft,
            divY    = e.pageY - this.offsetTop;
        document.getElementById('lobbyDiv').scrollLeft = divX * 5;
        document.getElementById('lobbyDiv').scrollTop  = divY * 5;
        updateViewbox(document.getElementById('lobbyDiv').scrollLeft, document.getElementById('lobbyDiv').scrollTop);
        $scope.movingView = true;
    })
    $('#viewbox').on('mousemove', function(e) {
        e.preventDefault();
        if ($scope.movingView) {
            $('#viewbox').css('cursor', 'move');
            var divX    = e.pageX - this.offsetLeft,
                divY    = e.pageY - this.offsetTop;
            document.getElementById('lobbyDiv').scrollLeft = divX * 5;
            document.getElementById('lobbyDiv').scrollTop  = divY * 5;
            updateViewbox(document.getElementById('lobbyDiv').scrollLeft, document.getElementById('lobbyDiv').scrollTop);
        }
    })
    $('#viewbox').on('mouseup', function(e) {
        e.preventDefault();
        $('#viewbox').css('cursor', 'default');
        $scope.movingView = false;
    })
    $('#viewbox').on('mouseout', function(e) {
        e.preventDefault();
        $('#viewbox').css('cursor', 'default');
        $scope.movingView = false;
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

    // Sidebar cursor changes
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
    // Toolbar canvas load elements
    $('#canvFile').on('mouseover', function(e) {
        $('#fileLabel').css({ color: 'white', background: 'rgb(198, 198, 198)'});
    })
    $('#canvFile').on('mouseout', function(e) {
        $('#fileLabel').css({ color: 'black', background: 'white'});
    })
    // Load button custom hover Handling
    $('#loadBtn').on('mouseover', function(e) {
        if (!$scope.showLoad) {
            $('#loadBtn').css({ background: 'rgb(198, 198, 198)', color: 'white' });
        }
    })
    $('#loadBtn').on('mouseout', function(e) {
        if (!$scope.showLoad) {
            $('#loadBtn').css({ background: 'white', color: 'black' });
        }
    })
    // Cancelling pop-up on outside click
    $('#popBack').on('click', function(e) {
        $scope.togglePop();
    })

})
