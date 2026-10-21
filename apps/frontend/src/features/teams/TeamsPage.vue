<script setup lang="ts">
import PageHeading from '../../components/PageHeading.vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { rows, rpc } from '../../lib/backend'
import { language as l, errorMessage } from '../../lib/i18n'
import { useCommand } from './commands'
import type { Team, Enrollment } from './types'
import CommandStatus from './CommandStatus.vue'
import PageState from '../../components/PageState.vue'
const cryptoId = () => crypto.randomUUID()
const coach = useRoute().path.startsWith('/coach'),
  router = useRouter()
const teams = ref<Team[]>([]),
  enrollments = ref<Enrollment[]>([]),
  loading = ref(true),
  error = ref(''),
  name = ref(''),
  confirmation = ref('')
async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[teams.value, enrollments.value] = await Promise.all([
      rows<Team>('teams'),
      rpc<Enrollment[]>('my_team_enrollments'),
    ])
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const command = useCommand('teams', async (kind, result) => {
  if (kind === 'create_team') await router.push('/coach/teams/' + (result as Team).id)
  else await load()
})
const respond = (e: Enrollment, accept: boolean) =>
  command.run('respond_team_client', { p_id: e.id, p_revision: e.revision, p_accept: accept })
onMounted(load)
</script>
<template>
  <div class="container page">
    <RouterLink class="back-link" :to="coach ? '/coach/more' : '/more'"
      >← {{ l('More tools', 'أدوات إضافية') }}</RouterLink
    >
    <PageHeading class="page-heading"
      ><div>
        <h1>{{ l('Teams', 'الفرق') }}</h1>
        <p>
          {{
            coach
              ? l(
                  'Work together when you need to. Solo coaching stays simple.',
                  'تعاون عند الحاجة. يبقى التدريب الفردي بسيطاً.',
                )
              : l(
                  'Choose the people who help with your training.',
                  'اختر الأشخاص الذين يدعمون تدريبك.',
                )
          }}
        </p>
      </div></PageHeading
    >
    <CommandStatus :command="command" /><PageState :loading="loading" :error="error" @retry="load"
      ><div class="ongoing-layout">
        <section class="form-stack">
          <nav v-if="teams.length" class="service-links" :aria-label="l('Your teams', 'فرقك')">
            <RouterLink v-for="t in teams" :key="t.id" :to="'/coach/teams/' + t.id"
              ><strong>{{ t.name }}</strong
              ><span aria-hidden="true">↗</span></RouterLink
            >
          </nav>
          <p v-else-if="coach" class="notice">
            {{
              l(
                'No team setup is required to coach. Create one only when you want to work with other people.',
                'لا تحتاج لإعداد فريق للتدريب. أنشئ فريقاً فقط عندما ترغب بالعمل مع الآخرين.',
              )
            }}
          </p>
          <article v-for="e in enrollments" :key="e.id" class="panel team-enrollment">
            <span class="tag">{{
              e.state === 'pending'
                ? l('Your approval needed', 'بانتظار موافقتك')
                : l('Active team', 'فريق نشط')
            }}</span>
            <h2>{{ e.team_name }}</h2>
            <p>{{ l('Current coach', 'المدرب الحالي') }}: {{ e.coach_name }}</p>
            <template v-if="e.state === 'pending'"
              ><p>
                {{
                  l(
                    'Team owners and admins will see your name and assigned coach. Your private coaching records stay with the people already involved.',
                    'سيرى مالك الفريق ومديروه اسمك ومدربك المكلّف. تبقى سجلات التدريب الخاصة مع الأشخاص المعنيين بها.',
                  )
                }}
              </p>
              <div class="actions">
                <button
                  class="button"
                  :disabled="command.state.busy || !!command.state.pending"
                  @click="respond(e, true)"
                >
                  {{ l('Join this team', 'الانضمام لهذا الفريق') }}</button
                ><button
                  class="text-link"
                  :disabled="command.state.busy || !!command.state.pending"
                  @click="respond(e, false)"
                >
                  {{ l('Decline invitation', 'رفض الدعوة') }}
                </button>
              </div></template
            >
            <template v-else-if="e.pending_coach_id"
              ><h3>{{ l('Proposed coach', 'المدرب المقترح') }}: {{ e.pending_name }}</h3>
              <p>
                {{
                  l(
                    'Accepting copies your current plan and schedule to this coach and replaces any future plan you already have with them. Started workouts and history stay intact. Private messages and coach notes are not copied. Future appointments and unanswered forms with the previous coach are cancelled.',
                    'ينقل القبول نسخة من خطتك وجدولك إلى هذا المدرب ويستبدل خطتك المستقبلية معه إن وجدت. تبقى الحصص التي بدأت والسجل محفوظة. لا تُنقل الرسائل والملاحظات الخاصة. تُلغى المواعيد المستقبلية والنماذج غير المجابة مع المدرب السابق.',
                  )
                }}
              </p>
              <div class="actions">
                <button
                  class="button"
                  :disabled="command.state.busy || !!command.state.pending"
                  @click="respond(e, true)"
                >
                  {{ l('Approve coach change', 'الموافقة على تغيير المدرب') }}</button
                ><button
                  class="text-link"
                  :disabled="command.state.busy || !!command.state.pending"
                  @click="respond(e, false)"
                >
                  {{ l('Keep my current coach', 'إبقاء مدربي الحالي') }}
                </button>
              </div></template
            >
            <button
              v-if="e.state === 'active' && confirmation !== e.id"
              class="text-link"
              @click="confirmation = e.id"
            >
              {{ l('Leave team roster', 'مغادرة قائمة الفريق') }}
            </button>
            <div v-if="confirmation === e.id" class="notice">
              <p>
                {{
                  l(
                    'This removes your team enrollment. Your direct coaching relationship and training history remain.',
                    'يزيل هذا انضمامك للفريق. تبقى علاقة التدريب المباشرة وسجلك محفوظين.',
                  )
                }}
              </p>
              <button
                class="button small secondary"
                :disabled="command.state.busy || !!command.state.pending"
                @click="command.run('close_team_client', { p_id: e.id, p_revision: e.revision })"
              >
                {{ l('Confirm leaving', 'تأكيد المغادرة') }}</button
              ><button class="text-link" @click="confirmation = ''">
                {{ l('Keep enrollment', 'إبقاء الانضمام') }}
              </button>
            </div>
          </article>
          <p v-if="!coach && !enrollments.length" class="notice">
            {{
              l(
                'No team invitations or coach changes need your attention.',
                'لا توجد دعوات فرق أو تغييرات مدرب تحتاج انتباهك.',
              )
            }}
          </p>
        </section>
        <form
          v-if="coach"
          class="panel form-stack"
          @submit.prevent="command.run('create_team', { p_id: cryptoId(), p_name: name })"
        >
          <h2>{{ l('Create a team', 'إنشاء فريق') }}</h2>
          <fieldset
            :disabled="command.state.busy || !!command.state.pending || !command.state.ready"
          >
            <label
              >{{ l('Team name', 'اسم الفريق') }}<input v-model="name" required maxlength="100"
            /></label>
            <p>
              {{
                l(
                  'Start with a name. Invite staff and add athletes only when you are ready.',
                  'ابدأ باسم. ادعُ الموظفين وأضف المتدربين عندما تكون جاهزاً.',
                )
              }}
            </p>
            <button class="button">{{ l('Create team', 'إنشاء الفريق') }}</button>
          </fieldset>
        </form>
      </div></PageState
    >
  </div>
</template>
