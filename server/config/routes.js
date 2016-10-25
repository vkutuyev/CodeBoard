var fs      = require('fs');
var path    = require('path');
var mult    = require('./multer.js');
var session = require('../controllers/session.js');

//////////////////////////////////////////////////////////
//                        Routes                        //
//////////////////////////////////////////////////////////
module.exports = function(app) {
    // File uploading/downloading/deleting
    app.post('/files/upload', function(req, res) {
        mult.upload(req, res);
    })
    app.get('/files/download/:lobby', function(req, res) {
        // var name = req.params.lobby;
        // var url = path.join(__dirname, '../files/');
        // url += name;
        // res.download(url, 'tempName.extension');
    })
    app.get('/files/delete/:lobby', function(req, res) {
        // var file = req.params.lobby;
        // var curPath = './server/files/' + file;
        // fs.unlinkSync(curPath)
        // res.end();
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
