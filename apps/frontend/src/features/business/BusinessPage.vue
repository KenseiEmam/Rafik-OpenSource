<script setup lang="ts">
import PageHeading from '../../components/PageHeading.vue'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { user } from '../../app/auth'
import { rows, rpc, localPreview } from '../../lib/backend'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import type { Database } from '@rafik/shared/database.types'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import PageState from '../../components/PageState.vue'
type Account = Database['public']['Tables']['business_accounts']['Row']
type Event = Database['public']['Tables']['business_events']['Row']
const team = String(useRoute().query.team || ''),
  account = ref<Account>(),
  events = ref<Event[]>([]),
  canSimulate = ref(false),
  loading = ref(true),
  error = ref('')
const state = ref('active'),
  days = ref(30),
  staff = ref(10),
  clients = ref(50),
  sequence = ref(1),
  uuid = () => crypto.randomUUID()
const access = computed(
  () =>
    account.value &&
    ['trial', 'active'].includes(account.value.state) &&
    Date.parse(account.value.access_until) > Date.now(),
)
const stateName = (value: string) =>
  ({
    trial: l('Trial', 'تجريبي'),
    active: l('Active', 'نشط'),
    past_due: l('Past due', 'متأخر'),
    cancelled: l('Cancelled', 'ملغي'),
  })[value]
async function load() {
  loading.value = true
  error.value = ''
  try {
    canSimulate.value = !team || (await rpc<string>('team_role', { p_team: team })) === 'owner'
    account.value = (
      await rows<Account>(
        'business_accounts',
        team ? 'team_id' : 'owner_id',
        team || user.value!.id,
      )
    )[0]
    if (team && !account.value) throw Error('forbidden')
    events.value = account.value
      ? (await rows<Event>('business_events', 'account_id', account.value.id)).sort(
          (a, b) => b.sequence - a.sequence,
        )
      : []
    if (account.value) {
      sequence.value = account.value.provider_sequence + 1
      staff.value = account.value.staff_limit
      clients.value = account.value.client_limit
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const command = useCommand('business:' + (team || 'personal'), async () => load())
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
function simulate() {
  if (!account.value) return
  return command.run('simulate_business_event', {
    p_id: uuid(),
    p_account: account.value.id,
    p_sequence: sequence.value,
    p_payload: {
      state: state.value,
      access_until: new Date(Date.now() + days.value * 86400000).toISOString(),
      staff_limit: staff.value,
      client_limit: clients.value,
    },
  })
}
onMounted(load)
</script>
<template>
  <div class="container page">
    <RouterLink class="back-link" :to="team ? '/coach/teams/' + team : '/coach/more'"
      >←
      {{ team ? l('Team workspace', 'مساحة الفريق') : l('More tools', 'أدوات إضافية') }}</RouterLink
    >
    <PageHeading class="page-heading"
      ><div>
        <h1>
          {{ team ? l('Team subscription', 'اشتراك الفريق') : l('Business account', 'حساب العمل') }}
        </h1>
        <p>
          {{
            l(
              'Clear account status. Training history stays separate.',
              'حالة حساب واضحة. يبقى سجل التدريب مستقلاً.',
            )
          }}
        </p>
      </div></PageHeading
    >
    <CommandStatus :command="command" /><PageState :loading="loading" :error="error" @retry="load"
      ><div class="ongoing-layout">
        <section class="panel">
          <template v-if="account"
            ><span class="tag">{{ stateName(account.state) }}</span>
            <h2>
              {{
                access
                  ? l('Access is available', 'الوصول متاح')
                  : l('New team activity is restricted', 'نشاط الفريق الجديد مقيّد')
              }}
            </h2>
            <dl class="business-facts">
              <div>
                <dt>{{ l('Access through', 'الوصول حتى') }}</dt>
                <dd>{{ dateLabel(account.access_until) }}</dd>
              </div>
              <div>
                <dt>{{ l('Staff admission limit', 'حد انضمام الموظفين') }}</dt>
                <dd>{{ account.staff_limit }}</dd>
              </div>
              <div>
                <dt>{{ l('Athlete admission limit', 'حد انضمام الرياضيين') }}</dt>
                <dd>{{ account.client_limit }}</dd>
              </div>
            </dl>
            <p>
              {{
                team
                  ? l(
                      'Restrictions stop new admissions, new shared material and group assignment. Existing training, history, export and athlete handoffs remain available. Lowering a limit never removes people.',
                      'توقف القيود الانضمامات والمواد المشتركة الجديدة وتعيين المجموعات. يبقى التدريب الحالي والسجل والتصدير ونقل الرياضيين متاحاً. خفض الحد لا يزيل الأشخاص.',
                    )
                  : l(
                      'Personal subscription state is recorded for local testing. Solo coaching is not paywalled in this build.',
                      'تُسجّل حالة الاشتراك الشخصي للاختبار المحلي. التدريب الفردي غير محجوب بالدفع في هذا الإصدار.',
                    )
              }}
            </p>
            <RouterLink class="text-link" :to="'/coach/support' + (team ? '?team=' + team : '')">{{
              l('Ask for account support', 'طلب دعم الحساب')
            }}</RouterLink></template
          ><template v-else
            ><h2>{{ l('No business setup required', 'لا يلزم إعداد حساب عمل') }}</h2>
            <p>
              {{
                l(
                  'You can keep coaching. Open a local account record when you want to explore subscription operations. No payment details are collected.',
                  'يمكنك متابعة التدريب. افتح سجل حساب محلياً لاستكشاف عمليات الاشتراك. لا تُجمع بيانات الدفع.',
                )
              }}
            </p>
            <button
              v-if="!team"
              class="button"
              :disabled="locked"
              @click="command.run('open_business_account', { p_id: uuid(), p_team: null })"
            >
              {{ l('Open business account', 'فتح حساب العمل') }}
            </button></template
          >
        </section>
        <aside v-if="account" class="form-stack">
          <details v-if="localPreview && canSimulate" class="panel">
            <summary>{{ l('Local provider simulation', 'محاكاة مزوّد محلية') }}</summary>
            <p class="notice">
              {{
                l(
                  'Test data only. No checkout, charges or external provider requests. This tool is unavailable on hosting unless explicitly enabled on the server.',
                  'بيانات اختبار فقط. لا دفع أو رسوم أو طلبات لمزوّد خارجي. هذه الأداة غير متاحة على الاستضافة إلا عند تمكينها صراحةً على الخادم.',
                )
              }}
            </p>
            <form class="form-stack" @submit.prevent="simulate">
              <fieldset class="command-fields" :disabled="locked">
                <label
                  >{{ l('Simulated state', 'الحالة المحاكاة')
                  }}<select v-model="state">
                    <option
                      v-for="v in ['trial', 'active', 'past_due', 'cancelled']"
                      :key="v"
                      :value="v"
                    >
                      {{ stateName(v) }}
                    </option>
                  </select></label
                ><label
                  >{{ l('Access days from now', 'أيام الوصول من الآن')
                  }}<input type="number" v-model.number="days" min="-1" max="365" required
                /></label>
                <div class="field-pair">
                  <label
                    >{{ l('Staff limit', 'حد الموظفين')
                    }}<input
                      type="number"
                      v-model.number="staff"
                      min="1"
                      max="1000"
                      required /></label
                  ><label
                    >{{ l('Athlete limit', 'حد الرياضيين')
                    }}<input type="number" v-model.number="clients" min="1" max="100000" required
                  /></label>
                </div>
                <label
                  >{{ l('Provider sequence', 'تسلسل المزوّد')
                  }}<input type="number" v-model.number="sequence" min="1" required /></label
                ><button class="button">
                  {{ l('Apply simulated event', 'تطبيق حدث محاكاة') }}
                </button>
              </fieldset>
            </form>
          </details>
          <section class="panel">
            <h2>{{ l('Account event history', 'سجل أحداث الحساب') }}</h2>
            <p v-if="!events.length">
              {{ l('No provider events recorded.', 'لا توجد أحداث مزوّد مسجلة.') }}
            </p>
            <ol class="team-activity">
              <li v-for="e in events" :key="e.id">
                <span
                  >{{ l('Event', 'حدث') }} {{ e.sequence }} ·
                  {{
                    e.applied
                      ? l('Applied', 'طُبّق')
                      : l('Older event, no state change', 'حدث أقدم دون تغيير الحالة')
                  }}</span
                ><time>{{ dateLabel(e.created_at) }}</time>
              </li>
            </ol>
          </section>
        </aside>
      </div></PageState
    >
  </div>
</template>
