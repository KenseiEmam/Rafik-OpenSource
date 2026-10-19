<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { AthletePlanPage } from '@rafik/shared/contracts'
import { request } from '../../lib/backend'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import { formatDate } from '../../lib/dates'
import { locale } from '../../lib/i18n'
import OrganizationNav from './OrganizationNav.vue'
import type { Member, Sport } from './types'

/**
 * Staff athlete profile. Every section calls an existing authorized endpoint; hidden sections
 * are a convenience, never the permission boundary (the API refuses anything out of scope).
 */
const route = useRoute(),
  workspace = String(route.params.workspace),
  view = String(route.params.view),
  memberId = String(route.params.member),
  base = `/organization/${workspace}/${view}`,
  ws = `/v1/workspaces/${workspace}`
// Sections report refusals inline, so these reads never raise global error toasts.
const get = <T,>(path: string) => request<T>(path, { feedback: 'none' })
type Section<T> = { loading: boolean; error: string; denied: boolean; data?: T }
const section = <T,>() => ref<Section<T>>({ loading: true, error: '', denied: false })
const self = ref(''),
  member = ref<Member>(),
  names = ref<{ id: string; name: string }[]>([]),
  sports = ref<Sport[]>([]),
  overview = section<Member>(),
  plans = section<AthletePlanPage>(),
  sessions =
    section<
      { id: string; title: string; started_at: string; status: string; reviewed_at?: string }[]
    >(),
  assessments = section<{ event_id: string; title: string; starts_at: string }[]>(),
  nutrition = section<{
    current: { revision: number; effective_on: string; expires_on: string | null } | null
    sharing: { enabled: boolean }
    canReadDiary: boolean
  }>(),
  participation = section<
    | { kind: 'status'; participation: string; effective_from: string }
    | { kind: 'none' }
    | {
        kind: 'consent'
        ready: boolean
        age_group: string | null
        assented: boolean
        withdrawn: boolean
      }
  >()
// The role relation decides which sections to request; the server decides what is returned.
const relation = computed(() =>
  view === 'admin'
    ? 'admin'
    : member.value?.trainer_id === self.value
      ? 'primary'
      : member.value?.coaches?.some((c) => c.coach === self.value)
        ? 'supporting'
        : 'other',
)
const sportName = (id: string | null) => sports.value.find((s) => s.id === id)?.name || ''
const nameOf = (id: string | null) =>
  names.value.find((n) => n.id === id)?.name || l('Not assigned', 'غير معيّن')
const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)
async function fill<T>(target: { value: Section<T> }, load: () => Promise<T>) {
  target.value = { loading: true, error: '', denied: false }
  try {
    target.value = { loading: false, error: '', denied: false, data: await load() }
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    target.value = {
      loading: false,
      denied: status === 403,
      error: status === 403 ? '' : errorMessage(e),
    }
  }
}
async function load() {
  await fill(overview, async () => {
    const [workspaceView, people, list] = await Promise.all([
      get<{ self: { id: string } }>(`${ws}?view=${view}&summary=false`),
      get<{ selected: Member[]; names: { id: string; name: string }[] }>(
        `${ws}/people?view=${view}&role=trainee&state=all&selected=${memberId}`,
      ),
      get<{ items: Sport[] }>(`${ws}/sports?view=${view}`).catch(() => ({ items: [] })),
    ])
    self.value = workspaceView.self.id
    names.value = people.names
    sports.value = list.items
    const found = people.selected[0]
    if (!found) throw Object.assign(new Error('forbidden'), { statusCode: 403 })
    member.value = found
    return found
  })
  if (!member.value) return
  const jobs = [
    fill(plans, () =>
      get<AthletePlanPage>(`${ws}/athlete-plans?view=${view}&status=active&member=${memberId}`),
    ),
    fill(sessions, async () =>
      (
        await get<{ sessions: NonNullable<typeof sessions.value.data> }>(
          `${ws}/delivery?view=${view}&history=true&member=${memberId}`,
        )
      ).sessions.slice(0, 5),
    ),
    fill(assessments, async () =>
      (
        await get<{ items: NonNullable<typeof assessments.value.data> }>(
          `${ws}/assessment-history?view=${view}&member=${memberId}&from=${day(-90)}&to=${day(0)}`,
        )
      ).items.slice(0, 5),
    ),
  ]
  if (relation.value === 'admin' || relation.value === 'primary')
    jobs.push(
      fill(nutrition, () =>
        get<NonNullable<typeof nutrition.value.data>>(
          `${ws}/nutrition?view=${view}&member=${memberId}`,
        ),
      ),
    )
  if (relation.value === 'primary')
    jobs.push(
      fill(participation, async () => {
        const r = await get<{
          items: { athlete_member_id: string; participation: string; effective_from: string }[]
        }>(`${ws}/injuries?view=trainer`)
        const found = r.items.find((x) => x.athlete_member_id === memberId)
        return found ? { kind: 'status' as const, ...found } : { kind: 'none' as const }
      }),
    )
  else if (relation.value === 'admin')
    jobs.push(
      fill(participation, async () => {
        const r = await get<{
          members: {
            member_id: string
            ready: boolean
            age_group: string | null
            athlete_assented_at: string | null
            withdrawn_at: string | null
          }[]
        }>(`${ws}/injuries?view=admin`)
        const found = r.members.find((x) => x.member_id === memberId)
        return {
          kind: 'consent' as const,
          ready: !!found?.ready,
          age_group: found?.age_group || null,
          assented: !!found?.athlete_assented_at,
          withdrawn: !!found?.withdrawn_at,
        }
      }),
    )
  await Promise.all(jobs)
}
const showNutrition = computed(() => relation.value === 'admin' || relation.value === 'primary')
const showParticipation = computed(() => relation.value === 'admin' || relation.value === 'primary')
onMounted(load)
</script>
<template>
  <OrganizationNav />
  <div class="container page athlete-profile">
    <RouterLink class="back-link" :to="base + '/people'">{{
      l('Back to people', 'العودة إلى الأشخاص')
    }}</RouterLink>
    <p v-if="overview.loading" role="status">{{ l('Loading profile…', 'جارٍ تحميل الملف…') }}</p>
    <section v-else-if="overview.denied" class="empty-state panel">
      <h1>{{ l('This athlete is not available to you.', 'هذا الرياضي غير متاح لك.') }}</h1>
      <p>
        {{
          l(
            'Profiles are visible to administrators and to the athlete’s coaching team.',
            'تظهر الملفات للمسؤولين ولفريق تدريب الرياضي.',
          )
        }}
      </p>
    </section>
    <p v-else-if="overview.error" role="alert" class="notice error">
      {{ overview.error }}
      <button type="button" class="text-link" @click="load">
        {{ l('Retry', 'إعادة المحاولة') }}
      </button>
    </p>
    <template v-else-if="member">
      <header class="work-heading">
        <div>
          <p class="overline">{{ l('Athlete profile', 'ملف الرياضي') }}</p>
          <h1 dir="auto">{{ member.name }}</h1>
          <p v-if="relation === 'supporting'" class="small-print">
            {{
              l(
                'You support this athlete. You see their training plans and sessions for your sport, and assessments from events you staffed.',
                'أنت مدرب مساند لهذا الرياضي. تطّلع على خطط التدريب والحصص الخاصة برياضتك، والتقييمات من المواعيد التي أشرفت عليها.',
              )
            }}
          </p>
        </div>
        <RouterLink
          class="button secondary"
          :to="
            base +
            '/messages?to=' +
            encodeURIComponent(member.id) +
            '&title=' +
            encodeURIComponent(member.name)
          "
          >{{ l('Message', 'مراسلة') }}</RouterLink
        >
      </header>
      <nav class="profile-jump" :aria-label="l('Profile sections', 'أقسام الملف')">
        <a href="#profile-overview">{{ l('Overview', 'نظرة عامة') }}</a>
        <a href="#profile-plans">{{ l('Plans', 'الخطط') }}</a>
        <a href="#profile-sessions">{{ l('Sessions', 'الحصص') }}</a>
        <a href="#profile-assessments">{{ l('Assessments', 'التقييمات') }}</a>
        <a v-if="showNutrition" href="#profile-nutrition">{{ l('Nutrition', 'التغذية') }}</a>
        <a v-if="showParticipation" href="#profile-participation">{{
          l('Participation', 'المشاركة')
        }}</a>
      </nav>

      <section id="profile-overview" class="panel" aria-labelledby="overview-heading">
        <h2 id="overview-heading">{{ l('Overview', 'نظرة عامة') }}</h2>
        <dl class="profile-facts">
          <div>
            <dt>{{ l('Membership', 'العضوية') }}</dt>
            <dd>{{ member.active ? l('Active', 'نشطة') : l('Inactive', 'غير نشطة') }}</dd>
          </div>
          <div>
            <dt>{{ l('Primary coach', 'المدرب الأساسي') }}</dt>
            <dd dir="auto">{{ nameOf(member.trainer_id) }}</dd>
          </div>
          <div>
            <dt>{{ l('Supporting coaches', 'المدربون المساندون') }}</dt>
            <dd dir="auto">
              {{
                (member.coaches || [])
                  .filter((c) => c.kind === 'supporting')
                  .map((c) => nameOf(c.coach) + ' · ' + sportName(c.sport))
                  .join('، ') || l('None', 'لا يوجد')
              }}
            </dd>
          </div>
          <div>
            <dt>{{ l('Sports', 'الرياضات') }}</dt>
            <dd>
              <span v-if="!member.sports?.length">{{ l('None', 'لا يوجد') }}</span>
              <span v-for="id in member.sports" :key="id" class="tag" dir="auto">{{
                sportName(id)
              }}</span>
            </dd>
          </div>
        </dl>
      </section>

      <section id="profile-plans" class="panel" aria-labelledby="plans-heading">
        <div class="heading-actions">
          <h2 id="plans-heading">{{ l('Active plans', 'الخطط النشطة') }}</h2>
          <RouterLink class="text-link" :to="base + '/training?member=' + member.id">{{
            l('All plans', 'جميع الخطط')
          }}</RouterLink>
        </div>
        <p v-if="plans.loading" role="status">{{ l('Loading…', 'جارٍ التحميل…') }}</p>
        <p v-else-if="plans.denied" class="small-print">
          {{ l('Not available for your role.', 'غير متاح لدورك.') }}
        </p>
        <p v-else-if="plans.error" role="alert" class="notice error">{{ plans.error }}</p>
        <p v-else-if="!plans.data?.items.length" class="small-print">
          {{ l('No active plans.', 'لا توجد خطط نشطة.') }}
        </p>
        <ul v-else class="profile-list">
          <li v-for="plan in plans.data.items" :key="plan.id">
            <strong dir="auto">{{ plan.version.title }}</strong>
            <span v-if="plan.goal || plan.sport" class="tag" dir="auto">{{
              [plan.goal, plan.sport].filter(Boolean).join(' · ')
            }}</span>
            <small
              >{{ formatDate(plan.start_date, locale) }} —
              {{
                plan.end_date
                  ? formatDate(plan.end_date, locale)
                  : l('No end date', 'دون تاريخ انتهاء')
              }}</small
            >
          </li>
        </ul>
      </section>

      <section id="profile-sessions" class="panel" aria-labelledby="sessions-heading">
        <div class="heading-actions">
          <h2 id="sessions-heading">{{ l('Recent sessions', 'الحصص الأخيرة') }}</h2>
          <RouterLink class="text-link" :to="base + '/session-history?member=' + member.id">{{
            l('Session history', 'سجل الحصص')
          }}</RouterLink>
        </div>
        <p v-if="sessions.loading" role="status">{{ l('Loading…', 'جارٍ التحميل…') }}</p>
        <p v-else-if="sessions.denied" class="small-print">
          {{ l('Not available for your role.', 'غير متاح لدورك.') }}
        </p>
        <p v-else-if="sessions.error" role="alert" class="notice error">{{ sessions.error }}</p>
        <p v-else-if="!sessions.data?.length" class="small-print">
          {{ l('No recorded sessions yet.', 'لا توجد حصص مسجلة بعد.') }}
        </p>
        <ul v-else class="profile-list">
          <li v-for="s in sessions.data" :key="s.id">
            <RouterLink :to="base + '/review/' + s.id" dir="auto">{{ s.title }}</RouterLink>
            <small
              >{{ dateLabel(s.started_at) }} ·
              {{
                s.status === 'completed'
                  ? s.reviewed_at
                    ? l('Reviewed', 'تمت المراجعة')
                    : l('Completed', 'مكتملة')
                  : l('In progress', 'قيد التنفيذ')
              }}</small
            >
          </li>
        </ul>
      </section>

      <section id="profile-assessments" class="panel" aria-labelledby="assessments-heading">
        <div class="heading-actions">
          <h2 id="assessments-heading">{{ l('Assessments (90 days)', 'التقييمات (٩٠ يوماً)') }}</h2>
          <RouterLink class="text-link" :to="base + '/assessments/' + member.id">{{
            l('Assessment history', 'سجل التقييمات')
          }}</RouterLink>
        </div>
        <p v-if="assessments.loading" role="status">{{ l('Loading…', 'جارٍ التحميل…') }}</p>
        <p v-else-if="assessments.denied" class="small-print">
          {{ l('Not available for your role.', 'غير متاح لدورك.') }}
        </p>
        <p v-else-if="assessments.error" role="alert" class="notice error">
          {{ assessments.error }}
        </p>
        <p v-else-if="!assessments.data?.length" class="small-print">
          {{ l('No assessment results in this period.', 'لا توجد نتائج تقييم في هذه الفترة.') }}
        </p>
        <ul v-else class="profile-list">
          <li v-for="a in assessments.data" :key="a.event_id">
            <strong dir="auto">{{ a.title }}</strong
            ><small>{{ dateLabel(a.starts_at) }}</small>
          </li>
        </ul>
      </section>

      <section
        v-if="showNutrition"
        id="profile-nutrition"
        class="panel"
        aria-labelledby="nutrition-heading"
      >
        <div class="heading-actions">
          <h2 id="nutrition-heading">{{ l('Nutrition', 'التغذية') }}</h2>
          <RouterLink class="text-link" :to="base + '/nutrition?member=' + member.id">{{
            l('Open nutrition', 'فتح التغذية')
          }}</RouterLink>
        </div>
        <p v-if="nutrition.loading" role="status">{{ l('Loading…', 'جارٍ التحميل…') }}</p>
        <p v-else-if="nutrition.denied" class="small-print">
          {{ l('Not available for your role.', 'غير متاح لدورك.') }}
        </p>
        <p v-else-if="nutrition.error" role="alert" class="notice error">{{ nutrition.error }}</p>
        <template v-else-if="nutrition.data">
          <p>
            {{
              nutrition.data.current
                ? l('Current plan: version ', 'الخطة الحالية: النسخة ') +
                  nutrition.data.current.revision
                : l('No current nutrition plan.', 'لا توجد خطة تغذية حالية.')
            }}
          </p>
          <p class="small-print">
            {{
              nutrition.data.canReadDiary
                ? l(
                    'The athlete shares their meal diary with staff.',
                    'يشارك الرياضي سجل وجباته مع الطاقم.',
                  )
                : l(
                    'The athlete has not shared their meal diary. Recorded meals stay private.',
                    'لم يشارك الرياضي سجل وجباته. تبقى الوجبات المسجلة خاصة.',
                  )
            }}
          </p>
        </template>
      </section>

      <section
        v-if="showParticipation"
        id="profile-participation"
        class="panel"
        aria-labelledby="participation-heading"
      >
        <h2 id="participation-heading">{{ l('Participation status', 'حالة المشاركة') }}</h2>
        <p v-if="participation.loading" role="status">{{ l('Loading…', 'جارٍ التحميل…') }}</p>
        <p v-else-if="participation.denied" class="small-print">
          {{ l('Not available for your role.', 'غير متاح لدورك.') }}
        </p>
        <p v-else-if="participation.error" role="alert" class="notice error">
          {{ participation.error }}
        </p>
        <template v-else-if="participation.data?.kind === 'status'">
          <p>
            <strong>{{
              participation.data.participation === 'unavailable'
                ? l('Unavailable', 'غير متاح')
                : l('Modified participation', 'مشاركة معدّلة')
            }}</strong>
            · {{ l('from', 'منذ') }} {{ formatDate(participation.data.effective_from, locale) }}
          </p>
          <p class="small-print">
            {{
              l(
                'Recorded by the athlete. This is not a medical assessment or clearance.',
                'سجّلها الرياضي. هذه ليست تقييماً طبياً أو إذناً بالمشاركة.',
              )
            }}
          </p>
        </template>
        <p v-else-if="participation.data?.kind === 'none'" class="small-print">
          {{
            l(
              'No active participation restriction is shared with you.',
              'لا توجد قيود مشاركة نشطة مشتركة معك.',
            )
          }}
        </p>
        <template v-else-if="participation.data?.kind === 'consent'">
          <p>
            {{
              participation.data.ready
                ? l('Consent setup is complete.', 'اكتمل إعداد الموافقة.')
                : l('Consent setup is not complete.', 'لم يكتمل إعداد الموافقة.')
            }}
            {{
              participation.data.withdrawn
                ? l('The athlete has withdrawn.', 'انسحب الرياضي.')
                : participation.data.assented
                  ? l('The athlete has assented.', 'وافق الرياضي.')
                  : l('Awaiting athlete assent.', 'بانتظار موافقة الرياضي.')
            }}
          </p>
          <p class="small-print">
            {{
              l(
                'Administrators manage consent setup only; participation records stay with the athlete and their primary coach.',
                'يدير المسؤولون إعداد الموافقة فقط؛ تبقى سجلات المشاركة لدى الرياضي ومدربه الأساسي.',
              )
            }}
          </p>
        </template>
      </section>
    </template>
  </div>
</template>
<style scoped>
.athlete-profile {
  max-width: 980px;
}
.athlete-profile .panel {
  margin-bottom: 20px;
  scroll-margin-top: 80px;
}
.profile-jump {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0 0 20px;
}
.profile-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px 24px;
  margin: 0;
}
.profile-facts dt {
  font-size: 0.8rem;
  color: var(--muted);
}
.profile-facts dd {
  margin: 4px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  overflow-wrap: anywhere;
}
.profile-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}
.profile-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.profile-list small {
  color: var(--muted);
}
</style>
