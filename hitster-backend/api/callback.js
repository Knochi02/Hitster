import fetch from "node-fetch";

export default async function handler(req, res) {
  const code = req.query.code || null;
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirect_uri
  });

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await tokenRes.json();

  // Weiterleiten ans Frontend mit access_token im Fragment
  res.redirect(`${process.env.FRONTEND_URL}#access_token=${data.access_token}`);
}
