const video = document.createElement('video');
video.autoplay = true;
video.muted = true;
video.width = 720;
video.height = 560;
document.body.appendChild(video);

const run = async () => {
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.ageGenderNet.loadFromUri('./models'),
        faceapi.nets.faceExpressionNet.loadFromUri('./models')
    ]);

    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    );

    video.addEventListener('play', async () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.appendChild(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors().withAgeAndGender().withFaceExpressions();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

            resizedDetections.forEach(face => {
                const { age, gender, genderProbability, expressions } = face;
                const gendetText = `${gender} - ${Math.floor(genderProbability * 100)}%`;
                const ageText = `Age: ${Math.round(age)} years`;
                const expressionText = `Expressions: ${Object.keys(expressions).map(exp => `${exp}: ${expressions[exp].toFixed(2)}`).join(', ')}`;
                const textfield = new faceapi.draw.DrawTextField([gendetText, ageText], face.detection.box.topLeft);
                // const textField = new faceapi.draw.DrawTextField([expressionText], face.detection.box.topLeft);
                textfield.draw(canvas);
                // textField.draw(canvas);
            });
        }, 100);
    });
}

run();
