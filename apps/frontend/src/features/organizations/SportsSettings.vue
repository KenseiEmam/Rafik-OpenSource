<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { request } from '../../lib/backend'
import { language as l, errorMessage } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import type { Sport } from './types'
const props = defineProps<{ workspaceId: string }>()
const emit = defineEmits<{ changed: [] }>()
const endpoint = `/v1/workspaces/${props.workspaceId}/sports`
const items = ref<Sport[]>([]),
  loading = ref(true),
  error = ref(''),
  name = ref(''),
  kind = ref<Sport['kind']>('sport'),
  editing = ref(''),
  editName = ref('')
async function load() {
  loading.value = true
  error.value = ''
  try {
    items.value = (await request<{ items: Sport[] }>(`${endpoint}?view=admin`)).items
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const command = useCommand<'sports'>(
  `organization-sports:${props.workspaceId}`,
  async (_, __, args) => {
    if (!args.revision) name.value = ''
    editing.value = ''
    await load()
    emit('changed')
  },
  (_, args) => request(endpoint, { method: 'POST', body: JSON.stringify(args) }),
  { successMessage: l('Sports and specialties saved.', 'تم حفظ الرياضات والتخصصات.') },
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
const save = (sport: Pick<Sport, 'id' | 'name' | 'kind' | 'archived' | 'revision'>) =>
  command.run('sports', {
    operation: crypto.randomUUID(),
    action: 'sport',
    view: 'admin',
    ...sport,
  })
const groups = computed(() => [
  {
    kind: 'sport' as const,
    title: l('Sports', 'الرياضات'),
    items: items.value.filter((s) => s.kind === 'sport'),
  },
  {
    kind: 'specialty' as const,
    title: l('Coaching specialties', 'تخصصات التدريب'),
    items: items.value.filter((s) => s.kind === 'specialty'),
  },
])
const add = () =>
  save({
    id: crypto.randomUUID(),
    name: name.value,
    kind: kind.value,
    archived: false,
    revision: 0,
  })
function startEdit(sport: Sport) {
  editing.value = sport.id
  editName.value = sport.name
}
onMounted(load)
</script>
<template>
  <section class="sports-settings form-stack" aria-labelledby="sports-settings-heading">
    <h2 id="sports-settings-heading">{{ l('Sports and specialties', 'الرياضات والتخصصات') }}</h2>
    <p class="small-print">
      {{
        l(
          'Athletes are linked to the sports they take part in; coaches to the sports or specialties they cover. These labels describe people and do not change their role or access.',
          'يُربط الرياضيون بالرياضات التي يمارسونها، والمدربون بالرياضات أو التخصصات التي يغطونها. هذه تسميات وصفية ولا تغيّر الدور أو الصلاحيات.',
        )
      }}
    </p>
    <CommandStatus :command="command" />
    <form class="form-stack" @submit.prevent="add">
      <label
        >{{ l('Name', 'الاسم') }}<input v-model="name" maxlength="80" required :disabled="locked"
      /></label>
      <fieldset class="role-choices">
        <legend>{{ l('Type', 'النوع') }}</legend>
        <label
          ><input v-model="kind" type="radio" value="sport" :disabled="locked" />{{
            l('Sport', 'رياضة')
          }}</label
        ><label
          ><input v-model="kind" type="radio" value="specialty" :disabled="locked" />{{
            l('Coaching specialty', 'تخصص تدريبي')
          }}</label
        >
      </fieldset>
      <button class="button secondary" :disabled="locked || !name.trim()">
        {{ l('Add', 'إضافة') }}
      </button>
    </form>
    <p v-if="loading" role="status" class="small-print">{{ l('Loading…', 'جارٍ التحميل…') }}</p>
    <p v-else-if="error" role="alert" class="notice error">
      {{ error }}
      <button type="button" class="text-link" @click="load">
        {{ l('Retry', 'إعادة المحاولة') }}
      </button>
    </p>
    <template v-else>
      <section v-for="group in groups" :key="group.kind" :aria-label="group.title">
        <h3>{{ group.title }} ({{ group.items.length }})</h3>
        <p v-if="!group.items.length" class="small-print">
          {{ l('None yet.', 'لا يوجد بعد.') }}
        </p>
        <ul class="sports-list">
          <li v-for="sport in group.items" :key="sport.id">
            <form
              v-if="editing === sport.id"
              class="sports-edit"
              @submit.prevent="save({ ...sport, name: editName })"
            >
              <label class="sr-only" :for="'sport-' + sport.id">{{ l('Name', 'الاسم') }}</label
              ><input
                :id="'sport-' + sport.id"
                v-model="editName"
                maxlength="80"
                required
                :disabled="locked"
              /><button class="button small" :disabled="locked || !editName.trim()">
                {{ l('Save', 'حفظ') }}</button
              ><button type="button" class="text-link" @click="editing = ''">
                {{ l('Cancel', 'إلغاء') }}
              </button>
            </form>
            <template v-else>
              <span dir="auto" :class="{ muted: sport.archived }">{{ sport.name }}</span>
              <span v-if="sport.archived" class="tag">{{ l('Archived', 'مؤرشف') }}</span>
              <span class="sports-actions"
                ><button
                  type="button"
                  class="text-link"
                  :disabled="locked"
                  :aria-label="l('Rename ', 'إعادة تسمية ') + sport.name"
                  @click="startEdit(sport)"
                >
                  {{ l('Rename', 'إعادة تسمية') }}</button
                ><button
                  type="button"
                  class="text-link"
                  :disabled="locked"
                  :aria-label="
                    (sport.archived ? l('Restore ', 'استعادة ') : l('Archive ', 'أرشفة ')) +
                    sport.name
                  "
                  @click="save({ ...sport, archived: !sport.archived })"
                >
                  {{ sport.archived ? l('Restore', 'استعادة') : l('Archive', 'أرشفة') }}
                </button></span
              >
            </template>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>
<style scoped>
.sports-settings {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.sports-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
}
.sports-list li,
.sports-edit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
}
.sports-list li > span[dir] {
  overflow-wrap: anywhere;
}
.sports-actions {
  margin-inline-start: auto;
  display: flex;
  gap: 12px;
}
.sports-edit input {
  flex: 1 1 160px;
  min-width: 0;
}
</style>
