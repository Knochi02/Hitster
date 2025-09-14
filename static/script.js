document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('login-button');
    if (btn) {
        btn.addEventListener('click', () => {
            window.location.href = "/login";
        });
    }
});

const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Kamera starten
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        requestAnimationFrame(scanQRCode);
    })
    .catch(err => {
        alert("Kamera-Zugriff verweigert: " + err);
    });

function scanQRCode() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            window.location.href = code.data;
            return;
        }
    }
    requestAnimationFrame(scanQRCode);
}