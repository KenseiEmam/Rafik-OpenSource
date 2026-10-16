<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../../lib/backend'
import { user, refreshContexts } from '../../app/auth'
import { language as l, errorMessage } from '../../lib/i18n'
const route = useRoute(),
  router = useRouter(),
  data = ref<{ organization: string; roles: string[]; state: string }>(),
  error = ref(''),
  busy = ref(false)
const path = '/v1/organization-invitations/' + route.params.token
onMounted(async () => {
  try {
    data.value = await request(path)
  } catch (e) {
    error.value = errorMessage(e)
  }
})
async function accept() {
  busy.value = true
  error.value = ''
  try {
    const result = await request<{ workspace_id: string; role: string }>(path, {
      method: 'POST',
      body: '{}',
    })
    await refreshContexts()
    await router.push(`/organization/${result.workspace_id}/${result.role}`)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="container page narrow">
    <h1>
      {{
        data
          ? l('Join ' + data.organization, 'الانضمام إلى ' + data.organization)
          : l('Organization invitation', 'دعوة المؤسسة')
      }}
    </h1>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <template v-if="data"
      ><p>
        {{ l('Your access:', 'صلاحياتك:') }}
        {{
          data.roles
            .map((r) =>
              l(
                { admin: 'Administrator', trainer: 'Trainer', trainee: 'Trainee' }[r] || r,
                { admin: 'مسؤول', trainer: 'مدرب', trainee: 'متدرب' }[r] || r,
              ),
            )
            .join(' · ')
        }}
      </p>
      <p>
        {{
          l(
            'This joins the organization’s training workspace. It does not share your independent coaching or personal tracking.',
            'تنضم إلى مساحة التدريب بالمؤسسة دون مشاركة تدريبك المستقل أو بياناتك الشخصية.',
          )
        }}
      </p>
      <button v-if="user" class="button" :disabled="busy" @click="accept">
        {{ l('Accept invitation', 'قبول الدعوة') }}</button
      ><RouterLink
        v-else
        class="button"
        :to="'/login?next=' + encodeURIComponent(route.fullPath)"
        >{{ l('Sign in to accept', 'سجّل الدخول للقبول') }}</RouterLink
      ></template
    >
  </div>
</template>
