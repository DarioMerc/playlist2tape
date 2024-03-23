<template>
  <nav>
    <div style="text-align: start">
      <h1>Playlist 2 Tape</h1>
      <h6>Can your playlist fit on a cassette tape?</h6>
    </div>
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

    <button @click="getPlaylist">Get Playlist</button>
  </nav>

  <div v-if="mixtape" style="margin: 0">
    <h2>{{ mixtape.name }}</h2>
    <div class="sides">
      <div class="side" v-for="side in mixtape.sides" :key="side.id">
        <h3 style="margin: 0">Side {{ side.id }}</h3>
        <div class="scroll-wrapper">
          <table class="tracklist">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Artist</th>
                <th>Duration</th>
              </tr>
            </thead>
            <draggable
              :list="side.tracklist"
              itemKey="href"
              tag="tbody"
              :animation="100"
              group="tracks"
            >
              <template #item="{ element, index }">
                <tr class="list-group-item">
                  <td>{{ index + 1 }}</td>
                  <td>{{ element.title }}</td>
                  <td>{{ element.artist }}</td>
                  <td>{{ formatDuration(element.duration_ms) }}</td>
                </tr>
              </template>
            </draggable>
          </table>
        </div>
        <table class="total-table">
          <tr>
            <td></td>
            <td></td>
            <td><strong>Total Duration:</strong></td>
            <td>
              <span
                :class="{
                  'red-text':
                    totalDuration(side.tracklist) > minToMs(tapeLength / 2),
                }"
              >
                {{ formatDuration(totalDuration(side.tracklist)) }}</span
              >/{{ formatMinute(tapeLength / 2) }}
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script src="./App.js"></script>
<style lang="scss">
@import "./styles/main.scss";
</style>
