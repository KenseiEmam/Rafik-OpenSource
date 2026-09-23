<script setup lang="ts">
import { computed } from 'vue'
import { language as l } from '../../lib/i18n'
const props = defineProps<{
  title: string
  description: string
  items: { label: string; value: number; href?: string; at?: string }[]
  unit?: string
  timeline?: boolean
}>()
const maximum = computed(() => Math.max(1, ...props.items.map((x) => x.value))),
  minimum = computed(() => Math.min(0, ...props.items.map((x) => x.value)))
const x = (index: number) => {
  const first = Date.parse(props.items[0]?.at || ''),
    last = Date.parse(props.items.at(-1)?.at || ''),
    current = Date.parse(props.items[index]?.at || '')
  return Number.isFinite(first) && Number.isFinite(last) && Number.isFinite(current) && last > first
    ? 30 + ((current - first) * 540) / (last - first)
    : 30 + (index * 540) / Math.max(1, props.items.length - 1)
}
const points = computed(() =>
  props.items
    .map(
      (p, i) =>
        `${x(i)},${160 - ((p.value - minimum.value) * 130) / (maximum.value - minimum.value)}`,
    )
    .join(' '),
)
</script>
<template>
  <section class="metric-chart">
    <h2>{{ title }}</h2>
    <p class="small-print">{{ description }}</p>
    <p v-if="!items.length" class="chart-empty">
      {{ l('No records in this period.', 'لا توجد سجلات في هذه الفترة.') }}
    </p>
    <template v-else>
      <div v-if="timeline" class="timeline-wrap">
        <p class="chart-range" dir="ltr">{{ maximum }} {{ unit }}</p>
        <svg
          viewBox="0 0 600 170"
          preserveAspectRatio="none"
          role="img"
          :aria-label="title"
          class="timeline-chart"
        >
          <title>{{ title }} · {{ unit }}</title>
          <line x1="30" y1="160" x2="570" y2="160" class="chart-axis" />
          <line x1="30" y1="30" x2="570" y2="30" class="chart-grid" />
          <polyline v-if="items.length > 1" :points="points" class="chart-line" />
          <circle
            v-for="(item, i) in items"
            :key="i"
            :cx="x(i)"
            :cy="160 - ((item.value - minimum) * 130) / (maximum - minimum)"
            r="3"
            class="chart-dot"
          >
            <title>{{ item.label }}: {{ item.value }} {{ unit }}</title>
          </circle>
        </svg>
        <p class="chart-range" dir="ltr">{{ minimum }} {{ unit }}</p>
        <div class="chart-dates" dir="ltr">
          <span>{{ items[0]?.label }}</span
          ><span>{{ items.length > 1 ? items.at(-1)?.label : '' }}</span>
        </div>
      </div>
      <div v-else class="bar-chart" role="img" :aria-label="title">
        <div v-for="(item, i) in items" :key="i" class="bar-row">
          <span>{{ item.label }}</span>
          <div class="bar-track"><i :style="{ width: (item.value / maximum) * 100 + '%' }" /></div>
          <strong>{{ item.value }} {{ unit }}</strong>
        </div>
      </div>
      <details class="chart-table">
        <summary>{{ l('View data table', 'عرض جدول البيانات') }}</summary>
        <div class="table-scroll">
          <table>
            <caption class="sr-only">
              {{
                title
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ l('Record', 'السجل') }}</th>
                <th scope="col">{{ l('Value', 'القيمة') }} {{ unit }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in items" :key="i">
                <th scope="row">
                  <RouterLink v-if="item.href" :to="item.href" class="text-link">{{
                    item.label
                  }}</RouterLink
                  ><span v-else>{{ item.label }}</span>
                </th>
                <td>{{ item.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </template>
  </section>
</template>
<style scoped>
.metric-chart {
  padding-block: 24px;
  border-top: 1px solid var(--line);
  min-width: 0;
}
.metric-chart h2 {
  font-size: 1.05rem;
  margin: 0 0 8px;
}
.timeline-chart {
  width: 100%;
  height: 180px;
  display: block;
  direction: ltr;
  overflow: visible;
}
.chart-range,
.chart-dates {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 4px 0;
}
.chart-dates {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.chart-dates span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.timeline-chart line,
.timeline-chart polyline,
.timeline-chart circle {
  vector-effect: non-scaling-stroke;
}
.chart-axis,
.chart-grid {
  stroke: var(--line);
}
.chart-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.5;
}
.chart-dot {
  fill: var(--accent);
}
.bar-chart {
  display: grid;
  gap: 18px;
  margin-block: 24px;
}
.bar-row {
  display: grid;
  grid-template-columns: minmax(90px, 1fr) minmax(60px, 2fr) auto;
  gap: 14px;
  align-items: center;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}
.bar-track {
  height: 10px;
  background: var(--line);
  border-radius: 3px;
}
.bar-track i {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
}
.chart-table {
  margin-top: 16px;
}
.chart-empty {
  padding: 20px 0;
  color: var(--muted);
}
.table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  text-align: start;
}
th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  text-align: start;
}
tbody th {
  font-weight: 500;
}
</style>
