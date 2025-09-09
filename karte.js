// -------- Konfiguration --------
const client_id = "26a0b6c1dd564438861726a3dc4fb46e";  // Spotify Client ID
const redirect_uri = "https://knochi02.github.io/Hitster"; // GitHub Pages URL der Seite
const scopes = "streaming user-read-email user-read-private user-modify-playback-state";

// QR-Code Mapping (Karten-ID → Spotify URI)
const qrToSpotify = {
  "3456": "spotify:track:6mTJK3Y2Z2G8B4zRJ7qT5Y", // Timber
  "3457": "spotify:track:4cOdK2wGLETKBW3PvgPWqT", // Beispiel
};

// -------- Karte-ID aus URL lesen --------
let karteId = null;
const params = new URLSearchParams(window.location.search);
if (params.has("karte")) {
  karteId = params.get("karte");
} else {
  // Pfad-Variante: /karte=3456
  const match = window.location.pathname.match(/karte=(\d+)/);
  if (match) karteId = match[1];
}

const playButton = document.getElementById("play-button");

// -------- Spotify OAuth --------
function getSpotifyAuthUrl() {
  return `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scopes)}`;
}

// Token aus URL fragment lesen
const hash = window.location.hash;
if (hash) {
  const token = new URLSearchParams(hash.replace("#", "?")).get("access_token");
  if (token) localStorage.setItem("spotify_token", token);
}

const token = localStorage.getItem("spotify_token");

// -------- Button aktivieren oder deaktivieren --------
if (!karteId || !qrToSpotify[karteId]) {
  playButton.disabled = true;
  playButton.textContent = "Ungültige Karte";
} else if (!token) {
  // Wenn noch kein Token → auf Spotify Login weiterleiten
  window.location.href = getSpotifyAuthUrl();
} else {
  const trackUri = qrToSpotify[karteId];

  // -------- Spotify Player initialisieren --------
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: "Hitster Player",
      getOAuthToken: cb => { cb(token); },
      volume: 0.8
    });

    player.addListener('ready', ({ device_id }) => {
      console.log('Spotify Player bereit, Device ID:', device_id);

      playButton.addEventListener("click", () => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [trackUri] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
      });
    });

    player.connect();
  };
}
