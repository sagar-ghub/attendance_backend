const multer = require('multer');
const fs = require('fs');

function fileFilter (req, file, callback) {
  var errorMessage = '';
  if (!file) {
    errorMessage = 'Wrong file type \"' + file.originalname.split('.').pop() + '\" found. Only mp4/mp3/imageformat video files are allowed!';
  }
  if(errorMessage) {
    return callback({errorMessage: errorMessage, code: 'LIMIT_FILE_TYPE'}, false);
  }
  callback(null, true);
}

function destinationPath(req, file, callback) {
  var stat = null;
  try {
    stat = fs.statSync(process.env.FILE_UPLOAD_PATH);
    // console.log(stat);
  } catch (err) {
    fs.mkdirSync(process.env.FILE_UPLOAD_PATH);
  }
   callback(null, process.env.FILE_UPLOAD_PATH);
}

function fileNameConvention(req, file, callback) {
  callback(null, Date.now() + '-' + file.originalname.replace(/ /g, '_'));
}

const limits = {
  fileSize: parseInt(process.env.FILE_SIZE) * 1024 * 1024 // 200MB
}


const storage = multer.diskStorage({
  destination: destinationPath,
  filename: fileNameConvention
});

const fileUploadConfig = {
  fileFilter: fileFilter,
  storage: storage,
  limits: limits
};

module.exports.fileUploadConfig = fileUploadConfig;
