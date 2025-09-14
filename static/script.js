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

document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-button');

    // Karten-ID aus URL
    const urlParams = new URLSearchParams(window.location.search);
    const karteId = urlParams.get('karte');

    if (!karteId) {
        alert("Keine Karte gefunden!");
        playButton.disabled = true;
        return;
    }

    // Spotify Track-Zuordnung (später extern)
    const karteMap = {
        "4321": "spotify:track:7ouMYWpwJ422jRcDASZB7P", // Beispiel Track-ID
        "4322": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
        "4323": "spotify:track:1EzrEOXmMH3G43AXT1y7pA"
    };

    const trackUri = karteMap[karteId];
    if (!trackUri) {
        alert("Song für diese Karte nicht gefunden!");
        playButton.disabled = true;
        return;
    }

    // Spotify Access Token vom Backend übergeben
    const accessToken = window.accessToken; // z. B. über Template oder JS

    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: 'Hitster Player',
            getOAuthToken: cb => { cb(accessToken); },
            volume: 0.8
        });

        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);

            playButton.addEventListener('click', () => {
                fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ uris: [trackUri] }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                });
            });
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        player.connect();
    };
});

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

    player.addListener('ready', ({ device_id }) => {
        console.log('Device ID', device_id);

        document.getElementById('play-button').addEventListener('click', async () => {
            // QR-Code Karte ID aus URL
            const urlParams = new URLSearchParams(window.location.search);
            const karteId = urlParams.get('karte');
            const karteMap = {
                "4321": "spotify:track:7ouMYWpwJ422jRcDASZB7P",
                "4322": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh"
            };
            const trackUri = karteMap[karteId];

            if (!trackUri) { alert("Song nicht gefunden"); return; }

            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [trackUri] }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            });
        });
    });

    player.connect();
}

initPlayer();