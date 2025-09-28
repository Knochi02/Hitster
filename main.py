from fastapi import FastAPI, Request, Depends
from fastapi.responses import RedirectResponse, JSONResponse
import requests, base64, os, json
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SCOPE = "user-read-playback-state user-modify-playback-state streaming"

# In-Memory Storage (später DB)
user_tokens = {}

# ---- Login-Check Dependency ----
def require_login():
    tokens = user_tokens.get('default')
    if not tokens:
        # nicht eingeloggt → auf Login-Seite umleiten
        # wirft keine Exception, sondern sendet Response:
        raise RedirectResponse(url="/login")
    return tokens

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
    if not code:
        return JSONResponse({"error": "Kein Code erhalten"}, status_code=400)

    auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }

    r = requests.post(SPOTIFY_TOKEN_URL, data=data, headers=headers)
    if r.status_code != 200:
        return JSONResponse({"error": r.text}, status_code=400)

    token_info = r.json()
    # Speichern von access + refresh Token (z.B. user_id = 'default')
    user_tokens['default'] = {
        "access_token": token_info['access_token'],
        "refresh_token": token_info['refresh_token']
    }

    return RedirectResponse("/camera")

@app.get("/camera")
async def camera(tokens: dict = Depends(require_login)):
    return RedirectResponse("/static/kamera.html")

@app.get("/auth/token")
async def get_token(tokens: dict = Depends(require_login)):
    # Access Token prüfen / erneuern
    access_token = tokens['access_token']
    refresh_token = tokens['refresh_token']

    auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    r = requests.post(SPOTIFY_TOKEN_URL, data=data, headers=headers)
    if r.status_code == 200:
        new_token_info = r.json()
        access_token = new_token_info['access_token']
        user_tokens['default']['access_token'] = access_token

    return JSONResponse({"access_token": access_token})

@app.get("/karte/{karte_id}")
async def get_track(karte_id: str, tokens: dict = Depends(require_login)):
    try:
        with open("songs.json", "r") as f:
            karte_map = json.load(f)
    except FileNotFoundError:
        return JSONResponse({"error": "Datenbank nicht gefunden"}, status_code=500)

    track_uri = karte_map.get(karte_id)
    if not track_uri:
        return JSONResponse({"error": "Song für diese Karte nicht gefunden"}, status_code=404)

    return {"track_uri": track_uri}
