<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { language as l, locale } from '../lib/i18n'
import type { Exercise } from '../lib/domain'
import media from '../content/exercise-media.json'
const props = defineProps<{
  exercise?: Omit<Exercise, 'kind'> & { kind?: string }
  thumbnail?: boolean
}>()
const pack = computed(() => {
  const e = props.exercise
  if (!e || e.media_url) return undefined
  // Older starter snapshots have no media field; only the fixed, reviewed starter mappings qualify.
  return media.items.find((item) =>
    e.media_ref
      ? item.id === e.media_ref
      : !e.owner_id && !e.workspace_id && item.exerciseId === e.id,
  )
})
const frame = ref(0),
  open = ref(false),
  playing = ref(false),
  failed = ref(false)
const name = computed(() =>
  locale.value === 'ar' ? props.exercise?.name_ar || props.exercise?.name : props.exercise?.name,
)
const asset = computed(() => pack.value?.frames[frame.value])
const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:55331'
const reduced =
  typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null
let timer: ReturnType<typeof setInterval> | undefined
function imageFailed() {
  failed.value = true
  stop()
}
function stop() {
  if (timer) clearInterval(timer)
  timer = undefined
  playing.value = false
}
function step(value: number) {
  stop()
  frame.value = (value + 3) % 3
  failed.value = false
}
function togglePlay() {
  if (playing.value) {
    stop()
    return
  }
  playing.value = true
  timer = setInterval(() => {
    frame.value = (frame.value + 1) % 3
  }, 900)
}
function toggle(e: Event) {
  open.value = (e.target as HTMLDetailsElement).open
  if (!open.value) stop()
}
function hidden() {
  if (document.hidden) stop()
}
function motionChanged() {
  if (reduced?.matches) stop()
}
document.addEventListener('visibilitychange', hidden)
reduced?.addEventListener('change', motionChanged)
watch(
  () => props.exercise?.id,
  () => {
    stop()
    frame.value = 0
    failed.value = false
  },
)
onBeforeUnmount(() => {
  stop()
  document.removeEventListener('visibilitychange', hidden)
  reduced?.removeEventListener('change', motionChanged)
})
</script>
<template>
  <details
    v-if="pack"
    class="exercise-demo"
    :class="{ 'demo-with-thumbnail': thumbnail }"
    @toggle="toggle"
  >
    <summary>
      <img
        v-if="thumbnail"
        :src="pack.frames[0]!.path.replace('/v1/catalog', '')"
        width="56"
        height="56"
        alt=""
        loading="lazy"
        @error="($event.target as HTMLImageElement).hidden = true"
      />
      <span>{{ l('See movement', 'شاهد الحركة') }}</span>
    </summary>
    <div v-if="open" class="demo-content">
      <div class="demo-stage">
        <img
          v-if="!failed && asset"
          :src="asset.path.replace('/v1/catalog', '')"
          :alt="`${name} · ${l('Position', 'الوضعية')} ${frame + 1} / 3`"
          width="512"
          height="512"
          @error="imageFailed"
        />
        <p v-else role="status">
          {{
            l(
              'Illustration unavailable. You can continue with the written instructions.',
              'الرسم غير متاح. يمكنك المتابعة بالتعليمات المكتوبة.',
            )
          }}
        </p>
      </div>
      <div class="demo-controls">
        <button
          type="button"
          class="button small secondary"
          @click="step(frame - 1)"
          :aria-label="l('Previous position', 'الوضعية السابقة')"
        >
          {{ l('Previous', 'السابق') }}
        </button>
        <span>{{ frame + 1 }} / 3</span>
        <button
          type="button"
          class="button small secondary"
          @click="step(frame + 1)"
          :aria-label="l('Next position', 'الوضعية التالية')"
        >
          {{ l('Next', 'التالي') }}
        </button>
        <button
          v-if="!failed"
          type="button"
          class="text-link"
          :aria-pressed="playing"
          @click="togglePlay"
        >
          {{ playing ? l('Pause', 'إيقاف مؤقت') : l('Play steps', 'تشغيل الخطوات') }}
        </button>
        <button v-else type="button" class="text-link" @click="failed = false">
          {{ l('Try image again', 'أعد تحميل الرسم') }}
        </button>
      </div>
      <p class="demo-caption">
        {{
          l(
            'Three reference positions, not a guide to movement speed. Follow your coach’s instructions.',
            'ثلاث وضعيات توضيحية، وليست دليلاً لسرعة الحركة. اتبع تعليمات مدربك.',
          )
        }}
      </p>
      <p class="demo-credit">
        <a href="https://github.com/bryllim/workout-guide" target="_blank" rel="noopener noreferrer"
          >Bryl Lim / Workout Guide</a
        ><span v-if="'source' in pack.attribution"> · Everkinetic</span> ·
        <a :href="media.licenseUrl" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> ·
        <a
          :href="apiUrl + '/v1/catalog/exercise-media'"
          target="_blank"
          rel="noopener noreferrer"
          >{{ l('Source & credits', 'المصدر والحقوق') }}</a
        >
      </p>
    </div>
  </details>
  <a
    v-else-if="exercise?.media_url"
    :href="exercise.media_url"
    target="_blank"
    rel="noopener noreferrer"
    class="text-link"
    >{{ l('Open demonstration', 'فتح الشرح') }} ↗</a
  >
</template>
<style scoped>
.exercise-demo {
  margin-block: 0.75rem;
  max-width: 100%;
}
.exercise-demo summary {
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
}
.demo-with-thumbnail summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.demo-with-thumbnail summary img {
  background: #1c2924;
  border-radius: 0.5rem;
  flex-shrink: 0;
}
.demo-content {
  max-width: 25rem;
  margin-top: 0.75rem;
}
.demo-stage {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  width: 100%;
  max-width: 22rem;
  background: #1c2924;
  color: #fff;
  border-radius: 0.75rem;
  padding: 1rem;
}
.demo-stage img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.demo-stage p {
  color: #fff;
  padding: 1rem;
}
.demo-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  max-width: 22rem;
  margin-top: 0.75rem;
}
.demo-caption,
.demo-credit {
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.6;
  margin-top: 0.6rem;
}
.demo-credit a {
  color: inherit;
}
</style>
