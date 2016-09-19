app.controller('AdminController', function($scope, socket){
    $scope.lobbies  = [],
    $scope.admin    = false,
    $scope.clicked  = false,
    $scope.chat     = '';

    $scope.checkAdmin = function(pass) {
        socket.emit('adminPW', pass);
    }

    // Receiving and formatting lobby info
    socket.on('adminInfo', function(data){
        $scope.admin = true;
        for (lobby of data.lobbies) {
            if(lobby.id.length > 10){
                lobby.id = lobby.id.substring(0,11);
            }
            $scope.lobbies.push(lobby);
        }
    })

    // Displaying clicked lobby info
    $scope.showInfo = function(data) {
        $scope.clicked  = true;
        $scope.drawScreen(data.lobby.savestate);
    }

    // Displaying saved canvas screenshot
    $scope.drawScreen = function(pic) {
        var canvas      = document.getElementById('adminCanv');
        var width       = $('#adminBoard').width();
        var height      = $('#adminBoard').height();
        canvas.width    = width;
        canvas.height   = height;
        var context     = canvas.getContext('2d');
        var board       = new Image;
        board.src       = pic;
        board.onload = function() {
            context.drawImage(board,0,0, width, height);
        }
    }

})
