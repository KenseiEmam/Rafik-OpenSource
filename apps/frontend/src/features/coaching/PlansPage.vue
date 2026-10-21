<script setup lang="ts">
import ProgramCover from './ProgramCover.vue'
import OrganizationNav from '../organizations/OrganizationNav.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { PhPlus, PhArrowRight, PhBarbell } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { rows, request } from '../../lib/backend'
import { useRoute } from 'vue-router'
import { programContext } from './program-context'
const context = programContext(useRoute())
const offset = ref(0),
  total = ref(0)
let loadSequence = 0
import type { Plan, PlanVersion } from '../../lib/domain'
import { language, t, errorMessage, dateLabel } from '../../lib/i18n'
import ListPagination from '../../components/ListPagination.vue'
import PageState from '../../components/PageState.vue'
const search = ref('')
watch(search, () => {
  offset.value = 0
  if (context.workspace) void load(0, true)
})
const filtered = computed(() =>
  plans.value.filter(
    (p) => !p.archived && p.title.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()),
  ),
)
const plans = ref<Plan[]>([])
const versions = ref<PlanVersion[]>([])
const loading = ref(true)
const error = ref('')
async function load(page = offset.value, background = false) {
  const sequence = ++loadSequence
  if (!background) loading.value = true
  error.value = ''
  try {
    if (context.workspace) {
      const result = await request<{
        items: (Plan & { version?: PlanVersion })[]
        next: number | null
        total: number
      }>(
        `/v1/workspaces/${context.workspace}/programs?view=${context.view}&search=${encodeURIComponent(search.value)}&offset=${page}`,
      )
      if (sequence !== loadSequence) return
      plans.value = result.items
      versions.value = result.items.flatMap((p) =>
        p.version ? [{ ...p.version, plan_id: p.id }] : [],
      )
      total.value = result.total
      offset.value = page
    } else
      [plans.value, versions.value] = await Promise.all([
        rows<Plan>('plans', 'coach_id', user.value!.id),
        rows<PlanVersion>('plan_versions', 'coach_id', user.value!.id),
      ])
    plans.value.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  } catch (e) {
    if (sequence === loadSequence) error.value = errorMessage(e)
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}
onMounted(() => load())
onUnmounted(() => {
  loadSequence++
})
</script>
<template>
  <OrganizationNav v-if="context.workspace" />
  <div class="container page">
    <div class="page-heading heading-actions">
      <div>
        <p class="overline">{{ t('coaching') }}</p>
        <h1>{{ language('Programs', 'البرامج') }}</h1>
        <p>
          {{
            language(
              'Build once. Adapt thoughtfully. Keep completed training intact.',
              'ابنِ الخطة. عدّلها بعناية. واحتفظ بالتدريب المكتمل.',
            )
          }}
        </p>
      </div>
      <RouterLink v-if="context.view !== 'trainee'" class="button" :to="context.base + '/plans/new'"
        ><PhPlus :size="18" aria-hidden="true" />{{ t('newPlan') }}</RouterLink
      >
    </div>
    <div class="list-controls">
      <h2 class="list-section-label">{{ language('Library', 'المكتبة') }}</h2>
      <ListPagination
        :offset="offset"
        :page-size="context.workspace ? 24 : 12"
        :total="context.workspace ? total : filtered.length"
        :disabled="loading"
        @page="(page) => (context.workspace ? load(page) : (offset = page))"
      />
    </div>
    <PageState :loading="loading" :error="error" @retry="load()"
      ><label v-if="search || plans.some((p) => !p.archived)" class="plan-search"
        >{{ language('Find a plan', 'ابحث عن خطة')
        }}<input
          v-model="search"
          type="search"
          :placeholder="language('Search by title', 'ابحث بالعنوان')"
      /></label>
      <p v-if="search && !filtered.length" class="notice">
        {{
          language('No matching plans. Try another title.', 'لا توجد خطط مطابقة. جرّب عنواناً آخر.')
        }}
      </p>
      <div v-if="filtered.length" class="plans-grid">
        <RouterLink
          v-for="p in context.workspace ? filtered : filtered.slice(offset, offset + 12)"
          :key="p.id"
          :to="context.base + '/plans/' + p.id"
          class="plan-card panel"
          ><ProgramCover :id="p.draft.presentation?.cover" />
          <div class="plan-card-top">
            <PhBarbell :size="28" aria-hidden="true" /><span class="tag">{{
              versions.some((v) => v.plan_id === p.id && v.revision === p.draft_version)
                ? t('published')
                : t('draft')
            }}</span>
          </div>
          <h2>{{ p.title }}</h2>
          <p v-if="p.draft.presentation?.goal">{{ p.draft.presentation.goal }}</p>
          <p v-if="p.draft.presentation?.level">
            {{
              p.draft.presentation.level === 'beginner'
                ? language('Getting started', 'للمبتدئين')
                : p.draft.presentation.level === 'experienced'
                  ? language('Experienced', 'ذوو خبرة')
                  : language('Adaptable', 'قابل للتكييف')
            }}
          </p>
          <p v-if="p.listed" class="small-print">
            {{
              language(
                'Shared in the institution library. Coaches can assign it to athletes they are responsible for.',
                'تمت مشاركة البرنامج في مكتبة المؤسسة. يمكن للمدربين تعيينه للرياضيين المسؤولين عنهم.',
              )
            }}
          </p>
          <p>
            {{ p.draft.days.filter((d) => !d.restDay).length }} {{ language('sessions', 'حصص') }} ·
            {{ p.draft.cycleWeeks || 1 }} {{ language('week cycle', 'أسبوع للدورة') }}
            <span
              >{{ p.draft.days.reduce((n, d) => n + d.exercises.length, 0) }}
              {{ t('exercises') }}</span
            >
          </p>
          <div class="plan-card-bottom">
            <small>{{ language('Updated', 'تم التحديث') }} {{ dateLabel(p.updated_at) }}</small
            ><PhArrowRight :size="22" class="directional" aria-hidden="true" /></div
        ></RouterLink>
      </div>
      <section v-else-if="!search && context.view === 'trainee'" class="empty-state panel">
        <h2>{{ language('Your institution’s program library.', 'مكتبة برامج مؤسستك.') }}</h2>
        <p>
          {{
            language(
              'Programs appear here when your institution makes them available. Assigned training is in your Training workspace.',
              'تظهر البرامج عندما تتيحها مؤسستك. التدريب المعيّن موجود في مساحة التدريب.',
            )
          }}
        </p>
        <RouterLink class="button secondary" :to="context.base + '/training'">{{
          language('Open my training', 'فتح تدريبي')
        }}</RouterLink>
      </section>
      <section v-else-if="!search" class="empty-state panel">
        <h2>
          {{ language('No programs yet', 'لا توجد برامج بعد') }}
        </h2>
        <p>
          {{
            language(
              'Create a program using exercises from your institution library, then publish it when it is ready.',
              'أنشئ برنامجاً باستخدام تمارين مكتبة المؤسسة، ثم انشره عندما يصبح جاهزاً.',
            )
          }}
        </p>
        <RouterLink
          v-if="context.view !== 'trainee'"
          class="button"
          :to="context.base + '/plans/new'"
          >{{ t('newPlan') }}</RouterLink
        >
      </section>
    </PageState>
  </div>
</template>
