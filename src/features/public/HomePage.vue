<script setup lang="ts">
import { PhArrowRight, PhArrowUpRight, PhCheck, PhBarbell } from '@phosphor-icons/vue'
import { language, t } from '../../lib/i18n'
</script>
<template>
  <div class="container landing">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">
          {{ language('For coaches and training organizations', 'للمدربين والمؤسسات التدريبية') }}
        </p>
        <h1>{{ language('A clear plan. A connected team.', 'خطة واضحة. فريق متواصل.') }}</h1>
        <p class="hero-description">
          {{
            language(
              'Plan the training. Support the people. See what needs your attention—all in your own workspace.',
              'خطّط للتدريب، وتابع الأشخاص، واعرف ما يحتاج اهتمامك، في مساحة عملك.',
            )
          }}
        </p>
        <div class="actions">
          <RouterLink class="button" to="/workspaces"
            >{{ language('Open your workspace', 'افتح مساحة عملك')
            }}<PhArrowRight :size="20" class="directional" aria-hidden="true"
          /></RouterLink>
          <RouterLink class="text-link" to="/routine"
            >{{ language('Try a workout', 'جرّب تمريناً')
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
    <section class="organization-intro" aria-labelledby="organization-title">
      <div>
        <p class="eyebrow">
          {{
            language('One organization. Clear responsibilities.', 'مؤسسة واحدة. مسؤوليات واضحة.')
          }}
        </p>
        <h2 id="organization-title">
          {{ language('Keep the whole training day connected.', 'كل تفاصيل يوم التدريب مترابطة.') }}
        </h2>
        <p>
          {{
            language(
              'Your organization has its own administrators, trainers and trainees. Assign responsibility, deliver programs and schedule assessments without mixing work with independent coaching.',
              'لمؤسستك مسؤولوها ومدربوها ومتدربوها. وزّع المسؤوليات وقدّم البرامج وجدول التقييمات، مع فصل أعمال المؤسسة عن التدريب المستقل.',
            )
          }}
        </p>
        <RouterLink class="text-link" to="/workspaces?start=organization"
          >{{ language('Set up an organization', 'أنشئ مساحة للمؤسسة')
          }}<PhArrowUpRight :size="18" aria-hidden="true"
        /></RouterLink>
      </div>
      <dl class="organization-benefits">
        <div>
          <dt>{{ language('Administrators', 'المسؤولون') }}</dt>
          <dd>
            {{
              language(
                'See workload, unassigned trainees and programs in use. Keep people and responsibilities up to date.',
                'تابع أعباء العمل والمتدربين بلا مدرب والبرامج المستخدمة. حدّث الأشخاص والمسؤوليات.',
              )
            }}
          </dd>
        </div>
        <div>
          <dt>{{ language('Trainers', 'المدربون') }}</dt>
          <dd>
            {{
              language(
                'Review your trainees, give feedback and follow up in scoped conversations.',
                'راجع تدريب متدربيك وقدّم الملاحظات وتابعهم في محادثات محددة المشاركين.',
              )
            }}
          </dd>
        </div>
        <div>
          <dt>{{ language('Continuity', 'استمرارية التدريب') }}</dt>
          <dd>
            {{
              language(
                'Change who is responsible without losing the organization’s training history.',
                'غيّر المدرب المسؤول مع الاحتفاظ بسجل تدريب المؤسسة.',
              )
            }}
          </dd>
        </div>
      </dl>
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
  </div>
</template>
<style scoped>
.coach-section {
  margin-block: clamp(40px, 6vw, 72px) 0;
}
.organization-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(32px, 6vw, 96px);
  padding-block: clamp(40px, 7vw, 88px);
  border-bottom: 1px solid var(--line);
}
.organization-intro h2 {
  max-width: 19ch;
}
.organization-intro p {
  max-width: 58ch;
  margin-block: 16px 24px;
}
.organization-benefits {
  margin: 0;
}
.organization-benefits > div {
  padding-block: 20px;
  border-top: 1px solid var(--line);
}
.organization-benefits dt {
  font-weight: 700;
  margin-bottom: 8px;
}
.organization-benefits dd {
  margin: 0;
  color: var(--muted);
}
@media (max-width: 700px) {
  .organization-intro {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
