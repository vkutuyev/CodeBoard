var Users   = {},
    Lobbies = {hello_world: 'Testing'};

////////////////////////////////////////////////////////////
//                     MODULE EXPORTS                     //
////////////////////////////////////////////////////////////
module.exports = function(io) {

    io.sockets.on('connection', function(socket) {
        Users[socket] = true;
        //////////////////////////////////////////
        ///            Lobby System            ///
        //////////////////////////////////////////
        socket.on('join_lobby', function(data) {
            if (Lobbies[data.path]) {
                socket.emit('join_lobby_success', {success: true, lobby_data: Lobbies[data.path]})
            } else {
                socket.emit('join_lobby_failure', {success: false, lobby_data: ''})
            }
        })

        //////////////////////////////////////////
        ///          Canvas Drawing            ///
        //////////////////////////////////////////
        socket.on('draw_line', function(data){
            io.emit('draw_line', data);
        })


        socket.on('disconnect', function(socket) {
            
        })
    })
}
