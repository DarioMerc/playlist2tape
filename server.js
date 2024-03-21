import path from "path";

import axios from "axios";
import dotenv from "dotenv";
import express from "express";

// Spotify stuff
dotenv.config();
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const app = express();

app.get("/api/tracklist", async (req, res) => {
  try {
    const playlistUrl = req.query.url;

    // Get access token
    const { data: tokenResponse } = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
        },
      }
    );

    const accessToken = tokenResponse.access_token;

    const playlistId = playlistUrl.split("/").pop();

    // Get Track List
    const { data: playlistData } = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const songs = playlistData.tracks.items.map((song) => ({
      title: song.track.name,
      artist: song.track.artists.map((artist) => artist.name).join(", "),
      album: song.track.album.name,
      duration_ms: song.track.duration_ms,
      href: song.track.href,
    }));

    const playlist = {
      name: playlistData.name,
      tracklist: songs,
    };

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const __dirname = path.resolve();

// Serve Vue.js app
if (process.env.NODE_ENV === "prod") {
  app.use(express.static(path.join(__dirname, "frontend", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running!");
  });
}

// Run Server
const PORT = process.env.PORT || 5000;
app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}`)
);
