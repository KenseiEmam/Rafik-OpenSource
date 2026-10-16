<script setup lang="ts">
import {
  PhArrowRight,
  PhCalendarBlank,
  PhBarbell,
  PhBowlFood,
  PhUsersThree,
} from '@phosphor-icons/vue'
import { language as l } from '../../lib/i18n'
</script>
<template>
  <div class="container gym-home">
    <section class="gym-hero">
      <div>
        <p class="eyebrow">
          {{ l('For gyms & training organizations', 'للصالات الرياضية والمؤسسات التدريبية') }}
        </p>
        <h1>
          {{
            l('Your people. Your programs. One training day.', 'فريقك. برامجك. يوم تدريبي مترابط.')
          }}
        </h1>
        <p class="gym-intro">
          {{
            l(
              'Give your trainers the tools to coach well—and your organization a clear view of the work. Bring training, nutrition, scheduled sessions and follow-up together.',
              'امنح مدربيك أدوات التدريب الفعّال، ومؤسستك رؤية واضحة للعمل. اجمع التدريب والتغذية والحصص المجدولة والمتابعة في مكان واحد.',
            )
          }}
        </p>
        <div class="actions">
          <RouterLink class="button" to="/workspaces?start=organization"
            >{{ l('Open your organization', 'افتح مؤسستك')
            }}<PhArrowRight :size="19" class="directional"
          /></RouterLink>
          <a class="text-link" href="#how-it-works">{{ l('See how it works', 'شاهد كيف يعمل') }}</a>
        </div>
        <p class="small-print">
          {{
            l('Built for the staff who keep training moving.', 'مصمم للفريق الذي يدير يوم التدريب.')
          }}
        </p>
      </div>
      <div
        class="gym-workflow"
        :aria-label="l('A connected coaching workflow', 'سير عمل تدريبي مترابط')"
      >
        <div class="workflow-heading">
          <span>{{ l('THE TRAINING DAY', 'يوم التدريب') }}</span
          ><PhCalendarBlank :size="26" />
        </div>
        <ol>
          <li>
            <span class="workflow-step">01</span>
            <div>
              <h2>{{ l('Prepare', 'حضّر') }}</h2>
              <p>
                {{
                  l(
                    'Choose a trainee. Build the training and nutrition plan.',
                    'اختر المتدرب. جهّز خطة التدريب والتغذية.',
                  )
                }}
              </p>
            </div>
            <PhBarbell :size="23" />
          </li>
          <li>
            <span class="workflow-step">02</span>
            <div>
              <h2>{{ l('Coordinate', 'نسّق') }}</h2>
              <p>
                {{
                  l(
                    'Put people and sessions on the same calendar.',
                    'اجمع الفريق والحصص في تقويم واحد.',
                  )
                }}
              </p>
            </div>
            <PhUsersThree :size="23" />
          </li>
          <li>
            <span class="workflow-step">03</span>
            <div>
              <h2>{{ l('Follow through', 'تابع') }}</h2>
              <p>
                {{
                  l(
                    'Review attendance and progress. Make the next step clear.',
                    'راجع الحضور والتقدم. وضّح الخطوة التالية.',
                  )
                }}
              </p>
            </div>
            <PhArrowRight :size="23" class="directional" />
          </li>
        </ol>
        <p class="workflow-foot">
          {{ l('One organization. Clear responsibilities.', 'مؤسسة واحدة. مسؤوليات واضحة.') }}
        </p>
      </div>
    </section>
    <section id="for-your-team" class="gym-team">
      <div>
        <p class="eyebrow">{{ l('Built around your team', 'حول احتياجات فريقك') }}</p>
        <h2>
          {{ l('Better coaching starts with a clearer picture.', 'تدريب أفضل يبدأ برؤية أوضح.') }}
        </h2>
        <p>
          {{
            l(
              'Keep client relationships consistent when schedules or trainers change. Your organization retains its training history, and each trainer knows who they are responsible for.',
              'حافظ على استمرارية المتابعة عند تغيير المواعيد أو المدربين. تحتفظ مؤسستك بسجل التدريب ويعرف كل مدرب مسؤولياته.',
            )
          }}
        </p>
      </div>
      <dl>
        <div>
          <dt>{{ l('For organization managers', 'لمديري المؤسسة') }}</dt>
          <dd>
            {{
              l(
                'Coordinate trainers, review workload and participation, and spot the clients who need follow-up.',
                'نسّق المدربين وراجع أعباء العمل والمشاركة وحدّد المتدربين الذين يحتاجون متابعة.',
              )
            }}
          </dd>
        </div>
        <div>
          <dt>{{ l('For your trainers', 'لمدربيك') }}</dt>
          <dd>
            {{
              l(
                'Create individual programs, set nutrition targets, review sessions and keep conversations in context.',
                'أنشئ برامج فردية وحدّد أهداف التغذية وراجع الحصص والمحادثات في سياقها.',
              )
            }}
          </dd>
        </div>
      </dl>
    </section>
    <section id="how-it-works" class="gym-tools">
      <header>
        <p class="eyebrow">{{ l('The tools behind the service', 'الأدوات التي تدعم خدمتك') }}</p>
        <h2>
          {{
            l('Less switching. More attention to each client.', 'تنقّل أقل. اهتمام أكبر بكل متدرب.')
          }}
        </h2>
      </header>
      <div class="tw:grid tw:gap-8 tw:md:grid-cols-2">
        <article>
          <PhBarbell :size="28" />
          <h3>{{ l('Training with a purpose', 'تدريب بهدف واضح') }}</h3>
          <p>
            {{
              l(
                'An exercise library, custom programs and preserved session history keep preparation connected to progress.',
                'مكتبة تمارين وبرامج مخصصة وسجل حصص محفوظ يربط التخطيط بالتقدم.',
              )
            }}
          </p>
        </article>
        <article>
          <PhBowlFood :size="28" />
          <h3>{{ l('Practical nutrition', 'تغذية قابلة للتطبيق') }}</h3>
          <p>
            {{
              l(
                'Clear calorie and macro targets, example meals, and food diaries shared by the trainee.',
                'أهداف واضحة للسعرات والمغذيات ووجبات مقترحة وسجل طعام يختار المتدرب مشاركته.',
              )
            }}
          </p>
        </article>
      </div>
      <div class="gym-close">
        <p>
          {{ l('Give every trainer a clear place to work.', 'امنح كل مدرب مكاناً واضحاً للعمل.') }}
        </p>
        <RouterLink class="button" to="/workspaces?start=organization"
          >{{ l('Get started', 'ابدأ الآن') }}<PhArrowRight :size="18" class="directional"
        /></RouterLink>
      </div>
    </section>
  </div>
</template>
<style scoped>
.gym-home {
  padding-block: clamp(40px, 6vw, 88px);
}
.gym-hero {
  display: grid;
  grid-template-columns: 1.12fr 1fr;
  gap: clamp(32px, 6vw, 96px);
  align-items: center;
}
h1 {
  font-size: clamp(2.4rem, 4.5vw, 4.5rem);
  line-height: 1.08;
  max-width: 15ch;
  text-wrap: balance;
}
.gym-intro {
  font-size: 1.08rem;
  line-height: 1.85;
  max-width: 53ch;
  margin-block: 28px;
  color: var(--muted);
}
.gym-workflow {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 18px;
  overflow: hidden;
}
.workflow-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  color: var(--accent);
  border-bottom: 1px solid var(--line);
  font-size: 0.73rem;
  letter-spacing: 0.08em;
  font-weight: 700;
}
ol {
  list-style: none;
  padding: 0 24px;
  margin: 0;
}
li {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 24px;
  gap: 16px;
  align-items: start;
  padding-block: 26px;
  border-bottom: 1px solid var(--line);
}
li:last-child {
  border: 0;
}
.workflow-step {
  color: var(--accent);
  font-size: 0.75rem;
  padding-top: 5px;
  font-variant-numeric: tabular-nums;
}
li h2 {
  font-size: 1.15rem;
  margin: 0 0 8px;
}
li p {
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.65;
  margin: 0;
}
li svg {
  color: var(--muted);
}
.workflow-foot {
  background: var(--surface-soft);
  padding: 18px 24px;
  margin: 0;
  font-size: 0.78rem;
}
.gym-team {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(32px, 7vw, 100px);
  margin-block: clamp(64px, 9vw, 120px);
  padding-top: 48px;
  border-top: 1px solid var(--line);
}
.gym-team h2,
.gym-tools h2 {
  font-size: clamp(1.7rem, 2.6vw, 2.5rem);
  max-width: 24ch;
  line-height: 1.2;
}
.gym-team p,
.gym-team dd,
.gym-tools article p {
  line-height: 1.8;
  color: var(--muted);
  max-width: 56ch;
}
dl {
  margin: 0;
}
dl div {
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}
dt {
  font-weight: 700;
  margin-bottom: 10px;
}
dd {
  margin: 0;
}
.gym-tools header {
  margin-bottom: 36px;
}
.gym-tools article {
  padding-top: 24px;
  border-top: 1px solid var(--line);
}
.gym-tools article svg {
  color: var(--accent);
}
.gym-tools h3 {
  margin-block: 18px 10px;
}
.gym-close {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 48px;
  border-top: 1px solid var(--line);
  padding-top: 32px;
}
.gym-close p {
  font-weight: 600;
}
@media (max-width: 800px) {
  .gym-hero,
  .gym-team {
    grid-template-columns: minmax(0, 1fr);
  }
  h1 {
    max-width: 20ch;
  }
}
@media (prefers-reduced-motion: no-preference) {
  a {
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }
}
</style>
