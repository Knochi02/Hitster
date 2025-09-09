const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Basis-URL für Karten
const baseUrl = "https://knochi02.github.io/Hitster/karte.html?karte=";

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

const client_id = "26a0b6c1dd564438861726a3dc4fb46e";  // Spotify Client ID
const redirect_uri = "https://knochi02.github.io/Hitster"; // GitHub Pages URL der Seite
const scopes = "streaming user-read-email user-read-private user-modify-playback-state";

// Spotify Login URL generieren
function getSpotifyAuthUrl() {
  return `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scopes)}`;
}

// Token aus URL fragment auslesen
const hash = window.location.hash;
if (hash) {
  const token = new URLSearchParams(hash.replace("#", "?")).get("access_token");
  if (token) localStorage.setItem("spotify_token", token);
}

const token = localStorage.getItem("spotify_token");

// Prüfen, ob Token vorhanden ist, sonst Login weiterleiten
if (!localStorage.getItem("spotify_token")) {
  window.location.href = getSpotifyAuthUrl();
}
