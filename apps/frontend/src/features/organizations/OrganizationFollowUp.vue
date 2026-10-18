<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { programContext } from '../coaching/program-context'
import { profile } from '../../app/auth'
import { localDate } from '../../lib/dates'
import { request } from '../../lib/backend'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
const context = programContext(useRoute()),
  loading = ref(true),
  error = ref('')
type Result = {
  missed: {
    total: number
    items: { id: string; member_id: string; name: string; title: string; starts_at: string }[]
  }
  reviews: {
    total: number
    items: { id: string; name: string; title: string; completed_at: string }[]
  }
  outcomes: { total: number; items: { id: string; title: string; ends_at: string }[] }
  unplanned: { total: number; items: { id: string; name: string }[] }
}
const data = ref<Result>()
const queue = ref<{
  items: {
    id: string
    title: string
    trainer_name: string
    due_date: string | null
    priority: string
  }[]
  counts: { open: number; overdue: number }
}>()
let disposed = false
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [result, tasks] = await Promise.all([
      request<Result>(`/v1/workspaces/${context.workspace}/follow-up?view=${context.view}`),
      request<NonNullable<typeof queue.value>>(
        `/v1/workspaces/${context.workspace}/tasks?view=${context.view}&today=${localDate(profile.value?.timezone || 'UTC')}`,
      ),
    ])
    if (!disposed) {
      data.value = result
      queue.value = tasks
    }
  } catch (e) {
    if (!disposed) error.value = errorMessage(e)
  } finally {
    if (!disposed) loading.value = false
  }
}
onMounted(load)
onUnmounted(() => {
  disposed = true
})
</script>
<template>
  <section class="daily-followup" aria-labelledby="follow-up-title">
    <div class="section-heading">
      <div>
        <h2 id="follow-up-title">{{ l('Needs follow-up', 'بحاجة إلى متابعة') }}</h2>
        <p class="small-print">
          {{
            l(
              'Recorded work that needs a clear next step.',
              'عمل مسجّل يحتاج إلى خطوة تالية واضحة.',
            )
          }}
        </p>
      </div>
      <RouterLink class="button secondary small" :to="context.base + '/tasks'">{{
        context.view === 'admin'
          ? l('Assign trainer tasks', 'تعيين مهام المدربين')
          : l('My tasks', 'مهامي')
      }}</RouterLink>
    </div>
    <p v-if="loading" role="status">{{ l('Checking recent activity…', 'جارٍ مراجعة النشاط…') }}</p>
    <p v-if="error" class="notice error" role="alert">
      {{ error }}
      <button class="text-link" @click="load">{{ l('Retry', 'إعادة المحاولة') }}</button>
    </p>
    <section v-if="queue" class="panel overview-task-queue">
      <h3>
        {{
          context.view === 'admin'
            ? l('Team task queue', 'قائمة مهام الفريق')
            : l('Your task queue', 'قائمة مهامك')
        }}
        · {{ queue.counts.open }}
      </h3>
      <p class="small-print" v-if="!queue.items.length">
        {{ l('No open tasks.', 'لا توجد مهام مفتوحة.') }}
      </p>
      <ul>
        <li v-for="task in queue.items.slice(0, 3)" :key="task.id">
          <RouterLink :to="context.base + '/tasks'"
            ><strong>{{ task.title }}</strong
            ><small
              >{{ task.trainer_name }} ·
              {{
                task.due_date
                  ? dateLabel(task.due_date.slice(0, 10))
                  : l('No due date', 'دون موعد نهائي')
              }}{{
                task.priority === 'high' ? ' · ' + l('High priority', 'أولوية عالية') : ''
              }}</small
            ></RouterLink
          >
        </li>
      </ul>
      <RouterLink v-if="queue.counts.open > 3" class="text-link" :to="context.base + '/tasks'">{{
        l('All tasks', 'كل المهام')
      }}</RouterLink>
    </section>
    <div v-if="data" class="followup-columns">
      <section class="panel">
        <h3>
          {{ l('Missed sessions to follow up', 'جلسات فائتة للمتابعة') }}
          <span class="count">{{ data.missed.total }}</span>
        </h3>
        <p class="small-print">
          {{
            l(
              'Review with the trainee before arranging a replacement. A missed session does not automatically grant a free session.',
              'راجع مع المتدرب قبل ترتيب جلسة بديلة. الجلسة الفائتة لا تمنح جلسة مجانية تلقائياً.',
            )
          }}
        </p>
        <p v-if="!data.missed.total" class="small-print">
          {{ l('No missed sessions awaiting a replacement.', 'لا توجد جلسات فائتة بانتظار بديل.') }}
        </p>
        <ul>
          <li v-for="s in data.missed.items" :key="s.id + s.member_id">
            <RouterLink
              :to="context.base + '/calendar/new?makeup=' + s.id + '&member=' + s.member_id"
              ><strong>{{ s.name }}</strong
              ><span>{{ s.title }}</span
              ><small>{{ l('Arrange a replacement', 'ترتيب جلسة بديلة') }}</small></RouterLink
            >
          </li>
        </ul>
        <RouterLink
          v-if="data.missed.total > 8"
          class="text-link"
          :to="context.base + '/calendar'"
          >{{ l('Open calendar', 'فتح التقويم') }}</RouterLink
        >
      </section>
      <section class="panel">
        <h3>
          {{ l('Training to review', 'تدريب للمراجعة') }}
          <span class="count">{{ data.reviews.total }}</span>
        </h3>
        <p v-if="!data.reviews.total" class="small-print">
          {{
            l('No completed training awaiting feedback.', 'لا يوجد تدريب مكتمل بانتظار الملاحظات.')
          }}
        </p>
        <ul>
          <li v-for="s in data.reviews.items" :key="s.id">
            <RouterLink :to="context.base + '/review/' + s.id"
              ><strong>{{ s.name }}</strong
              ><span>{{ s.title }}</span
              ><small
                >{{ l('Completed', 'اكتمل') }} {{ dateLabel(s.completed_at) }}</small
              ></RouterLink
            >
          </li>
        </ul>
        <RouterLink
          v-if="data.reviews.total > 8"
          class="text-link"
          :to="context.base + '/session-history'"
          >{{ l('Session history', 'سجل الحصص') }}</RouterLink
        >
      </section>
      <section class="panel">
        <h3>
          {{ l('Session outcomes needed', 'حصص تحتاج إلى نتيجة') }}
          <span class="count">{{ data.outcomes.total }}</span>
        </h3>
        <p class="small-print">
          {{
            l(
              'Past bookings still marked scheduled. Confirm what happened before arranging a replacement.',
              'مواعيد سابقة ما زالت مجدولة. أكد ما حدث قبل ترتيب حصة بديلة.',
            )
          }}
        </p>
        <p v-if="!data.outcomes.total" class="small-print">
          {{ l('No past bookings to resolve.', 'لا توجد مواعيد سابقة تحتاج إلى تحديث.') }}
        </p>
        <ul>
          <li v-for="s in data.outcomes.items" :key="s.id">
            <RouterLink :to="context.base + '/calendar/' + s.id"
              ><strong>{{ s.title }}</strong
              ><small>{{ dateLabel(s.ends_at) }}</small></RouterLink
            >
          </li>
        </ul>
        <RouterLink
          v-if="data.outcomes.total > 8"
          class="text-link"
          :to="context.base + '/calendar'"
          >{{ l('Open calendar', 'فتح التقويم') }}</RouterLink
        >
      </section>
      <section class="panel">
        <h3>
          {{ l('Trainees without a plan', 'متدربون بلا خطة') }}
          <span class="count">{{ data.unplanned.total }}</span>
        </h3>
        <p v-if="!data.unplanned.total" class="small-print">
          {{ l('Every active trainee has a program assignment.', 'لكل متدرب نشط تكليف ببرنامج.') }}
        </p>
        <ul>
          <li v-for="m in data.unplanned.items" :key="m.id">
            <RouterLink :to="context.base + '/training?member=' + m.id"
              ><strong>{{ m.name }}</strong
              ><small>{{
                l('Review their training and choose a program', 'راجع التدريب واختر برنامجاً')
              }}</small></RouterLink
            >
          </li>
        </ul>
        <RouterLink
          v-if="data.unplanned.total > 8"
          class="text-link"
          :to="context.base + '/people'"
          >{{ l('Open people', 'فتح الأشخاص') }}</RouterLink
        >
      </section>
    </div>
  </section>
</template>
<style scoped>
.overview-task-queue {
  margin-block: 1rem;
}
.overview-task-queue ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.overview-task-queue li + li {
  border: 0;
}
@media (max-width: 760px) {
  .overview-task-queue ul {
    grid-template-columns: minmax(0, 1fr);
  }
}
.daily-followup {
  margin-block: 1.5rem;
}
.followup-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.followup-columns > .panel {
  margin: 0;
  min-width: 0;
}
h3 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  font-size: 1rem;
}
.count {
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}
ul {
  list-style: none;
  padding: 0;
  max-height: 320px;
  overflow: auto;
}
li + li {
  border-top: 1px solid var(--line);
}
li a {
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem 0;
  overflow-wrap: anywhere;
}
li span,
li small {
  color: var(--muted);
  font-size: 0.85rem;
}
@media (max-width: 1000px) {
  .followup-columns {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
