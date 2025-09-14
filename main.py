from flask import Flask, redirect, request, session
import requests
import base64
import os
from dotenv import load_dotenv

load_dotenv()  

app = Flask(__name__)
app.secret_key = os.urandom(24)

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

SCOPE = "user-read-playback-state user-modify-playback-state streaming"

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"

@app.route("/")
def index():
    return redirect("/static/login.html")

@app.route("/login")
def login():
    auth_query = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "scope": SCOPE,
        "redirect_uri": REDIRECT_URI,
        "show_dialog": "true"
    }
    url_args = "&".join([f"{key}={requests.utils.quote(val)}" for key, val in auth_query.items()])
    auth_url = f"{SPOTIFY_AUTH_URL}/?{url_args}"
    return redirect(auth_url)

@app.route("/callback")
def callback():
    code = request.args.get("code")
    if code is None:
        return "Fehler: Kein Code erhalten", 400

    auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }

    r = requests.post(SPOTIFY_TOKEN_URL, data=data, headers=headers)
    if r.status_code != 200:
        return f"Fehler beim Token-Tausch: {r.text}", 400

    token_info = r.json()
    session["access_token"] = token_info["access_token"]

    # Weiterleitung zur Kamera-Seite
    return redirect("/camera")

@app.route("/camera")
def camera():
    return redirect("/static/kamera.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
