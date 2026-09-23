<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UpcomingAppointments from '../appointments/UpcomingAppointments.vue'
import { rpc } from '../../lib/backend'
import { language as l, dateLabel, errorMessage } from '../../lib/i18n'
import type { AttentionPage, AttentionTask } from '../workspace/types'
import PageState from '../../components/PageState.vue'
const route = useRoute(),
  router = useRouter()
const search = ref(String(route.query.search || ''))
let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void router.replace({ query: { ...route.query, search: search.value || undefined } })
    void load()
  }, 180)
})
onUnmounted(() => clearTimeout(searchTimer))
const kind = ref(
  ['workout', 'checkin', 'message'].includes(String(route.query.view))
    ? String(route.query.view)
    : 'all',
)
const data = ref<AttentionPage>({ items: [], total: 0, clients: 0, plans: 0 })
const loading = ref(true),
  busy = ref(false),
  error = ref('')
let generation = 0
async function load(more = false) {
  const request = ++generation
  if (!more) loading.value = true
  busy.value = true
  error.value = ''
  const last = more ? data.value.items.at(-1) : undefined
  try {
    const result = await rpc<AttentionPage>('coach_attention', {
      p_kind: kind.value,
      p_search: search.value,
      p_after_time: last?.happened_at ?? null,
      p_after_key: last?.key ?? '',
      p_limit: 12,
    })
    if (request !== generation) return
    data.value = { ...result, items: more ? [...data.value.items, ...result.items] : result.items }
  } catch (e) {
    if (request === generation) error.value = errorMessage(e)
  } finally {
    if (request === generation) {
      loading.value = false
      busy.value = false
    }
  }
}
watch(kind, () => {
  void router.replace({ query: { ...route.query, view: kind.value } })
  void load()
})
const destination = (task: AttentionTask) =>
  task.kind === 'workout'
    ? '/coach/review/' + task.id
    : task.kind === 'checkin'
      ? '/coach/checkins/' + task.id
      : '/coach/messages/' + task.id
onMounted(() => load())
</script>
<template>
  <div class="container page daily-workspace">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Your coaching day', 'يومك التدريبي') }}</p>
        <h1>{{ l('A clear next step.', 'خطوة تالية واضحة.') }}</h1>
        <p>
          {{
            l('See who needs you. Keep their progress moving.', 'شاهد من يحتاجك وساعده على التقدم.')
          }}
        </p>
      </div>
      <RouterLink class="button secondary" to="/coach/clients#invite">{{
        l('Invite a client', 'دعوة متدرب')
      }}</RouterLink>
    </header>
    <PageState :loading="loading" :error="!data.items.length ? error : ''" @retry="load()">
      <div class="daily-grid">
        <section class="attention-panel">
          <div class="section-title">
            <h2>
              {{ l('Needs your attention', 'بحاجة إلى متابعتك') }}
              <span class="count">{{ data.total }}</span>
            </h2>
            <button class="text-link" :disabled="busy" @click="load()">
              {{ l('Refresh', 'تحديث') }}
            </button>
          </div>
          <label class="attention-search"
            >{{ l('Find a client or update', 'البحث عن متدرب أو مستجد')
            }}<input v-model="search" type="search" maxlength="100"
          /></label>
          <label class="attention-filter"
            >{{ l('Show', 'عرض')
            }}<select v-model="kind" :aria-label="l('Show', 'عرض')">
              <option value="all">{{ l('All updates', 'كل المستجدات') }}</option>
              <option value="workout">{{ l('Workout reviews', 'مراجعة الحصص') }}</option>
              <option value="checkin">{{ l('Check-in reviews', 'مراجعة المتابعات') }}</option>
              <option value="message">
                {{ l('Unread conversations', 'المحادثات غير المقروءة') }}
              </option>
            </select></label
          >
          <p class="small-print">
            {{
              l(
                'Oldest waiting first. Opening a review does not mark it complete.',
                'الأقدم انتظاراً أولاً. فتح المراجعة لا يُكملها.',
              )
            }}
          </p>
          <p v-if="error && data.items.length" class="notice error" role="alert">{{ error }}</p>
          <RouterLink
            v-for="task in data.items"
            :key="task.key"
            class="attention-row"
            :to="{
              path: destination(task),
              query: { from: 'today', view: kind, search: search || undefined },
            }"
          >
            <span class="avatar" aria-hidden="true">{{ task.name.slice(0, 1) }}</span>
            <div class="grow">
              <strong>{{ task.name }}</strong
              ><span>{{
                task.kind === 'message'
                  ? l('Unread messages', 'رسائل غير مقروءة') + ' · ' + task.unread
                  : task.title
              }}</span
              ><span v-if="task.detail" class="note-excerpt">{{ task.detail }}</span
              ><small
                >{{
                  task.kind === 'workout'
                    ? l('Workout to review', 'حصة للمراجعة')
                    : task.kind === 'checkin'
                      ? l('Check-in to review', 'متابعة للمراجعة')
                      : l('Reply in conversation', 'الرد في المحادثة')
                }}
                · {{ dateLabel(task.happened_at) }}</small
              >
            </div>
            <span aria-hidden="true">↗</span>
          </RouterLink>
          <div v-if="!data.items.length" class="workspace-empty">
            <h3>
              {{
                data.clients
                  ? l('You’re up to date.', 'أنت على اطلاع بكل جديد.')
                  : l('Your next client starts here.', 'متدربك التالي يبدأ من هنا.')
              }}
            </h3>
            <p>
              {{
                data.clients
                  ? l(
                      'New messages and submitted work will appear here.',
                      'ستظهر الرسائل الجديدة والحصص والمتابعات المقدّمة هنا.',
                    )
                  : l(
                      'Prepare a plan, preview the client experience, then share a personal invitation.',
                      'جهّز خطة وعاين تجربة المتدرب ثم شارك دعوة شخصية.',
                    )
              }}
            </p>
            <RouterLink
              v-if="!data.clients"
              class="button"
              :to="data.plans ? '/coach/plans' : '/coach/plans/new'"
              >{{ l('Prepare a plan', 'تجهيز خطة') }}</RouterLink
            >
          </div>
          <button
            v-if="data.items.length < data.total"
            class="button secondary"
            :disabled="busy"
            @click="load(true)"
          >
            {{ l('Show more updates', 'عرض مستجدات أخرى') }}
          </button>
        </section>
        <aside class="daily-aside">
          <div class="workspace-summary">
            <strong>{{ data.clients }}</strong
            ><span>{{ l('active clients', 'متدربون نشطون') }}</span
            ><RouterLink to="/coach/clients"
              >{{ l('Open your roster', 'عرض المتدربين') }} ↗</RouterLink
            >
          </div>
          <UpcomingAppointments coach /><RouterLink class="workspace-shortcut" to="/coach/plans"
            ><strong>{{ l('Prepare what comes next', 'جهّز الخطوة التالية') }}</strong
            ><span>{{ l('Open your plans', 'افتح خططك') }} ↗</span></RouterLink
          >
        </aside>
      </div>
    </PageState>
  </div>
</template>
