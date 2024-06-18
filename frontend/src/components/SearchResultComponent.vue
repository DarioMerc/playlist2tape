<template>
  <div class="track">
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
      :icon="['fas', 'plus']"
      class="add pointer"
      @click="addTrack(side, song)"
    />
  </div>
</template>

<script>
export default {
  props: {
    element: Object,
  },
  methods: {
    formatDuration(durationMs) {
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    },
  },
};
</script>

<style scoped></style>
