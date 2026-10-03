<script setup lang="ts">
// Compact, honest "nothing here" message for lists inside workspace pages.
// The heading level is chosen by the caller so page outlines stay correct.
import type { Component } from 'vue'
withDefaults(
  defineProps<{
    title: string
    text?: string
    icon?: Component
    level?: 'h2' | 'h3'
  }>(),
  { text: '', icon: undefined, level: 'h3' },
)
</script>
<template>
  <div class="list-empty">
    <component :is="icon" v-if="icon" :size="26" aria-hidden="true" class="list-empty-icon" />
    <component :is="level" class="list-empty-title">{{ title }}</component>
    <p v-if="text">{{ text }}</p>
    <div v-if="$slots.default" class="list-empty-actions"><slot /></div>
  </div>
</template>
<style>
.list-empty {
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
  padding: 32px 20px;
  margin-block: 16px;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}
.list-empty-icon {
  color: var(--accent);
  margin-bottom: 4px;
}
.list-empty .list-empty-title {
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  margin: 0;
}
.list-empty p {
  max-width: 460px;
  margin: 0;
  font-size: 0.88rem;
}
.list-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 18px;
  margin-top: 10px;
}
</style>
