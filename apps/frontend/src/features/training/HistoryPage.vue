<script setup lang="ts">
import PageHeading from '../../components/PageHeading.vue'
import { computed, onMounted, ref } from 'vue'
import { PhArrowRight, PhBarbell, PhCheckCircle } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { rows } from '../../lib/backend'
import { type Session } from '../../lib/domain'
import { localSessions } from '../../lib/storage'
import { language, locale, t, dateLabel, errorMessage } from '../../lib/i18n'
import PageState from '../../components/PageState.vue'
const sessions = ref<Session[]>([])
const pendingIds = ref<string[]>([])
const loading = ref(true)
const error = ref('')
const completed = computed(() => sessions.value.filter((s) => s.status === 'completed'))
async function load() {
  loading.value = true
  error.value = ''
  try {
    const local = await localSessions(user.value?.id || 'guest')
    const remote = user.value ? await rows<Session>('sessions', 'client_id', user.value.id) : []
    const merged = new Map(remote.map((s) => [s.id, s]))
    local.forEach((r) => {
      if (r.localRevision > r.syncedRevision || !merged.has(r.id)) merged.set(r.id, r.session)
    })
    sessions.value = [...merged.values()].sort((a, b) => b.started_at.localeCompare(a.started_at))
    pendingIds.value = local.filter((s) => s.localRevision > s.syncedRevision).map((s) => s.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="container page">
    <PageHeading class="page-heading"
      ><div>
        <p class="overline">{{ t('training') }}</p>
        <h1>{{ language('The work you put in.', 'ما أنجزته من تدريب.') }}</h1>
        <p>
          {{
            language(
              'Your sessions, as they happened. Small steps count.',
              'حصصك كما أنجزتها. الخطوات الصغيرة مهمة.',
            )
          }}
        </p>
      </div></PageHeading
    >
    <PageState :loading="loading" :error="error" @retry="load"
      ><div v-if="sessions.length">
        <div class="history-summary">
          <PhCheckCircle :size="28" aria-hidden="true" /><strong>{{ completed.length }}</strong
          ><span>{{ language('completed sessions', 'حصص مكتملة') }}</span>
        </div>
        <div class="session-list">
          <RouterLink
            v-for="s in sessions"
            :key="s.id"
            :to="'/workout/' + s.id"
            class="session-list-row"
            ><div class="date-tile">{{ dateLabel(s.started_at) }}</div>
            <div class="grow">
              <h2>
                {{
                  locale === 'ar'
                    ? s.prescription.nameAr || s.prescription.name
                    : s.prescription.name
                }}
              </h2>
              <p>{{ s.title }}</p>
              <small v-if="pendingIds.includes(s.id)">{{ t('waiting') }}</small>
            </div>
            <span class="tag" :class="{ success: s.status === 'completed' }">{{
              s.status === 'completed' ? t('completed') : t('inProgress')
            }}</span
            ><PhArrowRight :size="22" class="directional" aria-hidden="true"
          /></RouterLink>
        </div>
      </div>
      <section v-else class="empty-state panel history-empty">
        <span class="history-empty-icon"><PhBarbell :size="26" aria-hidden="true" /></span>
        <div class="history-empty-copy">
          <h2>{{ t('noHistory') }}</h2>
          <p>
            {{
              language(
                'When you record a workout, you’ll find it here.',
                'عندما تسجّل تمريناً، ستجده هنا.',
              )
            }}
          </p>
        </div>
        <RouterLink class="button" :to="user ? '/today' : '/routine'"
          >{{ t('start') }}<PhArrowRight :size="20" class="directional" aria-hidden="true"
        /></RouterLink></section
    ></PageState>
  </div>
</template>
<style scoped>
.history-empty {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 24px 28px;
}
.history-empty-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  color: var(--accent);
  background: var(--surface-soft);
  border-radius: 50%;
}
.history-empty-copy h2 {
  margin: 0 0 6px;
}
.history-empty-copy p {
  margin: 0;
}
.history-empty .button {
  margin: 0;
}
@media (max-width: 600px) {
  .history-empty {
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 14px;
    padding: 20px;
  }
  .history-empty-icon {
    width: 44px;
    height: 44px;
  }
  .history-empty .button {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
