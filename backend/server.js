import axios from "axios";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import authRoutes from "./auth.js";

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
app.use(authRoutes);

app.get("/api/get_playlist", async (req, res) => {
  try {
    const { url } = req.query;

    const { authorization } = req.headers;
    const token = authorization.replace("Bearer ", "");

    const playlistId = url.split("/").pop();

    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const songs = playlistResponse.data.tracks.items.map((song) => ({
      title: song.track.name,
      artist: song.track.artists.map((artist) => artist.name).join(", "),
      album: song.track.album.name,
      art: song.track.album.images[0].url,
      duration_ms: song.track.duration_ms,
      href: song.track.href,
      uri: song.track.uri,
    }));

    const playlist = {
      id: playlistResponse.data.id,
      name: playlistResponse.data.name,
      tracklist: songs,
    };

    res.send(playlist);
  } catch (error) {
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

    if (replaceResponse.status === 200) {
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
app.get("/api/search_songs", async (req, res) => {
  try {
    const { q } = req.query;
    const { authorization } = req.headers;
    const token = authorization.replace("Bearer ", "");

    const response = await axios.get("https://api.spotify.com/v1/search", {
      params: {
        q,
        type: "track",
        limit: 10,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const results = response.data.tracks.items.map((song) => ({
      title: song.name,
      artist: song.artists.map((artist) => artist.name).join(", "),
      album: song.album.name,
      art: song.album.images[0].url,
      duration_ms: song.duration_ms,
      href: song.href,
      uri: song.uri,
    }));

    res.send(results);
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Serve static files for production
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
