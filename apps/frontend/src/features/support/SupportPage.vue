<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getDraft, storeDraft } from '../../lib/storage'
import { user } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import type { Database } from '@rafik/shared/database.types'
import type { Team, Enrollment } from '../teams/types'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import PageState from '../../components/PageState.vue'
type Case = Database['public']['Tables']['support_cases']['Row']
const route = useRoute(),
  coach = route.path.startsWith('/coach'),
  cases = ref<Case[]>([]),
  teams = ref<Team[]>([]),
  adminTeams = ref<string[]>([]),
  enrollments = ref<Enrollment[]>([])
const loading = ref(true),
  error = ref(''),
  team = ref(String(route.query.team || '')),
  subject = ref(''),
  detail = ref(''),
  selected = ref(''),
  reply = ref(''),
  show = ref('open'),
  uuid = () => crypto.randomUUID()
const options = computed(() => [
  ...new Map(
    [
      ...teams.value.map((t) => ({ id: t.id, name: t.name })),
      ...enrollments.value
        .filter((e) => e.state === 'active')
        .map((e) => ({ id: e.team_id, name: e.team_name })),
    ].map((t) => [t.id, t]),
  ).values(),
])
const current = computed(() => cases.value.find((c) => c.id === selected.value))
async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[cases.value, teams.value, enrollments.value] = await Promise.all([
      rows<Case>('support_cases'),
      rows<Team>('teams'),
      rpc<Enrollment[]>('my_team_enrollments'),
    ])
    cases.value.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    const members = await rows<Database['public']['Tables']['team_members']['Row']>(
      'team_members',
      'user_id',
      user.value!.id,
    )
    adminTeams.value = teams.value
      .filter(
        (t) =>
          t.owner_id === user.value!.id ||
          members.some((m) => m.team_id === t.id && m.role === 'admin' && m.state === 'active'),
      )
      .map((t) => t.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const command = useCommand('support', async (kind, result) => {
  if (kind === 'create_support_case') {
    selected.value = (result as Case).id
    subject.value = ''
    detail.value = ''
  }
  await load()
})
const locked = computed(
  () => command.state.busy || !!command.state.pending || !command.state.ready || !draftReady.value,
)
function choose(c: Case) {
  selected.value = c.id
  reply.value = c.reply
}
const draftKey = `support-draft:${user.value!.id}`
const draftReady = ref(false)
watch([subject, detail, team], () => {
  if (draftReady.value)
    void storeDraft(draftKey, {
      subject: subject.value,
      detail: detail.value,
      team: team.value,
    }).catch((e) => {
      command.state.error = errorMessage(e)
    })
})
onMounted(async () => {
  await load()
  try {
    const draft = await getDraft<{ subject: string; detail: string; team: string }>(draftKey)
    if (draft) {
      subject.value = draft.subject
      detail.value = draft.detail
      team.value = draft.team
    }
  } catch (e) {
    command.state.error = errorMessage(e)
  }
  draftReady.value = true
})
</script>
<template>
  <div class="container page">
    <RouterLink class="back-link" :to="coach ? '/coach/more' : '/more'"
      >← {{ l('More tools', 'أدوات إضافية') }}</RouterLink
    >
    <header class="page-heading">
      <h1>{{ l('Support', 'الدعم') }}</h1>
      <p>
        {{
          l(
            'Explain the issue once. Keep the response with it.',
            'اشرح المشكلة مرة واحدة واحتفظ بالرد معها.',
          )
        }}
      </p>
    </header>
    <CommandStatus :command="command" /><PageState :loading="loading" :error="error" @retry="load"
      ><p class="notice">
        {{
          l(
            'Requests stay in this installation. Nothing is emailed or sent to Rafik. Rafik-directed requests are visible to an authorized platform administrator; institution requests are visible to the selected team’s admins. Do not include athlete health details or private files.',
            'تبقى الطلبات في هذا التثبيت. لا يتم إرسال بريد أو إرسال معلومات إلى رفيق. يمكن لمسؤول المنصة المخوّل رؤية الطلبات الموجّهة إلى رفيق، ويمكن لمسؤولي الفريق المحدد رؤية طلبات المؤسسة. لا تُدرج تفاصيل صحية للرياضيين أو ملفات خاصة.',
          )
        }}
      </p>
      <div class="ongoing-layout">
        <section class="form-stack">
          <label
            >{{ l('Show cases', 'عرض الطلبات')
            }}<select v-model="show">
              <option value="open">{{ l('Open', 'مفتوحة') }}</option>
              <option value="all">{{ l('All cases', 'كل الطلبات') }}</option>
            </select></label
          >
          <nav class="support-list" :aria-label="l('Support cases', 'طلبات الدعم')">
            <button
              v-for="c in cases.filter((c) => show === 'all' || c.state === 'open')"
              :key="c.id"
              :class="{ selected: c.id === selected }"
              @click="choose(c)"
            >
              <strong>{{ c.subject }}</strong
              ><span
                >{{ c.state === 'open' ? l('Open', 'مفتوح') : l('Resolved', 'محلول') }} ·
                {{ dateLabel(c.updated_at) }}</span
              >
            </button>
          </nav>
          <p v-if="!cases.length" class="notice">
            {{ l('No support requests yet.', 'لا توجد طلبات دعم بعد.') }}
          </p>
          <article v-if="current" class="panel support-detail">
            <span class="tag">{{
              current.state === 'open' ? l('Open', 'مفتوح') : l('Resolved', 'محلول')
            }}</span>
            <h2>{{ current.subject }}</h2>
            <p class="preserve-lines">{{ current.detail }}</p>
            <p v-if="current.reply" class="notice preserve-lines">{{ current.reply }}</p>
            <form
              v-if="current.team_id && adminTeams.includes(current.team_id)"
              class="form-stack"
              @submit.prevent="
                command.run('update_support_case', {
                  p_id: current!.id,
                  p_revision: current!.revision,
                  p_state: 'resolved',
                  p_reply: reply,
                })
              "
            >
              <label
                >{{ l('Response', 'الرد')
                }}<textarea
                  v-model="reply"
                  maxlength="4000"
                  rows="4"
                  required
                  :disabled="locked"
                ></textarea></label
              ><button class="button" :disabled="locked">
                {{ l('Respond and resolve', 'الرد والحل') }}
              </button>
            </form>
            <button
              v-if="current.reporter_id === user!.id"
              class="text-link"
              :disabled="locked"
              @click="
                command.run('update_support_case', {
                  p_id: current.id,
                  p_revision: current.revision,
                  p_state: current.state === 'open' ? 'resolved' : 'open',
                  p_reply: null,
                })
              "
            >
              {{
                current.state === 'open'
                  ? l('Mark resolved', 'تحديد كمحلول')
                  : l('Reopen request', 'إعادة فتح الطلب')
              }}
            </button>
          </article>
        </section>
        <form
          class="panel form-stack"
          @submit.prevent="
            command.run('create_support_case', {
              p_id: uuid(),
              p_team: team || null,
              p_subject: subject,
              p_detail: detail,
            })
          "
        >
          <h2>{{ l('New support request', 'طلب دعم جديد') }}</h2>
          <fieldset class="command-fields" :disabled="locked">
            <label
              >{{ l('Send request to', 'توجيه الطلب إلى')
              }}<select v-model="team">
                <option value="">
                  {{ l('Rafik support (local only)', 'دعم رفيق (محلي فقط)') }}
                </option>
                <option v-for="t in options" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select></label
            >
            <p v-if="team" class="small-print">
              {{
                l(
                  'Your selected team’s owners and admins can read this request and reply. Only include details you want to share with them.',
                  'يمكن لمالك الفريق المحدد ومديريه قراءة الطلب والرد. أدرج فقط التفاصيل التي تريد مشاركتها معهم.',
                )
              }}
            </p>
            <label
              >{{ l('Subject', 'الموضوع')
              }}<input v-model="subject" maxlength="120" required /></label
            ><label
              >{{ l('What happened?', 'ماذا حدث؟')
              }}<textarea v-model="detail" maxlength="4000" rows="6" required></textarea></label
            ><button class="button">{{ l('Save support request', 'حفظ طلب الدعم') }}</button>
          </fieldset>
        </form>
      </div></PageState
    >
  </div>
</template>
