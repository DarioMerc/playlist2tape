<template>
  <div class="track">
    <div class="number" v-if="side.id == 'B'">
      {{ mixtape.sides[0].tracklist.length + (index + 1) }}
    </div>
    <div class="number" v-else>{{ index + 1 }}</div>

    <img class="art" :src="element.art" alt="" />
    <div class="details">
      <div class="title">{{ element.title }}</div>
      <div class="album">{{ element.album }}</div>
      <div class="artist">{{ element.artist }}</div>
    </div>
    <div class="length">
      {{ formatDuration(element.duration_ms) }}
    </div>
    <font-awesome-icon
      :icon="['fas', 'xmark']"
      class="delete pointer"
      @click="removeTrack(side, element)"
    />
  </div>
</template>

<script>
export default {
  props: {
    side: Object,
    index: Number,
    mixtape: Object,
    element: Object,
  },
  methods: {
    formatDuration(durationMs) {
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    },
    removeTrack(side, trackToRemove) {
      if (window.confirm("Are you sure you want to delete this track?")) {
        side.tracklist = side.tracklist.filter(
          (track) => track.uri !== trackToRemove.uri
        );
        this.toast.error(`Removed ${trackToRemove.title}`, {
          position: "top-right",
          timeout: 5000,
          icon: false,
        });
      }
    },
  },
};
</script>

<style scoped></style>
