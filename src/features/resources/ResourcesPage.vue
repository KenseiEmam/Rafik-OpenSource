<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { user } from '../../app/auth'
import { uploadFile, rows, rpc } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import type { Profile, Relationship } from '../../lib/domain'
import { downloadResource, deleteResource, fileTypes, type Resource, type Share } from './files'
import PageState from '../../components/PageState.vue'
const coach = useRoute().path.startsWith('/coach'),
  key = `resource-upload:${user.value!.id}`
type TeamShare = { resource_id: string; team_id: string; team_name: string; archived: boolean }
const teamShares = ref<TeamShare[]>([]),
  resources = ref<Resource[]>([]),
  shares = ref<Share[]>([]),
  people = ref<Profile[]>([]),
  relationships = ref<Relationship[]>([])
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  title = ref(''),
  file = ref<File>(),
  uploadId = ref(crypto.randomUUID() as string),
  confirmDelete = ref(''),
  search = ref(''),
  filter = ref('all')
const shareTo = ref<Record<string, string>>({}),
  resume = ref<Resource>()
const visible = computed(() =>
  resources.value
    .filter(
      (r) =>
        (filter.value === 'all' || (filter.value === 'mine') === (r.owner_id === user.value!.id)) &&
        `${r.title} ${r.filename}`.toLowerCase().includes(search.value.toLowerCase()),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at)),
)
const name = (id: string) => {
  const r = relationships.value.find((r) => r.id === id)
  return (
    people.value.find((p) => p.id === (r?.coach_id === user.value!.id ? r.client_id : r?.coach_id))
      ?.display_name || ''
  )
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[resources.value, shares.value, people.value, relationships.value, teamShares.value] =
      await Promise.all([
        rows<Resource>('resources'),
        rows<Share>('resource_shares'),
        rows<Profile>('profiles'),
        rows<Relationship>('coach_clients'),
        rpc<TeamShare[]>('my_resource_teams'),
      ])
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
function pick(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0]
  if (file.value && !title.value) title.value = file.value.name
}
async function upload() {
  busy.value = true
  error.value = ''
  try {
    if (
      !file.value ||
      !fileTypes.includes(file.value.type) ||
      file.value.size > 10485760 ||
      !file.value.size
    )
      throw Error('invalid_file')
    if (
      resume.value &&
      (resume.value.filename !== file.value.name ||
        resume.value.bytes !== file.value.size ||
        resume.value.media_type !== file.value.type)
    )
      throw Error('file_mismatch')
    await storeDraft(key, { id: uploadId.value, title: title.value })
    const r =
      resume.value ||
      (await rpc<Resource>('register_resource', {
        p_id: uploadId.value,
        p_title: title.value,
        p_filename: file.value.name,
        p_type: file.value.type,
        p_bytes: file.value.size,
      }))
    if (r.state === 'retired') throw Error('resource_unavailable')
    if (r.state === 'pending') {
      try {
        await uploadFile(r.object_path, file.value, r.media_type)
      } catch (e) {
        if (String((e as { statusCode?: number }).statusCode) !== '409') throw e
      }
      await rpc('finish_resource', { p_id: r.id })
    }
    await removeDraft(key)
    file.value = undefined
    title.value = ''
    resume.value = undefined
    uploadId.value = crypto.randomUUID()
    await load()
    notice.value = l(
      'File ready. Choose who to share it with.',
      'الملف جاهز. اختر من تريد مشاركته معه.',
    )
  } catch (e) {
    error.value = errorMessage(e)
    await load().catch(() => {})
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function finish(r: Resource) {
  busy.value = true
  error.value = ''
  try {
    await rpc('finish_resource', { p_id: r.id })
    await load()
    if (r.id === uploadId.value) {
      await removeDraft(key)
      startAnother()
    }
    notice.value = l('Upload completed.', 'اكتمل الرفع.')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function revokeTeam(s: TeamShare) {
  busy.value = true
  error.value = ''
  try {
    await rpc('share_team_resource', {
      p_team: s.team_id,
      p_resource: s.resource_id,
      p_shared: false,
    })
    await load()
    notice.value = l('Team access revoked.', 'أُلغي وصول الفريق.')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
function continueUpload(r: Resource) {
  resume.value = r
  uploadId.value = r.id
  title.value = r.title
  file.value = undefined
  document.querySelector('#resource-upload')?.scrollIntoView({ behavior: 'smooth' })
}
async function share(r: Resource, relationship: string, shared: boolean) {
  busy.value = true
  error.value = ''
  try {
    await rpc('share_resource', { p_id: r.id, p_relationship: relationship, p_shared: shared })
    await load()
    notice.value = shared
      ? l('Resource shared.', 'تمت مشاركة المورد.')
      : l(
          'Sharing revoked. Future downloads are blocked.',
          'أُلغيت المشاركة. تُحظر التنزيلات القادمة.',
        )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function remove(r: Resource) {
  busy.value = true
  error.value = ''
  try {
    await deleteResource(r)
    if (r.id === uploadId.value) {
      await removeDraft(key)
      startAnother()
    }
    confirmDelete.value = ''
    await load()
    notice.value = l('File and resource record removed.', 'حُذف الملف وسجل المورد.')
  } catch (e) {
    error.value = errorMessage(e)
    await load()
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function download(r: Resource) {
  busy.value = true
  error.value = ''
  try {
    await downloadResource(r)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
function startAnother() {
  resume.value = undefined
  title.value = ''
  file.value = undefined
  uploadId.value = crypto.randomUUID()
  void removeDraft(key)
}
onMounted(async () => {
  await load()
  const d = await getDraft<{ id: string; title: string }>(key)
  if (d) {
    const existing = resources.value.find((r) => r.id === d.id)
    if (existing && existing.state !== 'pending') {
      await removeDraft(key)
      return
    }
    uploadId.value = d.id
    title.value = d.title
    resume.value = existing
  }
})
</script>
<template>
  <div class="container page">
    <RouterLink class="back-link" :to="coach ? '/coach/more' : '/more'"
      >← {{ l('More tools', 'أدوات إضافية') }}</RouterLink
    >
    <header class="page-heading">
      <p class="overline">{{ l('Useful things, in one place', 'أشياء مفيدة في مكان واحد') }}</p>
      <h1>{{ l('Private resources', 'موارد خاصة') }}</h1>
      <p>
        {{
          l(
            'Keep a guide, a reference or a photo. Share it only with the people who need it.',
            'احتفظ بدليل أو مرجع أو صورة. وشاركها مع من يحتاجها فقط.',
          )
        }}
      </p>
      <a class="button small secondary" href="#resource-upload">{{
        l('Add a resource', 'إضافة مورد')
      }}</a>
    </header>
    <PageState :loading="loading" :error="''" @retry="load"
      ><p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <p v-if="notice" class="notice success" role="status">{{ notice }}</p>
      <div class="ongoing-layout">
        <section>
          <div class="roster-tools">
            <label
              >{{ l('Search resources', 'البحث في الموارد')
              }}<input v-model="search" type="search" /></label
            ><label
              >{{ l('Show resources', 'عرض الموارد')
              }}<select v-model="filter">
                <option value="all">{{ l('All accessible', 'كل ما يمكنك الوصول إليه') }}</option>
                <option value="mine">{{ l('My uploads', 'ملفاتي المرفوعة') }}</option>
                <option value="shared">{{ l('Shared with me', 'مشترك معي') }}</option>
              </select></label
            >
          </div>
          <p v-if="!visible.length" class="empty-review">
            {{
              coach
                ? l(
                    'No resources here yet. Upload a file to share with your clients or team.',
                    'لا توجد ملفات هنا بعد. ارفع ملفاً لمشاركته مع متدربيك أو فريقك.',
                  )
                : l(
                    'No resources here yet. Upload a useful file or find what your coach shares.',
                    'لا توجد موارد هنا بعد. ارفع ملفاً مفيداً أو ابحث عما يشاركه مدربك.',
                  )
            }}
          </p>
          <article v-for="r in visible" :key="r.id" class="panel resource-row">
            <p class="overline">
              {{
                r.state === 'ready'
                  ? l('Ready', 'جاهز')
                  : r.state === 'pending'
                    ? l('Upload incomplete', 'الرفع غير مكتمل')
                    : l('Removal incomplete', 'الحذف غير مكتمل')
              }}
            </p>
            <h2 dir="auto">{{ r.title }}</h2>
            <p dir="auto">{{ r.filename }} · {{ Math.ceil(r.bytes / 1024) }} KB</p>
            <small
              >{{ dateLabel(r.created_at) }} ·
              {{
                r.owner_id === user!.id ? l('Your file', 'ملفك') : l('Shared with you', 'مشترك معك')
              }}</small
            >
            <div class="actions">
              <button
                v-if="r.state === 'ready'"
                class="button small secondary"
                :disabled="busy"
                @click="download(r)"
              >
                {{ l('Download', 'تنزيل') }}</button
              ><template v-if="r.owner_id === user!.id"
                ><button
                  v-if="r.state === 'pending'"
                  class="text-link"
                  :disabled="busy"
                  @click="finish(r)"
                >
                  {{ l('Check uploaded file', 'التحقق من الملف المرفوع') }}</button
                ><button v-if="r.state === 'pending'" class="text-link" @click="continueUpload(r)">
                  {{ l('Resume upload', 'متابعة الرفع') }}</button
                ><button
                  v-if="confirmDelete !== r.id"
                  class="text-link"
                  @click="confirmDelete = r.id"
                >
                  {{
                    r.state === 'retired'
                      ? l('Retry removal', 'إعادة محاولة الحذف')
                      : l('Delete resource', 'حذف المورد')
                  }}</button
                ><template v-else
                  ><span>{{ l('Remove the file for everyone?', 'حذف الملف للجميع؟') }}</span
                  ><button class="button small secondary" :disabled="busy" @click="remove(r)">
                    {{ l('Confirm deletion', 'تأكيد الحذف') }}</button
                  ><button class="text-link" @click="confirmDelete = ''">
                    {{ l('Keep file', 'إبقاء الملف') }}
                  </button></template
                ></template
              >
            </div>
            <template v-if="r.state === 'ready'"
              ><form
                v-if="r.owner_id === user!.id"
                class="share-resource"
                @submit.prevent="share(r, shareTo[r.id]!, true)"
              >
                <label
                  >{{ l('Share with', 'المشاركة مع')
                  }}<select v-model="shareTo[r.id]" required>
                    <option :value="undefined" disabled>
                      {{ l('Choose a relationship', 'اختر علاقة تدريب') }}
                    </option>
                    <option
                      v-for="c in relationships.filter((c) => c.state === 'active')"
                      :key="c.id"
                      :value="c.id"
                    >
                      {{ name(c.id) }}
                    </option>
                  </select></label
                ><button class="button small secondary" :disabled="busy || !shareTo[r.id]">
                  {{ l('Share resource', 'مشاركة المورد') }}
                </button>
              </form>
              <div
                v-for="s in teamShares.filter((s) => s.resource_id === r.id)"
                :key="s.team_id"
                class="resource-share"
              >
                <span
                  >{{ s.team_name }} ·
                  {{
                    s.archived ? l('Closed team', 'فريق مغلق') : l('Team access', 'وصول الفريق')
                  }}</span
                >
                <button class="text-link" :disabled="busy" @click="revokeTeam(s)">
                  {{ l('Revoke team access', 'إلغاء وصول الفريق') }}
                </button>
              </div>
              <div
                v-for="s in shares.filter((s) => s.resource_id === r.id)"
                :key="s.id"
                class="resource-share"
              >
                <span>{{ name(s.relationship_id) }}</span
                ><RouterLink
                  class="text-link"
                  :to="
                    (relationships.find((c) => c.id === s.relationship_id)?.coach_id === user!.id
                      ? '/coach/messages/'
                      : '/messages/') +
                    s.relationship_id +
                    '?resource=' +
                    r.id
                  "
                  >{{ l('Attach in conversation', 'إرفاق بالمحادثة') }}</RouterLink
                ><button
                  v-if="r.owner_id === user!.id"
                  class="text-link"
                  :disabled="busy"
                  @click="share(r, s.relationship_id, false)"
                >
                  {{ l('Revoke access', 'إلغاء الوصول') }}
                </button>
              </div></template
            >
          </article>
        </section>
        <aside>
          <form id="resource-upload" class="panel form-stack" @submit.prevent="upload">
            <h2>
              {{ resume ? l('Resume a file', 'متابعة ملف') : l('Add a resource', 'إضافة مورد') }}
            </h2>
            <label
              >{{ l('Resource title', 'عنوان المورد')
              }}<input v-model="title" required maxlength="120" :disabled="!!resume" /></label
            ><label
              >{{
                resume
                  ? l('Select the original file again', 'اختر الملف الأصلي مجدداً')
                  : l('Choose a file', 'اختر ملفاً')
              }}<input
                type="file"
                :key="uploadId + String(!!resume)"
                :accept="fileTypes.join(',')"
                @change="pick"
                required
            /></label>
            <p class="subtle">
              {{
                l(
                  'PDF, plain text, JPEG, PNG or WebP. Up to 10 MB. Files are private until you share them.',
                  'PDF أو نص عادي أو JPEG أو PNG أو WebP. حتى ١٠ ميغابايت. الملفات خاصة حتى تشاركها.',
                )
              }}
            </p>
            <button class="button" :disabled="busy || !file">
              {{ busy ? l('Working…', 'جارٍ العمل…') : l('Upload resource', 'رفع المورد') }}</button
            ><button v-if="resume" type="button" class="text-link" @click="startAnother">
              {{ l('Start another upload', 'بدء رفع آخر') }}
            </button>
          </form>
        </aside>
      </div></PageState
    >
  </div>
</template>
