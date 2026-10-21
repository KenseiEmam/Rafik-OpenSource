<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { request } from '../../lib/backend'
import { language as l, errorMessage } from '../../lib/i18n'
import type { Member } from './types'
const props = withDefaults(
  defineProps<{
    workspace: string
    view: string
    modelValue: string[]
    role?: string
    sport?: string
    includeSelf?: boolean
    label?: string
    single?: boolean
    max?: number
    disabled?: boolean
    requiredIds?: string[]
    excludeIds?: string[]
  }>(),
  {
    role: '',
    sport: '',
    includeSelf: false,
    single: false,
    disabled: false,
    max: 100,
    requiredIds: () => [],
    excludeIds: () => [],
  },
)
const emit = defineEmits<{ 'update:modelValue': [string[]]; options: [Member[]] }>()
const search = ref(''),
  items = ref<Member[]>([]),
  chosen = ref<Member[]>([]),
  next = ref<number | null>(null),
  loading = ref(false),
  error = ref(''),
  total = ref(0)
let generation = 0
async function load(append = false) {
  const current = ++generation
  loading.value = true
  error.value = ''
  try {
    const q = new URLSearchParams({
      view: props.view,
      role: props.role,
      sport: props.sport,
      search: search.value,
      self: String(props.includeSelf),
      offset: String(append ? next.value || 0 : 0),
      selected: props.modelValue.join(','),
    })
    const data = await request<{
      items: Member[]
      selected: Member[]
      next: number | null
      total: number
    }>(`/v1/workspaces/${props.workspace}/people?${q}`)
    if (current !== generation) return
    items.value = append
      ? Array.from(new Map([...items.value, ...data.items].map((m) => [m.id, m])).values())
      : data.items
    chosen.value = data.selected
    next.value = data.next
    total.value = data.total
    emit(
      'options',
      Array.from(new Map([...chosen.value, ...items.value].map((m) => [m.id, m])).values()),
    )
  } catch (e) {
    if (current === generation) error.value = errorMessage(e)
  } finally {
    if (current === generation) loading.value = false
  }
}
const missing = computed(() =>
  props.modelValue.filter(
    (id) =>
      !chosen.value.some(
        (m) => m.id === id && m.active && (!props.role || m.roles.includes(props.role as any)),
      ),
  ),
)
function toggle(id: string) {
  if (props.requiredIds.includes(id)) return
  emit(
    'update:modelValue',
    props.modelValue.includes(id)
      ? props.modelValue.filter((x) => x !== id)
      : props.single
        ? [id]
        : [...props.modelValue, id],
  )
}
watch(
  () => props.modelValue.join(','),
  () => {
    const known = new Map([...chosen.value, ...items.value].map((m) => [m.id, m]))
    if (!loading.value && props.modelValue.every((id) => known.has(id))) {
      // A choice from a loaded page must not reset the list or move the person's place.
      chosen.value = props.modelValue.map((id) => known.get(id)!)
      emit('options', Array.from(known.values()))
    } else void load()
  },
)
watch(
  () => [props.role, props.sport],
  () => load(),
)
onMounted(() => load())
onUnmounted(() => {
  generation++
})
</script>
<template>
  <section class="member-picker">
    <div class="member-search">
      <label
        >{{ label || l('Find people', 'البحث عن أشخاص')
        }}<input
          :placeholder="l('Search by name…', 'ابحث بالاسم…')"
          v-model="search"
          type="search"
          :disabled="disabled"
          @keydown.enter.prevent="load()" /></label
      ><button
        type="button"
        class="button small secondary"
        :disabled="disabled || loading"
        @click="load()"
      >
        {{ l('Search people', 'البحث عن أشخاص') }}
      </button>
    </div>
    <p v-if="error" class="notice error" role="alert">
      {{ error }}
      <button type="button" class="text-link" @click="load()">
        {{ l('Try again', 'حاول مجدداً') }}
      </button>
    </p>
    <p class="small-print">
      {{ modelValue.length }} {{ l('selected', 'محدد') }} · {{ total }}
      {{ l('matching active people', 'شخص نشط مطابق') }}
    </p>
    <div v-if="modelValue.length" class="chosen-members">
      <span v-for="id in modelValue" :key="id"
        ><span>{{
          chosen.find((m) => m.id === id)?.name || l('Unavailable person', 'شخص غير متاح')
        }}</span
        ><button
          type="button"
          :disabled="disabled || requiredIds.includes(id)"
          class="text-link"
          @click="toggle(id)"
          :aria-label="l('Remove', 'إزالة') + ' ' + (chosen.find((m) => m.id === id)?.name || id)"
        >
          ×
        </button></span
      >
    </div>
    <p v-if="missing.length && !loading" class="small-print">
      {{
        l('Remove unavailable people before continuing.', 'أزل الأشخاص غير المتاحين قبل المتابعة.')
      }}
    </p>
    <div class="member-options" :aria-busy="loading">
      <label v-for="m in items" :key="m.id" class="check-label"
        ><input
          type="checkbox"
          :checked="modelValue.includes(m.id)"
          :disabled="
            disabled ||
            loading ||
            requiredIds.includes(m.id) ||
            excludeIds.includes(m.id) ||
            (!modelValue.includes(m.id) && modelValue.length >= max)
          "
          @change="toggle(m.id)" /><span class="member-option-details"
          >{{ m.name }}<slot :member="m" /></span
      ></label>
    </div>
    <p v-if="!items.length && !loading" class="small-print">
      {{ l('No matching people.', 'لا يوجد أشخاص مطابقون.') }}
    </p>
    <button
      v-if="next !== null"
      type="button"
      class="text-link"
      :disabled="loading || disabled"
      @click="load(true)"
    >
      {{ l('Load more people', 'تحميل المزيد من الأشخاص') }}
    </button>
  </section>
</template>
<style scoped>
.member-picker {
  min-width: 0;
  margin: 16px 0;
}
.member-search {
  display: flex;
  gap: 12px;
  align-items: end;
}
.member-search label {
  flex: 1;
  display: grid;
  gap: 8px;
  min-width: 0;
  margin: 0;
}
.member-search input,
.member-search .button {
  height: 44px;
  min-height: 44px;
  margin: 0;
}
/* A bounded, visibly framed list so partially scrolled rows do not look clipped. */
.member-options {
  max-height: 300px;
  overflow: auto;
  display: grid;
  gap: 4px;
  margin-block: 8px;
  padding: 4px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}
.member-options:empty {
  display: none;
}
.chosen-members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chosen-members > span {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.member-options label {
  overflow-wrap: anywhere;
  min-width: 0;
}
.member-option-details {
  min-width: 0;
}
.member-options label:has(.member-option-details small) {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  align-items: start;
}
.member-options label:has(input:checked) {
  background: var(--surface-soft);
}
@media (max-width: 600px) {
  .member-search {
    align-items: stretch;
    flex-direction: column;
  }
  .member-search button {
    align-self: start;
  }
}
</style>
