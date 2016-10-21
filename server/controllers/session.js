module.exports = (function() {
    return {

        setLobby: function(req, res) {
            var lobby = req.body.lobby || req.params.lobby;
            if (lobby != "favicon.ico") {
                req.session.lobby = lobby;
                res.redirect('/');
            }
        },

        getLobby: function(req, res) {
            var lobby = req.session.lobby;
            if (lobby) {
                res.json({lobby: lobby});
            }
            else {
                res.end();
            }
        }

    }
})
();
