<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { getDraft, storeDraft } from '../../lib/storage'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import type { PlanVersion, Relationship, Profile } from '../../lib/domain'
import type { Resource } from '../resources/files'
import { downloadResource } from '../resources/files'
import { useCommand } from './commands'
import type { Workspace } from './types'
import CommandStatus from './CommandStatus.vue'
import PageState from '../../components/PageState.vue'
const id = String(useRoute().params.id),
  router = useRouter(),
  uuid = () => crypto.randomUUID()
const data = ref<Workspace>(),
  loading = ref(true),
  error = ref(''),
  tab = ref('clients'),
  teamName = ref(''),
  confirm = ref(''),
  email = ref(''),
  role = ref('coach'),
  inviteLink = ref('')
const versions = ref<PlanVersion[]>([]),
  relationships = ref<Relationship[]>([]),
  profiles = ref<Profile[]>([]),
  files = ref<Resource[]>([])
const relationship = ref(''),
  handoffs = ref<Record<string, string>>({}),
  group = ref(''),
  groupName = ref(''),
  groupClient = ref(''),
  selected = ref<string[]>([]),
  version = ref(''),
  sharedVersion = ref(''),
  resource = ref('')
const admin = computed(() => ['owner', 'admin'].includes(data.value?.team.role || '')),
  owner = computed(() => data.value?.team.role === 'owner')
const currentGroup = computed(() => data.value?.groups.find((g) => g.id === group.value))
const groupMembers = computed(
  () =>
    data.value?.clients.filter(
      (c) =>
        c.state === 'active' &&
        data.value!.group_members.some((m) => m.group_id === group.value && m.client_id === c.id),
    ) || [],
)
const availableClients = computed(() =>
  relationships.value.filter(
    (r) => r.state === 'active' && !data.value?.clients.some((c) => c.relationship_id === r.id),
  ),
)
const name = (client: string) =>
  profiles.value.find((p) => p.id === client)?.display_name || l('Athlete', 'رياضي')
const roleName = (value: string) =>
  ({ owner: l('Owner', 'مالك'), admin: l('Admin', 'مدير'), coach: l('Coach', 'مدرب') })[value]
async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[data.value, versions.value, relationships.value, profiles.value, files.value] =
      await Promise.all([
        rpc<Workspace>('team_workspace', { p_team: id }),
        rows<PlanVersion>('plan_versions', 'coach_id', user.value!.id),
        rows<Relationship>('coach_clients', 'coach_id', user.value!.id),
        rows<Profile>('profiles'),
        rows<Resource>('resources', 'owner_id', user.value!.id),
      ])
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const linkKey = `team-link:${user.value!.id}:${id}`
const command = useCommand('team:' + id, async (kind, result, args) => {
  if (kind === 'import_team_plan') {
    await router.push('/coach/plans/' + (result as { id: string }).id)
    return
  }
  if (kind === 'invite_team_member') {
    inviteLink.value = location.origin + '/team-invite/' + String(args.p_token)
    await storeDraft(linkKey, inviteLink.value)
  }
  if (
    kind === 'close_team' ||
    (kind === 'change_team_member' && args.p_user === user.value!.id && args.p_action === 'remove')
  ) {
    await router.replace('/coach/teams')
    return
  }
  if (kind === 'archive_team_group') {
    group.value = ''
    groupName.value = ''
  }
  confirm.value = ''
  selected.value = []
  await load()
})
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
async function download(r: Resource) {
  try {
    await downloadResource(r)
  } catch (e) {
    command.state.error = errorMessage(e)
  }
}
function chooseGroup() {
  groupName.value = currentGroup.value?.name || ''
  groupClient.value = ''
  selected.value = []
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    command.state.notice = l('Invitation link copied.', 'نُسخ رابط الدعوة.')
  } catch {
    command.state.error = l('Select and copy the link below.', 'حدّد الرابط أدناه وانسخه.')
  }
}
const activityLabels: Record<string, [string, string]> = {
  team_renamed: ['Team renamed', 'غُيّر اسم الفريق'],
  group_archived: ['Group archived', 'أُرشفت المجموعة'],
  team_created: ['Team created', 'أُنشئ الفريق'],
  staff_invited: ['Staff invited', 'دُعي موظف'],
  staff_joined: ['Staff joined', 'انضم موظف'],
  invite_revoked: ['Invitation revoked', 'أُلغيت دعوة'],
  member_remove: ['Member removed', 'أُزيل عضو'],
  member_admin: ['Admin appointed', 'عُيّن مدير'],
  member_coach: ['Coach role set', 'عُيّن دور مدرب'],
  member_owner: ['Ownership transferred', 'نُقلت الملكية'],
  team_closed: ['Team closed', 'أُغلق الفريق'],
  client_proposed: ['Athlete enrollment requested', 'طُلب انضمام متدرب'],
  handoff_requested: ['Coach change requested', 'طُلب تغيير مدرب'],
  client_accepted: ['Athlete approved change', 'وافق المتدرب'],
  client_declined: ['Athlete declined change', 'رفض المتدرب'],
  enrollment_closed: ['Enrollment closed', 'أُغلق انضمام'],
  plan_shared: ['Plan shared', 'شوركت خطة'],
  plan_removed: ['Shared plan removed', 'أُزيلت خطة مشتركة'],
  plan_imported: ['Plan copied', 'نُسخت خطة'],
  group_assigned: ['Group plan assigned', 'عُيّنت خطة مجموعة'],
}
const activityLabel = (key: string) => {
  const v = activityLabels[key]
  return v ? l(...v) : l('Team updated', 'حُدّث الفريق')
}
onMounted(async () => {
  await load()
  inviteLink.value = (await getDraft<string>(linkKey)) || ''
})
</script>
<template>
  <div class="container page">
    <RouterLink class="back-link" to="/coach/teams">← {{ l('Teams', 'الفرق') }}</RouterLink
    ><CommandStatus :command="command" /><PageState :loading="loading" :error="error" @retry="load"
      ><template v-if="data"
        ><header class="page-heading heading-actions">
          <div>
            <p class="overline">{{ roleName(data.team.role) }}</p>
            <h1>{{ data.team.name }}</h1>
            <p>{{ l('Shared work, clear responsibility.', 'عمل مشترك ومسؤولية واضحة.') }}</p>
          </div>
          <RouterLink
            v-if="admin"
            class="button small secondary"
            :to="'/coach/business?team=' + id"
            >{{ l('Team subscription', 'اشتراك الفريق') }}</RouterLink
          >
        </header>
        <nav class="workspace-tabs" :aria-label="l('Team sections', 'أقسام الفريق')">
          <button
            v-for="item in [
              ['clients', 'Athletes', 'المتدربون'],
              ['people', 'Staff', 'الموظفون'],
              ['groups', 'Groups', 'المجموعات'],
              ['library', 'Shared library', 'المكتبة المشتركة'],
              ...(admin ? [['activity', 'Activity', 'النشاط']] : []),
            ]"
            :key="item[0]"
            :class="{ selected: tab === item[0] }"
            @click="tab = item[0]!"
          >
            {{ l(item[1]!, item[2]!) }}
          </button>
        </nav>
        <section v-if="tab === 'clients'" class="ongoing-layout">
          <div class="form-stack">
            <p class="notice">
              {{
                l(
                  'The roster shares names and responsibilities. Coaching details remain private to each coach and athlete.',
                  'تشارك القائمة الأسماء والمسؤوليات. تبقى تفاصيل التدريب خاصة بالمدرب والمتدرب.',
                )
              }}
            </p>
            <p v-if="!data.clients.length" class="empty-review">
              {{
                l(
                  'No athletes on your team roster yet. Ask an existing athlete to join.',
                  'لا يوجد متدربون في قائمتك بعد. اطلب من متدرب حالي الانضمام.',
                )
              }}
            </p>
            <article v-for="c in data.clients" :key="c.id" class="panel team-client">
              <span class="tag">{{
                c.state === 'pending'
                  ? l('Awaiting athlete approval', 'بانتظار موافقة المتدرب')
                  : l('Active', 'نشط')
              }}</span>
              <h2>{{ c.name }}</h2>
              <p>{{ l('Coach', 'المدرب') }}: {{ c.coach_name }}</p>
              <RouterLink
                v-if="c.coach_id === user!.id"
                class="text-link"
                :to="'/coach/clients/' + c.relationship_id"
                >{{ l('Open coaching workspace', 'فتح مساحة التدريب') }}</RouterLink
              >
              <p v-if="c.pending_coach_id" class="notice">
                {{ l('Proposed coach', 'المدرب المقترح') }}: {{ c.pending_name }} ·
                {{ l('Waiting for athlete approval.', 'بانتظار موافقة المتدرب.') }}
              </p>
              <form
                v-if="admin && c.state === 'active'"
                class="share-resource"
                @submit.prevent="
                  command.run('request_team_handoff', {
                    p_id: c.id,
                    p_revision: c.revision,
                    p_coach: handoffs[c.id],
                  })
                "
              >
                <label
                  >{{ l('New coach', 'المدرب الجديد')
                  }}<select v-model="handoffs[c.id]" required :disabled="locked">
                    <option :value="undefined" disabled>
                      {{ l('Choose a staff member', 'اختر موظفاً') }}
                    </option>
                    <option
                      v-for="m in data.members.filter(
                        (m) => m.user_id !== c.coach_id && m.user_id !== c.client_id,
                      )"
                      :key="m.id"
                      :value="m.user_id"
                    >
                      {{ m.name }}
                    </option>
                  </select></label
                ><button class="button small secondary" :disabled="locked || !handoffs[c.id]">
                  {{ l('Request coach change', 'طلب تغيير المدرب') }}
                </button>
              </form>
              <div v-if="admin || c.coach_id === user!.id" class="actions">
                <button
                  v-if="admin && c.pending_coach_id"
                  class="text-link"
                  :disabled="locked"
                  @click="
                    command.run('request_team_handoff', {
                      p_id: c.id,
                      p_revision: c.revision,
                      p_coach: null,
                    })
                  "
                >
                  {{ l('Cancel proposed change', 'إلغاء التغيير المقترح') }}</button
                ><button v-if="confirm !== c.id" class="text-link" @click="confirm = c.id">
                  {{ l('Close team enrollment', 'إغلاق الانضمام للفريق') }}</button
                ><template v-else
                  ><span>{{ l('Direct coaching will remain.', 'سيبقى التدريب المباشر.') }}</span
                  ><button
                    class="button small secondary"
                    :disabled="locked"
                    @click="
                      command.run('close_team_client', { p_id: c.id, p_revision: c.revision })
                    "
                  >
                    {{ l('Confirm closure', 'تأكيد الإغلاق') }}</button
                  ><button class="text-link" @click="confirm = ''">
                    {{ l('Keep enrollment', 'إبقاء الانضمام') }}
                  </button></template
                >
              </div>
            </article>
          </div>
          <form
            class="panel form-stack"
            @submit.prevent="
              command.run('propose_team_client', {
                p_id: uuid(),
                p_team: id,
                p_relationship: relationship,
              })
            "
          >
            <h2>{{ l('Invite an existing athlete', 'دعوة متدرب حالي') }}</h2>
            <fieldset class="command-fields" :disabled="locked">
              <label
                >{{ l('Your athlete', 'متدربك')
                }}<select v-model="relationship" required>
                  <option value="" disabled>{{ l('Choose an athlete', 'اختر رياضياً') }}</option>
                  <option v-for="r in availableClients" :key="r.id" :value="r.id">
                    {{ name(r.client_id) }}
                  </option>
                </select></label
              >
              <p>
                {{
                  l(
                    'The athlete approves in More → Teams. No private coaching records become visible to the whole team.',
                    'يوافق المتدرب من المزيد ← الفرق. لا تصبح سجلات التدريب الخاصة مرئية للفريق بأكمله.',
                  )
                }}
              </p>
              <button class="button" :disabled="!relationship">
                {{ l('Request team enrollment', 'طلب الانضمام للفريق') }}
              </button>
            </fieldset>
            <RouterLink class="text-link" to="/coach/clients">{{
              l('Invite a new athlete first', 'دعوة رياضي جديد أولاً')
            }}</RouterLink>
          </form>
        </section>
        <section v-if="tab === 'people'" class="ongoing-layout">
          <div class="panel">
            <h2>{{ l('Staff members', 'أعضاء الفريق') }}</h2>
            <article v-for="m in data.members" :key="m.id" class="team-staff">
              <div>
                <strong>{{ m.name }}</strong>
                <p>{{ roleName(m.user_id === data.team.owner_id ? 'owner' : m.role) }}</p>
              </div>
              <div v-if="m.user_id !== data.team.owner_id" class="actions">
                <button
                  v-if="owner"
                  class="text-link"
                  :disabled="locked"
                  @click="
                    command.run('change_team_member', {
                      p_team: id,
                      p_user: m.user_id,
                      p_action: m.role === 'admin' ? 'coach' : 'admin',
                    })
                  "
                >
                  {{
                    m.role === 'admin'
                      ? l('Make coach', 'تعيين كمدرب')
                      : l('Make admin', 'تعيين كمدير')
                  }}</button
                ><button v-if="owner" class="text-link" @click="confirm = 'owner:' + m.user_id">
                  {{ l('Transfer ownership', 'نقل الملكية') }}</button
                ><button
                  v-if="owner || m.user_id === user!.id || (admin && m.role === 'coach')"
                  class="text-link"
                  @click="confirm = 'remove:' + m.user_id"
                >
                  {{
                    m.user_id === user!.id
                      ? l('Leave team', 'مغادرة الفريق')
                      : l('Remove member', 'إزالة العضو')
                  }}
                </button>
                <div v-if="confirm.endsWith(m.user_id)" class="notice">
                  <p>
                    {{
                      confirm.startsWith('owner:')
                        ? l(
                            'This person becomes the owner. You remain an admin.',
                            'سيصبح هذا الشخص المالك. ستبقى مديراً.',
                          )
                        : l(
                            'Access to shared team material will end. Existing private history remains with its original participants.',
                            'سينتهي الوصول للمواد المشتركة. يبقى السجل الخاص مع المشاركين الأصليين.',
                          )
                    }}
                  </p>
                  <button
                    class="button small secondary"
                    :disabled="locked"
                    @click="
                      command.run('change_team_member', {
                        p_team: id,
                        p_user: m.user_id,
                        p_action: confirm.startsWith('owner:') ? 'owner' : 'remove',
                      })
                    "
                  >
                    {{ l('Confirm member change', 'تأكيد تعديل العضو') }}</button
                  ><button class="text-link" @click="confirm = ''">
                    {{ l('Cancel', 'إلغاء') }}
                  </button>
                </div>
              </div>
            </article>
          </div>
          <aside v-if="admin" class="form-stack">
            <form
              class="panel form-stack"
              @submit.prevent="
                command.run('invite_team_member', {
                  p_id: uuid(),
                  p_team: id,
                  p_email: email,
                  p_role: role,
                  p_token: uuid() + uuid(),
                })
              "
            >
              <h2>{{ l('Invite staff', 'دعوة موظف') }}</h2>
              <fieldset class="command-fields" :disabled="locked">
                <label
                  >{{ l('Staff email', 'بريد الموظف')
                  }}<input v-model="email" type="email" required maxlength="254" /></label
                ><label
                  >{{ l('Staff role', 'دور الموظف')
                  }}<select v-model="role">
                    <option value="coach">{{ l('Coach', 'مدرب') }}</option>
                    <option v-if="owner" value="admin">{{ l('Admin', 'مدير') }}</option>
                  </select></label
                ><button class="button">
                  {{ l('Create staff invitation', 'إنشاء دعوة موظف') }}
                </button>
              </fieldset>
              <template v-if="inviteLink"
                ><label
                  >{{ l('Staff invitation link', 'رابط دعوة الموظف')
                  }}<input :value="inviteLink" readonly dir="ltr" /></label
                ><button type="button" class="button secondary" @click="copyLink">
                  {{ l('Copy invitation link', 'نسخ رابط الدعوة') }}
                </button>
                <p>
                  {{
                    l(
                      'Share this link yourself. It opens only for the invited email.',
                      'شارك الرابط بنفسك. يُفتح فقط للبريد المدعو.',
                    )
                  }}
                </p></template
              >
            </form>
            <section v-if="data.invitations.length" class="panel">
              <h2>{{ l('Pending invitations', 'الدعوات المعلقة') }}</h2>
              <div v-for="i in data.invitations" :key="i.id" class="team-staff">
                <div>
                  <strong dir="ltr">{{ i.email }}</strong>
                  <p>{{ roleName(i.role) }} · {{ dateLabel(i.expires_at) }}</p>
                </div>
                <button
                  class="text-link"
                  :disabled="locked"
                  @click="command.run('revoke_team_invitation', { p_id: i.id })"
                >
                  {{ l('Revoke invitation', 'إلغاء الدعوة') }}
                </button>
              </div>
            </section>
          </aside>
        </section>
        <section v-if="tab === 'groups'" class="ongoing-layout">
          <div class="panel form-stack">
            <h2>{{ l('Athlete groups', 'مجموعات المتدربين') }}</h2>
            <label
              >{{ l('Selected group', 'المجموعة المحددة')
              }}<select v-model="group" @change="chooseGroup">
                <option value="">
                  {{ l('Choose or create a group', 'اختر مجموعة أو أنشئ واحدة') }}
                </option>
                <option v-for="g in data.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select></label
            ><template v-if="group"
              ><div v-for="c in groupMembers" :key="c.id" class="team-staff">
                <label class="check-label" v-if="c.coach_id === user!.id"
                  ><input type="checkbox" v-model="selected" :value="c.id" :disabled="locked" />{{
                    c.name
                  }}</label
                ><strong v-else>{{ c.name }}</strong
                ><button
                  v-if="admin"
                  class="text-link"
                  :disabled="locked"
                  @click="
                    command.run('set_team_group_client', {
                      p_group: group,
                      p_client: c.id,
                      p_included: false,
                    })
                  "
                >
                  {{ l('Remove from group', 'إزالة من المجموعة') }}
                </button>
              </div>
              <p v-if="!groupMembers.length">
                {{ l('No athletes in this group yet.', 'لا يوجد متدربون في المجموعة بعد.') }}
              </p>
              <form
                v-if="admin"
                class="share-resource"
                @submit.prevent="
                  command.run('set_team_group_client', {
                    p_group: group,
                    p_client: groupClient,
                    p_included: true,
                  })
                "
              >
                <label
                  >{{ l('Add athlete to group', 'إضافة متدرب للمجموعة')
                  }}<select v-model="groupClient" required :disabled="locked">
                    <option value="" disabled>{{ l('Choose an athlete', 'اختر رياضياً') }}</option>
                    <option
                      v-for="c in data.clients.filter(
                        (c) => c.state === 'active' && !groupMembers.some((m) => m.id === c.id),
                      )"
                      :key="c.id"
                      :value="c.id"
                    >
                      {{ c.name }}
                    </option>
                  </select></label
                ><button class="button small secondary" :disabled="locked || !groupClient">
                  {{ l('Add to group', 'إضافة للمجموعة') }}
                </button>
              </form>
              <form class="form-stack" @submit.prevent="confirm = 'assign'">
                <h3>{{ l('Assign to selected athletes', 'تعيين للمحددين') }}</h3>
                <p>
                  {{
                    l(
                      'You can select only athletes you coach. This changes future plans; started sessions retain their snapshots.',
                      'يمكنك تحديد المتدربين الذين تدربهم فقط. تتغير الخطط المستقبلية وتبقى نسخ الحصص التي بدأت محفوظة.',
                    )
                  }}
                </p>
                <label
                  >{{ l('Published plan for group', 'الخطة المنشورة للمجموعة')
                  }}<select v-model="version" required :disabled="locked">
                    <option value="" disabled>
                      {{ l('Choose a published plan', 'اختر خطة منشورة') }}
                    </option>
                    <option v-for="v in versions" :key="v.id" :value="v.id">
                      {{ v.title }} · v{{ v.revision }}
                    </option>
                  </select></label
                ><button class="button" :disabled="locked || !selected.length || !version">
                  {{ l('Review assignment', 'مراجعة التعيين') }}
                </button>
                <div v-if="confirm === 'assign'" class="notice">
                  <p>
                    {{ l('Replace future plans for', 'استبدال الخطط المستقبلية لـ') }}
                    {{ selected.length }} {{ l('selected athletes?', 'متدربين محددين؟') }}
                  </p>
                  <button
                    type="button"
                    class="button small"
                    :disabled="locked"
                    @click="
                      command.run('assign_team_group', {
                        p_id: uuid(),
                        p_group: group,
                        p_version: version,
                        p_clients: selected,
                      })
                    "
                  >
                    {{ l('Confirm group assignment', 'تأكيد تعيين المجموعة') }}</button
                  ><button type="button" class="text-link" @click="confirm = ''">
                    {{ l('Cancel', 'إلغاء') }}
                  </button>
                </div>
              </form></template
            >
          </div>
          <form
            v-if="admin"
            class="panel form-stack"
            @submit.prevent="
              command.run('save_team_group', {
                p_id: group || uuid(),
                p_team: id,
                p_name: groupName,
                p_revision: currentGroup?.revision || 0,
              })
            "
          >
            <h2>
              {{
                group ? l('Rename group', 'تسمية المجموعة') : l('Create a group', 'إنشاء مجموعة')
              }}
            </h2>
            <fieldset class="command-fields" :disabled="locked">
              <label
                >{{ l('Group name', 'اسم المجموعة')
                }}<input v-model="groupName" required maxlength="100" /></label
              ><button class="button">{{ l('Save group', 'حفظ المجموعة') }}</button>
            </fieldset>
            <button
              v-if="group"
              type="button"
              class="text-link"
              @click="
                () => {
                  group = ''
                  chooseGroup()
                }
              "
            >
              {{ l('Create another group', 'إنشاء مجموعة أخرى') }}
            </button>
            <button
              v-if="currentGroup && confirm !== 'archive-group'"
              class="text-link danger"
              type="button"
              @click="confirm = 'archive-group'"
            >
              {{ l('Archive group', 'أرشفة المجموعة') }}
            </button>
            <div v-if="currentGroup && confirm === 'archive-group'" class="notice">
              <p>
                {{
                  l(
                    'Remove this group from the workspace? Athlete enrollments and assigned plans stay intact.',
                    'هل تريد إزالة المجموعة من مساحة العمل؟ تبقى انضمامات المتدربين وخططهم المعيّنة محفوظة.',
                  )
                }}
              </p>
              <button
                type="button"
                class="button small secondary"
                :disabled="locked"
                @click="
                  command.run('archive_team_group', {
                    p_id: group,
                    p_revision: currentGroup.revision,
                  })
                "
              >
                {{ l('Confirm group archive', 'تأكيد أرشفة المجموعة') }}
              </button>
              <button type="button" class="text-link" @click="confirm = ''">
                {{ l('Keep group', 'إبقاء المجموعة') }}
              </button>
            </div>
          </form>
        </section>
        <section v-if="tab === 'library'" class="ongoing-layout">
          <div class="form-stack">
            <section class="panel">
              <h2>{{ l('Shared plans', 'الخطط المشتركة') }}</h2>
              <p>
                {{
                  l(
                    'Copy a published snapshot into your own plans, then adapt it. Other coaches’ copies stay independent.',
                    'انسخ نسخة منشورة إلى خططك ثم عدّلها. تبقى نسخ المدربين الآخرين مستقلة.',
                  )
                }}
              </p>
              <article v-for="p in data.plans" :key="p.id" class="team-library-row">
                <h3>{{ p.title }}</h3>
                <div class="actions">
                  <button
                    class="button small secondary"
                    :disabled="locked"
                    @click="command.run('import_team_plan', { p_id: uuid(), p_template: p.id })"
                  >
                    {{ l('Copy to my plans', 'نسخ إلى خططي') }}</button
                  ><button
                    v-if="admin || p.contributor_id === user!.id"
                    class="text-link"
                    :disabled="locked"
                    @click="command.run('remove_team_plan', { p_id: p.id })"
                  >
                    {{ l('Remove shared plan', 'إزالة الخطة المشتركة') }}
                  </button>
                </div>
              </article>
              <p v-if="!data.plans.length">
                {{ l('No plans shared yet.', 'لا توجد خطط مشتركة بعد.') }}
              </p>
            </section>
            <section class="panel">
              <h2>{{ l('Team files', 'ملفات الفريق') }}</h2>
              <p>
                {{
                  l(
                    'Shared with active staff. Athlete access is managed separately in Resources.',
                    'مشتركة مع الموظفين النشطين. يُدار وصول المتدربين بشكل منفصل في الملفات.',
                  )
                }}
              </p>
              <article v-for="f in data.resources" :key="f.id" class="team-library-row">
                <h3>{{ f.title }}</h3>
                <p>{{ f.filename }}</p>
                <div class="actions">
                  <button class="text-link" @click="download(f)">
                    {{ l('Download', 'تنزيل') }}</button
                  ><button
                    v-if="admin || f.owner_id === user!.id"
                    class="text-link"
                    :disabled="locked"
                    @click="
                      command.run('share_team_resource', {
                        p_team: id,
                        p_resource: f.id,
                        p_shared: false,
                      })
                    "
                  >
                    {{ l('Remove team access', 'إزالة وصول الفريق') }}
                  </button>
                </div>
              </article>
              <p v-if="!data.resources.length">
                {{ l('No team files yet.', 'لا توجد ملفات للفريق بعد.') }}
              </p>
            </section>
          </div>
          <aside class="form-stack">
            <form
              class="panel form-stack"
              @submit.prevent="
                command.run('share_team_plan', {
                  p_id: uuid(),
                  p_team: id,
                  p_version: sharedVersion,
                })
              "
            >
              <h2>{{ l('Share a published plan', 'مشاركة خطة منشورة') }}</h2>
              <label
                >{{ l('Your published version', 'نسختك المنشورة')
                }}<select v-model="sharedVersion" required :disabled="locked">
                  <option value="" disabled>{{ l('Choose a version', 'اختر نسخة') }}</option>
                  <option v-for="v in versions" :key="v.id" :value="v.id">
                    {{ v.title }} · v{{ v.revision }}
                  </option>
                </select></label
              ><button class="button" :disabled="locked || !sharedVersion">
                {{ l('Share plan with team', 'مشاركة الخطة مع الفريق') }}
              </button>
            </form>
            <form
              class="panel form-stack"
              @submit.prevent="
                command.run('share_team_resource', {
                  p_team: id,
                  p_resource: resource,
                  p_shared: true,
                })
              "
            >
              <h2>{{ l('Share an uploaded file', 'مشاركة ملف مرفوع') }}</h2>
              <label
                >{{ l('Your ready resource', 'ملفك الجاهز')
                }}<select v-model="resource" required :disabled="locked">
                  <option value="" disabled>{{ l('Choose a file', 'اختر ملفاً') }}</option>
                  <option
                    v-for="f in files.filter((f) => f.state === 'ready')"
                    :key="f.id"
                    :value="f.id"
                  >
                    {{ f.title }}
                  </option>
                </select></label
              ><button class="button" :disabled="locked || !resource">
                {{ l('Share file with team', 'مشاركة الملف مع الفريق') }}</button
              ><RouterLink class="text-link" to="/coach/resources">{{
                l('Upload a file first', 'رفع ملف أولاً')
              }}</RouterLink>
            </form>
          </aside>
        </section>
        <section v-if="tab === 'activity'" class="panel">
          <form
            v-if="admin"
            class="form-stack"
            @submit.prevent="
              command.run('rename_team', {
                p_id: id,
                p_name: teamName,
                p_revision: data.team.revision,
              })
            "
          >
            <label
              >{{ l('New team name', 'اسم الفريق الجديد')
              }}<input
                v-model="teamName"
                :placeholder="data.team.name"
                maxlength="100"
                required
                :disabled="locked"
            /></label>
            <button class="button secondary" :disabled="locked">
              {{ l('Rename team', 'تغيير اسم الفريق') }}
            </button>
          </form>
          <h2>{{ l('Team activity', 'نشاط الفريق') }}</h2>
          <p v-if="!admin">
            {{
              l(
                'Team owners and admins can review administrative activity.',
                'يمكن لمالك الفريق ومديريه مراجعة النشاط الإداري.',
              )
            }}
          </p>
          <ol v-else class="team-activity">
            <li v-for="a in data.activity" :key="a.id">
              <span>{{ activityLabel(a.action) }}</span
              ><time>{{ dateLabel(a.created_at) }}</time>
            </li>
          </ol>
          <template v-if="owner"
            ><hr />
            <button class="text-link danger" @click="confirm = 'close-team'">
              {{ l('Close this team', 'إغلاق هذا الفريق') }}
            </button>
            <div v-if="confirm === 'close-team'" class="notice">
              <p>
                {{
                  l(
                    'Close all athlete enrollments first. This ends team access and pending staff invitations; personal coaching and imported plans remain.',
                    'أغلق انضمامات المتدربين أولاً. ينهي هذا وصول الفريق ودعوات الموظفين المعلقة؛ يبقى التدريب الشخصي والخطط المنسوخة.',
                  )
                }}
              </p>
              <button
                class="button danger-button"
                :disabled="locked"
                @click="command.run('close_team', { p_id: id, p_revision: data.team.revision })"
              >
                {{ l('Confirm team closure', 'تأكيد إغلاق الفريق') }}</button
              ><button class="text-link" @click="confirm = ''">
                {{ l('Keep team', 'إبقاء الفريق') }}
              </button>
            </div></template
          >
        </section>
      </template></PageState
    >
  </div>
</template>
