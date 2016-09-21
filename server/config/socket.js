////////////////////////////////////////////////////////////
//                     MODULE EXPORTS                     //
////////////////////////////////////////////////////////////
module.exports = function(io) {

    io.sockets.on('connection', function(socket) {

        //////////////////////////////////////////
        ///          Canvas Drawing            ///
        //////////////////////////////////////////
        socket.on('draw_line', function(data){
            io.emit('draw_line', data);
        })



        socket.on('disconnect', function(socket) {

        })
    })
}
