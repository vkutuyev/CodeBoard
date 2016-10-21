var path    = require('path');
var session = require('../controllers/session.js');

//////////////////////////////////////////////////////////
//                        Routes                        //
//////////////////////////////////////////////////////////
module.exports = function(app) {
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
