<template>
  <Modal
    :isOpen="isOpen"
    :side="sideToAddSong"
    @modal-close="closeSearchModal"
    @submit="submitHandler"
    name="first-modal"
  >
    <template #content>
      <div class="modal-content">
        <div class="searchbar">
          <div class="input-wrapper">
            <input
              autocomplete="off"
              class="input"
              type="text"
              id="name"
              placeholder="Example: whats up by 4 non blondes"
              v-model="searchQuery"
            />
          </div>
          <button class="btn" @click="searchSongs">Search</button>
        </div>
        <div class="modal-scroll">
          <search-result-component
            v-for="song in searchResults"
            :key="song.uri"
            :element="song"
          ></search-result-component>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script>
import axios from "axios";
import Cookies from "js-cookie";
import { useToast } from "vue-toastification";
import Modal from "./Modal.vue";
import SearchResultComponent from "./SearchResultComponent.vue";

export default {
  setup() {
    const toast = useToast();
    return { toast };
  },
  components: {
    Modal,
    SearchResultComponent,
  },
  props: {
    isOpen: Boolean,
    sideToAddSong: Object,
  },
  data() {
    return {
      searchQuery: "",
      searchResults: [],
    };
  },
  methods: {
    async searchSongs() {
      try {
        const response = await axios.get(`/api/search_songs`, {
          params: {
            q: this.searchQuery,
          },
          headers: {
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
        });

        this.searchResults = response.data;
      } catch (error) {
        this.toast.error("Error searching songs", {
          position: "top-right",
          timeout: 5000,
          icon: false,
        });
      }
    },
    closeSearchModal() {
      this.$emit("close-modal");
    },
    submitHandler() {
      this.$emit("submit-modal");
    },
  },
};
</script>
