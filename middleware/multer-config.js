const multer = require('multer');
const uuid4 = require("uuid").v4;

// Dictionary between mime types and extensions
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
}

// Files are stored in the 'images' directory
// Files are renamed with a unique identifier (uuid) 
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images')
    },
    filename: (req, file, callback) => {
        const extension = MIME_TYPES[file.mimetype];
        callback(null, uuid4().replace(/-/g, '') + '.' + extension);
    }
});

module.exports = multer({ storage }).single('image');