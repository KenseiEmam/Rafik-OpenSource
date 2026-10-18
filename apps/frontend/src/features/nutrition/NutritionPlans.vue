<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../../lib/backend'
import { language as l, errorMessage, locale } from '../../lib/i18n'
import { formatDate } from '../../lib/dates'
import OrganizationNav from '../organizations/OrganizationNav.vue'
import MemberPicker from '../organizations/MemberPicker.vue'
import PageState from '../../components/PageState.vue'
const route = useRoute(),
  router = useRouter(),
  workspace = String(route.params.workspace),
  view = String(route.params.view),
  base = `/organization/${workspace}/${view}`
type Plan = {
  id: string
  member_id: string
  member_name: string
  member_active: boolean
  effective_on: string
  expires_on: string | null
  revision: number
  status: 'active' | 'upcoming' | 'expired' | 'superseded'
}
type Page = { items: Plan[]; total: number; next: number | null }
const data = ref<Page>(),
  loading = ref(false),
  error = ref(''),
  search = ref(String(route.query.search || '')),
  status = ref(String(route.query.status || 'active')),
  member = ref(String(route.query.filterMember || '')),
  offset = ref(0),
  creating = ref(false)
let generation = 0,
  disposed = false
const labels = {
  active: ['Active', 'نشطة'],
  upcoming: ['Upcoming', 'قادمة'],
  expired: ['Expired', 'منتهية المدة'],
  superseded: ['Replaced', 'مستبدلة'],
} as const
const label = (value: Plan['status']) => l(labels[value][0], labels[value][1])
async function load() {
  const current = ++generation
  loading.value = true
  error.value = ''
  const page = Math.max(0, Number(route.query.offset) || 0)
  const query = new URLSearchParams({
    view,
    status: String(route.query.status || 'active'),
    search: String(route.query.search || ''),
    offset: String(page),
    ...(route.query.filterMember ? { member: String(route.query.filterMember) } : {}),
  })
  try {
    const result = await request<Page>(`/v1/workspaces/${workspace}/nutrition-plans?${query}`)
    if (disposed || current !== generation) return
    data.value = result
    offset.value = page
  } catch (e) {
    if (!disposed && current === generation) {
      error.value = errorMessage(e)
      if ((e as { statusCode?: number }).statusCode === 403) data.value = undefined
    }
  } finally {
    if (!disposed && current === generation) loading.value = false
  }
}
function chooseMember(ids: string[]) {
  member.value = ids[0] || ''
  return navigate()
}
function navigate(page = 0) {
  return router.push({
    query: {
      ...(search.value ? { search: search.value } : {}),
      ...(status.value !== 'active' ? { status: status.value } : {}),
      ...(member.value ? { filterMember: member.value } : {}),
      ...(page ? { offset: page } : {}),
    },
  })
}
watch(
  () => route.fullPath,
  () => {
    search.value = String(route.query.search || '')
    status.value = String(route.query.status || 'active')
    member.value = String(route.query.filterMember || '')
    void load()
  },
)
onMounted(() => load())
onUnmounted(() => {
  disposed = true
  generation++
})
function create(ids: string[]) {
  if (ids[0]) return router.push({ path: base + '/nutrition', query: { member: ids[0] } })
}
</script>
<template>
  <OrganizationNav />
  <div class="container page nutrition-plans-page">
    <header class="work-heading">
      <div>
        <p class="overline">
          {{ l('Published nutrition guidance', 'الإرشادات الغذائية المنشورة') }}
        </p>
        <h1>{{ l('Nutrition plans', 'خطط التغذية') }}</h1>
        <p>
          {{
            l(
              'Current plans across your athletes. Meal diaries remain subject to each athlete’s sharing choice.',
              'الخطط الحالية لرياضييك. تبقى سجلات الطعام خاضعة لاختيار كل رياضي للمشاركة.',
            )
          }}
        </p>
      </div>
      <button class="button" :aria-expanded="creating" @click="creating = !creating">
        {{ l('Create a plan', 'إنشاء خطة') }}
      </button>
    </header>
    <section v-if="creating" class="panel">
      <MemberPicker
        :workspace="workspace"
        :view="view"
        role="trainee"
        single
        :model-value="[]"
        :label="l('Who is this new plan for?', 'لمن هذه الخطة الجديدة؟')"
        @update:model-value="create"
      />
    </section>
    <form class="nutrition-plan-filters" @submit.prevent="navigate()">
      <label
        >{{ l('Search athletes', 'البحث عن رياضيين')
        }}<input v-model="search" type="search" /></label
      ><label
        >{{ l('Plan status', 'حالة الخطة')
        }}<select v-model="status" @change="navigate()">
          <option
            v-for="key in ['active', 'upcoming', 'expired', 'superseded'] as const"
            :key="key"
            :value="key"
          >
            {{ label(key) }}
          </option>
          <option value="all">{{ l('All plans', 'جميع الخطط') }}</option>
        </select></label
      ><button class="button secondary" :disabled="loading">{{ l('Search', 'بحث') }}</button>
    </form>
    <details class="nutrition-athlete-filter">
      <summary>{{ l('Filter by athlete (optional)', 'تصفية حسب الرياضي (اختياري)') }}</summary>
      <MemberPicker
        :workspace="workspace"
        :view="view"
        single
        :model-value="member ? [member] : []"
        :label="l('Athlete', 'الرياضي')"
        @update:model-value="chooseMember"
      />
    </details>
    <p v-if="loading && data" role="status" class="small-print">
      {{ l('Updating plans…', 'جارٍ تحديث الخطط…') }}
    </p>
    <p v-if="error && data" role="alert" class="notice error">
      {{ error }}
      <button class="text-link" @click="load">{{ l('Retry', 'إعادة المحاولة') }}</button>
    </p>
    <PageState :loading="loading && !data" :error="!data ? error : ''" @retry="load"
      ><template v-if="data">
        <p class="small-print">{{ data.total }} {{ l('matching plans', 'خطط مطابقة') }}</p>
        <section v-if="!data.items.length" class="empty-state panel">
          <h2>{{ l('No plans match this view.', 'لا توجد خطط مطابقة لهذا العرض.') }}</h2>
          <p>
            {{
              l(
                'Try another status or search, or create a plan for an athlete.',
                'جرّب حالة أو بحثاً آخر، أو أنشئ خطة لرياضي.',
              )
            }}
          </p>
          <button class="button secondary" @click="creating = true">
            {{ l('Create a plan', 'إنشاء خطة') }}
          </button>
        </section>
        <div v-else class="nutrition-plan-grid">
          <article v-for="plan in data.items" :key="plan.id" class="nutrition-plan-card">
            <div class="heading-actions">
              <h2 dir="auto">{{ plan.member_name }}</h2>
              <span class="tag">{{ label(plan.status) }}</span>
            </div>
            <p class="small-print">
              {{ l('Nutrition plan · version', 'خطة تغذية · النسخة') }} {{ plan.revision }}
            </p>
            <dl>
              <div>
                <dt>{{ l('Effective', 'تسري من') }}</dt>
                <dd>{{ formatDate(plan.effective_on, locale) }}</dd>
              </div>
              <div>
                <dt>{{ l('Expires', 'تنتهي في') }}</dt>
                <dd>
                  {{
                    plan.expires_on
                      ? formatDate(plan.expires_on, locale)
                      : l('No end date', 'دون تاريخ انتهاء')
                  }}
                </dd>
              </div>
            </dl>
            <p v-if="!plan.member_active" class="small-print">
              {{ l('Inactive institution membership', 'عضوية المؤسسة غير نشطة') }}
            </p>
            <RouterLink
              class="button secondary"
              :to="base + '/nutrition?member=' + plan.member_id + '&plan=' + plan.id"
              >{{ l('View nutrition plan', 'عرض خطة التغذية') }}</RouterLink
            >
          </article>
        </div>
        <nav
          v-if="data.total > 24 || offset"
          class="nutrition-plan-pagination"
          :aria-label="l('Nutrition plan pages', 'صفحات خطط التغذية')"
        >
          <button
            class="button secondary"
            :disabled="loading || !offset"
            @click="navigate(Math.max(0, offset - 24))"
          >
            {{ l('Previous', 'السابق') }}</button
          ><span
            >{{ Math.min(offset + 1, data.total) }}–{{ Math.min(offset + 24, data.total) }} /
            {{ data.total }}</span
          ><button
            class="button secondary"
            :disabled="loading || data.next === null"
            @click="navigate(data.next!)"
          >
            {{ l('Next', 'التالي') }}
          </button>
        </nav>
      </template></PageState
    >
  </div>
</template>
<style scoped>
.nutrition-plan-filters {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
  gap: 16px;
  align-items: end;
}
.nutrition-plan-filters label {
  min-width: 0;
  margin: 0;
}
.nutrition-athlete-filter {
  margin-block: 18px;
}
.nutrition-plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr));
  gap: 18px;
}
.nutrition-plan-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}
.nutrition-plan-card h2 {
  font-size: 1.15rem;
  margin: 0;
  overflow-wrap: anywhere;
}
.nutrition-plan-card dl {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  margin-block: 20px;
}
.nutrition-plan-card dt {
  font-size: 0.8rem;
  color: var(--muted);
}
.nutrition-plan-card dd {
  margin: 4px 0 0;
}
.nutrition-plan-card .button {
  margin-top: auto;
  align-self: start;
}
.nutrition-plan-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-block: 24px;
}
@media (max-width: 650px) {
  .nutrition-plan-filters {
    grid-template-columns: minmax(0, 1fr);
  }
  .nutrition-plan-card {
    padding: 20px;
  }
}
</style>
