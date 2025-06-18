<template>
  <div
    v-if="visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-8 w-3/4 max-h-[90vh] overflow-y-auto">
      <h2 class="contentH-medium mb-6">
        {{ isEditing ? t('dashboard.tabs.program.template.editTemplate') : t('dashboard.tabs.program.template.createTemplate') }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Template Name and Description -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">
              {{ t('dashboard.tabs.program.template.name') }}
            </label>
            <input
              v-model="template.name"
              type="text"
              class="rafik-text-input w-full"
              :placeholder="t('dashboard.tabs.program.template.namePlaceholder')"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              {{ t('dashboard.tabs.program.template.description') }}
            </label>
            <textarea
              v-model="template.description"
              class="rafik-text-input w-full"
              :placeholder="t('dashboard.tabs.program.template.descriptionPlaceholder')"
              rows="3"
              required
            ></textarea>
          </div>
        </div>

        <!-- Control and Primary Fields
        <div class="grid grid-cols-3 gap-6">
          <div class="col-span-2 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ t('dashboard.tabs.program.template.control') }}
              </label>
              <select
                v-model="template.control"
                class="rafik-text-input w-full"
                required
              >
                <option disabled :value="undefined">
                  {{ t('dashboard.tabs.program.template.selectControl') }}
                </option>
                <option value="Load(Kg)">Load(Kg)</option>
                <option value="Load(Lb)">Load(Lb)</option>
                <option value="Speed(Kmph)">Speed(Kmph)</option>
                <option value="Speed(mph)">Speed(mph)</option>
                <option value="RPE">RPE</option>
                <option value="Heart Rate">Heart Rate</option>
                <option value="RIR">RIR</option>
                <option value="Reps">Reps</option>
                <option value="Seconds">Seconds</option>
                <option value="Minutes">Minutes</option>
                <option value="Rounds">Rounds</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                {{ t('dashboard.tabs.program.template.primary') }}
              </label>
              <select
                v-model="template.primary"
                class="rafik-text-input w-full"
                required
              >
                <option disabled :value="undefined">
                  {{ t('dashboard.tabs.program.template.selectPrimary') }}
                </option>
                <option value="Load(Kg)">Load(Kg)</option>
                <option value="Load(Lb)">Load(Lb)</option>
                <option value="Speed(Kmph)">Speed(Kmph)</option>
                <option value="Speed(mph)">Speed(mph)</option>
                <option value="RPE">RPE</option>
                <option value="Heart Rate">Heart Rate</option>
                <option value="RIR">RIR</option>
                <option value="Reps">Reps</option>
                <option value="Seconds">Seconds</option>
                <option value="Minutes">Minutes</option>
                <option value="Rounds">Rounds</option>
              </select>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ t('dashboard.tabs.program.template.rounds') }}
              </label>
              <input
                v-model.number="template.rounds"
                type="number"
                class="rafik-text-input w-32"
                :placeholder="t('dashboard.tabs.program.template.roundsPlaceholder')"
                required
                min="1"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                {{ t('dashboard.tabs.program.template.controlValue') }}
              </label>
              <input
                v-model.number="template.controlValue"
                type="number"
                class="rafik-text-input w-32"
                :placeholder="t('dashboard.tabs.program.template.controlValuePlaceholder')"
                required
                min="0"
              />
            </div>
          </div>
        </div> -->

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4 mt-8">
          <button
            type="button"
            @click="handleClose"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded"
          >
            {{ t('dashboard.tabs.program.template.cancel') }}
          </button>
          <button type="submit" class="btn-md rounded">
            {{ isEditing ? t('dashboard.tabs.program.template.save') : t('dashboard.tabs.program.template.create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  templateData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'submit']);

const template = ref({
  name: '',
  description: '',
});

const resetForm = () => {
  template.value = {
    name: '',
    description: '',
  };
};

const handleSubmit = () => {
  if (!template.value.name || !template.value.description ) {
    return;
  }

  emit('submit', template.value);
  resetForm();
};

const handleClose = () => {
  resetForm();
  emit('close');
};

// Watch for changes in the initialData prop
watch(() => props.templateData, (newData:any) => {
  if (newData) {
    template.value = { ...newData };
  } else {
    resetForm();
  }
}, { immediate: true });
</script>
