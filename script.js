// ---------------- Token aus URL-Fragment holen und speichern ----------------
const hash = window.location.hash;
if (hash) {
  const token = new URLSearchParams(hash.replace("#", "?")).get("access_token");
  if (token) {
    localStorage.setItem("spotify_token", token);
    // Token aus URL entfernen, damit QR-Scanner sauber läuft
    history.replaceState(null, null, window.location.pathname);
  }
}

// ---------------- QR-Scanner starten ----------------
const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Basis-URL für Karten
const baseUrl = "https://knochi02.github.io/Hitster/karte.html?karte=";

// Prüfen, ob Token existiert
const token = localStorage.getItem("spotify_token");
if (!token) {
  alert("Spotify Login erforderlich. Bitte zurück zur Login-Seite.");
} else {
  // Kamera starten
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

// ---------------- QR-Code Scanning ----------------
function scanQRCode() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const scannedValue = code.data.trim();

      // ✅ Wenn QR-Code nur eine Zahl ist → baue URL zusammen
      if (/^\d+$/.test(scannedValue)) {
        window.location.href = baseUrl + scannedValue;
      } else {
        // ✅ Wenn QR-Code schon eine URL ist → direkt weiterleiten
        try {
          const url = new URL(scannedValue);
          window.location.href = url.href;
        } catch {
          alert("Ungültiger QR-Code: " + scannedValue);
        }
      }
      return; // Stop scanning nach Erfolg
    }
  }
  requestAnimationFrame(scanQRCode);
}
