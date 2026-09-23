<script setup lang="ts">
import UpcomingAppointments from '../appointments/UpcomingAppointments.vue'
import CoachingActivity from '../ongoing/CoachingActivity.vue'
import { computed, onMounted, ref } from 'vue'
import { PhArrowRight, PhCheckCircle, PhPlus, PhNotebook } from '@phosphor-icons/vue'
import { user, profile } from '../../app/auth'
import { rows } from '../../lib/backend'
import { type Session, type Profile, type Relationship, type Plan } from '../../lib/domain'
import { language, t, errorMessage, dateLabel } from '../../lib/i18n'
import PageState from '../../components/PageState.vue'
const sessions = ref<Session[]>([])
const people = ref<Profile[]>([])
const relationships = ref<Relationship[]>([])
const plans = ref<Plan[]>([])
const loading = ref(true)
const error = ref('')
const reviewLimit = ref(8)
const awaiting = computed(() =>
  sessions.value
    .filter((s) => s.status === 'completed' && !s.reviewed_at)
    .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || '')),
)
const done = computed(() => sessions.value.filter((s) => s.status === 'completed').length)
async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[sessions.value, people.value, relationships.value, plans.value] = await Promise.all([
      rows<Session>('sessions', 'coach_id', user.value!.id),
      rows<Profile>('profiles'),
      rows<Relationship>('coach_clients', 'coach_id', user.value!.id),
      rows<Plan>('plans', 'coach_id', user.value!.id),
    ])
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="container page">
    <div class="page-heading heading-actions">
      <div>
        <p class="overline">{{ t('coaching') }}</p>
        <h1>
          {{ language('Good to see you,', 'أهلاً بك،') }}
          {{ profile?.display_name?.split(' ')[0] || language('coach', 'مدرب') }}.
        </h1>
        <p>
          {{
            language(
              'See what happened. Help with what comes next.',
              'شاهد ما تم إنجازه. وساعد في الخطوة التالية.',
            )
          }}
        </p>
      </div>
      <RouterLink class="button" to="/coach/clients"
        ><PhPlus :size="18" aria-hidden="true" />{{ t('invite') }}</RouterLink
      >
    </div>
    <PageState :loading="loading" :error="error" @retry="load"
      ><div class="coach-stats">
        <div>
          <span>{{ language('Active clients', 'المتدربون النشطون') }}</span
          ><strong>{{ relationships.filter((c) => c.state === 'active').length }}</strong>
        </div>
        <div>
          <span>{{ language('Sessions completed', 'الحصص المكتملة') }}</span
          ><strong>{{ done }}</strong>
        </div>
        <div>
          <span>{{ language('Ready for review', 'جاهز للمراجعة') }}</span
          ><strong>{{ awaiting.length }}</strong>
        </div>
      </div>
      <CoachingActivity coach />
      <UpcomingAppointments coach />
      <div class="coach-home-layout">
        <section class="review-section">
          <div class="section-title">
            <h2>{{ language('Your review list', 'قائمة المراجعة') }}</h2>
            <span v-if="awaiting.length" class="count">{{ awaiting.length }}</span>
          </div>
          <div v-if="awaiting.length" class="review-list">
            <RouterLink
              v-for="s in awaiting.slice(0, reviewLimit)"
              :key="s.id"
              class="review-row"
              :to="'/coach/review/' + s.id"
              ><span class="avatar">{{
                people.find((p) => p.id === s.client_id)?.display_name.slice(0, 1)
              }}</span>
              <div class="grow">
                <h3>{{ people.find((p) => p.id === s.client_id)?.display_name }}</h3>
                <p>
                  {{ s.prescription.name }}
                  <span class="subtle">{{ dateLabel(s.completed_at!) }}</span>
                </p>
                <p v-if="s.note" class="note-excerpt">“{{ s.note }}”</p>
              </div>
              <PhArrowRight :size="22" class="directional" aria-hidden="true"
            /></RouterLink>
          </div>
          <div v-else class="empty-review">
            <PhCheckCircle :size="44" weight="light" aria-hidden="true" />
            <h3>
              {{
                relationships.length
                  ? t('allCaughtUp')
                  : language(
                      'Your first client result will appear here.',
                      'ستظهر أول نتيجة لمتدرب هنا.',
                    )
              }}
            </h3>
            <p>
              {{
                language(
                  'Completed sessions come here for a quick review and a useful reply.',
                  'تظهر الحصص المكتملة هنا لمراجعة سريعة ورد مفيد.',
                )
              }}
            </p>
          </div>
          <button
            v-if="awaiting.length > reviewLimit"
            class="button secondary"
            @click="reviewLimit += 8"
          >
            {{ language('Show more sessions', 'عرض حصص أخرى') }}
          </button>
        </section>
        <aside class="panel coach-next">
          <PhNotebook :size="30" class="accent-icon" aria-hidden="true" />
          <h2>
            {{
              plans.length
                ? language('A good plan is a starting point.', 'الخطة الجيدة نقطة البداية.')
                : language('Start with something useful.', 'ابدأ بشيء مفيد.')
            }}
          </h2>
          <p>
            {{
              language(
                'Use the full-body starter, adjust the details, and preview exactly what your client will see.',
                'استخدم خطة كامل الجسم، وعدّل التفاصيل، وعاين ما سيشاهده متدربك.',
              )
            }}
          </p>
          <RouterLink
            class="button secondary full"
            :to="plans.length ? '/coach/plans' : '/coach/plans/new'"
            >{{
              plans.length
                ? language('Open your plans', 'افتح خططك')
                : language('Make your first plan', 'أنشئ خطتك الأولى')
            }}<PhArrowRight :size="18" class="directional" aria-hidden="true"
          /></RouterLink>
        </aside></div
    ></PageState>
  </div>
</template>
