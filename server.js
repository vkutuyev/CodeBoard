//////////////////////////////////////////////////////////
//                      Requires                        //
//////////////////////////////////////////////////////////
var bodyParser      = require("body-parser");
var express         = require("express");
var path            = require("path");
var app             = express();

//Body Parser && Static Folder
app.use(bodyParser.json());
app.use(express.static(__dirname + "/client/static"));

//Routes require
// require('./server/config/mongoose.js');
require('./server/config/routes.js')(app)

////////////////////////////////////////////////////////////
//                     Listen to Port                     //
////////////////////////////////////////////////////////////
var port = 8000;
var server = app.listen(port, function() {
    console.log("Hey, Listen! (ROOOOM "+port+")");
})
var io = require('socket.io').listen(server);


var line_history = [];

io.sockets.on('connection', function(socket) {
    console.log('Sockets:', socket.id);

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
    })

})
