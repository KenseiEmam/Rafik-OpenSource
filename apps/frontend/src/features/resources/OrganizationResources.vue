<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { programContext } from '../coaching/program-context'
import OrganizationNav from '../organizations/OrganizationNav.vue'
import OrganizationUpload from '../../components/OrganizationUpload.vue'
import OrganizationAsset from '../../components/OrganizationAsset.vue'
import { request } from '../../lib/backend'
import { language as l, errorMessage } from '../../lib/i18n'
import { user } from '../../app/auth'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
const context = programContext(useRoute()),
  search = ref(''),
  archived = ref(false),
  loading = ref(true),
  error = ref(''),
  next = ref<number | null>(null)
type Asset = {
  id: string
  filename: string
  media_type: string
  bytes: number
  retired: boolean
  revision: number
  editable: boolean
}
const assets = ref<Asset[]>([]),
  selected = ref<Asset>(),
  uploading = ref(false)
let serial = 0,
  disposed = false,
  timer: ReturnType<typeof setTimeout>
async function load(more = false) {
  const current = ++serial
  loading.value = true
  error.value = ''
  try {
    const result = await request<{ items: Asset[]; next: number | null }>(
      `/v1/workspaces/${context.workspace}/assets?` +
        new URLSearchParams({
          view: context.view,
          search: search.value,
          archived: String(archived.value),
          offset: String(more ? next.value || 0 : 0),
        }),
    )
    if (disposed || current !== serial) return
    assets.value = more ? [...assets.value, ...result.items] : result.items
    next.value = result.next
    selected.value = assets.value.find((a) => a.id === selected.value?.id) || assets.value[0]
  } catch (e) {
    if (!disposed && current === serial) error.value = errorMessage(e)
  } finally {
    if (!disposed && current === serial) loading.value = false
  }
}
const command = useCommand<'archive'>(
  `org-assets:${user.value!.id}:${context.key}`,
  () => load(),
  (_, args) =>
    request(`/v1/workspaces/${context.workspace}/assets`, {
      method: 'POST',
      body: JSON.stringify(args),
    }),
  {
    successMessage: (_, args) =>
      args.retired
        ? l('Resource archived.', 'تمت أرشفة المورد.')
        : l('Resource restored.', 'تمت استعادة المورد.'),
  },
)
const fileSize = (bytes: number) =>
  bytes < 1048576
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1048576).toFixed(1)} MB`
const change = (a: Asset) =>
  command.run('archive', {
    action: 'archive',
    operation: crypto.randomUUID(),
    view: context.view,
    id: a.id,
    revision: a.revision,
    retired: !a.retired,
  })
watch([search, archived], () => {
  serial++
  loading.value = true
  clearTimeout(timer)
  timer = setTimeout(() => load(), 200)
})
function uploaded() {
  archived.value = false
  void load()
}
onMounted(() => load())
onUnmounted(() => {
  disposed = true
  clearTimeout(timer)
})
</script>
<template>
  <OrganizationNav />
  <div class="container page institution-resources">
    <header class="page-heading">
      <p class="overline">{{ l('Your coaching toolkit', 'أدواتك التدريبية') }}</p>
      <h1>{{ l('Resources', 'الموارد') }}</h1>
      <p>
        {{
          l(
            'Manage exercise media here, or upload while creating an exercise. Private conversation files stay in their conversation.',
            'أدر وسائط التمارين هنا أو ارفعها أثناء إنشاء تمرين. تبقى ملفات المحادثات الخاصة في محادثاتها.',
          )
        }}
      </p>
    </header>
    <CommandStatus :command="command" />
    <p v-if="error" role="alert" class="notice error">
      {{ error }}
      <button class="text-link" @click="load()">{{ l('Retry', 'إعادة المحاولة') }}</button>
    </p>
    <div class="resource-columns">
      <section class="panel resource-list">
        <div class="field-pair">
          <label
            >{{ l('Search files', 'البحث عن ملف') }}<input v-model="search" type="search" /></label
          ><label
            >{{ l('Show', 'عرض')
            }}<select v-model="archived">
              <option :value="false">{{ l('Available files', 'الملفات المتاحة') }}</option>
              <option :value="true">{{ l('Archived files', 'الملفات المؤرشفة') }}</option>
            </select></label
          >
        </div>
        <p v-if="loading" role="status">{{ l('Loading files…', 'جارٍ تحميل الملفات…') }}</p>
        <p v-if="!loading && !assets.length" class="empty-state-note">
          {{
            l(
              'No files here yet. Upload your first demonstration below.',
              'لا توجد ملفات بعد. ارفع أول شرح أدناه.',
            )
          }}
        </p>
        <ul class="resource-items">
          <li v-for="a in assets" :key="a.id">
            <button
              class="resource-row"
              :class="{ selected: selected?.id === a.id }"
              @click="selected = a"
            >
              <strong>{{ a.filename }}</strong
              ><small
                >{{ fileSize(a.bytes) }} ·
                {{
                  a.editable ? l('Your upload', 'ملفك') : l('Institution library', 'مكتبة المؤسسة')
                }}</small
              >
            </button>
          </li>
        </ul>
        <button
          v-if="next !== null"
          class="button secondary"
          :disabled="loading"
          @click="load(true)"
        >
          {{ l('More files', 'المزيد من الملفات') }}
        </button>
        <OrganizationUpload
          :workspace="context.workspace"
          :view="context.view"
          purpose="exercise"
          @uploaded="uploaded"
          @busy="uploading = $event"
        />
        <small>{{
          l(
            'New uploads are private until included in an institution-shared exercise or a published assignment.',
            'تكون الملفات الجديدة خاصة حتى تضمينها في تمرين مشترك للمؤسسة أو تكليف منشور.',
          )
        }}</small>
      </section>
      <section class="panel resource-detail" v-if="selected">
        <h2>{{ selected.filename }}</h2>
        <OrganizationAsset :id="selected.id" :name="selected.filename" />
        <p class="small-print">
          {{
            l(
              'Use “Choose an uploaded file” in the exercise editor to reuse this demonstration. Archiving removes it from new selections; published plans and existing exercise references retain access.',
              'استخدم «اختر ملفاً مرفوعاً» في محرر التمرين لإعادة استخدامه. تمنع الأرشفة الاختيارات الجديدة وتحتفظ الخطط المنشورة والمراجع الحالية بالملف.',
            )
          }}
        </p>
        <button
          v-if="selected.editable"
          class="button secondary"
          :disabled="command.state.busy || !!command.state.pending"
          @click="change(selected)"
        >
          {{
            selected.retired ? l('Restore file', 'استعادة الملف') : l('Archive file', 'أرشفة الملف')
          }}
        </button>
      </section>
      <section class="panel resource-detail" v-else>
        <p class="empty-state-note">
          {{ l('Select a file to view its details.', 'اختر ملفاً لعرض تفاصيله.') }}
        </p>
      </section>
    </div>
  </div>
</template>
<style scoped>
.resource-columns > .panel {
  margin: 0;
}
.resource-columns {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
  gap: 1rem;
  min-height: 0;
}
.resource-list,
.resource-detail {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.resource-items {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow: auto;
}
.resource-row {
  width: 100%;
  text-align: start;
  display: grid;
  gap: 0.3rem;
  padding: 0.85rem;
  border: 0;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  background: transparent;
  overflow-wrap: anywhere;
}
.resource-row.selected {
  background: var(--tint);
}
h2 {
  overflow-wrap: anywhere;
  font-size: 1.2rem;
}
@media (max-width: 760px) {
  .resource-columns {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
