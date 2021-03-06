// Original file names for downloading {lobby: filename}
var files   = require('../models/Files.js');
var Users   = {},
    Lobbies = {};

function Lobby (id) {
    this.id          = id;
    this.users       = {};
    this.chatlog     = [];
    this.textCode    = '';
    this.modeCode    = 'javascript';
    this.savestate   = '';
    this.screenshots = {
        0: { name: '', img: '', time: '' },
        1: { name: '', img: '', time: '' },
        2: { name: '', img: '', time: '' }
    },
    this.sharedFile  = null;
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
            if (data.path && !Lobbies[data.path]) {
                Lobbies[data.path] = new Lobby(data.path);
                Lobbies[data.path].savestate = data.canvas;
                Lobbies[data.path].textCode  = data.code;
                console.log(data.path, 'Lobby Created');
                socket.emit('create_lobby_status', {success: true, path: data.path})
            } else {
                socket.emit('create_lobby_status', {success: false, path: data.path})
            }
        })

        socket.on('join_lobby', function(data) {
            if (data.path && Lobbies[data.path]) {
                if (Users[socket.id].lobby) {
                    delete Lobbies[Users[socket.id].lobby].users[socket.id];
                    Users[socket.id].lobby = null;
                }
                console.log(socket.id, 'joined lobby: ', data.path);
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

        socket.on('leave_lobby', function(data) {
            if (Users[socket.id]) {
                socket.leave(data.path);
                if (Lobbies[Users[socket.id].lobby]) {
                    var name = Lobbies[Users[socket.id].lobby].users[socket.id].name;
                    //Check to see that person has lobby or not
                    delete Lobbies[Users[socket.id].lobby].users[socket.id];
                    io.to(Users[socket.id].lobby).emit('users_receive', {users: Lobbies[Users[socket.id].lobby].users, name: name, left: true});
                }
                // Check to see if lobby is now empty
                var lobbyName = data.path;
                var users = Object.getOwnPropertyNames(Lobbies[lobbyName].users);
                if (users.length == 0) {
                    Lobbies[lobbyName].sharedFile = null;
                    files.delete(lobbyName);
                }
            }
        })

        socket.on('disconnect', function() {
            if (Users[socket.id]) {
                if (Lobbies[Users[socket.id].lobby]) {
                    //Check to see that person has lobby or not
                    var lobbyName = Users[socket.id].lobby;
                    delete Lobbies[Users[socket.id].lobby].users[socket.id];
                }
                delete Users[socket.id];
            }
            if (lobbyName) {
                // Check to see if lobby is now empty
                var users = Object.getOwnPropertyNames(Lobbies[lobbyName].users);
                if (users.length == 0) {
                    Lobbies[lobbyName].sharedFile = null;
                    files.delete(lobbyName);
                }
            }
        })
        //////////////////////////////////////////
        ///           Chat System              ///
        //////////////////////////////////////////
        socket.on('user_send', function(data) {
            if (Users[socket.id]) {
                Users[socket.id].name = data.name;
                if (Users[socket.id].lobby) {
                    io.to(Users[socket.id].lobby).emit('users_receive', {users: Lobbies[Users[socket.id].lobby].users, name: data.name});
                }
            }
        })
        socket.on('message_send', function(data) {
            if (Users[socket.id].name) {
                var formatted = {name: data.name, message: data.message, time: data.time};
            }
            if (Users[socket.id].lobby) {
                Lobbies[Users[socket.id].lobby].chatlog.push(formatted);
                io.to(Users[socket.id].lobby).emit('messages_receive', Lobbies[Users[socket.id].lobby].chatlog);
            }
        })

        //////////////////////////////////////////
        ///          Canvas Drawing            ///
        //////////////////////////////////////////
        socket.on('draw_line', function(data) {
            io.to(Users[socket.id].lobby).emit('draw_line', data);
        })
        socket.on('draw_shape', function(data) {
            io.to(Users[socket.id].lobby).emit('draw_shape', data);
        })
        socket.on('board_clear', function() {
            io.to(Users[socket.id].lobby).emit('board_clear');
        })
        socket.on('load_image', function(data) {
            io.to(Users[socket.id].lobby).emit('load_image', data);
        })
        //////////////////////////////////////////
        ///           Canvas Typing            ///
        //////////////////////////////////////////
        socket.on('draw_text', function(data) {
            io.to(Users[socket.id].lobby).emit('draw_text', data);
        })
        socket.on('draw_code', function(data) {
            io.to(Users[socket.id].lobby).emit('draw_code', data);
        })
        //////////////////////////////////////////
        ///           Canvas Saving            ///
        //////////////////////////////////////////
        socket.on('savestate', function(canvas) {
            Lobbies[Users[socket.id].lobby].savestate = canvas;
            io.to(Users[socket.id].lobby).emit('upadteMap');
        })
        socket.on('screenshot', function(data) {
            var screenshot = {
                name: data.name,
                img: data.canvas,
                time: data.time
            }
            Lobbies[Users[socket.id].lobby].screenshots[data.index] = screenshot;
            io.to(Users[socket.id].lobby).emit('screenshot', Lobbies[Users[socket.id].lobby].screenshots);
        })
        //////////////////////////////////////////
        ///             Code Editor            ///
        //////////////////////////////////////////
        socket.on('code_edit', function(data) {
            Lobbies[Users[socket.id].lobby].textCode = data.code;
            io.to(Users[socket.id].lobby).emit('code_edit', { code: data.code, id: data.id });
        })
        socket.on('code_edit_mode_switching', function(data) {
            Lobbies[Users[socket.id].lobby].modeCode = data.mode;
            io.to(Users[socket.id].lobby).emit('code_edit_mode_switch', {mode: data.mode});
        })
        //////////////////////////////////////////
        ///           File Sharing             ///
        //////////////////////////////////////////
        socket.on('file_uploaded', function(file) {
            Lobbies[Users[socket.id].lobby].sharedFile = file;
            io.to(Users[socket.id].lobby).emit('file_shared', { file: file });
        })
    })
}
