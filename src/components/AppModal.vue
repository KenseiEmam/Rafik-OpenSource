<script setup lang="ts">
// One accessible modal for same-page create/edit flows. Reka owns focus trapping,
// Escape, scroll locking and nested popup layers; callers own their drafts.
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { PhX } from '@phosphor-icons/vue'
import { language as l, locale } from '../lib/i18n'
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    size?: 'medium' | 'large'
    dismissible?: boolean
  }>(),
  { description: '', size: 'medium', dismissible: true },
)
const emit = defineEmits<{ 'update:open': [boolean]; close: [] }>()
function change(value: boolean) {
  if (value) return emit('update:open', true)
  if (!props.dismissible) return
  emit('update:open', false)
  emit('close')
}
</script>
<template>
  <DialogRoot :open="open" @update:open="change">
    <DialogPortal>
      <DialogOverlay class="app-modal-overlay" />
      <DialogContent
        class="app-modal"
        :class="'app-modal-' + size"
        :dir="locale === 'ar' ? 'rtl' : 'ltr'"
        @interact-outside="!dismissible && $event.preventDefault()"
        @escape-key-down="!dismissible && $event.preventDefault()"
      >
        <header class="app-modal-heading">
          <div>
            <DialogTitle class="app-modal-title">{{ title }}</DialogTitle>
            <DialogDescription v-if="description" class="app-modal-description">{{
              description
            }}</DialogDescription>
          </div>
          <DialogClose v-if="dismissible" class="icon-button" :aria-label="l('Close', 'إغلاق')"
            ><PhX :size="20" aria-hidden="true"
          /></DialogClose>
        </header>
        <div class="app-modal-body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="app-modal-footer">
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
<style>
.app-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: #0b120fa6;
  backdrop-filter: blur(2px);
}
.app-modal {
  position: fixed;
  z-index: 81;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
  width: min(560px, calc(100vw - 32px));
  max-height: min(860px, calc(100dvh - 48px));
  display: flex;
  flex-direction: column;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 24px 70px #0000004d;
}
[dir='rtl'].app-modal {
  transform: translate(50%, -50%);
}
.app-modal-large {
  width: min(860px, calc(100vw - 32px));
}
.app-modal:focus {
  outline: none;
}
.app-modal-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 14px;
  border-bottom: 1px solid var(--line);
}
.app-modal-heading > div {
  min-width: 0;
  overflow-wrap: anywhere;
}
.app-modal-title {
  font-size: 1.15rem;
  line-height: 1.35;
  letter-spacing: -0.02em;
  margin: 0;
}
.app-modal-description {
  font-size: 0.85rem;
  margin-top: 6px;
}
.app-modal-body {
  padding: 18px 22px 22px;
  overflow-y: auto;
  overscroll-behavior: contain;
  min-height: 0;
}
.app-modal-body > form > fieldset > label,
.app-modal-body .form-fields > label {
  margin-block: 14px;
}
.app-modal-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--line);
}
@media (max-width: 650px) {
  .app-modal,
  [dir='rtl'].app-modal {
    inset: auto 0 0 0;
    transform: none;
    width: 100%;
    max-height: calc(100dvh - 24px);
    border-radius: var(--radius) var(--radius) 0 0;
  }
  .app-modal-heading,
  .app-modal-body,
  .app-modal-footer {
    padding-inline: 16px;
  }
}
</style>
