<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { user, profile, refreshProfile, logout } from '../../app/auth'
import { rpc, rows } from '../../lib/backend'
import type { Session, Profile, Unit } from '../../lib/domain'
import { localSessions, diagnosticEvents, removeAccountLocalData } from '../../lib/storage'
import { language, locale, t, errorMessage } from '../../lib/i18n'
const router = useRouter()
const name = ref(profile.value?.display_name || '')
const units = ref<Unit>(profile.value?.units || 'kg')
const zone = ref(profile.value?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
const busy = ref(false),
  deleting = ref(false),
  confirmLogout = ref(false)
const confirmation = ref(''),
  error = ref(''),
  message = ref('')
const pending = ref(0)
const diagnostics = ref<{ name: string; at: string }[]>([])
async function save() {
  busy.value = true
  error.value = ''
  try {
    await rpc<Profile>('update_profile', {
      p_name: name.value,
      p_locale: locale.value,
      p_units: units.value,
      p_timezone: zone.value,
    })
    await refreshProfile()
    message.value = t('saved')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
function download(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
async function exportData() {
  busy.value = true
  try {
    const sessions = await rows<Session>('sessions', 'client_id', user.value!.id)
    const records = await Promise.all(
      sessions.map((s) => rpc<Session>('session_document', { p_id: s.id })),
    )
    download(
      {
        exportedAt: new Date().toISOString(),
        profile: profile.value,
        sessions: records,
        localDrafts: await localSessions(user.value!.id),
        plans: await rows('plans', 'coach_id', user.value!.id),
        exercises: await rows('exercises', 'owner_id', user.value!.id),
        coachingContext: await rows('client_context'),
        relationships: await rows('coach_clients'),
        assignments: await rows('assignments'),
        scheduleExceptions: await rows('schedule_exceptions'),
      },
      'rafik-data.json',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function signout() {
  if (pending.value && !confirmLogout.value) {
    confirmLogout.value = true
    return
  }
  try {
    await logout()
    await router.replace('/')
  } catch (e) {
    error.value = errorMessage(e)
  }
}
async function deleteAccount() {
  busy.value = true
  error.value = ''
  const id = user.value!.id
  try {
    await rpc('delete_my_account', { p_confirmation: confirmation.value })
    await removeAccountLocalData(id)
    await logout()
    await router.replace('/')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(async () => {
  const records = await localSessions(user.value!.id)
  pending.value = records.filter((r) => r.localRevision > r.syncedRevision || r.pending).length
  diagnostics.value = (await diagnosticEvents())
    .map(({ name, at }) => ({ name, at }))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 15)
})
function cancelDelete() {
  deleting.value = false
  confirmation.value = ''
}
</script>
<template>
  <div class="container page settings-page">
    <div class="page-heading">
      <p class="overline">{{ t('settings') }}</p>
      <h1>{{ language('Just the details that help.', 'التفاصيل المفيدة فقط.') }}</h1>
    </div>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="message" class="notice success" role="status">{{ message }}</p>
    <div class="settings-layout">
      <form class="panel" @submit.prevent="save">
        <h2>{{ language('Your profile', 'ملفك الشخصي') }}</h2>
        <label for="display-name">{{ t('name') }}</label
        ><input
          id="display-name"
          v-model="name"
          required
          maxlength="80"
          autocomplete="name"
        /><label for="profile-language">{{ t('language') }}</label
        ><select id="profile-language" v-model="locale">
          <option value="en">English</option>
          <option value="ar">العربية</option></select
        ><label for="profile-units">{{ t('units') }}</label
        ><select id="profile-units" v-model="units">
          <option value="kg">{{ t('kg') }}</option>
          <option value="lb">{{ t('lb') }}</option>
        </select>
        <p class="small-print">
          {{
            language(
              'Preferred display units. Existing results keep the units in which they were recorded.',
              'وحدة العرض المفضلة. تحتفظ النتائج السابقة بوحداتها المسجلة.',
            )
          }}
        </p>
        <label for="timezone">{{ t('timezone') }}</label
        ><input id="timezone" v-model="zone" required list="common-timezones" /><datalist
          id="common-timezones"
        >
          <option>Asia/Dubai</option>
          <option>Asia/Riyadh</option>
          <option>Asia/Amman</option>
          <option>Europe/London</option>
          <option>America/New_York</option>
          <option>UTC</option>
        </datalist>
        <p class="small-print">
          {{ language('Used to keep workout dates consistent.', 'لتوحيد تواريخ حصصك.') }}
        </p>
        <button class="button" :disabled="busy">{{ busy ? t('saving') : t('save') }}</button>
      </form>
      <div>
        <section class="panel">
          <h2>{{ language('Your account', 'حسابك') }}</h2>
          <p class="account-email">{{ user?.email }}</p>
          <div class="stack-actions">
            <button class="button secondary" :disabled="busy" @click="exportData">
              {{ t('export') }}</button
            ><button class="button secondary" @click="signout">{{ t('signOut') }}</button>
          </div>
          <p v-if="confirmLogout" class="notice">
            {{
              language(
                `${pending} session(s) are still waiting to sync. Signing out keeps them on this device. Sign in with this same account to continue syncing.`,
                `${pending} حصص بانتظار المزامنة. تبقى على هذا الجهاز عند الخروج. ادخل بالحساب نفسه لإكمال المزامنة.`,
              )
            }}
            <button class="text-link" @click="signout">
              {{ language('Sign out anyway', 'تسجيل الخروج على أي حال') }}
            </button>
          </p>
        </section>
        <details class="panel diagnostics">
          <summary>
            {{ language('Save status and support details', 'حالة الحفظ وتفاصيل الدعم') }}
          </summary>
          <p>
            {{
              language(
                `${pending} sessions waiting to sync on this device.`,
                `${pending} حصص بانتظار المزامنة على هذا الجهاز.`,
              )
            }}
          </p>
          <RouterLink class="text-link" to="/history">{{
            language('Open history to retry a save', 'افتح السجل لإعادة محاولة الحفظ')
          }}</RouterLink>
          <p class="small-print">
            {{
              language(
                'These events stay in your browser and contain no workout notes or email addresses.',
                'تبقى هذه الأحداث في متصفحك ولا تحتوي على ملاحظات التدريب أو عناوين البريد.',
              )
            }}
          </p>
          <ul class="event-list">
            <li v-for="(e, i) in diagnostics" :key="i">
              <code>{{ e.name }}</code
              ><time>{{ new Date(e.at).toLocaleString() }}</time>
            </li>
          </ul>
          <button
            class="button secondary small"
            @click="download(diagnostics, 'rafik-support-events.json')"
          >
            {{ language('Download support details', 'تنزيل تفاصيل الدعم') }}
          </button>
        </details>
        <section class="panel danger-zone">
          <h2>{{ language('Delete account', 'حذف الحساب') }}</h2>
          <p>
            {{
              language(
                'Permanently remove your account, your plans, and your own training results. Clients keep their own completed session snapshots.',
                'حذف حسابك وخططك ونتائج تدريبك نهائياً. يحتفظ المتدربون بنسخ حصصهم المكتملة.',
              )
            }}
          </p>
          <button v-if="!deleting" class="text-link danger" @click="deleting = true">
            {{ t('deleteAccount') }}
          </button>
          <form v-else @submit.prevent="deleteAccount">
            <label for="delete-confirm">{{
              language('Type DELETE to confirm', 'اكتب DELETE للتأكيد')
            }}</label
            ><input
              id="delete-confirm"
              v-model="confirmation"
              autocomplete="off"
              pattern="DELETE"
              required
            /><button class="button danger-button" :disabled="busy || confirmation !== 'DELETE'">
              {{ language('Permanently delete', 'حذف نهائي') }}</button
            ><button class="text-link" type="button" @click="cancelDelete">
              {{ t('cancel') }}
            </button>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>
