var allLobbies  = [],
    allUsers    = [];

function Lobby () {
    var valid = 'abcdefghijklmnopqrstuvqxyz1234567890'.split('');

    this.users          = [];
    this.line_history   = [];
    this.id             = Generate();

    for (var i = 0; i < allLobbies.length; i++) {
        if (allLobbies[i].id == this.id) {
            this.id = Generate();
            i = 0;
        }
    }
    function Generate(i) {
        i = i?i+1:1;
        if (i >= 6) {
            return valid[Math.floor(Math.random()*valid.length)];
        }
        return Generate(i) + valid[Math.floor(Math.random()*valid.length)];
    }

    this.roomContains = function(user) {
        for (i in this.users) {
            if (this.users[i].id == user.id) {
                return i;
            }
        }
        return false;
    }
}
function User ( id ) {
    this.id     = id;
    this.name;
}

module.exports = function(io) {
    var allUsers        = [],
        allLobbies      = [],
        line_history    = [];

    io.sockets.on('connection', function(socket) {
        console.log('Users:', allUsers);
        console.log('Lobbies:', allLobbies);

        var user = new User( socket.id );
        allUsers.push(user);

        socket.on('createLobby', function(data) {
            user.name = data.user;

            var lobby = new Lobby();
            console.log(lobby.id);
            allLobbies.push(lobby);
            lobby.users.push(user);

            socket.join(lobby.id);

            io.to(lobby.id).emit('lobbyStatus', {lobby});
        })
        socket.on('joinLobby', function(data) {
            user.name = data.user;

            var lobby;
            for (var room of allLobbies) {
                if (room.id == data.lobby) {
                    lobby = room;
                }
            }
            if (lobby) {
                lobby.users.push(user);

                socket.join(lobby.id);

                io.to(lobby.id).emit('lobbyStatus', {lobby});
            }
        })

        socket.on('disconnect', function(socket) {
            allUsers.splice(allUsers.indexOf(user),1);
            var room;
            for (lobby of allLobbies) {
                if (lobby.roomContains(user)) {
                    var index = lobby.roomContains(user);
                    room = lobby;
                    lobby.users.splice(lobby.users[index], 1);
                }
            }
            if (room) {
                io.to(room.id).emit('User Disconnected', room.users);
            }
        })










        for (var i in line_history) {
            socket.emit('draw_line', line_history[i] );
        }

        socket.on('draw_line', function (line) {
            line_history.push(line);
            io.emit('draw_line', line);
        });
        socket.on('clear_board', function(){
            line_history = [];
            io.emit('cleared');
        });
    })
}
