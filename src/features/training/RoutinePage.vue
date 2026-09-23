<script setup lang="ts">
import ExerciseDemo from '../../components/ExerciseDemo.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowLeft, PhArrowRight, PhBarbell, PhClock, PhCheckCircle } from '@phosphor-icons/vue'
import sample from '../../content/sample.json'
import { type Prescription, type Exercise } from '../../lib/domain'
import { language, locale, t, errorMessage } from '../../lib/i18n'
import { user } from '../../app/auth'
import { startWorkout } from '../../lib/training'
const router = useRouter()
const plan = sample.prescription as Prescription
const selected = ref(0)
const day = computed(() => plan.days[selected.value]!)
const busy = ref(false)
const error = ref('')
const exercise = (id: string) => sample.exercises.find((x) => x.id === id) as Exercise
async function start() {
  busy.value = true
  error.value = ''
  try {
    const row = await startWorkout(
      day.value,
      sample.title,
      sample.versionId,
      user.value?.id || 'guest',
    )
    await router.push('/workout/' + row.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="container page routine-page">
    <RouterLink class="back-link" to="/"
      ><PhArrowLeft :size="18" class="directional" aria-hidden="true" />{{ t('home') }}</RouterLink
    >
    <div class="page-heading">
      <span class="tag">{{ t('sample') }}</span>
      <h1>{{ t('contentTitle') }}</h1>
      <p>
        {{
          language(
            'A balanced full-body plan. Familiar movements, clear sets, and space to go at your pace.',
            'خطة متوازنة لكامل الجسم. حركات واضحة ومجموعات محددة وبالوتيرة التي تناسبك.',
          )
        }}
      </p>
    </div>
    <div class="routine-layout">
      <section class="routine-main">
        <div class="segmented" :aria-label="language('Choose a session', 'اختر حصة')">
          <button
            v-for="(d, i) in plan.days"
            :key="d.id"
            :class="{ selected: i === selected }"
            :aria-pressed="i === selected"
            @click="selected = i"
          >
            {{ locale === 'ar' ? d.nameAr : d.name }}
          </button>
        </div>
        <ol class="exercise-list">
          <li v-for="(item, i) in day.exercises" :key="item.key">
            <span class="exercise-number">{{ String(i + 1).padStart(2, '0') }}</span>
            <div class="exercise-list-copy">
              <h2>
                {{
                  locale === 'ar'
                    ? exercise(item.exerciseId)?.name_ar
                    : exercise(item.exerciseId)?.name
                }}
              </h2>
              <p>
                {{
                  locale === 'ar'
                    ? exercise(item.exerciseId)?.equipment_ar
                    : exercise(item.exerciseId)?.equipment
                }}
              </p>
              <details>
                <summary>{{ t('instruction') }}</summary>
                <p>
                  {{
                    locale === 'ar'
                      ? exercise(item.exerciseId)?.instructions_ar
                      : exercise(item.exerciseId)?.instructions
                  }}
                </p>
              </details>
              <ExerciseDemo :exercise="exercise(item.exerciseId)" />
            </div>
            <span class="set-prescription"
              >{{ item.sets }} × {{ item.reps
              }}<small>{{ t('sets') }} / {{ t('reps') }}</small></span
            >
          </li>
        </ol>
      </section>
      <aside class="session-overview panel">
        <div class="overview-title">
          <PhBarbell :size="28" aria-hidden="true" />
          <h2>{{ locale === 'ar' ? day.nameAr : day.name }}</h2>
        </div>
        <div class="overview-facts">
          <span><PhClock :size="20" aria-hidden="true" />{{ day.minutes }} {{ t('minutes') }}</span
          ><span>{{ day.exercises.length }} {{ t('exercises') }}</span>
        </div>
        <p>
          {{
            language(
              'Weights are sample starting values. Change them to match your plan and experience.',
              'الأوزان قيم تجريبية. عدّلها لتناسب خطتك وخبرتك.',
            )
          }}
        </p>
        <button class="button full" :disabled="busy" @click="start">
          {{ busy ? t('loading') : t('start')
          }}<PhArrowRight :size="20" class="directional" aria-hidden="true" />
        </button>
        <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        <p class="quiet-note">
          <PhCheckCircle :size="17" aria-hidden="true" />{{
            language('No account needed to try it.', 'لا تحتاج إلى حساب لتجربته.')
          }}
        </p>
        <div class="small-print">
          {{
            language(
              'Sample progress stays in this browser until you save it to an account. Clearing browser data removes local progress.',
              'يبقى التقدم التجريبي في هذا المتصفح حتى تحفظه بحساب. مسح بيانات المتصفح يزيل التقدم المحلي.',
            )
          }}
        </div>
      </aside>
    </div>
  </div>
</template>
