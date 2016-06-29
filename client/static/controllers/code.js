app.controller('CodeController', function($scope, $location, socket) {
    var option = {
            resize: false
        },
        code   = '',
        lobby  = $location.$$path.substr(1);

    socket.emit('CodeController', {lobby: lobby});

    $('.CEResize').mousedown(function(e) {
        option.resize = true;
        $(document).mousemove(function(e) {
            if (option.resize) {
                $('.codeEdit').width( parseInt($(window).width())-e.pageX );
            }
        })
    })
    $('.CEResize').mouseup(function(e) {
        if (option.resize) {
            option.resize = false;
        }
    })
    $('.CETA').keydown(function(e) {
        if (e.keyCode == 9) {
            //tab
            e.preventDefault();
            $('.CETA').val( $('.CETA').val()+'      ' );
            // console.log('tab')
        } else if (e.keyCode == 32) {
            //space
            // console.log('space')
        } else if (e.keyCode == 13) {
            //enter
            // console.log('enter')
        } else if (e.keyCode == 8) {
            //backspace
            // console.log(';')
        } else if (e.keyCode == 186) {
            //;
            // console.log(';')
        } else {
            //All else
            code += e.key;
        }
    })
    $('.CETA').keyup(function(e) {
        socket.emit('codeSend', {lobby: lobby, code: $('.CETA').val()});
    })


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
    socket.on('codeReceive', function(data) {
        var codeArr = data.code.split(' '),
            html    = codeArr.length>0?cArrToHtml(codeArr):'';

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
