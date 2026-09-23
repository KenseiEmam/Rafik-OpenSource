<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowRight } from '@phosphor-icons/vue'
import { backend, localPreview } from '../../lib/backend'
import { user, refreshProfile } from '../../app/auth'
import { language, t, errorMessage } from '../../lib/i18n'
const busy = ref('')
const error = ref('')
const router = useRouter()
async function enter(role: 'coach' | 'client' | 'coach2' | 'other') {
  busy.value = role
  error.value = ''
  try {
    const { data, error: e } = await backend.auth.signInWithPassword({
      email: role + '@rafik.test',
      password: 'Rafik-local-only-2026!',
    })
    if (e) throw e
    user.value = data.user
    await refreshProfile()
    await router.push(role.startsWith('coach') ? '/coach' : '/today')
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
        <h1>{{ language('See both sides of a useful session.', 'شاهد جانبي الحصة المفيدة.') }}</h1>
        <p>
          {{
            language(
              'These are synthetic accounts in the local database. Use them to try planning, training, and reviewing without sending any real email.',
              'هذه حسابات تجريبية في قاعدة البيانات المحلية. جرّب التخطيط والتدريب والمراجعة بلا رسائل حقيقية.',
            )
          }}
        </p>
      </div>
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
