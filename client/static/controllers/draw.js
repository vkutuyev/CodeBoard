app.controller('DrawController', function($scope, $location, socket) {

    var roomId = $location.$$path.substr(1);
    socket.emit('DrawController', {lobby: roomId});

    // Block default right-click menu
    document.addEventListener("contextmenu", function(e){
        e.preventDefault();
    }, false);



    $('div.draw').ready(function() {

        $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
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
        var dragScreen = false;
        // set canvas to full browser width/height
        canvas.width = width;
        canvas.height = height;
        // misc context/canvas settings
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = 'white';
        context.fillStyle = 'white';
        context.lineWidth = 2;
        var dataURL;

        // variables for text inputs
        var typing = false,
            bigTyping = false,
            smallTyping = false,
            erasing = false;
        context.textBaseline = 'top';

        // Dropdown menu sorcery
		//cache nav
		var nav = $("#topNav");
		//add indicators and hovers to submenu parents
		nav.find("li").each(function() {
			if ($(this).find("ul").length > 0) {
				//show subnav on hover
				$(this).mouseenter(function() {
                    if (!dragScreen) {
                        $(this).find("ul").stop(true, true).slideDown();
                    }
				});
				//hide submenus on exit
				$(this).mouseleave(function() {
					$(this).find("ul").stop(true, true).slideUp();
				});
			}
		});

        $(document).on('keydown', function(e){
            if(e.keyCode == 27){          // Pressed escape
                if(typing){
                    var tf = document.getElementById('smalltext');
                    var tf2 = document.getElementById('largetext');
                    tf.hidden = true;
                    tf2.hidden = true;
                    typing = false;
                    $('#ptextinput').val('');
                    $('#ctextinput').val('');
                }
                $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
                erasing = false;
                context.lineWidth = 2;
                context.strokeStyle = 'white';
            }
            if(e.keyCode == 13 && typing && !e.shiftKey){      // Pressed enter
                var inptext, posX, posY;
                var pText = $('#ptextinput').val();
                var cText = $('#ctextinput').val();
                if(pText){
                    inptext = pText;
                    var pos = $("#smalltext").position();
                    if(context.strokeStyle == '#000000'){
                        context.fillStyle = 'white';
                    }
                    else{
                        context.fillStyle = context.strokeStyle;
                    }
                    context.font = "15px Verdana";
                    context.fillText(inptext,pos.left+10,pos.top+10);
                }
                else if(cText){
                    inptext = cText;
                    var pos = $("#largetext").position();
                    var splitstr = inptext.split('\n');
                    if(context.strokeStyle == '#000000'){
                        context.fillStyle = 'white';
                    }
                    else{
                        context.fillStyle = context.strokeStyle;
                    }
                    for(var line of splitstr){
                        context.font = "15px Verdana";
                        context.fillText(line, pos.left, pos.top);
                        pos.top += 20;
                    }
                }
                var tf = document.getElementById('largetext');
                var tf2 = document.getElementById('smalltext');
                tf.hidden = true;
                tf2.hidden = true;
                $('#ptextinput').val('');
                $('#ctextinput').val('');
                typing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});

                // Save screen to png file and send to server
                if(pText || cText){
                    dataURL = canvas.toDataURL();
                    socket.emit('save_canv', { canvas: dataURL, lobby: roomId});
                    socket.emit('savestate', { canvas: dataURL, lobby: roomId});
                }
            }   // End of enter key if check
        })
        var smallText = false;
        var largeText = false;
        // register mouse event handlers
        canvas.onmousedown = function(e){
            $('canvas').focus();
            $('.CETA').blur();
            $('.CETA').css('-webkit-user-select', 'none');

            if(!erasing && context.strokeStyle == '#000000'){
                context.strokeStyle = 'white';
            }

            if(!typing){
                if(e.which==1) {mouse.click = true; }
            }
            else{
                if(smallTyping && e.which != 3){    // Place small text input
                    var tf2 = document.getElementById('largetext');
                    tf2.hidden = true;
                    var tf = document.getElementById('smalltext');
                    tf.hidden = false;
                    tf.style.top = e.clientY - 20 + 'px';
                    tf.style.left = e.clientX - 10 + 'px';
                    smallText = true;
                    erasing = false;
                }
                else if(bigTyping && e.which != 3){     // Place big text area
                    var tf2 = document.getElementById('smalltext');
                    tf2.hidden = true;
                    var tf = document.getElementById('largetext');
                    tf.hidden = false;
                    tf.style.top = e.clientY + 'px';
                    tf.style.left = e.clientX + 'px';
                    largeText = true;
                    erasing = false;
                }
            }
            if(e.which==3) {
                var menu = document.getElementById('rightmenu');
                menu.hidden = !menu.hidden;
                menu.style.top = e.clientY + 'px';
                menu.style.left = e.clientX + 'px';
            }
        };
        canvas.onmouseup = function(e){
            $('.CETA').blur();
            if(e.which==1){
                mouse.click = false;

                dataURL = canvas.toDataURL();
                socket.emit('savestate', { canvas: dataURL, lobby: roomId});
            }
        };
        $(document).mouseup(function(e) {
            if (smallText) {
                $('#ptextinput').focus();
                smallText = false;
                largeText = false;
            }
            if (largeText) {
                $('#ctextinput').focus();
                smallText = false;
                largeText = false;
            }
        })
        canvas.onmousemove = function(e) {
            // normalize mouse position to range 0.0 - 1.0
            mouse.pos.x = e.clientX / width;
            mouse.pos.y = e.clientY / height;
            mouse.move = true;
        };
        $('#rightmenu').mousedown(function(e) {
            var curr = $(this)
            dragScreen = true;
            var left = parseInt(curr.css('left')),
                top  = parseInt(curr.css('top'));

            var lDiff = e.pageX-left,
                tDiff = e.pageY-top;

            $(document).mousemove(function(e) {
                curr.css('left', e.pageX-lDiff);
                curr.css('top', e.pageY-tDiff);
            })
        })
        $(document).mouseup(function(e) {
            if (dragScreen) {
                $(document).off('mousemove')
                dragScreen = false;
            }
        })
        // draw line received from server
        socket.on('draw_line', function (data) {
            var line = data.line;
            context.beginPath();
            context.moveTo(line[0].x * width, line[0].y * height);
            context.lineTo(line[1].x * width, line[1].y * height);
            context.strokeStyle = data.lineColor;
            context.lineWidth = data.penWidth;
            context.lineCap = 'round';
            context.lineJoin = 'round';
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
            socket.emit('clear_board', {lobby: roomId});
        });
        socket.on('cleared', function(){
            canvas.width = canvas.width;
            $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
            context.strokeStyle = 'white';
            context.lineWidth = 2;
        });
        // Pen colors/sizes, reset buttons
        $('button').on('click', function(){

            if(this.id == 'color1'){
                context.strokeStyle = 'blue';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_blue_sm.png'), auto"});
            }
            else if(this.id == 'color2'){
                context.strokeStyle = 'red';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_red_sm.png'), auto"});
            }
            else if(this.id == 'color3'){
                context.strokeStyle = 'green';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_green_sm.png'), auto"});
            }
            else if(this.id == 'color4'){
                context.strokeStyle = 'yellow';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_yellow_sm.png'), auto"});
            }
            else if(this.id == 'color5'){
                context.strokeStyle = 'white';
                erasing = false;
                $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
            }
            else if(this.id == 'eraser'){
                context.strokeStyle = 'black';
                erasing = true;
                $('#drawing').css({'cursor':"url('../img/cursor/eraser_sm.png'), auto"});
            }
            else if(this.id == 'width1'){
                context.lineWidth = 0.5;
                if(context.strokeStyle == '#000000'){ context.lineWidth = 10; }
            }
            else if(this.id == 'width2'){
                context.lineWidth = 2;
                if(context.strokeStyle == '#000000'){ context.lineWidth = 20; }
            }
            else if(this.id == 'width3'){
                context.lineWidth = 5;
                if(context.strokeStyle == '#000000'){ context.lineWidth = 50; }
            }
            else if(this.id == 'simpText'){
                typing = true;
                smallTyping = true;
                bigTyping = false;
                $('#drawing').css({'cursor':'text'});
            }
            else if(this.id == 'bigText'){
                typing = true;
                smallTyping = false;
                bigTyping = true;
                $('#drawing').css({'cursor':'text'});
            }
            // Eraser size reset
            if(context.strokeStyle != '#000000'){
                if(context.lineWidth > 5){
                    context.lineWidth = 5;
                }
            }

        }); // End of $button.on click

        // Loading canvas from screenshot
        socket.on('load_canv', function(data){
            var board = new Image;
            board.src = data;
            canvas.width = canvas.width;
            board.onload = function() {
                context.drawImage(board,0,0, window.innerWidth, window.innerHeight);
            };
            $('#drawing').css({'cursor':"url('../img/cursor/marker_white_sm.png'), auto"});
            context.strokeStyle = 'white';
            context.lineWidth = 2;
        })

        socket.on('get_canv', function(data){
            dataURL = canvas.toDataURL();
            socket.emit('save_canv', { canvas: dataURL, lobby: roomId});
        })

    })  // End of div.draw ready
})
