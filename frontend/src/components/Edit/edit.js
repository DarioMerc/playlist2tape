import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import draggable from "vuedraggable";
import { Mixtape, Side } from "../../models.js";

export default {
  components: {
    draggable,
  },
  data() {
    return {
      accessToken: "",
      refreshToken: "",
      mixtape: {},
      playlist: null,
      tapeLength: 90,
      url: "",
      drag: false,
      error: "",
    };
  },
  mounted() {
    const hashFragment = window.location.hash.substr(1);
    const params = new URLSearchParams(hashFragment);
    this.accessToken = params.get("access_token");
    this.refreshToken = params.get("refresh_token");

    localStorage.setItem("accessToken", this.accessToken);
    localStorage.setItem("refreshToken", this.refreshToken);

    toastr.options = {
      positionClass: "toast-top-right",
      preventDuplicates: true,
      timeOut: 3000, // Time duration for which the toast will be shown (in milliseconds)
    };
  },
  methods: {
    async getPlaylist() {
      this.error = "";
      this.mixtape = {};

      const regex = /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/;

      if (!this.url) {
        console.error("Error: URL is empty.");
        return;
      }

      if (!regex.test(this.url)) {
        console.error("Error: Invalid Spotify playlist URL.");
        return;
      }

      try {
        const response = await axios.get(`/api/get_playlist`, {
          params: {
            url: this.url,
          },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });

        // console.log(response.status);
        if (response.status !== 200) {
          console.error(
            `Error: Failed to fetch playlist (${response.status}).`
          );
          return;
        }

        this.playlist = response.data;

        const maxDuration = (this.tapeLength / 2) * 60 * 1000;

        if (
          !this.playlist.tracklist ||
          !Array.isArray(this.playlist.tracklist)
        ) {
          console.error("Error: Invalid tracklist format.");
          return;
        }

        const [sideAtracklist, sideBtracklist] = this.splitArrayByDuration(
          this.playlist.tracklist,
          maxDuration
        );

        if (!sideAtracklist || !sideBtracklist) {
          console.error("Error: Unable to split tracklist.");
          return;
        }

        this.mixtape = new Mixtape(this.playlist.id, this.playlist.name, [
          new Side("A", sideAtracklist),
          new Side("B", sideBtracklist),
        ]);
      } catch (error) {
        this.error = "Error fetching playlist.";
      }
    },
    async updatePlaylist() {
      let trackUris = [];
      this.mixtape.sides.forEach((side) => {
        side.tracklist.forEach((track) => {
          trackUris.push(track.uri);
        });
      });

      try {
        const response = await axios.post(`/api/update_playlist`, {
          playlistId: this.mixtape.id,
          trackUris: trackUris,
          accessToken: this.accessToken,
        });

        if (response.status == 200) {
          this.showToast("Playlist updated!", "success");
        }
      } catch (error) {
        this.showToast("Error updating playlist!", "error");
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
    showToast(message, type = "success") {
      toastr[type](message);
    },
  },
};
