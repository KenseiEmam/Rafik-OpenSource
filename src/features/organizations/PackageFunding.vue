<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { request } from '../../lib/backend'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
const props = defineProps<{
  workspace: string
  view: string
  member: string
  name: string
  count: number
  disabled?: boolean
}>()
const model = defineModel<{ package_id: string | null; independent_reason: string }>({
  required: true,
})
type Choice = {
  id: string
  title: string
  available: number
  reserved: number
  used: number
  starts_on: string
  ends_on: string
}
const emit = defineEmits<{ title: [value: string] }>()
const mode = ref(
    model.value.package_id ? 'package' : model.value.independent_reason ? 'independent' : '',
  ),
  items = ref<Choice[]>([]),
  next = ref<number | null>(null),
  search = ref(''),
  loading = ref(false),
  error = ref('')
let generation = 0,
  disposed = false,
  timer: ReturnType<typeof setTimeout>
async function load(more = false) {
  const current = ++generation
  loading.value = true
  error.value = ''
  try {
    const result = await request<{ items: Choice[]; next: number | null }>(
      `/v1/workspaces/${props.workspace}/packages?` +
        new URLSearchParams({
          view: props.view,
          member: props.member,
          status: 'active',
          search: search.value,
          offset: String(more ? next.value || 0 : 0),
        }),
    )
    if (disposed || current !== generation) return
    const selected = items.value.find((p) => p.id === model.value.package_id)
    items.value = more ? [...items.value, ...result.items] : result.items
    if (selected && !items.value.some((p) => p.id === selected.id)) items.value.unshift(selected)
    next.value = result.next
    if (model.value.package_id && !items.value.some((p) => p.id === model.value.package_id)) {
      const detail = await request<{ item: Choice }>(
        `/v1/workspaces/${props.workspace}/packages?view=${props.view}&id=${model.value.package_id}`,
      )
      if (!disposed && current === generation) items.value.unshift(detail.item)
    }
  } catch (e) {
    if (!disposed && current === generation) error.value = errorMessage(e)
  } finally {
    if (!disposed && current === generation) loading.value = false
  }
}
watch(
  [items, () => model.value.package_id],
  () => emit('title', items.value.find((p) => p.id === model.value.package_id)?.title || ''),
  { immediate: true },
)
watch(
  () => props.member,
  () => {
    search.value = ''
    void load()
  },
  { immediate: true },
)
watch(search, () => {
  generation++
  clearTimeout(timer)
  timer = setTimeout(() => load(), 180)
})
function chooseMode() {
  model.value = {
    package_id: null,
    independent_reason: mode.value === 'independent' ? 'other' : '',
  }
}
onUnmounted(() => {
  disposed = true
  generation++
  clearTimeout(timer)
})
</script>
<template>
  <fieldset class="participant-funding" :disabled="disabled">
    <legend>{{ name }}</legend>
    <label
      >{{ l('Session funding', 'تمويل الجلسة')
      }}<select v-model="mode" required @change="chooseMode">
        <option disabled value="">
          {{ l('Choose package or independent', 'اختر باقة أو جلسة مستقلة') }}
        </option>
        <option value="package">{{ l('Use a subscription package', 'استخدم باقة اشتراك') }}</option>
        <option value="independent">{{ l('Independent session', 'جلسة مستقلة') }}</option>
      </select></label
    >
    <template v-if="mode === 'package'">
      <label
        >{{ l('Find a package', 'ابحث عن باقة') }}<input v-model="search" type="search"
      /></label>
      <label
        >{{ l('Package', 'الباقة')
        }}<select v-model="model.package_id" required>
          <option :value="null" disabled>{{ l('Choose a package', 'اختر باقة') }}</option>
          <option
            v-for="item in items"
            :key="item.id"
            :value="item.id"
            :disabled="item.available < count"
          >
            {{ item.title }} · {{ item.available }} {{ l('available', 'متاحة') }} ·
            {{ dateLabel(item.ends_on.slice(0, 10)) }}
          </option>
        </select></label
      >
      <p class="small-print">
        {{
          l(
            'Reserves one session per booking. The package must cover every selected date.',
            'تُحجز جلسة لكل موعد. يجب أن تغطي الباقة جميع التواريخ المختارة.',
          )
        }}
        {{ count }} {{ l('to reserve', 'للحجز') }}.
      </p>
      <p v-if="loading" role="status">{{ l('Loading packages…', 'تحميل الباقات…') }}</p>
      <p v-else-if="!items.length" class="notice">
        {{
          l(
            'No matching active packages. An administrator can assign one, or choose an independent session.',
            'لا توجد باقات نشطة مطابقة. يمكن للمسؤول تعيين باقة أو اختيار جلسة مستقلة.',
          )
        }}
      </p>
      <p v-if="error" role="alert" class="notice error">
        {{ error }}
        <button type="button" class="text-link" @click="load()">
          {{ l('Retry', 'إعادة المحاولة') }}
        </button>
      </p>
      <button
        v-if="next !== null"
        type="button"
        class="text-link"
        :disabled="loading"
        @click="load(true)"
      >
        {{ l('More packages', 'المزيد من الباقات') }}
      </button>
    </template>
    <template v-if="mode === 'independent'"
      ><label
        >{{ l('Independent session reason', 'سبب الجلسة المستقلة')
        }}<select v-model="model.independent_reason" required>
          <option value="trial">{{ l('Trial', 'تجريبية') }}</option>
          <option value="makeup">{{ l('Makeup', 'تعويضية') }}</option>
          <option value="prize">{{ l('Prize', 'جائزة') }}</option>
          <option value="other">{{ l('Other', 'أخرى') }}</option>
        </select></label
      >
      <p class="small-print">
        {{
          l(
            'No subscription sessions will be reserved or deducted.',
            'لن تُحجز أو تُخصم أي جلسات من الاشتراك.',
          )
        }}
      </p></template
    >
  </fieldset>
</template>
<style scoped>
.participant-funding {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  gap: 0.75rem;
}
.participant-funding legend {
  font-weight: 700;
  padding-inline: 0.35rem;
}
.participant-funding label {
  min-width: 0;
}
.participant-funding select {
  max-width: 100%;
  width: 100%;
}
</style>
