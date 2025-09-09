const qrToSpotify = {
  "3456": "spotify:track:6mTJK3Y2Z2G8B4zRJ7qT5Y",
  "3457": "spotify:track:4cOdK2wGLETKBW3PvgPWqT"
};

const params = new URLSearchParams(window.location.search);
const karteId = params.get("karte");
const playButton = document.getElementById("play-button");
const token = localStorage.getItem("spotify_token");

if (!token) {
  alert("Spotify Login erforderlich.");
  window.location.href = "login.html";
}

const trackUri = qrToSpotify[karteId];
if (!karteId || !trackUri) {
  playButton.disabled = true;
  playButton.textContent = "Ungültige Karte";
} else {
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: "Hitster Player",
      getOAuthToken: cb => { cb(token); },
      volume: 0.8
    });

    player.addListener('ready', ({ device_id }) => {
      console.log('Spotify Player ready, Device ID:', device_id);

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
          playButton.disabled = true;
          playButton.textContent = "Wird abgespielt...";
        }).catch(err => {
          console.error("Fehler beim Abspielen:", err);
          alert("Fehler beim Abspielen. Stelle sicher, dass du Spotify Premium hast.");
        });
      });
    });

    player.connect();
  };
}
