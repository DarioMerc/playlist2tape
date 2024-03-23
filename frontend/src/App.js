import axios from "axios";
import draggable from "vuedraggable";
import { Mixtape, Side } from "./models";

export default {
  components: {
    draggable,
  },
  data() {
    return {
      apiURL: process.env.API_URL,
      loaded: false,
      mixtape: {},
      playlist: null,
      tapeLength: 90,
      url: "",
      drag: false,
    };
  },
  mounted() {
    // Get previous playlist from local storage
    if (localStorage.getItem("spotifyPlaylist") != null) {
      this.mixtape = JSON.parse(localStorage.getItem("spotifyPlaylist"));
      this.loaded = true;
    }
  },
  methods: {
    async getPlaylist() {
      const regex = /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/;

      if (regex.test(this.url)) {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/tracklist`,
            {
              params: {
                url: this.url,
              },
            }
          );
          this.playlist = response.data;

          const maxDuration = (this.tapeLength / 2) * 60 * 1000;

          const [sideAtracklist, sideBtracklist] = this.splitArrayByDuration(
            this.playlist.tracklist,
            maxDuration
          );
          this.mixtape = new Mixtape(this.playlist.name, [
            new Side("A", sideAtracklist),
            new Side("B", sideBtracklist),
          ]);
          localStorage.setItem("spotifyPlaylist", JSON.stringify(this.mixtape));
          this.loaded = true;
        } catch (error) {
          console.error("Error fetching playlist:", error);
        }
      }
    },
    formatDuration(durationMs) {
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    },
    splitArrayByDuration(songs, maxDuration) {
      const firstHalf = [];
      const secondHalf = [];
      let totalDuration = 0;

      for (const song of songs) {
        if (totalDuration + song.duration_ms <= maxDuration) {
          firstHalf.push(song);
          totalDuration += song.duration_ms;
        } else {
          secondHalf.push(song);
        }
      }

      return [firstHalf, secondHalf];
    },
    totalDuration(side) {
      return side.reduce((total, song) => total + song.duration_ms, 0);
    },
    formatMinute(durationM) {
      const totalSeconds = durationM * 60; // Convert minutes to seconds
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    },
    minToMs(minutes) {
      let seconds = minutes * 60; // Convert minutes to seconds
      let milliseconds = seconds * 1000; // Convert seconds to milliseconds
      return milliseconds;
    },
  },
};
