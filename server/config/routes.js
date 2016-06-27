//Require the controller
var main = require('../controllers/main.js');
//////////////////////////////////////////////////////////
//                        Routes                        //
//////////////////////////////////////////////////////////
module.exports = function(app) {
    app.get('/', function(req, res) {
        main.index(req, res);
    })
}
