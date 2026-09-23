<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { PhCopy, PhCheck, PhArrowRight } from '@phosphor-icons/vue'
import { user, profile, refreshProfile } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import type { Profile, PlanVersion, Relationship, Assignment, Invitation } from '../../lib/domain'
import { language, t, errorMessage, dateLabel } from '../../lib/i18n'
import PageState from '../../components/PageState.vue'
const people = ref<Profile[]>([]),
  versions = ref<PlanVersion[]>([]),
  clients = ref<Relationship[]>([]),
  assignments = ref<Assignment[]>([]),
  invites = ref<Invitation[]>([])
const loading = ref(true),
  busy = ref(false),
  copied = ref(false)
const error = ref(''),
  message = ref(''),
  email = ref(''),
  version = ref(''),
  link = ref(''),
  coachName = ref(profile.value?.display_name || '')
const choices = ref<Record<string, string>>({})
let pending: { email: string; version: string; token: string; id: string } | undefined
const latest = computed(() =>
  versions.value.filter(
    (v) =>
      !versions.value.some((other) => other.plan_id === v.plan_id && other.revision > v.revision),
  ),
)
const search = ref(''),
  rosterState = ref('active')
const filteredClients = computed(() =>
  clients.value.filter(
    (c) =>
      c.state === rosterState.value &&
      (people.value.find((p) => p.id === c.client_id)?.display_name || '')
        .toLowerCase()
        .includes(search.value.toLowerCase()),
  ),
)
const visibleCount = ref(12)
watch([search, rosterState], () => {
  visibleCount.value = 12
})
const pendingInvites = computed(() => invites.value.filter((i) => i.status === 'pending'))
async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = user.value!.id
    ;[people.value, versions.value, clients.value, assignments.value, invites.value] =
      await Promise.all([
        rows<Profile>('profiles'),
        rows<PlanVersion>('plan_versions', 'coach_id', id),
        rows<Relationship>('coach_clients', 'coach_id', id),
        rows<Assignment>('assignments', 'coach_id', id),
        rows<Invitation>('invitations', 'coach_id', id),
      ])
    if (!version.value) version.value = latest.value[0]?.id || ''
    for (const c of clients.value)
      choices.value[c.id] =
        assignments.value.find((a) => a.relationship_id === c.id && a.state === 'active')
          ?.version_id || ''
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function invite() {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    if (coachName.value.trim() !== profile.value?.display_name) {
      await rpc('update_profile', {
        p_name: coachName.value.trim(),
        p_locale: profile.value?.locale || 'en',
        p_units: profile.value?.units || 'kg',
        p_timezone: profile.value?.timezone || 'UTC',
      })
      await refreshProfile()
    }
    if (
      !pending ||
      pending.email !== email.value.trim().toLowerCase() ||
      pending.version !== version.value
    ) {
      const bytes = crypto.getRandomValues(new Uint8Array(32))
      pending = {
        email: email.value.trim().toLowerCase(),
        version: version.value,
        token: Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''),
        id: crypto.randomUUID(),
      }
    }
    await rpc('create_invitation', {
      p_email: pending.email,
      p_version_id: pending.version,
      p_token: pending.token,
      p_request_id: pending.id,
    })
    link.value = location.origin + '/invite/' + pending.token
    copied.value = false
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function copy() {
  try {
    await navigator.clipboard.writeText(link.value)
    copied.value = true
  } catch {
    message.value = language(
      'Select and copy the invitation link below.',
      'حدّد رابط الدعوة أدناه وانسخه.',
    )
  }
}
async function revoke(id: string) {
  busy.value = true
  try {
    await rpc('revoke_invitation', { p_id: id })
    await load()
    message.value = language('Invitation revoked.', 'أُلغيت الدعوة.')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function assign(id: string) {
  busy.value = true
  error.value = ''
  try {
    await rpc('assign_plan', { p_relationship_id: id, p_version_id: choices.value[id] })
    await load()
    message.value = language(
      'Updated for future sessions. Started and completed sessions keep their original plan.',
      'تم التحديث للحصص القادمة. تحتفظ الحصص التي بدأت أو اكتملت بخطتها الأصلية.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="container page">
    <div class="page-heading">
      <p class="overline">{{ t('coaching') }}</p>
      <h1>{{ language('Good coaching stays connected.', 'التدريب الجيد يبقيك قريباً.') }}</h1>
      <p>
        {{
          language(
            'A personal invitation. A clear plan. No app to install.',
            'دعوة شخصية. خطة واضحة. بلا تطبيق للتنزيل.',
          )
        }}
      </p>
    </div>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="message" class="notice success" role="status">{{ message }}</p>
    <PageState :loading="loading" @retry="load"
      ><div class="clients-layout">
        <section>
          <h2>{{ t('clients') }}</h2>
          <div class="roster-tools">
            <label
              >{{ language('Search clients', 'البحث عن متدرب')
              }}<input v-model="search" type="search" /></label
            ><label
              >{{ language('Status', 'الحالة')
              }}<select v-model="rosterState">
                <option value="active">{{ t('active') }}</option>
                <option value="archived">{{ language('Archived', 'مؤرشف') }}</option>
              </select></label
            >
          </div>
          <p v-if="clients.length && !filteredClients.length">
            {{ language('No clients match this view.', 'لا يوجد متدربون مطابقون.') }}
          </p>
          <div v-if="!clients.length" class="empty-review">
            <h3>
              {{ language('Invite someone you already coach.', 'ادعُ شخصاً تدرّبه بالفعل.') }}
            </h3>
            <p>
              {{
                language(
                  'They receive their plan when they open your link and verify their email.',
                  'تظهر خطتهم عند فتح الرابط والتحقق من البريد الإلكتروني.',
                )
              }}
            </p>
          </div>
          <p class="small-print roster-total">
            {{ filteredClients.length }} {{ language('clients', 'متدربون') }}
          </p>
          <article
            v-for="c in filteredClients.slice(0, visibleCount)"
            :key="c.id"
            class="client-row"
          >
            <div class="client-heading">
              <span class="avatar">{{
                people.find((p) => p.id === c.client_id)?.display_name.slice(0, 1)
              }}</span>
              <h3>
                <RouterLink :to="'/coach/clients/' + c.id"
                  >{{ people.find((p) => p.id === c.client_id)?.display_name }} →</RouterLink
                >
              </h3>
            </div>
            <template v-if="c.state === 'active'"
              ><label :for="'assignment-' + c.id">{{
                language('Assigned plan', 'الخطة المعينة')
              }}</label>
              <div class="inline-form">
                <select :id="'assignment-' + c.id" v-model="choices[c.id]">
                  <option v-for="v in versions" :key="v.id" :value="v.id">
                    {{ v.title }} · {{ language('version', 'نسخة') }} {{ v.revision }}
                  </option></select
                ><button
                  class="button small secondary"
                  :disabled="
                    busy ||
                    choices[c.id] ===
                      assignments.find((a) => a.relationship_id === c.id && a.state === 'active')
                        ?.version_id
                  "
                  @click="assign(c.id)"
                >
                  {{ language('Apply', 'تطبيق') }}
                </button>
              </div>
              <small>{{
                language(
                  'Applies to future sessions. Training history stays intact.',
                  'يُطبّق على الحصص القادمة. يبقى سجل التدريب كما هو.',
                )
              }}</small>
            </template>
          </article>
          <button
            v-if="filteredClients.length > visibleCount"
            class="button secondary small"
            @click="visibleCount += 12"
          >
            {{ language('Show more clients', 'عرض المزيد من المتدربين') }}
          </button>
          <section v-if="pendingInvites.length" class="pending-invites">
            <h2>{{ language('Pending invitations', 'الدعوات المعلقة') }}</h2>
            <article v-for="i in pendingInvites" :key="i.id" class="invite-row">
              <div>
                <strong>{{ i.intended_email }}</strong
                ><small>{{ language('Expires', 'تنتهي') }} {{ dateLabel(i.expires_at) }}</small>
              </div>
              <button class="text-link danger" :disabled="busy" @click="revoke(i.id)">
                {{ language('Revoke', 'إلغاء') }}
              </button>
            </article>
            <p class="small-print">
              {{
                language(
                  'Lost a link? Revoke that invitation and create a new one.',
                  'فقدت الرابط؟ ألغِ الدعوة وأنشئ أخرى.',
                )
              }}
            </p>
          </section>
        </section>
        <aside class="panel invite-panel">
          <h2>{{ t('invite') }}</h2>
          <template v-if="latest.length"
            ><form @submit.prevent="invite">
              <label for="coach-name">{{
                language('Your name, shown on the invitation', 'اسمك الظاهر في الدعوة')
              }}</label
              ><input
                id="coach-name"
                v-model="coachName"
                required
                maxlength="80"
                autocomplete="name"
              /><label for="client-email">{{ language('Client email', 'بريد المتدرب') }}</label
              ><input
                id="client-email"
                v-model="email"
                type="email"
                required
                maxlength="254"
                autocomplete="off"
                placeholder="name@example.com"
              /><label for="invite-plan">{{ language('Published plan', 'الخطة المنشورة') }}</label
              ><select id="invite-plan" v-model="version" required>
                <option v-for="v in latest" :key="v.id" :value="v.id">
                  {{ v.title }} · {{ v.revision }}
                </option>
              </select>
              <p class="small-print">
                {{
                  language(
                    'Only this verified email can accept the invitation. The link is valid for seven days.',
                    'يقبل الدعوة صاحب هذا البريد بعد التحقق فقط. الرابط صالح لسبعة أيام.',
                  )
                }}
              </p>
              <button class="button full" :disabled="busy">
                {{ busy ? t('loading') : language('Create invitation link', 'إنشاء رابط الدعوة')
                }}<PhArrowRight :size="18" class="directional" />
              </button>
            </form>
            <div v-if="link" class="invitation-result">
              <label for="invitation-link">{{
                language('Share this link with your client', 'شارك هذا الرابط مع متدربك')
              }}</label
              ><input
                id="invitation-link"
                :value="link"
                readonly
                @focus="($event.target as HTMLInputElement).select()"
              /><button class="button secondary full" @click="copy">
                <PhCheck v-if="copied" :size="18" /><PhCopy v-else :size="18" />{{
                  copied ? language('Copied', 'تم النسخ') : language('Copy link', 'نسخ الرابط')
                }}</button
              ><small>{{
                language('Nothing has been sent automatically.', 'لم يتم إرسال أي شيء تلقائياً.')
              }}</small>
            </div></template
          ><template v-else
            ><p>
              {{
                language(
                  'Publish a plan first, then invite a client to use it.',
                  'انشر خطة أولاً، ثم ادعُ متدرباً لاستخدامها.',
                )
              }}
            </p>
            <RouterLink class="button" to="/coach/plans/new">{{
              t('newPlan')
            }}</RouterLink></template
          >
        </aside>
      </div></PageState
    >
  </div>
</template>
