<script setup lang="ts">
import { computed } from 'vue'
import { language as l } from '../../lib/i18n'
import MetricChart from './MetricChart.vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
export type Experience = {
  client: { source: string; score: number | null; value: number }[]
  workplace: { score: number | null; value: number }[] | null
  workplaceMonth: string
  renewal: { ended: number; renewed: number }
}
const props = defineProps<{ report: Experience; base: string }>()
const sources = ['calendar', 'workout']
const ratings = (items: { score: number | null; value: number }[]) =>
  Array.from({ length: 5 }, (_, i) => ({
    label: String(i + 1) + ' / 5',
    value: items.filter((x) => x.score === i + 1).reduce((n, x) => n + x.value, 0),
  }))
const count = (items: { score: number | null; value: number }[], responded = false) =>
  items.filter((x) => !responded || x.score !== null).reduce((n, x) => n + x.value, 0)
const average = (items: { score: number | null; value: number }[]) => {
  const n = count(items, true)
  return n ? (items.reduce((sum, x) => sum + (x.score || 0) * x.value, 0) / n).toFixed(1) : '—'
}
const renewal = computed(() => [
  { label: l('Renewal recorded', 'سُجل تجديد'), value: props.report.renewal.renewed },
  {
    label: l('No renewal recorded', 'لم يُسجل تجديد'),
    value: props.report.renewal.ended - props.report.renewal.renewed,
  },
])
</script>
<template>
  <TabsRoot activation-mode="manual" default-value="clients" class="experience-report">
    <TabsList
      class="experience-tabs"
      :aria-label="l('Experience report sections', 'أقسام تقرير التجربة')"
      ><TabsTrigger value="clients">{{ l('Client experience', 'تجربة المتدربين') }}</TabsTrigger
      ><TabsTrigger v-if="report.workplace" value="workplace">{{
        l('Trainer workplace', 'بيئة عمل المدربين')
      }}</TabsTrigger
      ><TabsTrigger value="renewals">{{
        l('Package renewals', 'تجديد الباقات')
      }}</TabsTrigger></TabsList
    >
    <TabsContent value="clients">
      <section class="experience-section">
        <h2>{{ l('Client session experience', 'تجربة جلسات المتدربين') }}</h2>
        <p>
          {{
            l(
              'Ratings from completed sessions in the selected dates, for the current roster. Optional responses are shown separately by source; they are not an overall trainer score.',
              'تقييمات الجلسات المكتملة ضمن الفترة المحددة للقائمة الحالية. تُعرض الإجابات الاختيارية حسب المصدر؛ ليست تقييماً عاماً للمدرب.',
            )
          }}
        </p>
        <div class="experience-charts">
          <div v-for="source in sources" :key="source">
            <p class="response-summary">
              <strong>{{ average(report.client.filter((x) => x.source === source)) }} / 5</strong
              ><span
                >{{
                  count(
                    report.client.filter((x) => x.source === source),
                    true,
                  )
                }}
                / {{ count(report.client.filter((x) => x.source === source)) }}
                {{ l('eligible sessions rated', 'جلسة مؤهلة تم تقييمها') }}</span
              >
            </p>
            <MetricChart
              counts
              :title="
                source === 'calendar'
                  ? l('Scheduled session satisfaction', 'الرضا عن الجلسات المجدولة')
                  : l('Workout satisfaction', 'الرضا عن التمارين')
              "
              :description="
                l(
                  '1 = very dissatisfied · 5 = very satisfied. Missing ratings are not neutral.',
                  '١ = غير راضٍ جداً · ٥ = راضٍ جداً. عدم الإجابة لا يعني الحياد.',
                )
              "
              :items="
                count(
                  report.client.filter((x) => x.source === source),
                  true,
                )
                  ? ratings(report.client.filter((x) => x.source === source))
                  : []
              "
              :unit="l('responses', 'إجابة')"
            />
          </div>
        </div>
      </section> </TabsContent
    ><TabsContent v-if="report.workplace" value="workplace"
      ><section class="experience-section">
        <h2>{{ l('Trainer workplace satisfaction', 'رضا المدربين عن بيئة العمل') }}</h2>
        <p>
          {{ l('Current month', 'الشهر الحالي') }}: {{ report.workplaceMonth.slice(0, 7) }} (UTC).
          {{
            l(
              'One optional response per current active trainer. Separate from client feedback and the trainee/date filters above.',
              'إجابة اختيارية لكل مدرب نشط حالياً. منفصلة عن تقييمات المتدربين ومرشحات الفترة والمتدرب أعلاه.',
            )
          }}
        </p>
        <p class="response-summary">
          <strong>{{ average(report.workplace) }} / 5</strong
          ><span
            >{{ count(report.workplace, true) }} / {{ count(report.workplace) }}
            {{ l('active trainers responded', 'مدرب نشط أجاب') }}</span
          >
        </p>
        <MetricChart
          counts
          :title="l('Workplace rating distribution', 'توزيع تقييمات بيئة العمل')"
          :description="
            l(
              'Ratings describe the experience of working at this organization. No response means unknown.',
              'تصف التقييمات تجربة العمل في المؤسسة. عدم الإجابة يعني أن الرأي غير معروف.',
            )
          "
          :items="count(report.workplace, true) ? ratings(report.workplace) : []"
          :unit="l('trainers', 'مدرب')"
        />
      </section> </TabsContent
    ><TabsContent value="renewals"
      ><section class="experience-section">
        <h2>{{ l('Recorded package renewals', 'تجديدات الباقات المسجلة') }}</h2>
        <p>
          {{
            l(
              'Non-archived packages that expired in the selected dates. A renewal is a new linked package recorded by the end of the report period. This is an entitlement record, not verified payment or a customer retention rate.',
              'الباقات غير المؤرشفة التي انتهت خلال الفترة المحددة. التجديد باقة جديدة مرتبطة سُجلت بنهاية فترة التقرير. هذا سجل استحقاق وليس دفعة موثقة أو معدل احتفاظ بالعملاء.',
            )
          }}
        </p>
        <MetricChart
          counts
          donut
          :title="l('Renewal follow-through', 'متابعة التجديد')"
          :description="
            l(
              'Each expired package is counted once. Independent sessions never count as renewals.',
              'تحتسب كل باقة منتهية مرة واحدة. الجلسات المستقلة لا تُعد تجديداً.',
            )
          "
          :items="report.renewal.ended ? renewal : []"
          :unit="l('packages', 'باقة')"
        /><RouterLink class="text-link" :to="base + '/packages'">{{
          l('Review packages', 'مراجعة الباقات')
        }}</RouterLink>
      </section>
    </TabsContent></TabsRoot
  >
</template>
<style scoped>
.experience-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.experience-tabs :deep(button) {
  border: 1px solid var(--line);
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  padding: 0.6rem 0.9rem;
  cursor: pointer;
}
.experience-tabs :deep(button[data-state='active']) {
  background: var(--tint);
  color: var(--ink);
  border-color: var(--accent);
}
.experience-report {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  min-width: 0;
}
.experience-report :deep([role='tabpanel']) {
  min-width: 0;
}
.experience-section {
  min-width: 0;
}
.experience-section > h2 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}
.experience-section > p {
  max-width: 80ch;
  color: var(--muted);
  line-height: 1.7;
}
.experience-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.experience-charts > div {
  min-width: 0;
}
.response-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: baseline;
  margin-block: 1rem;
}
.response-summary strong {
  font-size: 1.5rem;
  color: var(--ink);
}
.response-summary span {
  color: var(--muted);
  font-size: 0.85rem;
}
@media (max-width: 1050px) {
  .experience-charts {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
