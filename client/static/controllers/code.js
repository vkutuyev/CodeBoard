app.controller('CodeController', function($scope, socket) {
    var option = {
        resize: false
    }
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
        e.preventDefault();
        console.log(e.keyCode);
        console.log(e.which);
    })
})
