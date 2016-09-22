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
        socket.on('create_lobby', function(data) {
            if (!Lobbies[data.path]) {
                Lobbies[data.path] = new Lobby(data.path);
                socket.emit('create_lobby_status', {success: true, path: data.path})
            } else {
                socket.emit('create_lobby_status', {success: false, path: data.path})
            }
        })

        socket.on('join_lobby', function(data) {
            if (Lobbies[data.path]) {
                if (Users[socket.id].lobby) {
                    delete Lobbies[Users[socket.id].lobby].users[socket.id];
                    Users[socket.id].lobby = null;
                }
                socket.emit('join_lobby_status', {success: true, lobby_data: Lobbies[data.path]})
                socket.join(data.path);
                Lobbies[data.path].users[socket.id] = Users[socket.id];
                Users[socket.id].lobby = data.path;
                console.log('___________________________');
                console.log("Lobbies", Lobbies);
                console.log("Users", Users);
            } else {
                socket.emit('join_lobby_status', {success: false, lobby_data: ''})
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
