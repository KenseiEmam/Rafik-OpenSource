<script setup lang="ts">
import PageHeading from '../../components/PageHeading.vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../../lib/backend'
import { profile } from '../../app/auth'
import { language as l, errorMessage, locale } from '../../lib/i18n'
import PageState from '../../components/PageState.vue'
import NotificationPreferences from './NotificationPreferences.vue'
const route = useRoute(),
  router = useRouter()
type Notice = {
  id: string
  category: string
  kind: string
  context: string
  href: string
  created_at: string
  read_at: string | null
  state: string
}
const items = ref<Notice[]>([]),
  next = ref<number | null>(null),
  loading = ref(true),
  error = ref(''),
  preferences = ref(route.query.preferences === 'true'),
  busy = ref('')
const title = (item: Notice) =>
  item.category === 'messages'
    ? l('New conversation updates', 'تحديثات جديدة في المحادثة')
    : item.kind.endsWith('reminder')
      ? l('An upcoming event', 'موعد قادم')
      : item.category === 'calendar'
        ? l('A calendar update', 'تحديث في التقويم')
        : item.category === 'checkins'
          ? l('A check-in is due', 'متابعة مستحقة')
          : l('Feedback or results are ready', 'الملاحظات أو النتائج جاهزة')
const stamp = (value: string) =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-AE' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: profile.value?.timezone || 'UTC',
  }).format(new Date(value))
async function load(append = false) {
  loading.value = true
  error.value = ''
  try {
    const result = await request<{ items: Notice[]; next: number | null }>(
      `/v1/notifications?offset=${append ? next.value || 0 : 0}`,
    )
    items.value = append ? [...items.value, ...result.items] : result.items
    next.value = result.next
    if (!append && typeof route.query.event === 'string') {
      const linked = await request<{ items: Notice[] }>(
        '/v1/notifications?id=' + encodeURIComponent(route.query.event),
      )
      items.value = Array.from(
        new Map([...linked.items, ...items.value].map((n) => [n.id, n])).values(),
      )
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function open(item: Notice, navigate = true) {
  busy.value = item.id
  error.value = ''
  try {
    await request('/v1/notifications', { method: 'POST', body: JSON.stringify({ id: item.id }) })
    item.read_at = new Date().toISOString()
    if (navigate) await router.push(item.href)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = ''
  }
}
onMounted(() => load())
</script>
<template>
  <div class="container page notifications-page">
    <PageHeading class="work-heading">
      <div>
        <p class="overline">{{ l('Your updates', 'تحديثاتك') }}</p>
        <h1>{{ l('Notifications', 'الإشعارات') }}</h1>
        <p>
          {{
            l(
              'Relevant updates across your workspaces, with each context kept clear.',
              'تحديثات مهمة من مساحات عملك مع توضيح سياق كل تحديث.',
            )
          }}
        </p>
      </div>
      <button class="button secondary" @click="preferences = !preferences">
        {{
          preferences
            ? l('Back to updates', 'العودة للتحديثات')
            : l('Notification preferences', 'تفضيلات الإشعارات')
        }}
      </button>
    </PageHeading>
    <NotificationPreferences v-if="preferences" /><template v-else
      ><div class="heading-actions">
        <p class="small-print">
          {{
            l(
              'Latest update per conversation or event · kept for 30 days.',
              'أحدث تحديث لكل محادثة أو موعد · يُحفظ لمدة 30 يوماً.',
            )
          }}
        </p>
        <button class="text-link" @click="load()">{{ l('Refresh', 'تحديث') }}</button>
      </div>
      <PageState :loading="loading" :error="error" @retry="load()"
        ><section v-if="!items.length" class="notification-empty">
          <h2>
            {{
              next === null
                ? l('You’re up to date', 'أنت على اطلاع')
                : l('No current updates on this page', 'لا توجد تحديثات حالية في هذه الصفحة')
            }}
          </h2>
          <p>
            {{
              l(
                'New messages, feedback and calendar updates will appear here. Optional reminders are prepared by the local dispatcher.',
                'ستظهر الرسائل الجديدة والملاحظات وتحديثات التقويم هنا. تُجهز التذكيرات الاختيارية عبر الموزع المحلي.',
              )
            }}
          </p>
          <RouterLink to="/workspaces" class="text-link">{{
            l('Open your workspaces', 'فتح مساحات عملك')
          }}</RouterLink>
        </section>
        <article
          v-for="item in items"
          :key="item.id"
          class="notification-row"
          :class="{ unread: !item.read_at }"
        >
          <div>
            <p class="overline">
              {{
                item.context === 'independent'
                  ? l('Independent coaching', 'التدريب المستقل')
                  : item.context
              }}
            </p>
            <h2>
              <button class="text-link" :disabled="!!busy" @click="open(item)">
                {{ title(item) }} ↗
              </button>
            </h2>
            <time :datetime="item.created_at">{{ stamp(item.created_at) }}</time>
            <p class="small-print" v-if="item.state === 'intercepted'">
              {{
                l(
                  'Email intercepted locally · not sent externally',
                  'البريد محتجز محلياً · لم يُرسل خارجياً',
                )
              }}
            </p>
            <p class="small-print" v-if="item.state === 'failed'">
              {{
                l(
                  'Reminder delivery failed. This update is still available here.',
                  'فشل تسليم التذكير. يبقى التحديث متاحاً هنا.',
                )
              }}
            </p>
          </div>
          <button
            v-if="!item.read_at"
            class="text-link small"
            :disabled="!!busy"
            @click="open(item, false)"
          >
            {{ l('Mark read', 'تعليم كمقروء') }}</button
          ><span v-else class="small-print">{{ l('Read', 'مقروء') }}</span>
        </article>
        <button v-if="next !== null" class="button secondary" @click="load(true)">
          {{ l('Earlier updates', 'التحديثات الأقدم') }}
        </button></PageState
      ></template
    >
  </div>
</template>
<style scoped>
.notifications-page {
  max-width: 960px;
}
.notification-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 24px 12px;
  border-bottom: 1px solid var(--line);
}
.notification-row > div {
  min-width: 0;
  overflow-wrap: anywhere;
}
.notification-row.unread {
  border-inline-start: 3px solid var(--accent);
  background: var(--surface);
}
.notification-row h2 {
  font-size: 1.05rem;
  margin: 8px 0;
}
.notification-row .overline {
  margin: 0;
}
.notification-row time {
  font-size: 0.8rem;
  color: var(--muted);
}
.notification-empty {
  padding: 40px 0;
  max-width: 550px;
}
.notification-empty h2 {
  font-size: 1.4rem;
}
@media (max-width: 550px) {
  .notification-row {
    align-items: start;
    flex-direction: column;
    gap: 14px;
  }
  .notifications-page > .heading-actions {
    flex-wrap: wrap;
  }
}
</style>
