<template>
  <h1>Playlist 2 Tape</h1>

  <div style="text-align: start">
    <div>
      <label for="">Tape Length</label>
      <input
        type="text"
        v-model="tapeLength"
        placeholder="Example: 60, 90, etc"
      />
    </div>
    <div>
      <label for="">Spotify Playlist URL</label>
      <input type="text" v-model="url" />
    </div>
  </div>

  <button @click="getPlaylist">Get Playlist</button>

  <hr />

  <div v-if="playlist" style="margin: 0">
    <h2 style="margin: 0">{{ playlist.name }}</h2>
    <div class="sides">
      <div class="side" v-for="side in mixtape.sides" :key="side.id">
        <h3 style="margin: 0">Side {{ side.id }}</h3>
        <div class="scroll-wrapper">
          <table class="tracklist">
            <thead>
              <tr>
                <th style="width: 45%">Title</th>
                <th>Artist</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="track in side.tracklist" :key="track.href">
                <td>{{ track.title }}</td>
                <td>{{ track.artist }}</td>
                <td>{{ formatDuration(track.duration_ms) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <table class="total-table">
          <tr>
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
<style>
@import "./App.css";
</style>
