<template>
  <div class="main-container">
    <SearchModal
      :isOpen="isModalOpened"
      :sideToAddSong="sideToAddSong"
      @close-modal="closeSearchModal"
      @submit-modal="submitHandler"
    />
    <nav>
      <h1>Playlist 2 Tape</h1>
      <div class="input-wrapper">
        <label class="label" for="name">Tape Length:</label>
        <input
          autocomplete="off"
          class="input"
          type="text"
          id="name"
          placeholder="Example 90,60,etc"
          v-model="tapeLength"
        />
      </div>

      <div class="input-wrapper">
        <label class="label" for="name">Spotify Playlist URL:</label>
        <input
          autocomplete="off"
          class="input"
          type="text"
          id="name"
          placeholder="Paste link here"
          v-model="url"
        />
      </div>

      <button class="btn" @click="getPlaylist">View Playlist</button>
      <button class="btn" @click="updatePlaylist" :disabled="playlist === null">
        Update Playlist
      </button>

      <div class="copyright">
        &copy; {{ new Date().getFullYear() }} Dario Mercuri. All rights
        reserved.
      </div>
    </nav>

    <div class="content">
      <h3 class="error">{{ error }}</h3>
      <div v-if="error !== null" style="margin: 0">
        <h2>{{ mixtape.name }}</h2>
        <div class="sides">
          <div class="side" v-for="side in mixtape.sides" :key="side.id">
            <h3 style="margin: 0">Side {{ side.id }}</h3>
            <div class="scroll-wrapper">
              <div style="display: flex; flex-direction: column">
                <draggable
                  :list="side.tracklist"
                  itemKey="href"
                  tag="tbody"
                  :animation="200"
                  group="tracks"
                >
                  <template #item="{ element, index }">
                    <track-component
                      :side="side"
                      :index="index"
                      :mixtape="mixtape"
                      :element="element"
                    ></track-component>
                  </template>
                </draggable>
              </div>
            </div>
            <table class="total-table">
              <tbody>
                <tr>
                  <td>
                    <font-awesome-icon
                      :icon="['fas', 'plus']"
                      class="add pointer"
                      @click="openSearchModal(side)"
                    />
                  </td>
                  <td></td>
                  <td style="text-align: end"><strong>Total:</strong></td>
                  <td>
                    <span
                      :class="{
                        'red-text':
                          totalDuration(side.tracklist) >
                          convertMinToMs(tapeLength / 2),
                      }"
                    >
                      {{ formatDuration(totalDuration(side.tracklist)) }}</span
                    >/{{ formatMinute(tapeLength / 2) }}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Cookies from "js-cookie";
import { ref } from "vue";
import { useToast } from "vue-toastification";
import "vue-toastification/dist/index.css";
import draggable from "vuedraggable";
import { Mixtape, Side } from "../models.js";
import Modal from "./Modal.vue";
import SearchModal from "./SearchModal.vue";
import TrackComponent from "./TrackComponent.vue";

export default {
  components: {
    draggable,
    Modal,
    TrackComponent,
    SearchModal,
  },
  data() {
    return {
      mixtape: {},
      playlist: null,
      tapeLength: 90,
      url:
        localStorage.getItem("playlistUrl") != null
          ? localStorage.getItem("playlistUrl")
          : "",
      drag: false,
      error: "",
    };
  },
  setup() {
    const toast = useToast();

    const isModalOpened = ref(false);
    const sideToAddSong = ref(undefined);

    const openSearchModal = (side) => {
      sideToAddSong.value = side;
      isModalOpened.value = true;
    };
    const closeSearchModal = () => {
      sideToAddSong.value = undefined;
      isModalOpened.value = false;
    };

    const submitHandler = () => {
      //here you do whatever
    };

    return {
      toast,
      isModalOpened,
      sideToAddSong,
      openSearchModal,
      closeSearchModal,
      submitHandler,
    };
  },
  methods: {
    async getPlaylist() {
      this.error = "";
      this.mixtape = {};

      const regex = /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/;

      if (!this.url) {
        this.error = "URL is empty";
        return;
      }

      if (!regex.test(this.url)) {
        this.error = "Invalid Spotify playlist URL.";
        return;
      }

      try {
        const response = await axios.get(`/api/get_playlist`, {
          params: {
            url: this.url,
          },
          headers: {
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
        });

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

        console.log(this.mixtape);
        localStorage.setItem("playlistUrl", this.url);
      } catch (error) {
        this.error = "Error fetching playlist. Try refreshing.";
      }
    },
    async updatePlaylist() {
      try {
        let trackUris = [];
        this.mixtape.sides.forEach((side) => {
          side.tracklist.forEach((track) => {
            trackUris.push(track.uri);
          });
        });

        const response = await axios.post(`/api/update_playlist`, {
          playlistId: this.mixtape.id,
          trackUris: trackUris,
          accessToken: Cookies.get("access_token"),
        });

        console.log(response);

        if (response.status == 200) {
          this.toast.success("Playlist updated", {
            position: "top-right",
            timeout: 5000,
            icon: false,
          });
        }
      } catch (error) {
        this.toast.error("Error updating playlist", {
          position: "top-right",
          timeout: 5000,
          icon: false,
        });
      }
    },

    addTrack(side, trackToAdd) {
      this.mixtape.sides[side.id == "A" ? 0 : 1].tracklist.push(trackToAdd);
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
          break; // Exit loop once adding a song exceeds maxDuration
        }
      }

      secondHalf.push(...songs.slice(firstHalf.length)); // Add remaining songs to secondHalf

      return [firstHalf, secondHalf];
    },
    totalDuration(side) {
      return side.reduce((total, song) => total + song.duration_ms, 0);
    },
    formatDuration(durationMs) {
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    },
    convertMinToMs(minutes) {
      let seconds = minutes * 60;
      let milliseconds = seconds * 1000;
      return milliseconds;
    },
    formatMinute(durationM) {
      const totalSeconds = durationM * 60;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    },
  },
};
</script>
