<template>
  <div class="main-container">
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
              <table class="tracklist">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Artist</th>
                    <th>Duration</th>
                    <th></th>
                  </tr>
                </thead>
                <draggable
                  :list="side.tracklist"
                  itemKey="href"
                  tag="tbody"
                  :animation="200"
                  group="tracks"
                >
                  <template #item="{ element, index }">
                    <tr class="list-group-item">
                      <td v-if="side.id == 'B'">
                        {{ mixtape.sides[0].tracklist.length + (index + 1) }}
                      </td>
                      <td v-else>{{ index + 1 }}</td>
                      <td>{{ element.title }}</td>
                      <td>{{ element.artist }}</td>
                      <td>{{ formatDuration(element.duration_ms) }}</td>
                      <td>
                        <font-awesome-icon
                          :icon="['fas', 'xmark']"
                          class="delete pointer"
                          @click="removeTrack(side, element)"
                        />
                      </td>
                    </tr>
                  </template>
                </draggable>
              </table>
            </div>
            <table class="total-table">
              <tbody>
                <tr>
                  <td>
                    <!-- <font-awesome-icon
                      :icon="['fas', 'plus']"
                      class="add pointer"
                    /> -->
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

<script src="./edit.js"></script>
