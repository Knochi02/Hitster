document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-button');

    // QR-Code Karte ID aus URL
    const urlParams = new URLSearchParams(window.location.search);
    const karteId = urlParams.get('karte');

    if (!karteId) {
        alert("Keine Karte gefunden!");
        playButton.disabled = true;
        return;
    }

    // Spotify Track-Zuordnung
    const karteMap = {
        "4321": "spotify:track:5bcTCxgc7xVfSaMV3RuVke",
        "4322": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh"
    };
    const trackUri = karteMap[karteId];

    if (!trackUri) {
        alert("Song für diese Karte nicht gefunden!");
        playButton.disabled = true;
        return;
    }

    async function getAccessToken() {
        const res = await fetch('/auth/token');
        const data = await res.json();
        if (data.error) alert(data.error);
        return data.access_token;
    }

    async function initPlayer() {
        const accessToken = await getAccessToken();

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
                    playButton.src = '/static/pause.png'; // Bild wechseln
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
                    playButton.src = '/static/play.png'; // Bild wechseln
                    isPlaying = false;
                }
            });
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        player.connect();
    }

    initPlayer();
});
