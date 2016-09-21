app.controller('LobbyController', function($scope, $location, socket) {
    //check url
    socket.emit('join_lobby', {/*URL*/});
    $location.url('/');
}
