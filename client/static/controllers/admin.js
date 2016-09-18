app.controller('AdminController', function($scope, socket){
    console.log('loaded admin controller');
    socket.emit('adminInfo');
    socket.on('adminInfo', function(data){
        console.log('=========data=========');
        console.log(data);
        console.log('=========data=========');
        $scope.lobbies  = data.lobbies;
        $scope.users    = data.users;
    });
})
