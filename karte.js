// -------- QR-Code Mapping (Karten-ID → Spotify URI) --------
const qrToSpotify = {
  "3456": "spotify:track:6mTJK3Y2Z2G8B4zRJ7qT5Y", // Timber
  "3457": "spotify:track:4cOdK2wGLETKBW3PvgPWqT", // Beispiel
  // weitere Karten hier einfügen
};

// -------- Karte-ID aus URL auslesen --------
let karteId = null;
const params = new URLSearchParams(window.location.search);
if (params.has("karte")) {
  karteId = params.get("karte");
} else {
  const match = window.location.pathname.match(/karte=(\d+)/);
  if (match) karteId = match[1];
}

const playButton = document.getElementById("play-button");
const token = localStorage.getItem("spotify_token");

// -------- Button aktivieren oder deaktivieren --------
if (!karteId || !qrToSpotify[karteId]) {
  playButton.disabled = true;
  playButton.textContent = "Ungültige Karte";
} else if (!token) {
  // Falls doch kein Token vorhanden, sollte der Nutzer auf index.html weitergeleitet werden
  alert("Spotify Login erforderlich. Bitte zurück zur Startseite.");
  playButton.disabled = true;
} else {
  const trackUri = qrToSpotify[karteId];

  // -------- Spotify Player initialisieren --------
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: "Hitster Player",
      getOAuthToken: cb => { cb(token); },
      volume: 0.8
    });

    // Player bereit
    player.addListener('ready', ({ device_id }) => {
      console.log('Spotify Player bereit, Device ID:', device_id);

      // Song abspielen, wenn Button geklickt wird
      playButton.addEventListener("click", () => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [trackUri] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }).then(() => {
          console.log("Song gestartet:", trackUri);
          // Optional: Button deaktivieren, damit nicht mehrfach geklickt wird
          playButton.disabled = true;
          playButton.textContent = "Wird abgespielt...";
        }).catch(err => {
          console.error("Fehler beim Abspielen:", err);
          alert("Fehler beim Abspielen. Stelle sicher, dass du Spotify Premium hast.");
        });
      });
    });

    // Player verbinden
    player.connect();
  };
}