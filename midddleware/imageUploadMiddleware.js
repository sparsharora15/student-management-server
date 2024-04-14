const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    const date = new Date();
    const dateString = date.toISOString().replace(/:/g, '-'); // Convert date to string and replace colons with dashes
    const uniqueFilename = dateString + '-' + file.originalname; // Append date string to original filename
    cb(null, uniqueFilename); // Set the filename to the unique filename
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only certain file types, adjust as needed
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
