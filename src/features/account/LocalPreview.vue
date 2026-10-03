<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowRight } from '@phosphor-icons/vue'
import { api, localPreview } from '../../lib/backend'
import { user, refreshProfile } from '../../app/auth'
import { language, t, errorMessage } from '../../lib/i18n'
const busy = ref('')
const error = ref('')
const router = useRouter()
// Independent-coach sample accounts stay reachable for compatibility tests only (?legacy=1).
const legacy = useRoute().query.legacy === '1'
async function enter(
  role:
    | 'coach'
    | 'client'
    | 'coach2'
    | 'other'
    | 'orgadmin'
    | 'orgtrainer'
    | 'orgtrainee'
    | 'orgadmin2'
    | 'operator',
) {
  busy.value = role
  error.value = ''
  try {
    user.value = await api.preview(role + '@rafik.test')
    await refreshProfile()
    await router.push(
      role === 'operator'
        ? '/platform'
        : role.startsWith('org')
          ? '/organization/12000000-0000-4000-8000-00000000000' +
            (role === 'orgadmin2' ? '2' : '1') +
            '/' +
            (role === 'orgadmin2' ? 'admin' : role.slice(3))
          : role.startsWith('coach')
            ? '/coach'
            : '/today',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = ''
  }
}
</script>
<template>
  <div class="container page narrow">
    <template v-if="localPreview"
      ><div class="page-heading">
        <span class="tag">{{ language('Local preview', 'معاينة محلية') }}</span>
        <h1>
          {{
            language(
              'Choose a role. Explore how a gym runs on Rafik.',
              'اختر دوراً واستكشف كيف يعمل النادي على رفيق.',
            )
          }}
        </h1>
        <p>
          {{
            language(
              'Synthetic accounts in the local database. Switch between an administrator, a trainer and a trainee of the same gym to see each side of the workflow, without sending any real email.',
              'حسابات تجريبية في قاعدة البيانات المحلية. بدّل بين مسؤول ومدرب ومتدرب في النادي نفسه لرؤية كل جانب من سير العمل، دون إرسال أي بريد حقيقي.',
            )
          }}
        </p>
      </div>
      <h2>{{ language('Madar Training', 'مدار للتدريب') }}</h2>
      <p class="preview-context">
        {{
          language(
            'A gym with its own administrators, trainers and trainees. Madar’s people and training history belong to Madar.',
            'نادٍ له مسؤولوه ومدربوه ومتدربوه. أشخاص مدار وسجلهم التدريبي يتبعون مدار.',
          )
        }}
      </p>
      <div class="preview-accounts">
        <button
          v-for="account in [
            {
              role: 'orgadmin' as const,
              name: 'Rania Mansour',
              description: language(
                'Administrator: people, packages, calendar and analytics',
                'مسؤولة: الأشخاص والباقات والتقويم والتحليلات',
              ),
            },
            {
              role: 'orgtrainer' as const,
              name: 'Kareem Nasser',
              description: language(
                'Trainer: programs, sessions and follow-up (also trains here)',
                'مدرب: البرامج والجلسات والمتابعة (ويتدرب هنا أيضاً)',
              ),
            },
            {
              role: 'orgtrainee' as const,
              name: 'Sara Khalil',
              description: language(
                'Trainee: training, bookings and session feedback',
                'متدربة: التدريب والحجوزات وتقييم الجلسات',
              ),
            },
          ]"
          :key="account.role"
          class="preview-account panel"
          :disabled="!!busy"
          @click="enter(account.role)"
        >
          <span class="avatar">{{ account.name[0] }}</span
          ><span
            ><strong>{{ account.name }}</strong
            ><small>{{ account.description }}</small></span
          ><PhArrowRight :size="22" class="directional" aria-hidden="true" />
        </button>
      </div>
      <h2>{{ language('A second organization', 'مؤسسة ثانية') }}</h2>
      <p class="preview-context">
        {{
          language(
            'Athar Academy is fully separate: nothing from Madar is visible here.',
            'أكاديمية أثر منفصلة تماماً: لا يظهر فيها شيء من مدار.',
          )
        }}
      </p>
      <div class="preview-accounts">
        <button class="preview-account panel" :disabled="!!busy" @click="enter('orgadmin2')">
          <span class="avatar">O</span
          ><span
            ><strong>Omar Saleh</strong
            ><small>{{
              language('Athar Academy · Administrator', 'أكاديمية أثر · مسؤول')
            }}</small></span
          ><PhArrowRight :size="22" class="directional" aria-hidden="true" />
        </button>
      </div>
      <h2>{{ language('Platform operations', 'عمليات المنصة') }}</h2>
      <div class="preview-accounts">
        <button class="preview-account panel" :disabled="!!busy" @click="enter('operator')">
          <span class="avatar">A</span
          ><span
            ><strong>Amina</strong
            ><small>{{
              language(
                'Platform operator: audited local operations',
                'مشغلة المنصة: العمليات المحلية المسجَّلة',
              )
            }}</small></span
          ><PhArrowRight :size="22" aria-hidden="true" />
        </button>
      </div>
      <template v-if="legacy">
        <h2>{{ language('Legacy compatibility accounts', 'حسابات التوافق القديمة') }}</h2>
        <p class="preview-context">
          {{
            language(
              'Independent-coach accounts kept only for compatibility checks. They are not part of the gym product.',
              'حسابات المدربين المستقلين محفوظة لاختبارات التوافق فقط وليست جزءاً من منتج الأندية.',
            )
          }}
        </p>
        <div class="preview-accounts">
          <button class="preview-account panel" :disabled="!!busy" @click="enter('coach')">
            <span class="avatar">L</span
            ><span
              ><strong>Laila Khoury</strong
              ><small>{{
                language('Coach: plans, invitations, and review', 'مدربة: خطط ودعوات ومراجعة')
              }}</small></span
            ><PhArrowRight :size="22" class="directional" aria-hidden="true" /></button
          ><button class="preview-account panel" :disabled="!!busy" @click="enter('client')">
            <span class="avatar">A</span
            ><span
              ><strong>Amir Hassan</strong
              ><small>{{
                language(
                  'Client: train, save, and see feedback',
                  'متدرب: تمرّن واحفظ وشاهد الملاحظات',
                )
              }}</small></span
            ><PhArrowRight :size="22" class="directional" aria-hidden="true" />
          </button>
          <button class="preview-account panel" :disabled="!!busy" @click="enter('coach2')">
            <span class="avatar">N</span
            ><span
              ><strong>Nour Mahfouz</strong
              ><small>{{
                language('Second coach: team collaboration', 'مدرب آخر: تعاون الفريق')
              }}</small></span
            ><PhArrowRight :size="22" class="directional" aria-hidden="true" />
          </button>
          <button class="preview-account panel" :disabled="!!busy" @click="enter('other')">
            <span class="avatar">D</span
            ><span
              ><strong>Dalia Saad</strong
              ><small>{{
                language('Second client: independent access', 'متدربة أخرى: وصول مستقل')
              }}</small></span
            ><PhArrowRight :size="22" class="directional" aria-hidden="true" />
          </button>
        </div>
      </template>
      <p v-if="busy" role="status">{{ t('loading') }}</p>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <RouterLink class="text-link" to="/routine">{{
        language('Or try the workout without an account', 'أو جرّب التمرين بلا حساب')
      }}</RouterLink></template
    ><template v-else
      ><h1>
        {{
          language(
            'Sample accounts are only available locally.',
            'الحسابات التجريبية متاحة محلياً فقط.',
          )
        }}
      </h1>
      <RouterLink class="button" to="/routine">{{ t('sample') }}</RouterLink></template
    >
  </div>
</template>

<style scoped>
h2 {
  font-size: 1.2rem;
  margin-block: 32px 16px;
}
.preview-context {
  margin-bottom: 20px;
  color: var(--muted);
}
</style>
