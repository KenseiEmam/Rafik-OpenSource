<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../../lib/backend'
import { user, refreshProfile } from '../../app/auth'
import { safeNext } from '../../app/router'
import { language, errorMessage } from '../../lib/i18n'
const error = ref('')
const router = useRouter()
const route = useRoute()
onMounted(async () => {
  try {
    user.value = await api.session()
    await refreshProfile()
    await router.replace(safeNext(route.query.next))
  } catch (e) {
    error.value = errorMessage(e)
  }
})
</script>
<template>
  <section class="container page narrow">
    <h1>{{ language('Returning to your training', 'العودة إلى تدريبك') }}</h1>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-else role="status">{{ language('Completing sign-in…', 'جارٍ إكمال الدخول…') }}</p>
    <RouterLink v-if="error" class="button" to="/login">{{
      language('Request a new code', 'اطلب رمزاً جديداً')
    }}</RouterLink>
  </section>
</template>
