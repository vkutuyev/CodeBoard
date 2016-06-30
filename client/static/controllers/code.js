app.controller('CodeController', function($scope, $location, socket) {
    var option = {
            resize: false,
            hidden: false,
            shft  : false
        },
        code   = '',
        lobby  = $location.$$path.substr(1);

    socket.emit('CodeController', {lobby: lobby});
    socket.on('toggleTextEditor', function() {toggleTextEditor();})

    $('.codeEdit').height( parseInt($(window).height())- 32 );
    $('.codeEditor').height( $('.codeEdit').height()-32 );

    function toggleTextEditor() {
        if (option.hidden) {
            console.log('currently hidden');
            console.log(option.hidden);
            //unhide
            $('.codeEdit').animate({ right: 0 }, 500);

            option.hidden = false;
        } else {
            console.log('currently shown');
            console.log(option.hidden);
            //hide
            var offscreen = parseInt($('.CEResize').width())-parseInt($('.codeEdit').width());
            $('.codeEdit').animate({ right: offscreen }, 500);

            option.hidden = true;
        }
    }
    function cArrToHtml(arr, i) {
        if (i == undefined) {i = 0}
        if (i >= arr.length) {
            return '';
        }
        var purpleKeywords = [
            'if',
            'var',
            'else',
            'function'
        ];
        if ( arr[i] && purpleKeywords.includes(arr[i]) ){
            // console.log(arr);
            return '<span class="purple">' + arr[i] + '</span> ' + cArrToHtml( arr, i+1 );
        }
        return arr[i] + ' ' + cArrToHtml( arr, i+1 );
    }


    $(document).keydown(function(e) {
        if (e.keyCode == 16) {
            option.shft = true;
        }
    })
    $(document).keyup(function(e) {
        if (e.keyCode == 16) {
            option.shft = false;
        }
        if (e.keyCode == 9 && option.shft) {
            $('.CETA').blur();
            toggleTextEditor();
        }
    })
    $(window).resize(function() {
        $('.codeEdit').height( $(window).height() );

    })
    $('.CEResize').mousedown(function(e) {
        if (!option.hidden) {
            option.resize = true;
            $(document).mousemove(function(e) {
                if (option.resize) {
                    $('.codeEdit').width( parseInt($(window).width())-e.pageX );
                }
            })
        }
    })
    $('.CEResize').mouseup(function(e) {
        if (option.resize) {
            option.resize = false;
        }
        if (option.hidden) {
            toggleTextEditor();
            option.hidden = false;
        }
    })
    $('.hide').click(function(e) {
        console.log('HIDE');
        if (!option.hidden) {
            toggleTextEditor();
            option.hidden = true;
        }
    })
    $('.CETA').keydown(function(e) {
        if (e.keyCode == 9) {
            //tab
            e.preventDefault();
            // $('.CETA').val( $('.CETA').val()+'    ' );
            code += '    ';
            // console.log('tab')
        } else if (e.keyCode == 32) {
            //space
            // console.log('space')
            code += e.key;
        } else if (e.keyCode == 13) {
            //enter
            // console.log('enter')
            code += '\n';
        } else if (e.keyCode == 8) {
            //backspace
            // console.log(';')
            code = $('.CETA').val();
        } else if (e.keyCode == 186) {
            //;
            // console.log(';')
            code += e.key;
        } else {
            //All else
            code += e.key;
        }
    })
    $('.CETA').keyup(function(e) {
        if (e.keyCode == 8) {
            //backspace
            // console.log(';')
            code = $('.CETA').val();
        }
        socket.emit('codeSend', {lobby: lobby, code: code});
    })


    socket.on('codeReceive', function(data) {
        // var codeArr = data.code.split(' '),
        //     html    = codeArr.length>0?cArrToHtml(codeArr):'';

        // console.log(html);
        $('.CETA').val(data.code);
    })
})
/*
backspace   : 8
tab         : 9
space       : 32
enter       : 13
;           : 186

alt         : 91
shift       : 16
*/
