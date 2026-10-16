<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowRight, PhBarbell } from '@phosphor-icons/vue'
import { rpc } from '../../lib/backend'
import { user, logout } from '../../app/auth'
import { language, t, errorMessage } from '../../lib/i18n'
import PageState from '../../components/PageState.vue'
const route = useRoute()
const router = useRouter()
const invite = ref<{ coach_name: string; status: string; expires_at: string } | null>(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
async function load() {
  loading.value = true
  error.value = ''
  try {
    invite.value = await rpc('get_invitation', { p_token: String(route.params.token) })
    if (!invite.value)
      error.value = language(
        'This invitation could not be found. Ask your coach for a new link.',
        'لم يتم العثور على الدعوة. اطلب رابطاً جديداً من مدربك.',
      )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function accept() {
  if (!user.value) {
    await router.push({ path: '/login', query: { next: route.fullPath } })
    return
  }
  busy.value = true
  error.value = ''
  try {
    await rpc('accept_invitation', { p_token: String(route.params.token) })
    await router.replace('/today')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function switchAccount() {
  await logout()
  await router.push({ path: '/login', query: { next: route.fullPath } })
}
onMounted(load)
</script>
<template>
  <section class="container page narrow">
    <PageState :loading="loading" :error="!invite ? error : ''" @retry="load"
      ><div v-if="invite" class="invitation-card panel">
        <PhBarbell :size="38" class="accent-icon" aria-hidden="true" />
        <p class="overline">{{ language('An invitation to train', 'دعوة للتدريب') }}</p>
        <h1>{{ language('Your plan is ready.', 'خطتك جاهزة.') }}</h1>
        <p>
          {{ language('Coach', 'المدرب') }} <strong>{{ invite.coach_name }}</strong>
          {{
            language(
              'has a training plan for you. Verify your email to open your private assignment.',
              'لديه خطة تدريب لك. تحقق من بريدك لفتح خطتك الخاصة.',
            )
          }}
        </p>
        <template v-if="['pending', 'accepted'].includes(invite.status)"
          ><button class="button full" :disabled="busy" @click="accept">
            {{
              busy
                ? t('loading')
                : user
                  ? language('Accept and open my plan', 'قبول وفتح خطتي')
                  : language('Verify my email', 'التحقق من بريدي')
            }}<PhArrowRight :size="19" class="directional" aria-hidden="true" />
          </button>
          <div v-if="user" class="small-print">
            {{ language('Signed in as', 'مسجل باسم') }} <span dir="ltr">{{ user.email }}</span
            ><button class="text-link" @click="switchAccount">
              {{ language('Use another account', 'استخدم حساباً آخر') }}
            </button>
          </div></template
        >
        <div v-else class="notice">
          {{
            language(
              'This invitation has expired or was canceled. Ask your coach for a new link.',
              'انتهت الدعوة أو أُلغيت. اطلب رابطاً جديداً من مدربك.',
            )
          }}
        </div>
        <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        <RouterLink class="text-link" to="/routine">{{
          language('Try a sample while you wait', 'جرّب تمريناً أثناء الانتظار')
        }}</RouterLink>
      </div></PageState
    >
  </section>
</template>
