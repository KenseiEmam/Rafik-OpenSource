<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, logout } from '../../app/auth'
import { rpc } from '../../lib/backend'
import { language as l, errorMessage } from '../../lib/i18n'
const route = useRoute(),
  router = useRouter(),
  invite = ref<{ team_name: string; role: string; state: string }>(),
  error = ref(''),
  busy = ref(false),
  loading = ref(true)
async function load() {
  loading.value = true
  error.value = ''
  try {
    invite.value = await rpc('team_invitation', { p_token: String(route.params.token) })
    if (!invite.value) throw Error('invitation_unavailable')
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
  try {
    const id = await rpc<string>('accept_team_invitation', { p_token: String(route.params.token) })
    await router.replace('/coach/teams/' + id)
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
    <div class="panel invitation-card">
      <h1>{{ l('An invitation to work together', 'دعوة للعمل معاً') }}</h1>
      <p v-if="loading" role="status">{{ l('Loading invitation…', 'جارٍ تحميل الدعوة…') }}</p>
      <button v-if="!loading && !invite" class="button secondary" @click="load">
        {{ l('Retry invitation', 'إعادة تحميل الدعوة') }}
      </button>
      <template v-if="invite"
        ><h2>{{ invite.team_name }}</h2>
        <p>
          {{ l('Invited role', 'الدور المدعو') }}:
          {{ invite.role === 'admin' ? l('Admin', 'مدير') : l('Coach', 'مدرب') }}
        </p>
        <p>
          {{
            l(
              'You will see shared team material and clients assigned to you. Joining does not expose other coaches’ private conversations.',
              'سترى المواد المشتركة والمتدربين المكلّف بهم. لا يكشف الانضمام المحادثات الخاصة للمدربين الآخرين.',
            )
          }}
        </p>
        <button
          v-if="invite.state !== 'unavailable'"
          class="button"
          :disabled="busy"
          @click="accept"
        >
          {{
            user
              ? l('Accept team invitation', 'قبول دعوة الفريق')
              : l('Verify my email', 'التحقق من بريدي')
          }}
        </button>
        <p v-else class="notice">
          {{
            l(
              'This invitation is no longer available. Ask for a new link.',
              'لم تعد الدعوة متاحة. اطلب رابطاً جديداً.',
            )
          }}
        </p>
        <p v-if="user">
          {{ user.email }}
          <button class="text-link" @click="switchAccount">
            {{ l('Use another account', 'استخدم حساباً آخر') }}
          </button>
        </p></template
      >
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    </div>
  </section>
</template>
