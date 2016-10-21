//////////////////////////////////////////////////////////
//                      Requires                        //
//////////////////////////////////////////////////////////
var bodyParser      = require("body-parser");
var express         = require("express");
var session         = require("express-session");
var path            = require("path");
var app             = express();

//session
app.use(session({ secret: "codeboard", resave: false, saveUninitialized: false }));

//Body Parser && Static Folder
app.use(bodyParser.json());
app.use(express.static(__dirname + "/client/static"));

//Routes
require('./server/config/routes.js')(app);

////////////////////////////////////////////////////////////
//                     Listen to Port                     //
////////////////////////////////////////////////////////////
var port    = 7000;
var server  = app.listen(port, function() {
    console.log("Hey, Listen! (ROOOOM "+port+")");
})
////////////////////////////////////////////////////////////
//                         Socket                         //
////////////////////////////////////////////////////////////
var io  =   require('socket.io').listen(server);
            require('./server/config/socket.js')(io);
