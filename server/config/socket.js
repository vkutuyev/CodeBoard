var Users   = {},
    Lobbies = {hello_world: 'Testing'};

function Lobby (id) {
    this.id      = id;
    this.users   = {};
    this.chatlog = [];
}

////////////////////////////////////////////////////////////
//                     MODULE EXPORTS                     //
////////////////////////////////////////////////////////////
module.exports = function(io) {

    io.sockets.on('connection', function(socket) {
        Users[socket.id] = {}
        Users[socket.id].name = 'No name';
        //////////////////////////////////////////
        ///            Lobby System            ///
        //////////////////////////////////////////

        socket.on('join_lobby', function(data) {
            if (Lobbies[data.path]) {
                socket.emit('join_lobby_success', {success: true, lobby_data: Lobbies[data.path]})
                socket.join(data.path)
                Lobbies[data.path] = new Lobby(data.path);
                Lobbies[data.path].users[socket.id] = Users[socket.id];
                Users[socket.id].lobby = data.path
                console.log('___________________________');
                console.log("Lobbies", Lobbies);
                console.log("Users", Users);
            } else {
                socket.emit('join_lobby_failure', {success: false, lobby_data: ''})
            }
        })

        socket.on('disconnect', function() {
            if (Users[socket.id]) {
                if (Lobbies[Users[socket.id].lobby]) {
                    console.log(Users[socket.id].name, 'disconnected from', Users[socket.id].lobby);
                    //Check to see that person has lobby or not
                    delete Lobbies[Users[socket.id].lobby].users[socket.id]
                }
                delete Users[socket.id];
            }
            console.log('___________________________');
            console.log("Lobbies", Lobbies);
            console.log("Users", Users);
        })
        //////////////////////////////////////////
        ///          Canvas Drawing            ///
        //////////////////////////////////////////
        socket.on('draw_line', function(data){
            io.emit('draw_line', data);
        })


    })
}
