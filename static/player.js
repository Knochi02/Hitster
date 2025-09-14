document.addEventListener('DOMContentLoaded', async () => {
  const playButton = document.getElementById('play-button');
  const playImg = document.getElementById('play-img');
  const nextScanLink = document.getElementById('next-scan-link');

  // QR-Code Karte ID aus URL
  const urlParams = new URLSearchParams(window.location.search);
  const karteId = urlParams.get('karte');

  if (!karteId) {
    alert("Keine Karte gefunden!");
    playButton.disabled = true;
    return;
  }

  // Track-URI vom Backend holen
  async function getTrackUri(karteId) {
    const res = await fetch(`/karte/${karteId}`);
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return null;
    }
    return data.track_uri;
  }

  const trackUri = await getTrackUri(karteId);
  if (!trackUri) {
    playButton.disabled = true;
    return;
  }

  // Access Token holen
  async function getAccessToken() {
    const res = await fetch('/auth/token');
    const data = await res.json();
    if (data.error) alert(data.error);
    return data.access_token;
  }

  const accessToken = await getAccessToken();

  // Spotify Player initialisieren
  const player = new Spotify.Player({
    name: 'Hitster Player',
    getOAuthToken: cb => { cb(accessToken); },
    volume: 0.8
  });

  let deviceId;
  let isPlaying = false;

  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    deviceId = device_id;
    playButton.disabled = false;

    playButton.addEventListener('click', async () => {
      if (!isPlaying) {
        // Song starten oder fortsetzen
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: [trackUri] })
        });
        playImg.src = '/static/pause.png'; // Bild wechseln
        isPlaying = true;
      } else {
        // Song pausieren
        await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        playImg.src = '/static/play.png'; // Bild wechseln
        isPlaying = false;
      }
    });
  });

  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  player.connect();

  // Link zurück zum QR-Scanner
  if (nextScanLink) {
    nextScanLink.href = '/camera';
  }
});
