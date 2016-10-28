var fs = require('fs');
// File index {lobby: fileName}
var fileIndex = {};

var files = {

    save: function(lobby, file) {
        fileIndex[lobby] = file;
    },

    delete: function(lobby) {
        //Check to see if a file is stored
        var path = './server/files/uploads/' + lobby;
        fs.access(path, fs.F_OK, function(err) {
            if (!err) {
                // File exists(no err while accessing), delete it
                fs.unlinkSync(path);
                delete fileIndex[lobby];
            }
        });
    },

    fetch: function(lobby) {
        return fileIndex[lobby];
    },

    print: function() {
        for (var lobby in fileIndex) {
            if (fileIndex.hasOwnProperty(lobby)) {
                console.log('Lobby:', lobby, '|| File:', fileIndex[lobby]);
            }
        }
    }

}

module.exports = files;
