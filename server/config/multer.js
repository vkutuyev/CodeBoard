// Multer file uploads
var multer = require("multer");
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './server/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, req.body.username)
    }
});

var upload = multer({
    storage: storage,
    limits: {
        // fileSize: 5000000
    }
}).single('thumbnail');


module.exports = (function() {
    return {

        upload: function(req, res) {
            upload(req, res, function(err) {
                if (err) {
                    console.log(err);
                    res.json(err);
                }
                else {
                    console.log('=========req.file=========');
                    console.log(req.file);
                    console.log('=========req.body=========');
                    console.log(req.body);
                    res.send("OK");
                }
            })
        }

    }
})
();
