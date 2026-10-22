<script setup lang="ts">
import { language as l } from '../../lib/i18n'
import MetricChart from './MetricChart.vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
export type Experience = {
  client: { source: string; score: number | null; value: number }[]
  workplace: { score: number | null; value: number }[] | null
  workplaceMonth: string
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
</script>
<template>
  <TabsRoot activation-mode="manual" default-value="clients" class="experience-report">
    <TabsList
      class="experience-tabs ui-tabs"
      :aria-label="l('Experience report sections', 'أقسام تقرير التجربة')"
      ><TabsTrigger value="clients">{{ l('Athlete experience', 'تجربة الرياضيين') }}</TabsTrigger
      ><TabsTrigger v-if="report.workplace" value="workplace">{{
        l('Coach workplace', 'بيئة عمل المدربين')
      }}</TabsTrigger></TabsList
    >
    <TabsContent value="clients">
      <section class="experience-section">
        <h2>{{ l('Athlete session experience', 'تجربة جلسات الرياضيين') }}</h2>
        <p>
          {{
            l(
              'Ratings from completed sessions in the selected dates, for the current roster. Optional responses are shown separately by source; they are not an overall coach score.',
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
        <h2>{{ l('Coach workplace satisfaction', 'رضا المدربين عن بيئة العمل') }}</h2>
        <p>
          {{ l('Current month', 'الشهر الحالي') }}: {{ report.workplaceMonth.slice(0, 7) }} (UTC).
          {{
            l(
              'One optional response per current active coach. Separate from athlete feedback and the trainee/date filters above.',
              'إجابة اختيارية لكل مدرب نشط حالياً. منفصلة عن تقييمات الرياضيين ومرشحات الفترة والرياضي أعلاه.',
            )
          }}
        </p>
        <p class="response-summary">
          <strong>{{ average(report.workplace) }} / 5</strong
          ><span
            >{{ count(report.workplace, true) }} / {{ count(report.workplace) }}
            {{ l('active coaches responded', 'مدرب نشط أجاب') }}</span
          >
        </p>
        <MetricChart
          counts
          :title="l('Workplace rating distribution', 'توزيع تقييمات بيئة العمل')"
          :description="
            l(
              'Ratings describe the experience of working at this institution. No response means unknown.',
              'تصف التقييمات تجربة العمل في المؤسسة. عدم الإجابة يعني أن الرأي غير معروف.',
            )
          "
          :items="count(report.workplace, true) ? ratings(report.workplace) : []"
          :unit="l('coaches', 'مدرب')"
        /></section></TabsContent
  ></TabsRoot>
</template>
<style scoped>
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
