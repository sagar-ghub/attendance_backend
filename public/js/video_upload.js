function onSubmit(e) {
  e.preventDefault();
  var customMessage = document.getElementById('message');
  if(validateForm(customMessage)) {
    uploadVideo(customMessage);
  }
}

function validateForm(customMessage) {
  const uploadedFile = document.getElementById('video-upload').elements[0].files[0];
  // console.log(uploadedFile);
  if(!uploadedFile) {
    customMessage.innerHTML = "Please select a video to upload";
    return false;
  }
  const fileLimit = 10485760000;
  if(uploadedFile.size > fileLimit) {
    customMessage.innerHTML = "Maximum video size allowed: 10000MB";
    return false;
  }
  return true;
}

function uploadVideo(customMessage) {
  document.getElementById("submit").disabled = true;
  customMessage.innerHTML = 'uploading video..'
  var formElement = document.getElementById("video-upload");
  var request = new XMLHttpRequest();
  request.open("POST", "/api/v1/uploadvideo?_format=json", true);
  request.onload = onComplete;
  request.upload.onprogress = fileUploadPercentage;
  const data = new FormData(formElement);
  // console.log(data);
  request.send(data);
  // console.log(data);
}

function onComplete(event) {
  // console.log((event));
  var customMessage = document.getElementById('message');
  const response = JSON.parse(event.currentTarget.response);
  // console.log(response);
  if(response.success) {
    document.getElementById('main-div').style.display = 'none';
    customMessage.style.color = '#9C27B0';
    customMessage.innerHTML = 'Video Uploaded successfully!!. Please <a href='+ response.link +'>click here</a> to view the video.';
  } else {
    customMessage.innerHTML = response.error;
    customMessage.style.color = 'red';
  }
  document.getElementById("submit").disabled = false;
}

function fileUploadPercentage(e) {
  if (e.lengthComputable) {
    var customMessage = document.getElementById('message');
    var percentage = (e.loaded / e.total) * 100;
    customMessage.innerHTML = 'Uploading Video: ' + percentage + ' %';
  }
};
