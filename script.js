let videoWidth, videoHeight;

// whether streaming video from the camera.
let streaming = false;

let video = document.getElementById('video');
let canvasOutput = document.getElementById('canvasOutput');
let canvasOutputCtx = canvasOutput.getContext('2d');
let stream = null;

let t1 = 1;
let t2 = 1;

let t3 = 1;

let detectFace = document.getElementById('face');
let detectEye = document.getElementById('eye');




function startCamera() {
  if (streaming) return;
  navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(s) {
    stream = s;
    video.srcObject = s;
    video.play();
  })
    .catch(function(err) {
    console.log("An error occured! " + err);
  });

  video.addEventListener("canplay", function(ev){
    if (!streaming) {
      videoWidth = video.videoWidth;
      videoHeight = video.videoHeight;
      video.setAttribute("width", videoWidth);
      video.setAttribute("height", videoHeight);
      canvasOutput.width = videoWidth;
      canvasOutput.height = videoHeight;
      streaming = true;
    }

    startVideoProcessing();
  }, false);
}

let faceClassifier = null;
let eyeClassifier = null;

let src = null;
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;

let canvasInput = null;
let canvasInputCtx = null;

let canvasBuffer = null;
let canvasBufferCtx = null;

function startVideoProcessing() {
  if (!streaming) { console.warn("Please startup your webcam"); return; }
  stopVideoProcessing();
  canvasInput = document.createElement('canvas');
  canvasInput.width = videoWidth;
  canvasInput.height = videoHeight;
  canvasInputCtx = canvasInput.getContext('2d');
  
  canvasBuffer = document.createElement('canvas');
  canvasBuffer.width = videoWidth;
  canvasBuffer.height = videoHeight;
  canvasBufferCtx = canvasBuffer.getContext('2d');
  
  srcMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4);
  grayMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC1);
  
  faceClassifier = new cv.CascadeClassifier();
  faceClassifier.load('haarcascade_frontalface_default.xml');
  
  eyeClassifier = new cv.CascadeClassifier();
  eyeClassifier.load('haarcascade_eye_tree_eyeglasses.xml');//'haarcascade_eye.xml' 'haarcascade_eye_tree_eyeglasses' 'haarcascade_lefteye_2splits'
  
  requestAnimationFrame(processVideo);
}



function alteraLabel(texto,cor,cor2) {
  document.getElementById("divstatus1").innerHTML =
  "<font face='Arial' size='4' color='"+cor+"' style='background-color:"+cor2+";'>"+texto+"</font>";
}

function alteraLabel2(texto,cor,cor2) {
  document.getElementById("divstatus2").innerHTML =
  "<font face='Arial' size='4' color='"+cor+"' style='background-color:"+cor2+";'>"+texto+"</font>";
}

 a=new AudioContext() // browsers limit the number of concurrent audio contexts, so you better re-use'em

function beep(vol, freq, duration){
  v=a.createOscillator()
  u=a.createGain()
  v.connect(u)
  v.frequency.value=freq
  v.type="square"
  u.connect(a.destination)
  u.gain.value=vol*0.01
  v.start(a.currentTime)
  v.stop(a.currentTime+duration*0.001)
}

function start_script() {
  t3 = 1;
  document.getElementById("bt1").innerHTML =
  "<button disabled onclick='start_script()'>Dirigir</button>";
  document.getElementById("bt2").innerHTML =
  "<button enabled onclick='stop_script()'>Parar</button>";

  stats.end();
  requestAnimationFrame(processVideo);
}
function stop_script() {
    t3 = 0;
  document.getElementById("bt2").innerHTML =
  "<button disabled onclick='stop_script()'>Parar</button>";
  document.getElementById("bt1").innerHTML =
  "<button enabled onclick='start_script()'>Dirigir</button>"; 

}

function processVideo() {
if (t3 == 1)
{  
  stats.begin();
  canvasInputCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
  let imageData = canvasInputCtx.getImageData(0, 0, videoWidth, videoHeight);
  srcMat.data.set(imageData.data);
  cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
  let faces = [];
  let eyes = [];
  let size;
  if (detectFace.checked) {
    let faceVect = new cv.RectVector();
    let faceMat = new cv.Mat();
    if (detectEye.checked) {
      cv.pyrDown(grayMat, faceMat);
      size = faceMat.size();
    } else {
      cv.pyrDown(grayMat, faceMat);
      cv.pyrDown(faceMat, faceMat);
      size = faceMat.size();
    }
    faceClassifier.detectMultiScale(faceMat, faceVect);
    for (let i = 0; i < faceVect.size(); i++) {
      let face = faceVect.get(i);
      faces.push(new cv.Rect(face.x, face.y, face.width, face.height));
 
     if (detectEye.checked) {
      let eyeVect = new cv.RectVector();
      let eyeMat = new cv.Mat();
      cv.pyrDown(grayMat, eyeMat);
      cv.pyrDown(faceMat, faceMat);
      size = eyeMat.size();
      eyeClassifier.detectMultiScale(eyeMat, eyeVect);
      for (let i = 0; i < eyeVect.size(); i++) {
        let eye = eyeVect.get(i);
        if (eye.width < 45) eyes.push(new cv.Rect(eye.x, eye.y, eye.width, eye.height));
      }
      eyeMat.delete();
      eyeVect.delete();
    }

    }
    faceMat.delete();
    faceVect.delete();
  } else {
    if (detectEye.checked) {
      let eyeVect = new cv.RectVector();
      let eyeMat = new cv.Mat();
      cv.pyrDown(grayMat, eyeMat);
      
      size = eyeMat.size();
      eyeClassifier.detectMultiScale(eyeMat, eyeVect);
      for (let i = 0; i < eyeVect.size(); i++) {
        let eye = eyeVect.get(i);
        if (eye.width < 45) eyes.push(new cv.Rect(eye.x, eye.y, eye.width, eye.height));
      }
      eyeMat.delete();
      eyeVect.delete();
    }
  }
  canvasOutputCtx.drawImage(canvasInput, 0, 0, videoWidth, videoHeight);
  drawResults(canvasOutputCtx, faces, 'green', size);
  drawResults(canvasOutputCtx, eyes, 'yellow', size);



if (detectFace.checked) {
  if (faces.length == 1){
    alteraLabel('Indicador Face: Normal','black','white');
    t1 = 0;
  } else {
     if (t1 < 30) {
                  alteraLabel('Indicador Face: Distração Detectada','black','yellow'); 
                 }
     else        {
                  alteraLabel('Indicador Face: [PERIGO DETECTADO]','yellow', 'red');
                  beep(100, 520, 200);
                 }
  }
  t1 = t1 + 1;
}
if (detectEye.checked){
  if (eyes.length >= 2){
    alteraLabel2('Indicador Olhos: Normal','black','white');
    t2 = 0;
  } else {
     if (t2 < 15) {
                  alteraLabel2('Indicador Olhos: Distração Detectada','black','yellow'); 
                 }
     else        {
                  alteraLabel2('Indicador Olhos: [PERIGO DETECTADO]','yellow', 'red');
                 }

  }
  t2 = t2 + 1;
}
 



  stats.end();
  requestAnimationFrame(processVideo);
}
}


function drawResults(ctx, results, color, size) {
  for (let i = 0; i < results.length; ++i) {
    let rect = results[i];
    let xRatio = videoWidth/size.width;
    let yRatio = videoHeight/size.height;
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.strokeRect(rect.x*xRatio, rect.y*yRatio, rect.width*xRatio, rect.height*yRatio);
  }
}

function stopVideoProcessing() {
  if (src != null && !src.isDeleted()) src.delete();
  if (dstC1 != null && !dstC1.isDeleted()) dstC1.delete();
  if (dstC3 != null && !dstC3.isDeleted()) dstC3.delete();
  if (dstC4 != null && !dstC4.isDeleted()) dstC4.delete();
}

function stopCamera() {
  if (!streaming) return;
  stopVideoProcessing();
  document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, width, height);
  video.pause();
  video.srcObject=null;
  stream.getVideoTracks()[0].stop();
  streaming = false;
}

function initUI() {
  stats = new Stats();
  stats.showPanel(0);
  document.getElementById('container').appendChild(stats.dom);
}

function opencvIsReady() {
  console.log('OpenCV.js is ready');
  initUI();
  startCamera();
}