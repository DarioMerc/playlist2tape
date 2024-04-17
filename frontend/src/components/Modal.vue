<script setup>
import { onClickOutside } from "@vueuse/core";
import { defineEmits, defineProps, ref } from "vue";

const props = defineProps({
  isOpen: Boolean,
  side: String,
});

const emit = defineEmits(["modal-close"]);

const target = ref(null);
onClickOutside(target, () => emit("modal-close"));
</script>

<template>
  <div v-if="isOpen" class="modal-mask">
    <div class="modal-wrapper">
      <div class="modal-container" ref="target">
        <font-awesome-icon
          :icon="['fas', 'xmark']"
          class="close pointer"
          @click.stop="emit('modal-close')"
        />
        <div class="modal-body">
          Add tracks to Side {{ side }}
          <slot name="content"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
