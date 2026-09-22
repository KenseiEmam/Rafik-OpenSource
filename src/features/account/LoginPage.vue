<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowRight, PhEnvelopeSimple, PhArrowLeft } from '@phosphor-icons/vue'
import { backend, localPreview, configured } from '../../lib/backend'
import { user, refreshProfile } from '../../app/auth'
import { safeNext } from '../../app/router'
import { language, t, errorMessage } from '../../lib/i18n'
const route = useRoute()
const router = useRouter()
const email = ref('')
const code = ref('')
const step = ref<'email' | 'code'>('email')
const busy = ref(false)
const error = ref('')
const sentAt = ref(0)
const next = computed(() => safeNext(route.query.next))
const coaching = computed(() => next.value.startsWith('/coach'))
async function send() {
  if (!configured) {
    error.value = language(
      'Local account services are not configured yet. You can still try the sample workout.',
      'خدمات الحساب المحلية غير مهيأة بعد. يمكنك تجربة التمرين التجريبي.',
    )
    return
  }
  busy.value = true
  error.value = ''
  try {
    const { error: e } = await backend.auth.signInWithOtp({
      email: email.value.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    })
    if (e) throw e
    step.value = 'code'
    sentAt.value = Date.now()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function verify() {
  busy.value = true
  error.value = ''
  try {
    const { data, error: e } = await backend.auth.verifyOtp({
      email: email.value.trim().toLowerCase(),
      token: code.value.trim(),
      type: 'email',
    })
    if (e) throw e
    user.value = data.user
    await refreshProfile()
    await router.replace(next.value)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
function changeEmail() {
  step.value = 'email'
  code.value = ''
}
</script>
<template>
  <div class="container auth-layout">
    <section class="auth-intro">
      <RouterLink class="back-link" to="/routine"
        ><PhArrowLeft :size="18" class="directional" aria-hidden="true" />{{
          t('sample')
        }}</RouterLink
      >
      <h1>
        {{
          coaching
            ? language('Make your next plan a useful one.', 'اجعل خطتك القادمة مفيدة.')
            : language('Keep your training with you.', 'احتفظ بتدريبك معك.')
        }}
      </h1>
      <p>
        {{
          coaching
            ? language(
                'Start from a real plan, invite a client, and see how their session went.',
                'ابدأ بخطة، وادعُ متدرباً، وراجع كيف كانت حصته.',
              )
            : language(
                'Save your sessions, see your previous results, and open your coach’s plan.',
                'احفظ حصصك، وشاهد نتائجك السابقة، وافتح خطة مدربك.',
              )
        }}
      </p>
      <div class="auth-promise">
        <PhEnvelopeSimple :size="25" aria-hidden="true" />
        <p>
          {{
            language(
              'One email code. No password to remember.',
              'رمز عبر البريد. بلا كلمة مرور تتذكرها.',
            )
          }}
        </p>
      </div>
    </section>
    <section class="auth-form panel">
      <template v-if="step === 'email'"
        ><h2>{{ t('signIn') }}</h2>
        <p>
          {{
            language(
              'New here? The same step creates your account.',
              'جديد هنا؟ الخطوة نفسها تنشئ حسابك.',
            )
          }}
        </p>
        <form @submit.prevent="send">
          <label for="email">{{ t('email') }}</label
          ><input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            inputmode="email"
            maxlength="254"
            placeholder="you@example.com"
            required
          /><button class="button full" :disabled="busy">
            {{ busy ? t('loading') : language('Send me a code', 'أرسل لي رمزاً')
            }}<PhArrowRight :size="18" class="directional" aria-hidden="true" />
          </button></form></template
      ><template v-else
        ><h2>{{ language('Check your email', 'تحقق من بريدك') }}</h2>
        <p>
          {{
            language(
              'Enter the six-digit code sent to',
              'أدخل الرمز المكون من ستة أرقام المرسل إلى',
            )
          }}
          <strong dir="ltr">{{ email }}</strong>
        </p>
        <form @submit.prevent="verify">
          <label for="code">{{ language('Sign-in code', 'رمز الدخول') }}</label
          ><input
            id="code"
            v-model="code"
            class="code-input"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            pattern="[0-9]{6}"
            maxlength="6"
            required
            autofocus
          /><button class="button full" :disabled="busy">
            {{ busy ? t('loading') : language('Continue', 'متابعة') }}
          </button>
        </form>
        <div class="auth-secondary">
          <button class="text-link" :disabled="busy" @click="changeEmail">
            {{ language('Use another email', 'استخدم بريداً آخر') }}</button
          ><button class="text-link" :disabled="busy" @click="send">
            {{ language('Resend code', 'إعادة إرسال الرمز') }}
          </button>
        </div></template
      >
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <p class="small-print">
        {{
          language(
            'Your workout stays on this device while you sign in.',
            'يبقى تمرينك على هذا الجهاز أثناء تسجيل الدخول.',
          )
        }}
        <RouterLink to="/privacy">{{ t('privacy') }}</RouterLink>
      </p>
      <div v-if="localPreview && step === 'code'" class="local-inbox">
        <p>
          {{
            language(
              'In this local preview, sign-in emails stay in the test inbox.',
              'في المعاينة المحلية تبقى رسائل الدخول في صندوق الاختبار.',
            )
          }}
        </p>
        <a class="text-link" href="http://127.0.0.1:55324" target="_blank" rel="noopener">{{
          language('Open test inbox', 'فتح صندوق الاختبار')
        }}</a>
      </div>
    </section>
  </div>
</template>
