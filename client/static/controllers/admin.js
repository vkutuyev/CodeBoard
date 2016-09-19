app.controller('AdminController', function($scope, socket, $location){
    $scope.lobbies  = [],
    $scope.admin    = false,
    $scope.clicked  = false,
    $scope.chat     = '',
    $scope.lobbyID;

    $scope.checkAdmin = function(pass) {
        socket.emit('adminPW', pass);
    }

    // Receiving and formatting lobby info
    socket.on('adminInfo', function(data){
        $scope.admin = true;
        $scope.setLobbies(data);
    })
    // Updating lobby info
    socket.on('updateInfo', function(data){
        $scope.lobbies = [];
        $scope.setLobbies(data);
    })
    // Set display and IDs of lobbies
    $scope.setLobbies = function(data) {
        for (lobby of data.lobbies) {
            if(lobby.id.length > 10){
                lobby.dispName = lobby.id.substring(0,11);
            }
            else{
                lobby.dispName = lobby.id;
            }
            lobby.userCount = Object.keys(lobby.users).length;
            $scope.lobbies.push(lobby);
        }
    }

    // 'Printing out' all lobbies
    $scope.print = function() {
        console.log($scope.lobbies);
    }
    // Refreshing lobby list
    $scope.refresh = function() {
        socket.emit('lobbyRefresh');
    }

    // Displaying clicked lobby info
    $scope.showInfo = function(data) {
        $scope.clicked  = true;
        $scope.lobbyID  = data.lobby.id;
        $scope.drawScreen(data.lobby.savestate || '');
        if(data.lobby.chat_history){
            $scope.chat = '';
            for (message of data.lobby.chat_history){
                $scope.chat += '<div class="row">'+
                '<div class="columns two">'+message.name+
                '</div><div class="columns ten">'+message.message+
                '</div>'+'</div>';
            }
            $('#adminChat').html($scope.chat);
        }
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

    // Join displayed lobby
    $scope.join = function(id) {
        if(!id){
            $location.path('/');
        }
        else{
            socket.emit('joinLobby', {lobby: id, user: ''});
        }
    }
    // Delete displayed lobby
    $scope.delete = function(id) {
        $scope.clicked = false;
        socket.emit('delLobby', id);
    }
    // Create new lobby
    $scope.createLobby = function(lobby) {
        if(lobby != 'admin'){
            socket.emit('createLobby', {lobby: lobby, user: ''});
        }
    }

})
