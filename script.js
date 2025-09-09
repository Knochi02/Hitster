// Token aus URL-Fragment holen und speichern
const hash = window.location.hash;
if (hash) {
  const token = new URLSearchParams(hash.replace("#", "?")).get("access_token");
  if (token) {
    localStorage.setItem("spotify_token", token);
    history.replaceState(null, null, window.location.pathname); // URL bereinigen
  }
}

// QR-Scanner starten
const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const baseUrl = "https://knochi02.github.io/Hitster/karte.html?karte=";

// Token prüfen
const token = localStorage.getItem("spotify_token");
if (!token) {
  alert("Spotify Login erforderlich.");
  window.location.href = "login.html";
} else {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      video.play();
      requestAnimationFrame(scanQRCode);
    })
    .catch(err => {
      document.body.innerHTML += `<p style="color:red">❌ Kamera-Zugriff verweigert: ${err}</p>`;
    });
}

function scanQRCode() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const scannedValue = code.data.trim();
      if (/^\d+$/.test(scannedValue)) {
        window.location.href = baseUrl + scannedValue;
      } else {
        try {
          const url = new URL(scannedValue);
          window.location.href = url.href;
        } catch {
          alert("Ungültiger QR-Code: " + scannedValue);
        }
      }
      return;
    }
  }
  requestAnimationFrame(scanQRCode);
}
