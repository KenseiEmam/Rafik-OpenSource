<script setup lang="ts">
import SectionHeader from '../../components/SectionHeader.vue'
import { computed, ref, watch } from 'vue'
import { request } from '../../lib/backend'
import { language as l } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import MemberPicker from './MemberPicker.vue'
import type { Member, Sport } from './types'
const props = defineProps<{
  workspaceId: string
  member: Member
  sports: Sport[]
  names: { id: string; name: string }[]
}>()
const emit = defineEmits<{ saved: [] }>()
const coach = ref(''),
  sport = ref('')
watch(sport, () => {
  coach.value = ''
})
const supporting = computed(() =>
  (props.member.coaches || []).filter((c) => c.kind === 'supporting'),
)
const nameOf = (id: string) => props.names.find((n) => n.id === id)?.name || l('Coach', 'مدرب')
const sportOf = (id: string | null) => props.sports.find((s) => s.id === id)?.name || ''
// A supporting coach covers one of the athlete's sports, or a general coaching specialty.
const choices = computed(() =>
  props.sports.filter(
    (s) => !s.archived && (s.kind === 'specialty' || (props.member.sports || []).includes(s.id)),
  ),
)
const command = useCommand<'coaching'>(
  `organization-coaching:${props.workspaceId}`,
  async (_, __, args) => {
    if (args.action === 'link-coach') {
      coach.value = ''
      sport.value = ''
    }
    emit('saved')
  },
  (_, args) =>
    request(`/v1/workspaces/${props.workspaceId}`, { method: 'POST', body: JSON.stringify(args) }),
  { successMessage: l('Coaching team updated.', 'تم تحديث فريق التدريب.') },
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
const add = () =>
  command.run('coaching', {
    operation: crypto.randomUUID(),
    action: 'link-coach',
    id: crypto.randomUUID(),
    athlete: props.member.id,
    coach: coach.value,
    sport: sport.value,
  })
const remove = (link: { id: string; revision: number }) =>
  command.run('coaching', {
    operation: crypto.randomUUID(),
    action: 'end-coach-link',
    id: link.id,
    revision: link.revision,
  })
</script>
<template>
  <section class="form-stack coaching-team" aria-labelledby="supporting-coaches-heading">
    <SectionHeader
      id="supporting-coaches-heading"
      :title="l('Supporting coaches', 'المدربون المساندون')"
      :description="
        l(
          'Choose a sport or specialty, then a coach who covers it. Supporting coaches manage plans within their scope and can see cross-plan scheduling conflicts. Nutrition and participation status remain with the primary coach.',
          'اختر الرياضة أو التخصص، ثم مدرباً يغطيه. يدير المدربون المساندون الخطط ضمن نطاقهم ويطّلعون على تعارضات جداول الخطط. تبقى التغذية وحالة المشاركة لدى المدرب الأساسي.',
        )
      "
    />
    <CommandStatus :command="command" />
    <p v-if="!supporting.length" class="small-print">{{ l('None yet.', 'لا يوجد بعد.') }}</p>
    <ul v-else class="coaching-links">
      <li v-for="link in supporting" :key="link.id">
        <span dir="auto"
          ><strong>{{ nameOf(link.coach) }}</strong> · {{ sportOf(link.sport) }}</span
        ><button
          type="button"
          class="text-link"
          :disabled="locked"
          :aria-label="l('Remove supporting coach ', 'إزالة المدرب المساند ') + nameOf(link.coach)"
          @click="remove(link)"
        >
          {{ l('Remove', 'إزالة') }}
        </button>
      </li>
    </ul>
    <form class="form-stack" @submit.prevent="add">
      <fieldset class="command-fields" :disabled="locked">
        <label
          >{{ l('Sport or specialty they cover', 'الرياضة أو التخصص الذي يغطيه')
          }}<select v-model="sport" required>
            <option value="" disabled>{{ l('Choose…', 'اختر…') }}</option>
            <option v-for="s in choices" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select></label
        >
        <MemberPicker
          v-if="sport"
          :sport="sport"
          :workspace="workspaceId"
          view="admin"
          role="trainer"
          single
          :label="l('Add a supporting coach', 'إضافة مدرب مساند')"
          :model-value="coach ? [coach] : []"
          :exclude-ids="[
            member.id,
            ...(member.trainer_id ? [member.trainer_id] : []),
            ...supporting.map((c) => c.coach),
          ]"
          @update:model-value="coach = $event[0] || ''"
          ><template #default="{ member: person }"
            ><small style="display: block; color: var(--muted)">{{
              (person.sports || [])
                .map((id) => sports.find((s) => s.id === id)?.name)
                .filter(Boolean)
                .join(' · ')
            }}</small></template
          ></MemberPicker
        >
        <p v-if="!choices.length" class="small-print">
          {{
            l(
              'Link this athlete to a sport first, or add a coaching specialty in Institution settings.',
              'اربط هذا الرياضي برياضة أولاً، أو أضف تخصصاً تدريبياً من إعدادات المؤسسة.',
            )
          }}
        </p>
        <button class="button secondary" :disabled="!coach || !sport">
          {{ l('Add supporting coach', 'إضافة مدرب مساند') }}
        </button>
      </fieldset>
    </form>
  </section>
</template>
<style scoped>
.coaching-team h2 {
  margin-top: 0;
  font-size: 1.1rem;
}
.coaching-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}
.coaching-links li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px 12px;
  min-width: 0;
}
.coaching-links span {
  overflow-wrap: anywhere;
}
.coaching-team fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}
</style>
