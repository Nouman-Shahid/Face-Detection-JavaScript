const video = document.getElementById('video');
const message = document.getElementById('message');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  );
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  async function detectGaze() {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    if (resizedDetections.length > 0) {
      const landmarks = resizedDetections[0].landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      // Calculate the center of each eye
      const leftEyeCenter = { x: (leftEye[0].x + leftEye[3].x) / 2, y: (leftEye[0].y + leftEye[3].y) / 2 };
      const rightEyeCenter = { x: (rightEye[0].x + rightEye[3].x) / 2, y: (rightEye[0].y + rightEye[3].y) / 2 };

      const eyeCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
      const eyeCenterY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

      const faceWidth = video.width;
      const gazeThreshold = 50; 

      // Calculate the difference from the center of the face
      const xDiff = eyeCenterX - (faceWidth / 2);

      if (xDiff > gazeThreshold) {
        message.textContent = 'Person looking left';
      } else if (xDiff < gazeThreshold) {
        message.textContent = 'Person looking right';
      } 
    } else {
      message.textContent = 'No face detected';
    }

    setTimeout(detectGaze, 100);
  }

  detectGaze();
});
