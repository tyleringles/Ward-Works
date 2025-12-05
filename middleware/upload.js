// This middlewear saves uploaded files renames them with a timestamp, will only allow certian file types to prevent the weird ones, limits the size of file as well
// Past what we learned in class, using multer's diskStorage for files, also validates them, also added file size limits, and used a path.join for folder locations

// middleware/upload.js
// Handles profile photo uploads with Multer

const multer = require('multer');
const path = require('path');

// Where to store uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save into /uploads at the project root
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    // Example: 2025-12-05T20-37-43.632Z-avatar.png
    const safeTimestamp = new Date().toISOString().replace(/:/g, '-');
    cb(null, `${safeTimestamp}-${file.originalname}`);
  }
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(null, false); // silently ignore non-images
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

module.exports = upload;
