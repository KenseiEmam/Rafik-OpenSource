<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, refreshContexts, contexts } from '../../app/auth'
import { request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import PageState from '../../components/PageState.vue'
import type { Organization, Member, Role } from './types'
import './organization.css'
import OrganizationUpcoming from './OrganizationUpcoming.vue'
import MemberPicker from './MemberPicker.vue'
import OrganizationNav from './OrganizationNav.vue'
const route = useRoute(),
  router = useRouter(),
  id = String(route.params.workspace),
  view = String(route.params.view) as Role,
  base = `/organization/${id}/${view}`,
  section = computed(() => String(route.params.section || 'overview'))
const peopleLoading = ref(false),
  extraLoading = ref(false)
const nextPeople = ref<number | null>(null),
  peopleTotal = ref(0)
const data = ref<Organization>(),
  loading = ref(true),
  error = ref(''),
  search = ref(''),
  filter = ref(String(route.query.filter || 'all')),
  selected = ref<Member>(),
  editRoles = ref<Role[]>([]),
  active = ref(true),
  trainer = ref(''),
  newName = ref(''),
  closeName = ref(''),
  inviting = ref(false),
  email = ref(''),
  roles = ref<Role[]>(['trainee']),
  inviteLink = ref(''),
  draftReady = ref(false),
  draftSaved = ref(false),
  draftError = ref('')
const draftKey = `organization-invite:${user.value!.id}:${id}:${view}`
const roleName = (role: string) =>
  l(
    { admin: 'Administrator', trainer: 'Trainer', trainee: 'Trainee' }[role] || role,
    { admin: 'مسؤول', trainer: 'مدرب', trainee: 'متدرب' }[role] || role,
  )
const visible = computed(() =>
  (data.value?.members || []).filter(
    (m) =>
      (filter.value === 'inactive'
        ? !m.active
        : m.active && (filter.value === 'all' || m.roles.includes(filter.value as Role))) &&
      (!search.value ||
        `${m.name} ${m.email || ''}`.toLowerCase().includes(search.value.toLowerCase())),
  ),
)
const trainers = computed(
  () => data.value?.members.filter((m) => m.active && m.roles.includes('trainer')) || [],
)
const trainees = computed(
  () =>
    data.value?.members.filter(
      (m) =>
        m.active &&
        m.roles.includes('trainee') &&
        (view !== 'trainer' || m.trainer_id === data.value?.self.id),
    ) || [],
)
const trainerName = (member: Member) =>
  data.value?.names.find((m) => m.id === member.trainer_id)?.name || l('Not assigned', 'غير معيّن')
async function load() {
  loading.value = true
  error.value = ''
  try {
    const loaded = await request<Organization>(
      `/v1/workspaces/${id}?view=${view}&summary=${view !== 'trainee'}`,
    )
    data.value = loaded
    newName.value = loaded.workspace.name
    if (section.value === 'people') await loadPeople()
  } catch (e) {
    data.value = undefined
    error.value = errorMessage(e)
    await refreshContexts().catch(() => {})
  } finally {
    loading.value = false
  }
}
async function loadExtra(kind: 'invitations' | 'events') {
  if (!data.value || extraLoading.value) return
  extraLoading.value = true
  try {
    const result = await request<Organization>(
      `/v1/workspaces/${id}?view=${view}&summary=true&${kind === 'events' ? 'eventOffset' : 'invitationOffset'}=${kind === 'events' ? data.value.eventsNext : data.value.invitationsNext}`,
    )
    if (kind === 'events') {
      data.value.events.push(...result.events)
      data.value.eventsNext = result.eventsNext
    } else {
      data.value.invitations.push(...result.invitations)
      data.value.invitationsNext = result.invitationsNext
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    extraLoading.value = false
  }
}
let rosterGeneration = 0,
  rosterTimer: ReturnType<typeof setTimeout>
async function loadPeople(append = false) {
  const current = ++rosterGeneration
  peopleLoading.value = true
  try {
    const q = new URLSearchParams({
      view,
      search: search.value,
      state: filter.value === 'inactive' ? 'inactive' : 'active',
      role: ['admin', 'trainer', 'trainee'].includes(filter.value) ? filter.value : '',
      offset: String(append ? nextPeople.value || 0 : 0),
    })
    const page = await request<{
      items: Member[]
      names: { id: string; name: string }[]
      next: number | null
      total: number
    }>(`/v1/workspaces/${id}/people?${q}`)
    if (current !== rosterGeneration || !data.value) return
    data.value.members = append ? [...data.value.members, ...page.items] : page.items
    data.value.names = Array.from(
      new Map([...data.value.names, ...page.names].map((m) => [m.id, m])).values(),
    )
    nextPeople.value = page.next
    peopleTotal.value = page.total
  } catch (e) {
    if (current === rosterGeneration) error.value = errorMessage(e)
  } finally {
    if (current === rosterGeneration) peopleLoading.value = false
  }
}
onUnmounted(() => {
  clearTimeout(rosterTimer)
  rosterGeneration++
})
watch([search, filter], () => {
  rosterGeneration++
  peopleLoading.value = true
  clearTimeout(rosterTimer)
  rosterTimer = setTimeout(() => void loadPeople(), 180)
})
const command = useCommand<'organization'>(
  `organization:${id}:${view}`,
  async (_, result, args) => {
    if (args.action === 'invite') {
      inviteLink.value = location.origin + '/organization-invite/' + args.token
      email.value = ''
      roles.value = ['trainee']
      await removeDraft(draftKey)
    }
    selected.value = undefined
    await refreshContexts()
    if (!contexts.value.some((c) => c.path === base)) {
      await router.push('/workspaces')
      return
    }
    await load()
  },
  (_, args) => request(`/v1/workspaces/${id}`, { method: 'POST', body: JSON.stringify(args) }),
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
const run = (args: Record<string, unknown>) =>
  command.run('organization', { operation: crypto.randomUUID(), ...args })
async function select(member: Member) {
  selected.value = member
  editRoles.value = [...member.roles]
  active.value = member.active
  trainer.value = member.trainer_id || ''
  await nextTick()
  document.querySelector<HTMLElement>('.organization-edit-heading h2')?.focus()
}
async function closeEditor() {
  const member = selected.value?.id
  selected.value = undefined
  await nextTick()
  if (member) document.querySelector<HTMLElement>(`[data-member="${member}"]`)?.focus()
}

function invite() {
  inviteLink.value = ''
  const token = [...crypto.getRandomValues(new Uint8Array(32))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
  return run({
    action: 'invite',
    id: crypto.randomUUID(),
    email: email.value,
    roles: roles.value,
    token,
  })
}
let draftSequence = 0
async function saveInviteDraft() {
  if (!draftReady.value) return
  const sequence = ++draftSequence
  draftSaved.value = false
  draftError.value = ''
  try {
    await storeDraft(draftKey, { email: email.value, roles: [...roles.value] })
    if (sequence === draftSequence) draftSaved.value = true
  } catch (e) {
    if (sequence === draftSequence) draftError.value = errorMessage(e)
  }
}
watch([email, roles], () => void saveInviteDraft(), { deep: true })
onMounted(async () => {
  await load()
  const draft = await getDraft<{ email: string; roles: Role[] }>(draftKey).catch(() => undefined)
  if (draft) {
    email.value = draft.email
    roles.value = draft.roles
    inviting.value = !!draft.email
  }
  draftReady.value = true
})
</script>
<template>
  <OrganizationNav />
  <div class="container page organization-page">
    <header class="work-heading">
      <div>
        <p class="overline">{{ roleName(view) }}</p>
        <h1>{{ data?.workspace.name || l('Organization', 'المؤسسة') }}</h1>
        <p>
          {{
            view === 'admin'
              ? l(
                  'Your people, their training, one shared responsibility.',
                  'أشخاصك وتدريبهم ومسؤولية مشتركة.',
                )
              : view === 'trainer'
                ? l('Focus on the people you support.', 'ركّز على الأشخاص الذين تدعمهم.')
                : l('Your training within this organization.', 'تدريبك ضمن هذه المؤسسة.')
          }}
        </p>
      </div>
      <button
        v-if="data && view === 'admin'"
        class="button"
        @click="inviting = !inviting"
        :aria-expanded="inviting"
      >
        {{ l('Invite people', 'دعوة أشخاص') }}
      </button>
    </header>
    <CommandStatus :command="command" />
    <PageState :loading="loading" :error="error" @retry="load"
      ><template v-if="data">
        <section v-if="inviting && view === 'admin'" class="panel organization-invite">
          <form class="form-stack" @submit.prevent="invite">
            <h2>
              {{
                l('Invite someone to ' + data.workspace.name, 'دعوة شخص إلى ' + data.workspace.name)
              }}
            </h2>
            <p v-if="draftError" class="notice error" role="alert">{{ draftError }}</p>
            <p v-else-if="email" class="muted" aria-live="polite">
              {{
                draftSaved
                  ? l(
                      'Invitation draft saved on this device.',
                      'حُفظت مسودة الدعوة على هذا الجهاز.',
                    )
                  : l('Saving draft…', 'جارٍ حفظ المسودة…')
              }}
            </p>
            <fieldset class="command-fields" :disabled="locked || !draftReady">
              <label
                >{{ l('Email address', 'البريد الإلكتروني')
                }}<input type="email" v-model="email" maxlength="254" required
              /></label>
              <fieldset class="role-choices">
                <legend>
                  {{ l('Access within this organization', 'الصلاحيات داخل هذه المؤسسة') }}
                </legend>
                <label v-for="role in ['admin', 'trainer', 'trainee'] as Role[]" :key="role"
                  ><input type="checkbox" v-model="roles" :value="role" />{{
                    roleName(role)
                  }}</label
                >
              </fieldset>
              <p class="muted">
                {{
                  l(
                    'Choose more than one role when needed. The invitation must be accepted using this verified email address.',
                    'اختر أكثر من دور عند الحاجة. يجب قبول الدعوة بهذا البريد الإلكتروني الموثّق.',
                  )
                }}
              </p>
              <button class="button" :disabled="!roles.length">
                {{ l('Create invitation', 'إنشاء الدعوة') }}
              </button>
            </fieldset>
          </form>
        </section>
        <div v-if="inviteLink" class="notice success">
          <p>
            {{
              l(
                'Invitation ready. Share this link with the intended person.',
                'الدعوة جاهزة. شارك الرابط مع الشخص المقصود.',
              )
            }}
          </p>
          <label
            >{{ l('Invitation link', 'رابط الدعوة')
            }}<input
              :value="inviteLink"
              readonly
              @focus="($event.target as HTMLInputElement).select()"
          /></label>
        </div>
        <template v-if="section === 'overview'">
          <div v-if="view !== 'trainee'" class="organization-summary">
            <RouterLink :to="base + '/people'"
              ><strong>{{ data.summary.trainees }}</strong
              ><span>{{
                view === 'admin'
                  ? l('Active trainees', 'المتدربون النشطون')
                  : l('Assigned to you', 'المعيّنون لك')
              }}</span></RouterLink
            ><RouterLink v-if="view === 'admin'" :to="base + '/people?filter=trainer'"
              ><strong>{{ data.summary.trainers }}</strong
              ><span>{{ l('Trainers', 'المدربون') }}</span></RouterLink
            ><RouterLink v-if="view === 'admin'" :to="base + '/people'"
              ><strong>{{ data.summary.unassigned }}</strong
              ><span>{{ l('Need a trainer', 'بحاجة إلى مدرب') }}</span></RouterLink
            >
          </div>
          <div class="actions">
            <RouterLink class="button" :to="base + '/training'">{{
              view === 'trainee'
                ? l('Open my training', 'فتح تدريبي')
                : l('Review training', 'مراجعة التدريب')
            }}</RouterLink
            ><RouterLink
              v-if="view !== 'trainee'"
              class="button secondary"
              :to="base + '/analytics'"
              >{{ l('View analytics', 'عرض التحليلات') }}</RouterLink
            >
          </div>
          <OrganizationUpcoming />
          <section v-if="view === 'trainee' || !data.summary.trainees" class="panel">
            <h2>
              {{
                view === 'admin'
                  ? l('Keep everyone supported', 'امنح الجميع الدعم')
                  : view === 'trainer'
                    ? l('Your next coaching step', 'خطوتك التدريبية التالية')
                    : l('Your trainer', 'مدربك')
              }}
            </h2>
            <template v-if="view === 'trainee'"
              ><p>{{ trainerName(data.members.find((m) => m.id === data?.self.id)!) }}</p>
              <p class="muted">
                {{
                  l(
                    'Your organization manages your trainer assignment. Your personal training remains in My training.',
                    'تدير مؤسستك تعيين مدربك. يبقى تدريبك الشخصي في «تدريبي».',
                  )
                }}
              </p></template
            ><template v-else
              ><p>
                {{
                  view === 'admin'
                    ? l(
                        'Invite your staff and trainees, then give each trainee a responsible trainer. You can reassign responsibility while keeping the organization’s records together.',
                        'ادعُ موظفيك ومتدربيك وعيّن مدرباً مسؤولاً لكل متدرب. يمكنك تغيير المسؤولية مع الحفاظ على سجلات المؤسسة.',
                      )
                    : l(
                        'Open your roster to see the trainees assigned to you. Organization administration and independent coaching are separate views.',
                        'افتح القائمة للاطلاع على المتدربين المعيّنين لك. إدارة المؤسسة والتدريب المستقل عرضان منفصلان.',
                      )
                }}
              </p>
              <RouterLink class="text-link" :to="base + '/people'"
                >{{ l('Open roster', 'فتح القائمة') }} →</RouterLink
              ></template
            >
          </section>
        </template>
        <template v-else-if="section === 'people'">
          <div class="organization-toolbar">
            <label
              >{{ l('Find a person', 'البحث عن شخص')
              }}<input type="search" v-model="search" /></label
            ><label
              >{{ l('Show people', 'عرض الأشخاص')
              }}<select v-model="filter">
                <option value="all">{{ l('Active people', 'الأشخاص النشطون') }}</option>
                <option
                  v-for="role in ['admin', 'trainer', 'trainee'] as Role[]"
                  :key="role"
                  :value="role"
                >
                  {{ roleName(role) }}
                </option>
                <option value="inactive">{{ l('Inactive people', 'الأشخاص غير النشطين') }}</option>
              </select></label
            >
          </div>
          <div class="organization-people">
            <section>
              <p class="muted">{{ peopleTotal }} {{ l('people', 'أشخاص') }}</p>
              <p v-if="peopleLoading" class="small-print" role="status">
                {{ l('Finding people…', 'جارٍ البحث عن الأشخاص…') }}
              </p>
              <p v-if="!visible.length && !peopleLoading" class="empty-state">
                {{ l('No people match this view.', 'لا أشخاص يطابقون هذا العرض.') }}
              </p>
              <article v-for="member in visible" :key="member.id" class="organization-person">
                <div class="person-identity">
                  <span class="avatar">{{ member.name.slice(0, 1) }}</span>
                  <div>
                    <h2>{{ member.name }}</h2>
                    <p>{{ member.roles.map(roleName).join(' · ') }}</p>
                    <p v-if="member.roles.includes('trainee')" class="muted">
                      {{ l('Trainer', 'المدرب') }}: {{ trainerName(member) }}
                    </p>
                  </div>
                </div>
                <button
                  v-if="view === 'admin'"
                  class="button small secondary"
                  :disabled="peopleLoading"
                  @click="select(member)"
                  :data-member="member.id"
                  :aria-label="l('Manage ', 'إدارة ') + member.name"
                >
                  {{ l('Manage', 'إدارة') }}
                </button>
              </article>
              <button
                v-if="nextPeople !== null"
                class="button secondary"
                :disabled="peopleLoading"
                @click="loadPeople(true)"
              >
                {{ l('Show more people', 'عرض المزيد') }}
              </button>
            </section>
            <aside v-if="selected && view === 'admin'" class="panel form-stack">
              <header class="organization-edit-heading">
                <h2 tabindex="-1">{{ selected.name }}</h2>
                <button class="text-link" @click="closeEditor">
                  {{ l('Close', 'إغلاق') }}
                </button>
              </header>
              <fieldset class="command-fields" :disabled="locked">
                <form
                  class="form-stack"
                  @submit.prevent="
                    run({
                      action: 'member',
                      id: selected.id,
                      revision: selected.revision,
                      roles: editRoles,
                      active,
                    })
                  "
                >
                  <fieldset class="role-choices">
                    <legend>{{ l('Organization roles', 'أدوار المؤسسة') }}</legend>
                    <label v-for="role in ['admin', 'trainer', 'trainee'] as Role[]" :key="role"
                      ><input type="checkbox" v-model="editRoles" :value="role" />{{
                        roleName(role)
                      }}</label
                    >
                  </fieldset>
                  <label class="check-label"
                    ><input type="checkbox" v-model="active" />{{
                      l('Active membership', 'عضوية نشطة')
                    }}</label
                  >
                  <p
                    v-if="
                      !active ||
                      (!editRoles.includes('trainer') && selected.roles.includes('trainer'))
                    "
                    class="notice"
                  >
                    {{
                      l(
                        'Any assigned trainees will need a new trainer. Their organization records remain available. Access ends immediately when membership is deactivated.',
                        'سيحتاج المتدربون المعيّنون إلى مدرب جديد. تبقى سجلاتهم بالمؤسسة. ينتهي الوصول فور إلغاء تنشيط العضوية.',
                      )
                    }}
                  </p>
                  <button class="button" :disabled="!editRoles.length">
                    {{ l('Save membership', 'حفظ العضوية') }}
                  </button>
                </form>
                <form
                  v-if="selected.active && selected.roles.includes('trainee')"
                  class="form-stack organization-trainer-form"
                  @submit.prevent="
                    run({
                      action: 'assign-trainer',
                      id: selected.id,
                      revision: selected.revision,
                      trainer: trainer || null,
                    })
                  "
                >
                  <MemberPicker
                    :workspace="id"
                    :view="view"
                    role="trainer"
                    single
                    :label="l('Responsible trainer', 'المدرب المسؤول')"
                    :model-value="trainer ? [trainer] : []"
                    :exclude-ids="[selected.id]"
                    @update:model-value="trainer = $event[0] || ''"
                  />
                  <button class="button secondary">
                    {{ l('Update trainer', 'تحديث المدرب') }}
                  </button>
                </form>
              </fieldset>
            </aside>
          </div>
          <section v-if="view === 'admin' && data.invitations.length" class="panel">
            <h2>{{ l('Waiting for acceptance', 'بانتظار القبول') }}</h2>
            <article
              v-for="invitation in data.invitations"
              :key="invitation.id"
              class="organization-person"
            >
              <div>
                <strong>{{ invitation.email }}</strong>
                <p>
                  {{ invitation.roles.map(roleName).join(' · ') }} · {{ l('Expires', 'تنتهي') }}
                  {{ dateLabel(invitation.expires_at) }}
                </p>
              </div>
              <button
                class="text-link"
                :disabled="locked"
                @click="run({ action: 'revoke-invite', id: invitation.id })"
              >
                {{ l('Revoke invitation', 'إلغاء الدعوة') }}
              </button>
            </article>
            <button
              v-if="data.invitationsNext !== null"
              type="button"
              class="text-link"
              :disabled="extraLoading"
              @click="loadExtra('invitations')"
            >
              {{ l('More pending invitations', 'المزيد من الدعوات المعلقة') }}
            </button>
          </section>
        </template>
        <section v-else-if="section === 'activity' && view === 'admin'" class="panel">
          <h2>{{ l('Recent organization changes', 'تغييرات المؤسسة الأخيرة') }}</h2>
          <p v-if="!data.events.length">
            {{ l('No changes recorded yet.', 'لا تغييرات مسجلة بعد.') }}
          </p>
          <ol class="organization-events">
            <li v-for="event in data.events" :key="event.id">
              <strong>{{
                l(
                  {
                    member_invited: 'Invitation created',
                    invitation_revoked: 'Invitation revoked',
                    member_joined: 'Member joined',
                    trainer_assigned: 'Trainer responsibility updated',
                    member_roles_changed: 'Member roles updated',
                    member_removed: 'Membership deactivated',
                    organization_created: 'Organization created',
                    organization_renamed: 'Organization renamed',
                  }[event.kind] || 'Organization updated',
                  {
                    member_invited: 'إنشاء دعوة',
                    invitation_revoked: 'إلغاء دعوة',
                    member_joined: 'انضمام عضو',
                    trainer_assigned: 'تحديث مسؤولية المدرب',
                    member_roles_changed: 'تحديث الأدوار',
                    member_removed: 'إلغاء تنشيط عضوية',
                    organization_created: 'إنشاء المؤسسة',
                    organization_renamed: 'تغيير اسم المؤسسة',
                  }[event.kind] || 'تحديث المؤسسة',
                )
              }}</strong
              ><span>{{
                data.members.find(
                  (m) => m.id === event.subject_id || m.user_id === event.subject_id,
                )?.name
              }}</span
              ><time>{{ dateLabel(event.created_at) }}</time>
            </li>
          </ol>
          <button
            v-if="data.eventsNext !== null"
            type="button"
            class="text-link"
            :disabled="extraLoading"
            @click="loadExtra('events')"
          >
            {{ l('Earlier activity', 'نشاط أقدم') }}
          </button>
        </section>
        <section v-else-if="section === 'settings' && view === 'admin'" class="panel narrow">
          <h2>{{ l('Organization settings', 'إعدادات المؤسسة') }}</h2>
          <form
            class="form-stack"
            @submit.prevent="
              run({ action: 'rename', name: newName, revision: data.workspace.revision })
            "
          >
            <label
              >{{ l('Organization name', 'اسم المؤسسة')
              }}<input v-model="newName" maxlength="100" required :disabled="locked" /></label
            ><button class="button" :disabled="locked">{{ l('Save name', 'حفظ الاسم') }}</button>
          </form>
          <details class="organization-close">
            <summary>{{ l('Close this organization', 'إغلاق هذه المؤسسة') }}</summary>
            <p>
              {{
                l(
                  'This ends access for all members. Records remain preserved. Type the organization name to confirm.',
                  'ينهي هذا الوصول لجميع الأعضاء مع الاحتفاظ بالسجلات. اكتب اسم المؤسسة للتأكيد.',
                )
              }}
            </p>
            <label
              >{{ l('Confirm organization name', 'تأكيد اسم المؤسسة')
              }}<input v-model="closeName" :disabled="locked" /></label
            ><button
              class="button secondary"
              :disabled="locked || closeName !== data.workspace.name"
              @click="
                run({ action: 'close', confirm: closeName, revision: data.workspace.revision })
              "
            >
              {{ l('Close organization', 'إغلاق المؤسسة') }}
            </button>
          </details>
        </section>
        <p v-else class="notice">
          {{
            l(
              'Choose an available page from the organization navigation.',
              'اختر صفحة متاحة من قائمة المؤسسة.',
            )
          }}
        </p>
      </template></PageState
    >
    <RouterLink v-if="error" class="text-link" to="/workspaces">{{
      l('Choose another workspace', 'اختيار مساحة عمل أخرى')
    }}</RouterLink>
  </div>
</template>
