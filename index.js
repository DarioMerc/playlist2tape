require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Spotify stuff
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

app.get("/tracklist", async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
