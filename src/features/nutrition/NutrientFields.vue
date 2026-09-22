<script setup lang="ts">
import { language as l } from '../../lib/i18n'
import { nutrientKeys, type Nutrients } from './model'
const model = defineModel<Nutrients>({ required: true })
const labels = {
  kcal: ['Energy (kcal)', 'الطاقة (سعرة)'],
  protein_g: ['Protein (g)', 'البروتين (غ)'],
  carb_g: ['Carbohydrate (g)', 'الكربوهيدرات (غ)'],
  fat_g: ['Fat (g)', 'الدهون (غ)'],
}
function update(key: (typeof nutrientKeys)[number], e: Event) {
  const value = (e.target as HTMLInputElement).value
  model.value = { ...model.value, [key]: value === '' ? null : Number(value) }
}
</script>
<template>
  <div class="nutrient-fields">
    <label v-for="key in nutrientKeys" :key="key"
      >{{ l(labels[key][0]!, labels[key][1]!)
      }}<input
        :value="model[key] ?? ''"
        @input="update(key, $event)"
        type="number"
        min="0"
        max="10000"
        step="0.1"
        :placeholder="l('Not entered', 'غير مدخل')"
    /></label>
  </div>
</template>
