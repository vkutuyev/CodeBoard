// Original file names for downloading {lobby: filename}
var files = require('../models/Files.js');

// Multer settings
var fs      = require('fs');
var multer  = require("multer");
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './server/files/temp')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 50000000
    }
}).single('chatFile');


module.exports = (function() {
    return {

        upload: function(req, res) {
            upload(req, res, function(err) {
                console.log('=========req.file=========');
                console.log(req.file);
                console.log('=========req.body=========');
                console.log(req.body);
                if (err) {
                    console.log('Error Uploading: ', err);
                    res.json({upload: false, error: err});
                }
                else {
                    files.save(req.body.lobbyName, req.file.originalname);
                    files.print();
                    fs.rename('./server/files/temp/'+req.file.originalname, './server/files/uploads/'+req.body.lobbyName);
                    res.json({upload: true});
                }
            })
        }

    }
})
();
