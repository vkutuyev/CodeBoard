var allLobbies  = [],
    allUsers    = [];

function Lobby () {
    var valid = 'abcdefghijklmnopqrstuvqxyz1234567890'.split('');

    this.users  = [];
    this.id     = Generate();

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
}
function User ( id ) {
    this.id     = id;
    this.name;
}

module.exports = function(io) {
    var allUsers    = [],
        allLobbies  = [];

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

        socket.on('disconnect', function() {
        })
    })
}
