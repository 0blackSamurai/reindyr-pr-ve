const multer = require("multer");
const path = require("path");
const fs = require('fs');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for general uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Disk storage for specific uploads
const diskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./uploads")
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname)
        console.log("EXT", ext)
        const filename = file.originalname
        cb(null, filename)
    }
});

// Initialize multer instances
const upload = multer({ storage: storage });
const uploads = multer({ storage: diskStorage });

module.exports = { upload, uploads };