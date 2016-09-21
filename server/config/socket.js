////////////////////////////////////////////////////////////
//                     MODULE EXPORTS                     //
////////////////////////////////////////////////////////////
module.exports = function(io) {

    io.sockets.on('connection', function(socket) {

        //////////////////////////////////////////
        ///          Canvas Drawing            ///
        //////////////////////////////////////////
        socket.on('draw_line', function(line){
            socket.emit('draw_line', line.path);
        })



        socket.on('disconnect', function(socket) {

        })
    })
}
