<template>
  <div class="flex h-screen overflow-auto px-8 py-12 flex-col space-y-6 2xl:px-12 2xl:py-24">

      <!-- Actions -->
      <div class="flex gap-4 my-6 justify-between">
        <div>
          <h3 class="contentH-large mb-3">Editing Template</h3>
          <p class="subheader-small" v-if="template">Created at: {{formatDate(template.created_at)}}</p>
        </div>

        <div class="flex gap-4 ">

          <button class="btn-md uppercase" @click="handleUpdate">
            Save
          </button>
          <button class="btn-md-outline uppercase" @click="cancelEdit">
            Cancel
          </button>
        </div>
      </div>
    <div v-if="template" class="space-y-6">
      <!-- Editable Fields -->

      <div class="space-y-4">
        <h2 class="block header-small">
          Assessment Name
        </h2>
        <input
          v-model="editableTemplate.template_name"
          class="w-full topsets-text-input"
        />

        <h2 class="block header-small">
         Describe your assessment:
        </h2>
        <textarea
          v-model="editableTemplate.template_description"
          class="w-full topsets-text-input"
          rows="3"
        />
      </div>

      <!-- Drills Section -->
      <div>
        <h2 class="header-small">
          List of Drills:
        </h2>
         <div class="mt-4 mb-3  ">

           <p v-if="!template.drills?.length" class="text-center subheader-small mt-2">
          Click below to add drills...
        </p>
          <draggable
            class="flex flex-col gap-4 mb-5"
            v-model="editableTemplate.drills"
            handle=".handle"
            @start="drag = true"
            @end="drag = false"
            item-key="id"
          >
          <template #item="{ element, index }">
              <div v-if="element.type === 'multi-set'"
                class="gradient-bg border border-topsets-sectext dark:border-topsets-darksectext rounded-xl shadow-xl p-6 gap-6 2xl:gap-12 flex items-center"
              >
                <svg

                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 320 512"
                  fill="currentColor"
                  class="h-12 handle text-topsets-sectext dark:text-topsets-darksectext hover:cursor-move"
                >
                  <path
                    d="M40 352l48 0c22.1 0 40 17.9 40 40l0 48c0
                       22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0
                       -48c0-22.1 17.9-40 40-40zm192 0l48 0c22.1 0 40
                       17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1
                       0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 320
                       c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48
                       0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40
                       40l-48 0zM232 192l48 0c22.1 0 40 17.9 40 40l0
                       48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9
                       -40-40l0-48c0-22.1 17.9-40 40-40zM40 160c-22.1
                       0-40-17.9-40-40L0 72C0 49.9 17.9 32 40 32l48 0c22.1
                       0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48
                       0zM232 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1
                       -17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0
                       -48c0-22.1 17.9-40 40-40z"
                  />
                </svg>
                <div class="flex-1">
                  <div class="flex gap-3 items-center mb-4">
                    <div>
                      <input
                        type="text"
                        v-model="element.drill_name"
                        class="p-0 contentH-small text-topsets-sectext dark:text-topsets-darksectext border-0 bg-transparent focus:outline-none focus:ring-0 focus:border-0"
                      />
                      <p class="text-topsets-pritext dark:text-topsets-darkpritext capitalize">
                        {{ t('dashboard.tabs.program.planner.multipleExerciseGroup') }}
                      </p>
                    </div>

                    <div class="ms-auto space-y-3">
                      <div class="flex gap-4 justify-between items-end">
                        <label class="text-body">
                          Rounds:
                        </label>
                        <input
                          type="number"
                          v-model.number="element.rounds"
                          class="topsets-text-input w-16 border-0 focus:ring-0 pb-1 border-topsets-sectext dark:border-topsets-darksectext border-b focus:border-topsets-alternate rounded-none"
                          :placeholder="t('dashboard.tabs.program.planner.totalSetsPlaceholder')"
                        />
                      </div>
                      <div  class="flex gap-4 justify-between items-end">
                        <label class="text-body">
                          Control Metric:
                        </label>
                        <input
                          type="number"
                          v-model.number="element.metric"
                          class="topsets-text-input w-16 border-0 focus:ring-0 pb-1 border-topsets-sectext dark:border-topsets-darksectext border-b focus:border-topsets-alternate rounded-none"
                          :placeholder="t('dashboard.tabs.program.planner.recommendedRestPlaceholder')"
                        />
                      </div>


                    </div>
                  </div>

                  <div class="space-y-6 card border-0 bg-topsets-secbg dark:bg-topsets-darksecbg p-6">
                    <h3 class="text-body uppercase text-center">
                      {{ t('dashboard.tabs.program.planner.innerExercises') }}
                    </h3>
                    <div
                      v-for="(embed, eindex) in element.embeds"
                      class="gradient-bg border border-topsets-sectext dark:border-topsets-darksectext rounded-xl shadow-xl p-6 gap-6 2xl:gap-12 flex items-center"
                    >
                      <div class="flex-1">
                        <div class="flex gap-3 items-center mb-4">
                          <video
                            v-if="embed.media"
                            class="w-24 h-24 card border p-0 object-cover rounded-lg"
                            :src="embed.media"
                            ref="videoRef"
                            mutedgi
                            loop
                          ></video>
                          <div
                            v-else
                            class="w-24 h-24 card border flex items-center justify-center"
                          >
                            <p class="text-sm">{{ t('dashboard.tabs.program.planner.noMedia') }}</p>
                          </div>

                          <div>
                            <h2 class="contentH-small">{{ embed.drill_name }}</h2>
                            <p class="text-topsets-pritext dark:text-topsets-darkpritext capitalize">
                              {{ embed.type }} {{ t('dashboard.tabs.program.planner.exercise') }}
                            </p>
                          </div>

                        </div>
                      </div>
                    </div>

                    <ExerciseOffcanvas
                      @addExercises="handleAddEmbed(element, $event)"
                    />
                  </div>
                  <div class="flex justify-end ms-auto min-w-max mt-auto">
                    <button
                      class="hover:text-red-400 text-red-500"
                      @click="removeExercise(index)"
                    >
                      {{ t('dashboard.tabs.program.planner.removeExercise') }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-else
                class="card  rounded-xl shadow-xl p-6 gap-6 2xl:gap-12 flex items-center"
              >
                <svg

                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 320 512"
                  fill="currentColor"
                  class="h-6 handle text-topsets-sectext dark:text-topsets-darksectext hover:cursor-move"
                >
                  <path
                    d="M40 352l48 0c22.1 0 40 17.9 40 40l0 48c0
                       22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0
                       -48c0-22.1 17.9-40 40-40zm192 0l48 0c22.1 0 40
                       17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1
                       0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 320
                       c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48
                       0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40
                       40l-48 0zM232 192l48 0c22.1 0 40 17.9 40 40l0
                       48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9
                       -40-40l0-48c0-22.1 17.9-40 40-40zM40 160c-22.1
                       0-40-17.9-40-40L0 72C0 49.9 17.9 32 40 32l48 0c22.1
                       0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48
                       0zM232 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1
                       -17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0
                       -48c0-22.1 17.9-40 40-40z"
                  />
                </svg>
                <div class="flex-1">
                  <div class="flex gap-3 items-center mb-4">
                    <video
                      v-if="element.media"
                      class="w-24 h-24 card border p-0 object-cover rounded-lg"
                      :src="element.media"
                      ref="videoRef"
                      mutedgi
                      loop
                    ></video>
                    <div v-else class="w-24 h-24 card border flex items-center justify-center">
                      <p class="text-sm">{{ t('dashboard.tabs.program.planner.noMedia') }}</p>
                    </div>

                    <div>
                      <h2 class="contentH-small">{{ element.exercise_name }}</h2>
                      <p class="text-topsets-pritext dark:text-topsets-darkpritext capitalize">
                        {{ element.type }} {{ t('dashboard.tabs.program.planner.exercise') }}
                      </p>
                    </div>
                    <div class="ms-auto space-y-3 ">
                      <div  class="flex gap-4 justify-between items-end">
                        <label class="text-body min-w-max">
                          Control Unit:
                        </label>
                        <select
                          v-model="element.control_unit"
                          class="topsets-text-input border-0 focus:ring-0 pb-1 border-topsets-sectext dark:border-topsets-darksectext border-b focus:border-topsets-alternate rounded-none"
                        >
                        <option disabled :value=" undefined">Control Unit</option>
                        <option value="Reps">Reps</option>
                        <option value="Seconds">Seconds</option>
                        <option value="Minutes">Minutes</option>
                        <option value="Metres">Metres</option>
                        <option value="Miles">Miles</option>
                        <option value="Load(Kg)">Load(Kg)</option>
                        <option value="Load(Lb)">Load(Lb)</option>
                        <option value="Speed(Kmph)">Speed(Kmph)</option>
                        <option value="Speed(mph)">Speed(mph)</option>
                        <option value="RPE">RPE</option>
                        <option value="Heart Rate">Heart Rate</option>
                        <option value="RIR">RIR</option>
                      </select>
                      </div>
                      <div v class="flex gap-4 justify-between items-end">
                        <label class="text-body min-w-max">
                          Primary Variable Unit:
                        </label>
                        <select
                          v-model="element.primary_variable"
                          class="topsets-text-input border-0 focus:ring-0 pb-1 border-topsets-sectext dark:border-topsets-darksectext border-b focus:border-topsets-alternate rounded-none"
                        >
                        <option disabled :value=" undefined">Primary Unit</option>
                        <option value="Reps">Reps</option>
                        <option value="Seconds">Seconds</option>
                        <option value="Minutes">Minutes</option>
                        <option value="Load(Kg)">Load(Kg)</option>
                        <option value="Load(Lb)">Load(Lb)</option>
                        <option value="Speed(Kmph)">Speed(Kmph)</option>
                        <option value="Speed(mph)">Speed(mph)</option>
                        <option value="RPE">RPE</option>
                        <option value="Heart Rate">Heart Rate</option>
                        <option value="RIR">RIR</option>
                      </select>
                      </div>


                    </div>
                    <div class="ms-auto space-y-3">
                      <div class="flex gap-4 justify-between items-end">
                        <label class="text-body">
                          Rounds:
                        </label>
                        <input
                          type="number"
                          v-model.number="element.rounds"
                          class="topsets-text-input w-16 border-0 focus:ring-0 pb-1 border-topsets-sectext dark:border-topsets-darksectext border-b focus:border-topsets-alternate rounded-none"
                          :placeholder="t('dashboard.tabs.program.planner.totalSetsPlaceholder')"
                        />
                      </div>

                      <div  class="flex gap-4 justify-between items-end">
                        <label class="text-body">
                         Control Metric:
                        </label>
                        <input
                          type="number"
                          v-model.number="element.metric"
                          class="topsets-text-input w-16 border-0 focus:ring-0 pb-1 border-topsets-sectext dark:border-topsets-darksectext border-b focus:border-topsets-alternate rounded-none"
                          :placeholder="t('dashboard.tabs.program.planner.recommendedRestPlaceholder')"
                        />
                      </div>


                    </div>
                  </div>


                </div>
              </div>
            </template>
          </draggable>


        </div>
        <div class="text-center flex gap-3 items-center justify-center">
            <ExerciseOffcanvas @addExercises="handleAdd"  />

          </div>
      </div>

    </div>

    <!-- Loading or Error -->
    <div v-else class="text-center mt-24 text-lg">
      {{ t('general.loading') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTemplateStore } from '@/stores/templatestores';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import Swal from 'sweetalert2';
import { ref, onMounted , reactive, watch, defineProps, computed } from 'vue';
import { useProgramStore } from '@/stores/programstores';
import ExerciseOffcanvas from "@/components/Offcanvas/ExerciseOffcanvas.vue";
import { useUserStore } from '@/stores/user';
import draggable from 'vuedraggable';
import { debounce } from 'lodash';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const templateStore = useTemplateStore();
const drag = ref(true);
const templateId = route.params.id as string;
const template = ref<any>(null);
type Drill = {
  drill_name?: string;
  type?: string;
  metric?: number;
  rounds?: number;
  sets?: number;
  true_sets?: { primary_done: number; control_abide: boolean }[];
  primary_variable?: string;
  control_unit?: string;
  embeds?: Drill[];
};

const editableTemplate = ref<{
  template_name: string;
  template_description: string;
  drills: Drill[];
}>({
  template_name: '',
  template_description: '',
  drills: [],
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

const fetchTemplate = async () => {
  await templateStore.fetchTemplateById(templateId);
  if (templateStore.TemplateItem) {
    template.value = templateStore.TemplateItem;
    editableTemplate.value = {
      template_name: template.value.template_name,
      template_description: template.value.template_description,
      drills: JSON.parse(JSON.stringify(template.value.drills || [])) // ✅ ONLY THIS FIXED
    };
  } else {
    Swal.fire({
      icon: 'error',
      title: t('general.error'),
      text: t('dashboard.assessmentTemplates.view.notFound')
    });
    router.push({ name: 'programs-list' });
  }
};

const handleUpdate = async () => {
  console.log(editableTemplate.value)
  await templateStore.updateTemplate({
    ...template.value,
    template_name: editableTemplate.value.template_name,
    template_description: editableTemplate.value.template_description,
    drills: editableTemplate.value.drills
  });
  await fetchTemplate();
};

const cancelEdit = () => {
  editableTemplate.value = {
    template_name: template.value.template_name,
    template_description: template.value.template_description,
    drills: editableTemplate.value.drills
  };
};

const handleAdd = (list: any[]) => {
  editableTemplate.value.drills.push(
    ...list.map((e) => ({
      ...e,
      rounds: 1,
      metric: 5,
      true_sets: [
        { primary_done: 0, control_abide: true },
        { primary_done: 0, control_abide: true },
        { primary_done: 0, control_abide: true }
      ],
      primary_variable: "Load(Kg)",
      control_unit: "Reps"
    }))
  );
};

const removeExercise = (exerciseIndex: number) => {
  editableTemplate.value.drills.splice(exerciseIndex, 1);
};

const removeEmbed = (exercise: any, exerciseIndex: number) => {
  exercise.embeds.splice(exerciseIndex, 1);
};

const handleAddEmbed = (exercise: any, list: any[]) => {
  exercise.embeds.push(
    ...list.map((e) => ({
      ...e,
      rounds: exercise.sets,
      true_sets: [
        { primary_done: 0, control_abide: true },
        { primary_done: 0, control_abide: true },
        { primary_done: 0, control_abide: true }
      ]
    }))
  );
};

const handleAddMulti = () => {
  editableTemplate.value.drills.push({
    drill_name: 'Multi-Set',
    type: 'multi-set',
    metric: 90,
    rounds: 3,
    embeds: []
  });
};

onMounted(fetchTemplate);
</script>

