//////////////////////////////////////////////////////////
//                        Routes                        //
//////////////////////////////////////////////////////////
module.exports = function(app) {
    app.get('/null', function(req, res) {
        console.log('reached null....error');
    })
}
