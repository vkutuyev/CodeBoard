app.controller('ChatController', function($scope, socket, $location) {
    $('.chatDisplayName').focus();
    $scope.lobby = $location.$$path.substr(1);
    var log = [];
    $scope.currentName;
    $scope.chatbox = '';
    socket.emit('ChatController', {lobby: $scope.lobby});

    var height = parseInt($('div.chat').height())-8;
    // $('div.chat').css('bottom', '-'+height);
    socket.on('messageReceive', function(data) {
        log = data;
        html = '';
        for (message of log) {
            html+='<div class="row">'+
            '<div class="columns two">'+message.name+
            '</div><div class="columns ten">'+message.message+
            '</div>'+'</div>';
        };
        $('div.chatCol').html(html);
    })
    $('.chatForm').keypress(function(e) {
        if (e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            console.log('send', $scope.chatbox)
            if ($scope.chatbox != '' && $scope.currentName) {
                sendMessage();
            }
        }
    })
    var sendMessage = function() {
        var message = {name: $scope.currentName, message: $('.chatTextArea').val()};

        socket.emit('messageSend', {lobby: $scope.lobby, message: message});
        $('.chatTextArea').val('');
    }
    if (!$scope.currentName) {
        $('.cover').height($('.chat').height());
        $('.cover').width($('.chat').width());
        $('.cover').css('bottom', $('.chat').css('bottom'));
        $('.cover').css('right', $('.chat').css('right'));
    }

    $scope.toggleChat = function() {
        var bottom = parseInt($('div.chat').css('bottom'));

        if (bottom < 0) {
            $('div.chat').animate({bottom: 0}, 500);
            $('.chatTextArea').focus();
        } else {
            var height = parseInt($('div.chat').height())-8;
            $('div.chat').animate({bottom: '-'+height}, 500);
            if ($('.chatTextArea').focus()) {
                $('.chatTextArea').blur();
            }
        }
    }
    $scope.setName = function() {
        $scope.currentName = $scope.displayName;
        //Send User
        $('.cover').hide();
        $('.chatTextArea').focus();
    }

})
