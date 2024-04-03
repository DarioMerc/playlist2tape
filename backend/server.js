import axios from "axios";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import queryString from "query-string";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
var stateKey = "spotify_auth_state";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Helper Functions
function generateRandomString(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Routes
app.get("/", (req, res) => {
  res.send("Playlist2Tape API is running!");
});

app.get("/login", async (req, res) => {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  var scope = "playlist-modify-public playlist-modify-private";

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      queryString.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});
app.get("/callback", async (req, res) => {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  try {
    if (state === null || state !== storedState) {
      res.redirect(
        "/#" +
          queryString.stringify({
            error: "state_mismatch",
          })
      );
    } else {
      res.clearCookie(stateKey);

      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        queryString.stringify({
          code: code,
          redirect_uri: redirect_uri,
          grant_type: "authorization_code",
        }),
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${client_id}:${client_secret}`
            ).toString("base64")}`,
          },
        }
      );

      if (tokenResponse.status == 200) {
        var access_token = tokenResponse.data.access_token;
        var refresh_token = tokenResponse.data.refresh_token;

        res.redirect(
          "http://localhost:5173/edit/#" +
            queryString.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
            })
        );
      } else {
        res.redirect(
          "/#" +
            queryString.stringify({
              error: "invalid_token",
            })
        );
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_playlist", async (req, res) => {
  try {
    // Destructure the query parameters directly in the function signature
    const { url } = req.query;
    // Destructure the token directly from the Authorization header
    const { authorization } = req.headers;
    const token = authorization.replace("Bearer ", "");

    const playlistId = url.split("/").pop();
    // Use template literals for readability
    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Use Array.map for mapping instead of forEach
    const songs = playlistResponse.data.tracks.items.map((song) => ({
      title: song.track.name,
      artist: song.track.artists.map((artist) => artist.name).join(", "),
      album: song.track.album.name,
      duration_ms: song.track.duration_ms,
      href: song.track.href,
      uri: song.track.uri,
    }));

    // Use object shorthand for simplicity
    const playlist = {
      id: playlistResponse.data.id,
      name: playlistResponse.data.name,
      tracklist: songs,
    };

    // Use res.send() for sending JSON response
    res.send(playlist);
  } catch (error) {
    // Use res.status().send() for sending error response
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.post("/api/update_playlist", async (req, res) => {
  try {
    const { playlistId, trackUris, accessToken } = req.body;

    const replaceResponse = await axios.put(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      { uris: trackUris },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (replaceResponse.status === 201) {
      res.json({
        success: true,
        message: "Playlist tracks replaced successfully",
      });
    } else {
      console.log("Error from Spotify API:", replaceResponse.data);
      res
        .status(400)
        .json({ success: false, message: "Failed to replace playlist tracks" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});

app.get("/refresh_token", function (req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        access_token: access_token,
      });
    }
  });
});

// Static files for production
if (process.env.NODE_ENV === "prod") {
  app.use(express.static(path.join(__dirname, "frontend", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Server setup
app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
