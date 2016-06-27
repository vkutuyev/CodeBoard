app.controller('LobbyController', function($scope, $location) {
    $scope.displayName  = '';
    $scope.lobbyName    = '';
    $(document).ready(function() {
        $('.displayName').focus();
    })

    socket.on('lobbyStatus', function(data) {
        console.log('something');
        console.log(data);
        console.log($location);
        $location.url('/'+data.lobby.id);
        $scope.$apply();
    })

    $scope.createLobby = function() {
        console.log('User',$scope.displayName,'created lobby:',$scope.lobbyName)

        socket.emit('createLobby', {lobby: $scope.lobbyName, user: $scope.displayName})

        $scope.displayName = '';
        $scope.lobbyName = '';

        // $location.url('/asdf')
    }
    $scope.joinLobby = function() {
        console.log('User',$scope.displayName,'joined lobby:',$scope.lobbyName)

        socket.emit('joinLobby', {lobby: $scope.lobbyName, user: $scope.displayName})

        $scope.displayName = '';
        $scope.lobbyName = '';
    }
})
