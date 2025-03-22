// middleware/multer.js
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const crypto = require('crypto');

// Create upload directory path - use absolute path for clarity
const uploadDir = path.join(__dirname, '../public/uploads');
console.log(`Multer upload directory: ${uploadDir}`);

// Create the upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    console.log(`Creating uploads directory: ${uploadDir}`);
    fs.mkdirSync(uploadDir, { recursive: true });
    
    // Set directory permissions to ensure it's writable
    try {
        fs.chmodSync(uploadDir, '755');
        console.log(`Set permissions on uploads directory to 755`);
    } catch (err) {
        console.error(`Permission error on upload directory: ${err.message}`);
    }
}

// Check if directory is writable
try {
    const testFile = path.join(uploadDir, '.test-write-permission');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('Upload directory is writable');
} catch (err) {
    console.error(`Upload directory is not writable: ${err.message}`);
}

// Use memory storage instead of disk storage for serverless environments
const storage = multer.memoryStorage();
console.log('Using multer memory storage for serverless compatibility');

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
    // Accept only image files
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        console.log(`Accepting file: ${file.originalname} (${file.mimetype})`);
        cb(null, true);
    } else {
        console.log(`Rejecting file: ${file.originalname} (${file.mimetype})`);
        cb(new Error('Only image files (JPEG, PNG, GIF) are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage, // memory storage for serverless compatibility
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    }
});

module.exports = upload;

// // middleware/multer.js
// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         console.log("Multer saving to: uploads/");
//         cb(null, "uploads/"); // Ensure this folder exists
//     },
//     filename: (req, file, cb) => {
//         const filename = Date.now() + path.extname(file.originalname);
//         console.log("Multer filename:", filename);
//         cb(null, filename);
//     },
// });

// const upload = multer({ storage });
// module.exports = upload;