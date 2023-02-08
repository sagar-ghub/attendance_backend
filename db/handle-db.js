const fileName = 'db/uploaded-files.js';
const fs = require('fs');

module.exports.saveToDB =  function(data) {
  // console.log(data);
  let currentData =this.readFromDB();
  currentData[data.id] = data;
  currentData = JSON.stringify(currentData);
  fs.writeFileSync(fileName, currentData, 'utf8');
}

module.exports.readFromDB = function() {
  // console.log(fileName);
  var data = fs.readFileSync(fileName, 'utf8');
  if (!data) {
     data = "{}";
  }
  return JSON.parse(data);
}

module.exports.getFile = function(fileId) {
  if (!fileId) {
    return null;
  }
 let data = this.readFromDB();
  return data[fileId];

}
