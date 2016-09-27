var Users   = {},
    Lobbies = {};

function Lobby (id) {
    this.id          = id;
    this.users       = {};
    this.chatlog     = [];
    this.textCode    = [];
    this.savestate   = '';
    this.screenshots = [];
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
                Lobbies[data.path].savestate = data.canvas;
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
            } else {
                socket.emit('join_lobby_status', {success: false, lobby_data: data.path})
            }
        })

        socket.on('save_lobby', function(data) {
            Lobbies[data.path].savestate = data.canvas;
        })

        socket.on('disconnect', function() {
            if (Users[socket.id]) {
                if (Lobbies[Users[socket.id].lobby]) {
                    // console.log(Users[socket.id].name, 'disconnected from', Users[socket.id].lobby);
                    //Check to see that person has lobby or not
                    delete Lobbies[Users[socket.id].lobby].users[socket.id]
                }
                delete Users[socket.id];
            }
            // console.log('___________________________');
            // console.log("Lobbies", Lobbies);
            // console.log("Users", Users);
        })
        //////////////////////////////////////////
        ///           Chat System              ///
        //////////////////////////////////////////
        socket.on('user_send', function(data) {
            Users[socket.id].name = data.name;
            console.log(Users[socket.id]);
        })
        socket.on('message_send', function(data) {
            console.log(data);
            if (Users[socket.id].name) {
                var formatted = {name: Users[socket.id].name, message: data.message};

            }
            if (Users[socket.id].lobby) {
                Lobbies[Users[socket.id].lobby].chatlog.push(formatted);
                console.log(Lobbies[Users[socket.id].lobby].chatlog);
                console.log('-----------------');
                io.to(Users[socket.id].lobby).emit('users_receive', {users: Lobbies[Users[socket.id].lobby].users})
                io.to(Users[socket.id].lobby).emit('messages_receive', {messages: Lobbies[Users[socket.id].lobby].chatlog});
            }
        })

        //////////////////////////////////////////
        ///          Canvas Drawing            ///
        //////////////////////////////////////////
        socket.on('draw_line', function(data) {
            io.to(data.lobby).emit('draw_line', data);
        })
        socket.on('draw_shape', function(data) {
            io.to(data.lobby).emit('draw_shape', data);
        })
        socket.on('board_clear', function(lobby) {
            io.to(lobby).emit('board_clear');
        })
        //////////////////////////////////////////
        ///           Canvas Typing            ///
        //////////////////////////////////////////
        socket.on('draw_text', function(data) {
            io.to(data.lobby).emit('draw_text', data);
        })
        socket.on('draw_code', function(data) {
            io.to(data.lobby).emit('dra_code', data);
        })
        //////////////////////////////////////////
        ///           Canvas Saving            ///
        //////////////////////////////////////////
        socket.on('savestate', function(data) {
            Lobbies[data.lobby].savestate = data.canvas;
        })
    })
}
