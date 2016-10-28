var fs      = require('fs');
var path    = require('path');
var mult    = require('./multer.js');
var Files   = require('../models/Files.js');
var session = require('../controllers/session.js');

//////////////////////////////////////////////////////////
//                        Routes                        //
//////////////////////////////////////////////////////////
module.exports = function(app) {
    // File uploading/downloading
    app.post('/files/upload', function(req, res) {
        mult.upload(req, res);
    })
    app.get('/files/download/:lobby', function(req, res) {
        var lobby = req.params.lobby;
        var file  = Files.fetch(lobby);
        if (file) {
            var url = path.join(__dirname, '../files/uploads/');
            url += lobby;
            res.download(url, file);
        }
        else {
            res.end();
        }
    })

    // Lobby joining/saving/loading
    app.get('/:lobby', function(req, res) {
        session.setLobby(req, res);
    })
    app.post('/session/setLobby', function(req, res) {
        session.setLobby(req, res);
    })
    app.get('/session/getLobby', function(req, res) {
        session.getLobby(req, res);
    })

    // Redirect all other urls
    app.get('/*', function(req, res) {
        res.redirect('/');
    })
}
