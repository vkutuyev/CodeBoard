app.controller('LobbyController', function($scope, $location, socket) {
    $scope.displayName  = '';
    $scope.lobbyName    = '';
    $(document).ready(function() {
        $('.displayName').focus();
        $('.bgAnim').css('width', parseInt($(window).width())+10);
        $('.bgAnim').css('height', $(window).height());
        $(window).resize(function() {
            $('.bgAnim').css('width', $(window).width());
            $('.bgAnim').css('height', $(window).height());
        })
    })

    socket.on('lobbyStatus', function(data) {
        $location.url('/'+data.lobby.id);
    })

    $scope.createLobby = function() {
        socket.emit('createLobby', {lobby: $scope.lobbyName, user: $scope.displayName});
        $scope.displayName = '';
        $scope.lobbyName = '';
    }
    $scope.joinLobby = function() {
        socket.emit('joinLobby', {lobby: $scope.lobbyName, user: $scope.displayName});
        $scope.displayName = '';
        $scope.lobbyName = '';
    }
})
