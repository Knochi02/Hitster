from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, HTMLResponse
import requests
import base64
import os
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

SCOPE = "user-read-playback-state user-modify-playback-state streaming"
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"

@app.get("/")
async def index():
    return RedirectResponse("/static/login.html")

@app.get("/login")
async def login():
    auth_query = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "scope": SCOPE,
        "redirect_uri": REDIRECT_URI,
        "show_dialog": "true"
    }
    url_args = "&".join([f"{key}={requests.utils.quote(val)}" for key, val in auth_query.items()])
    auth_url = f"{SPOTIFY_AUTH_URL}/?{url_args}"
    return RedirectResponse(auth_url)

@app.get("/callback")
async def callback(request: Request):
    code = request.query_params.get("code")
    if code is None:
        return HTMLResponse("Fehler: Kein Code erhalten", status_code=400)

    auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }

    r = requests.post(SPOTIFY_TOKEN_URL, data=data, headers=headers)
    if r.status_code != 200:
        return HTMLResponse(f"Fehler beim Token-Tausch: {r.text}", status_code=400)

    token_info = r.json()
    # Session-Handling ist in FastAPI anders, für einfache Weiterleitung reicht:
    return RedirectResponse("/camera")

@app.get("/camera")
async def camera():
    return RedirectResponse("/static/kamera.html")