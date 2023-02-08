import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
const path = require('path');
const fileUploadConfig = require('../config/file-upload-config').fileUploadConfig;
const handleDb = require('../db/handle-db');
const multer  = require('multer');


module.exports.initUploadPage = function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../public/video_upload_test.html'));
}

module.exports.uploadFile = function(req, res) {
  var upload = multer(fileUploadConfig).single('user_file');
  upload(req, res, function(uploadError){
    if(uploadError){
      var errorMessage;
      if(uploadError.code === 'LIMIT_FILE_TYPE') {
        errorMessage = uploadError.errorMessage;
      } else if(uploadError.code === 'LIMIT_FILE_SIZE'){
          errorMessage = 'Maximum file size allowed is ' + process.env.FILE_SIZE + 'MB';
      }
      return res.json({
        error: errorMessage
      });
    }
    const fileId = req.file.filename.split('-')[0];
    // console.log(req.file);
    let clipDetails={
      files_id: JSON.parse(fileId),
      files_details: req.file.filename,
      candidate_id:req.body.candidate_id,
      files_created_by:req.body.candidate_id,
      files_type:req.file.mimetype
    }
    knex('ptr_candidates_file_map').insert(clipDetails).then((resp)=>{
      const link = 'http://' + req.hostname + ':' + process.env.HTTP_APP_PORT +'/api/v1/stream/' + fileId +'?_format=json' 
      // console.log(link);
      return res.status(200).json(helpers.response("200", "success", "Your Link", link));
      // res.json({
      //   success: true,
      //   link: link
      // });
    }).catch((err) => {
      return res.status(404).json(helpers.response("404", "error", "Problem in clips Insert Query", err));
  })

    const attributesToBeSaved = {
      id: fileId,
      name: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      encoding: req.file.encoding,
      details: req.body.details ? req.body.details : ''
    }
    // console.log(attributesToBeSaved);
    handleDb.saveToDB(attributesToBeSaved);
    // return res.send(req.file);
  });
}
