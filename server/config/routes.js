var path = require('path');

//////////////////////////////////////////////////////////
//                        Routes                        //
//////////////////////////////////////////////////////////
module.exports = function(app) {
    //This will redirect to a random url.
    app.get('/', function(req, res) {
        res.redirect('/Hello');
    })
    //This will be angular's handling. Sends the file so angular can handle everything
    app.get('/:roomId', function(req, res) {
        res.sendFile(path.join(__dirname, './../../client/static/index.html'));
    })
}
