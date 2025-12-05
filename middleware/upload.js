// This middlewear saves uploaded files renames them with a timestamp, will only allow certian file types to prevent the weird ones, limits the size of file as well
// Past what we learned in class, using multer's diskStorage for files, also validates them, also added file size limits, and used a path.join for folder locations


const multer = require('multer');
const path = require('path');


// Storage configuration
const storage = multer.diskStorage({

  //   I used /public/upload in my dircetory so images can be seen publicly
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },

 
  //   each file is given a unique name so multiple uploads don't overwrite each other
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); 
    cb(null, file.fieldname + '-' + unique + ext);
  }
});

//this is the image part where it only allows certain types
const fileFilter = (req, file, cb) => {
  const isImage = /^image\/(jpe?g|png|gif|webp)$/i.test(file.mimetype);

  if (isImage) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

//this uses the new packages
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // gives it a 2 MB max
});

module.exports = upload;
