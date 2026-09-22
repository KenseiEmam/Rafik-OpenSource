<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { PhPlus, PhArrowRight, PhBarbell } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { rows } from '../../lib/backend'
import type { Plan, PlanVersion } from '../../lib/domain'
import { language, t, errorMessage, dateLabel } from '../../lib/i18n'
import PageState from '../../components/PageState.vue'
const plans = ref<Plan[]>([])
const versions = ref<PlanVersion[]>([])
const loading = ref(true)
const error = ref('')
async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[plans.value, versions.value] = await Promise.all([
      rows<Plan>('plans', 'coach_id', user.value!.id),
      rows<PlanVersion>('plan_versions', 'coach_id', user.value!.id),
    ])
    plans.value.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
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
        <h1>{{ language('Plans with a clear purpose.', 'خطط بهدف واضح.') }}</h1>
        <p>
          {{
            language(
              'Build once. Adapt thoughtfully. Keep completed training intact.',
              'ابنِ الخطة. عدّلها بعناية. واحتفظ بالتدريب المكتمل.',
            )
          }}
        </p>
      </div>
      <RouterLink class="button" to="/coach/plans/new"
        ><PhPlus :size="18" aria-hidden="true" />{{ t('newPlan') }}</RouterLink
      >
    </div>
    <PageState :loading="loading" :error="error" @retry="load"
      ><div v-if="plans.length" class="plans-grid">
        <RouterLink
          v-for="p in plans.filter((p) => !p.archived)"
          :key="p.id"
          :to="'/coach/plans/' + p.id"
          class="plan-card panel"
          ><div class="plan-card-top">
            <PhBarbell :size="28" aria-hidden="true" /><span class="tag">{{
              versions.some((v) => v.plan_id === p.id && v.revision === p.draft_version)
                ? t('published')
                : t('draft')
            }}</span>
          </div>
          <h2>{{ p.title }}</h2>
          <p>
            {{ p.draft.days.length }} {{ t('days') }}
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
      <section v-else class="empty-state panel">
        <PhBarbell :size="40" aria-hidden="true" />
        <h2>
          {{
            language('A starter is better than a blank page.', 'الخطة الأولية أفضل من صفحة فارغة.')
          }}
        </h2>
        <p>
          {{
            language(
              'Your first plan begins with two simple full-body sessions. Edit it to suit your client.',
              'ابدأ بحصتين بسيطتين لكامل الجسم، وعدّلهما لمتدربك.',
            )
          }}
        </p>
        <RouterLink class="button" to="/coach/plans/new">{{ t('newPlan') }}</RouterLink>
      </section></PageState
    >
  </div>
</template>
