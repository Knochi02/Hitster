document.addEventListener('DOMContentLoaded', async () => {
  const playImg = document.getElementById('play-img');
  const nextScanLink = document.getElementById('next-scan-link');

  // QR-Code Karte ID aus URL
  const urlParams = new URLSearchParams(window.location.search);
  const karteId = urlParams.get('karte');

  if (!karteId) {
    alert("Keine Karte gefunden!");
    playImg.style.pointerEvents = 'none'; // Klick deaktivieren
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
    playImg.style.pointerEvents = 'none';
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
  let firstStart = true; 

  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    deviceId = device_id;

    playImg.addEventListener('click', async () => {
    if (!isPlaying) {
        // Song starten (beim ersten Klick) oder fortsetzen (bei Pause)
        const body = firstStart
            ? JSON.stringify({ uris: [trackUri] }) // nur beim ersten Start Track übergeben
            : null; // danach nur fortsetzen

        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: body
        });

        playImg.src = '/static/pause.png';
        isPlaying = true;
        firstStart = false;
    } else {
        // Song pausieren
        await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        playImg.src = '/static/play.png';
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
