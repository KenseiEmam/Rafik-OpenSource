<script setup lang="ts">
import PageHeading from '../../components/PageHeading.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { contexts, refreshContexts, user } from '../../app/auth'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { request, localPreview } from '../../lib/backend'
import { language as l } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
const router = useRouter(),
  route = useRoute(),
  name = ref(''),
  adding = ref(!!route.query.start),
  draftReady = ref(false),
  draftError = ref(''),
  draftSaved = ref(false)
const key = 'workspace-setup:' + user.value!.id
let draftSequence = 0
onMounted(async () => {
  try {
    const draft = await getDraft<{ name: string }>(key)
    if (draft) {
      name.value = draft.name
      adding.value = !!route.query.start || !!draft.name
    }
  } catch {
    draftError.value = l('Could not restore your device draft.', 'تعذّر استعادة مسودة الجهاز.')
  } finally {
    draftReady.value = true
  }
})
watch(name, async () => {
  if (!draftReady.value) return
  const sequence = ++draftSequence
  draftSaved.value = false
  try {
    await storeDraft(key, { name: name.value })
    if (sequence === draftSequence) draftSaved.value = true
  } catch {
    draftError.value = l(
      'Keep this page open. Your draft could not be saved on this device.',
      'أبقِ الصفحة مفتوحة. تعذّر حفظ المسودة على هذا الجهاز.',
    )
  }
})
const command = useCommand<'create'>(
  'workspace-create',
  async (_, result) => {
    await removeDraft(key)
    await refreshContexts()
    const w = result as { id: string }
    await router.push(`/organization/${w.id}/admin`)
  },
  (_, args) => request('/v1/workspaces', { method: 'POST', body: JSON.stringify(args) }),
  { successMessage: l('Institution created.', 'تم إنشاء المؤسسة.') },
)
const locked = computed(
  () => command.state.busy || !!command.state.pending || !command.state.ready || !draftReady.value,
)
function create() {
  return command.run('create', { id: crypto.randomUUID(), kind: 'organization', name: name.value })
}
</script>
<template>
  <div class="container page narrow">
    <PageHeading class="work-heading">
      <div>
        <p class="overline">{{ l('Your work, in its place', 'عملك في مكانه') }}</p>
        <h1>{{ l('Choose where to work', 'اختر مساحة العمل') }}</h1>
        <p>
          {{
            l(
              'Each institution has its own staff, athletes and training history. Choose a staff role to continue.',
              'لكل مؤسسة موظفوها ورياضيون وسجلها التدريبي. اختر دورك للمتابعة.',
            )
          }}
        </p>
      </div>
    </PageHeading>
    <p v-if="localPreview" class="notice">
      {{
        l(
          'Local examination: organization administrators, coaches and athletes are available with sample data.',
          'معاينة محلية: تتوفر حسابات مسؤولي المؤسسات والمدربين والرياضيين مع بيانات تجريبية.',
        )
      }}
    </p>
    <div class="form-stack">
      <RouterLink
        v-for="c in contexts.filter(
          (c) => c.kind === 'organization' && (localPreview || c.role !== 'trainee'),
        )"
        :key="c.id"
        :to="c.path"
        class="panel text-link"
        >{{ c.name }}
        <span class="muted"
          >·
          {{
            l(
              { admin: 'Administration', trainer: 'Coaching', trainee: 'Athlete training' }[c.role],
              { admin: 'الإدارة', trainer: 'التدريب', trainee: 'تدريب الرياضي' }[c.role],
            )
          }}</span
        >
        →</RouterLink
      >
    </div>
    <button
      class="button secondary"
      style="margin-block: 24px"
      @click="adding = !adding"
      :aria-expanded="adding"
    >
      {{ l('Set up a workspace', 'إعداد مساحة عمل') }}
    </button>
    <CommandStatus :command="command" />
    <form v-if="adding" class="panel form-stack" @submit.prevent="create">
      <h2>{{ l('A simple start', 'بداية بسيطة') }}</h2>
      <p v-if="draftError" class="notice error" role="alert">{{ draftError }}</p>
      <p v-else-if="name" class="muted" aria-live="polite">
        {{
          draftSaved
            ? l('Draft saved on this device.', 'حُفظت المسودة على هذا الجهاز.')
            : l('Saving draft…', 'جارٍ حفظ المسودة…')
        }}
      </p>
      <fieldset class="command-fields" :disabled="locked">
        <label
          >{{ l('Institution name', 'اسم المؤسسة')
          }}<input v-model="name" maxlength="100" required autocomplete="organization"
        /></label>
        <p class="muted">
          {{
            l(
              'You will be an administrator. Invite other admins, coaches and athletes when you are ready.',
              'ستكون مسؤولاً. ادعُ مسؤولين ومدربين ورياضيين عندما تكون جاهزاً.',
            )
          }}
        </p>
        <button class="button">{{ l('Create workspace', 'إنشاء مساحة العمل') }}</button>
      </fieldset>
    </form>
  </div>
</template>
