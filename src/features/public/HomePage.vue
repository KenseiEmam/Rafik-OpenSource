<script setup lang="ts">
import { PhArrowRight, PhArrowUpRight, PhCheck, PhBarbell } from '@phosphor-icons/vue'
import { language, t } from '../../lib/i18n'
</script>
<template>
  <div class="container landing">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">{{ language('Make room for training', 'مساحة أفضل للتدريب') }}</p>
        <h1>{{ language('A clear plan. A better session.', 'خطة واضحة. حصة أفضل.') }}</h1>
        <p class="hero-description">
          {{
            language(
              'Know what to do, record what you did, and keep your coach close.',
              'اعرف تمرينك، سجّل إنجازك، وابقَ على تواصل مع مدربك.',
            )
          }}
        </p>
        <div class="actions">
          <RouterLink class="button" to="/routine"
            >{{ language('Try a workout', 'جرّب تمريناً')
            }}<PhArrowRight :size="20" class="directional" aria-hidden="true" /></RouterLink
          ><RouterLink class="text-link" to="/coach"
            >{{ language('I coach clients', 'أنا مدرب')
            }}<PhArrowUpRight :size="18" aria-hidden="true"
          /></RouterLink>
        </div>
      </div>
      <figure class="hero-photo">
        <img
          src="/images/training.png"
          :alt="
            language(
              'A woman taking a quiet break between sets in a sunlit gym',
              'امرأة تستريح بين مجموعات التمرين في صالة مضاءة بالشمس',
            )
          "
          width="1536"
          height="1024"
          fetchpriority="high"
        />
      </figure>
    </section>
    <section class="sample-feature" aria-labelledby="sample-title">
      <div>
        <PhBarbell :size="30" weight="regular" class="accent-icon" aria-hidden="true" />
        <h2 id="sample-title">
          {{ language('Your next workout is already here.', 'تمرينك القادم جاهز.') }}
        </h2>
        <p>
          {{
            language(
              'Start with a simple full-body session. No account, installation, or long introduction.',
              'ابدأ بحصة بسيطة لكامل الجسم. بلا حساب أو تنزيل أو مقدمة طويلة.',
            )
          }}
        </p>
      </div>
      <RouterLink to="/routine" class="workout-teaser"
        ><span class="teaser-label">{{ t('sample') }}</span>
        <h3>{{ t('contentTitle') }}</h3>
        <div class="teaser-facts">
          <span>{{ language('4 movements', '٤ تمارين') }}</span
          ><span>{{ language('About 35 minutes', 'حوالي ٣٥ دقيقة') }}</span>
        </div>
        <div class="teaser-bottom">
          <span>{{ language('Dumbbells and a mat', 'دمبل وحصيرة') }}</span
          ><span class="round-arrow"
            ><PhArrowRight :size="24" class="directional" aria-hidden="true"
          /></span></div
      ></RouterLink>
    </section>
    <section id="how-it-works" class="how-section">
      <h2>{{ language('Less setup. More useful training.', 'إعداد أقل. تدريب أكثر فائدة.') }}</h2>
      <div class="how-grid">
        <article>
          <span class="feature-symbol"><PhCheck :size="22" aria-hidden="true" /></span>
          <h3>{{ language('See the whole session', 'شاهد الحصة كاملة') }}</h3>
          <p>
            {{
              language(
                'Exercises, sets, and clear instructions together. You always know what comes next.',
                'التمارين والمجموعات والتعليمات في مكان واحد. تعرف دائماً ما الخطوة التالية.',
              )
            }}
          </p>
        </article>
        <article>
          <span class="feature-symbol"><PhCheck :size="22" aria-hidden="true" /></span>
          <h3>{{ language('Pick up where you left off', 'تابع من حيث توقفت') }}</h3>
          <p>
            {{
              language(
                'Your sets stay on your device through interruptions. Connected workouts sync with your account.',
                'تبقى مجموعاتك على الجهاز عند الانقطاع. وتتم مزامنة حصصك المرتبطة بحسابك.',
              )
            }}
          </p>
        </article>
      </div>
    </section>
    <section class="coach-section">
      <div>
        <h2>{{ language('Your plan. Their progress.', 'خطتك. تقدّمهم.') }}</h2>
        <p>
          {{
            language(
              'For coaches who already have clients: start from a useful plan, make it your own, and review what actually happened.',
              'للمدربين الذين لديهم متدربون: ابدأ بخطة مفيدة، عدّلها، وراجع ما أنجزوه فعلاً.',
            )
          }}
        </p>
        <RouterLink to="/coach" class="button secondary"
          >{{ language('Open your coaching workspace', 'افتح مساحة التدريب')
          }}<PhArrowUpRight :size="18" aria-hidden="true"
        /></RouterLink>
      </div>
      <div class="coach-principles">
        <p>
          {{ language('Start with a plan, not a blank dashboard.', 'ابدأ بخطة، لا بلوحة فارغة.') }}
        </p>
        <p>
          {{
            language('Give feedback where the workout happened.', 'قدّم ملاحظاتك ضمن الحصة نفسها.')
          }}
        </p>
        <p>
          {{
            language(
              'Change what comes next. Keep what was done.',
              'عدّل القادم. واحتفظ بما تم إنجازه.',
            )
          }}
        </p>
      </div>
    </section>
  </div>
</template>
