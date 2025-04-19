<template>
  <div class="flex-1 space-y-6 py-6">
    <!-- Toolbar -->
    <div class="flex justify-between items-center gap-4 flex-wrap">
      <div class="flex text-rafik-pritext dark:text-rafik-darkpritext min-w-max gap-3 items-center">
        <input
          :disabled="admin"
          type="number"
          v-model.number="program.weekly_cycle"
          class="rafik-text-input w-16 text-right"
          :placeholder="t('dashboard.tabs.program.planner.dayCyclePlaceholder')"
        />
        <p>{{ t('dashboard.tabs.program.planner.dayCycleLabel') }}</p>
      </div>
      <!-- Tabs Navigation -->

            <draggable
        class="flex gap-4 mb-5"
        v-model="editedWorkouts"
        handle=".handle"
        @start="drag = true"
        @end="drag = false"
        item-key="index"
      >
        <template #item="{ element, index }">
          <button
            @click="activeTab = index"
            :class="activeTab === index ? 'border-rafik text-rafik-pritext dark:text-rafik-darkpritext' : 'text-rafik-sectext dark:text-rafik-darksectext border-transparent'"
            class="px-4 py-2 min-w-max border-b-2 flex items-center gap-2"
          >
            <svg v-if="isEditing" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" class="h-5 handle text-rafik-sectext dark:text-rafik-darksectext hover:cursor-move">
              <path d="M40 352l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zm192 0l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 320c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0zM232 192l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 160c-22.1 0-40-17.9-40-40L0 72C0 49.9 17.9 32 40 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0zM232 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40z"/>
            </svg>
            {{
          element.workout_name
            ? element.workout_name
            : element.rest_day
              ? t('dashboard.tabs.program.planner.restDay')
              : t('dashboard.tabs.program.planner.workout') + ' ' + (index + 1)
        }}
          </button>
        </template>
      </draggable>

      <div v-if="!admin" class="ms-auto">
        <button v-if="!isEditing" class="btn-sm-outline min-w-max" @click="enableEditMode">
          {{ t('dashboard.tabs.program.planner.editProgram') }}
        </button>
        <div v-else class="flex gap-2">
          <button class="btn-sm-outline" @click="cancelEdit">
            {{ t('dashboard.tabs.program.planner.cancel') }}
          </button>
          <button class="btn-sm" @click="submitChanges">
            {{ t('dashboard.tabs.program.planner.submit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Active Workout Content -->
    <div class="card p-0 flex flex-col" v-if="editedWorkouts.length">
      <label
        v-if="isEditing"
        class="flex items-center w-full mr-4 space-x-2 cursor-pointer border-b border-rafik-sectext dark:border-rafik-darksectext bg-rafik-secbg dark:bg-rafik-darksecbg p-8 rounded-t-xl"
      >
        <input type="checkbox" v-model="editedWorkouts[activeTab].rest_day" class="hidden" />
        <div
          class="w-12 h-6 flex items-center border-rafik-pritext dark:border-rafik-darkpritext border-2 rounded-full transition-all"
          :class="{ 'bg-rafik': editedWorkouts[activeTab].rest_day }"
        >
          <div
            class="w-6 h-6 bg-rafik-pritext dark:bg-rafik-darkpritext rounded-full shadow-md transform transition-transform"
            :class="{ 'translate-x-6': editedWorkouts[activeTab].rest_day }"
          ></div>
        </div>
        <p class="header-small text-sm">
          {{ t('dashboard.tabs.program.planner.restDay') }}
        </p>
      </label>

      <div class="p-8" v-if="!editedWorkouts[activeTab].rest_day">
        <!-- Editable Workout Fields -->
        <div class="flex justify-between items-center gap-6">
          <div class="w-2/3 space-y-3">
            <input
              v-if="isEditing"
              v-model="editedWorkouts[activeTab].workout_name"
              class="rafik-text-input border-0 bg-transparent text-rafik-sectext dark:text-rafik-darksectext focus:ring-0 pb-1 border-b focus:border-rafik-alternate rounded-none text-3xl text-rafik contentH-medium mb-2"
              :placeholder="t('dashboard.tabs.program.planner.workoutNamePlaceholder')"
            />
            <h3 v-else class="text-rafik contentH-medium">
              {{
                editedWorkouts[activeTab].workout_name ||
                t('dashboard.tabs.program.planner.editToAddName')
              }}
            </h3>

            <textarea
              v-if="isEditing"
              v-model="editedWorkouts[activeTab].workout_summary"
              class="rafik-text-input border-0 bg-transparent text-rafik-sectext dark:text-rafik-darksectext focus:ring-0 pb-1 border-b focus:border-rafik-alternate rounded-none mb-4"
              :placeholder="t('dashboard.tabs.program.planner.workoutSummaryPlaceholder')"
            ></textarea>
            <p v-else class="text-body mb-4">
              {{
                editedWorkouts[activeTab].workout_summary ||
                t('dashboard.tabs.program.planner.editToAddSummary')
              }}
            </p>
          </div>

          <div class="space-y-6 mb-auto">
            <div
              class="flex justify-between text-rafik-pritext dark:text-rafik-darkpritext w-full gap-12"
            >
              <p>{{ t('dashboard.tabs.program.planner.completionTimeMins') }}</p>
              <p class="text-rafik-secondary" v-if="!isEditing">
                {{
                  editedWorkouts[activeTab].time_to_complete + 'mins' ||
                  t('dashboard.tabs.program.planner.zeroMins')
                }}
              </p>
              <input
                v-if="isEditing"
                v-model="editedWorkouts[activeTab].time_to_complete"
                class="rafik-text-input border-0 bg-transparent text-rafik-sectext dark:text-rafik-darksectext mb-auto focus:ring-0 pb-1 border-b focus:border-rafik-alternate rounded-none"
                :placeholder="t('dashboard.tabs.program.planner.completionTimePlaceholder')"
              />
            </div>

            <div
              v-if="!isEditing"
              class="flex justify-between text-rafik-pritext dark:text-rafik-darkpritext w-full"
            >
              <p>{{ t('dashboard.tabs.program.planner.totalSets') }}</p>
              <p class="text-rafik-secondary">
                {{ calculateTotalSets(editedWorkouts[activeTab].exercises) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Editable Exercises -->
        <div class="mt-4 mb-3 p-6 bg-rafik-secbg dark:bg-rafik-darksecbg rounded-xl">
          <h4 class="header-small w-2/3 mx-auto text-center">
            {{ t('dashboard.tabs.program.planner.exercises') }}
          </h4>
          <h4 class="header-small mb-3 w-2/3 mx-auto text-center">••••••</h4>
          <h4
            v-if="editedWorkouts[activeTab].exercises.length === 0 && !isEditing"
            class="text-body text-center gap-2 mt-6 text-sm"
          >
            {{ t('dashboard.tabs.program.planner.noExercises') }}
          </h4>

          <draggable
            class="flex flex-col gap-4 mb-5"
            v-model="editedWorkouts[activeTab].exercises"
            handle=".handle"
            @start="drag = true"
            @end="drag = false"
            item-key="id"
          >
          <template #item="{ element, index }">
              <div v-if="element.type === 'multi-set'"
                class="gradient-bg border border-rafik-sectext dark:border-rafik-darksectext rounded-xl shadow-xl p-6 gap-6 2xl:gap-12 flex items-center"
              >
                <svg
                  v-if="isEditing"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 320 512"
                  fill="currentColor"
                  class="h-12 handle text-rafik-sectext dark:text-rafik-darksectext hover:cursor-move"
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
                      <h2 v-if="!isEditing" class="contentH-small">{{ element.exercise_name }}</h2>
                      <input
                        v-else
                        type="text"
                        v-model="element.exercise_name"
                        class="p-0 contentH-small text-rafik-sectext dark:text-rafik-darksectext border-0 bg-transparent focus:outline-none focus:ring-0 focus:border-0"
                      />
                      <p class="text-rafik-pritext dark:text-rafik-darkpritext capitalize">
                        {{ t('dashboard.tabs.program.planner.multipleExerciseGroup') }}
                      </p>
                    </div>

                    <div class="ms-auto space-y-3">
                      <div v-if="isEditing" class="flex gap-4 justify-between items-end">
                        <label class="text-body">
                          {{ t('dashboard.tabs.program.planner.totalSets') }}:
                        </label>
                        <input
                          type="number"
                          v-model.number="element.sets"
                          class="rafik-text-input w-16 border-0 focus:ring-0 pb-1 border-rafik-sectext dark:border-rafik-darksectext border-b focus:border-rafik-alternate rounded-none"
                          :placeholder="t('dashboard.tabs.program.planner.totalSetsPlaceholder')"
                        />
                      </div>
                      <div
                        v-else
                        class="flex justify-between gap-4 w-full text-rafik-sectext dark:text-rafik-darksectext"
                      >
                        <p>{{ t('dashboard.tabs.program.planner.totalSets') }}:</p>
                        <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                          {{ element.sets }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-6 card border-0 bg-rafik-secbg dark:bg-rafik-darksecbg p-6">
                    <h3 class="text-body uppercase text-center">
                      {{ t('dashboard.tabs.program.planner.innerExercises') }}
                    </h3>
                    <div
                      v-for="(embed, eindex) in element.embeds"
                      class="gradient-bg border border-rafik-sectext dark:border-rafik-darksectext rounded-xl shadow-xl p-6 gap-6 2xl:gap-12 flex items-center"
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
                            <h2 class="contentH-small">{{ embed.exercise_name }}</h2>
                            <p class="text-rafik-pritext dark:text-rafik-darkpritext capitalize">
                              {{ embed.type }} {{ t('dashboard.tabs.program.planner.exercise') }}
                            </p>
                          </div>

                          <div class="ms-auto space-y-3">
                            <div
                              class="flex justify-between gap-4 w-full text-rafik-sectext dark:text-rafik-darksectext text-body"
                            >
                              <p>{{ t('dashboard.tabs.program.planner.averageIntensity') }}</p>
                              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                                {{ embed.intensity }} kg
                              </p>
                            </div>

                            <div
                              class="flex justify-between gap-4 w-full text-rafik-sectext dark:text-rafik-darksectext text-body"
                            >
                              <p>{{ t('dashboard.tabs.program.planner.averageRepetitions') }}</p>
                              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                                {{ embed.reps }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div class="flex gap-6">
                          <div class="space-y-2 w-full">
                            <div
                              class="flex w-full justify-between items-end py-2 border-b border-rafik-pritext dark:border-rafik-darkpritext"
                            >
                              <h2 class="header-small text-sm w-12">
                                {{
                                  isEditing
                                    ? t('dashboard.tabs.program.planner.changeAll')
                                    : t('dashboard.tabs.program.planner.sets')
                                }}
                              </h2>
                              <div class="space-y-2">
                                <p
                                  class="text-rafik-pritext dark:text-rafik-darkpritext md:w-44 2xl:w-64"
                                >
                                  {{
                                    embed.type === 'cardio'
                                      ? t('dashboard.tabs.program.planner.speed')
                                      : t('dashboard.tabs.program.planner.loadKg')
                                  }}
                                </p>
                                <input
                                  v-if="isEditing"
                                  :disabled="!isEditing"
                                  type="number"
                                  @input="changeAll($event, embed.true_sets)"
                                  name="all-intensities"
                                  class="rafik-text-input border-0 focus:ring-0 pb-1 focus:border-rafik-alternate md:w-44 2xl:w-64"
                                  placeholder="-"
                                />
                              </div>
                              <div class="space-y-2">
                                <p
                                  class="text-rafik-pritext dark:text-rafik-darkpritext md:w-44 2xl:w-64"
                                >
                                  {{
                                    embed.type === 'cardio' || embed.type === 'isometric'
                                      ? t('dashboard.tabs.program.planner.time')
                                      : t('dashboard.tabs.program.planner.reps')
                                  }}
                                </p>
                                <input
                                  v-if="isEditing"
                                  :disabled="!isEditing"
                                  type="number"
                                  @input="changeAll($event, embed.true_sets)"
                                  name="all-reps"
                                  class="rafik-text-input border-0 focus:ring-0 pb-1 focus:border-rafik-alternate md:w-44 2xl:w-64"
                                  placeholder="-"
                                />
                              </div>
                            </div>

                            <div
                              class="flex w-full justify-between items-end py-2 border-b border-rafik-sectext dark:border-rafik-darksectext"
                              v-for="(set, sindex) in embed.true_sets"
                              :key="sindex"
                            >
                              <h2
                                class="header-small text-sm w-12 text-rafik-sectext dark:text-rafik-darksectext"
                              >
                                {{ t('dashboard.tabs.program.planner.set') }} {{ sindex + 1 }}
                              </h2>
                              <div class="space-y-2">
                                <input
                                  :disabled="!isEditing"
                                  type="number"
                                  v-model.number="set.intensity"
                                  class="rafik-text-input border-0 focus:ring-0 pb-1 focus:border-rafik-alternate md:w-44 2xl:w-64"
                                  placeholder="0"
                                />
                              </div>
                              <div class="space-y-2">
                                <input
                                  :disabled="!isEditing"
                                  type="number"
                                  v-model.number="set.reps"
                                  class="rafik-text-input border-0 focus:ring-0 pb-1 focus:border-rafik-alternate md:w-44 2xl:w-64"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            v-if="isEditing"
                            class="flex justify-between ms-auto min-w-max mt-auto"
                          >
                            <button
                              class="hover:text-red-400 text-red-500"
                              @click="removeEmbed(element, eindex)"
                            >
                              {{ t('dashboard.tabs.program.planner.removeExercise') }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <ExerciseOffcanvas
                      @addExercises="handleAddEmbed(element, $event)"
                      v-if="isEditing"
                    />
                  </div>
                  <div v-if="isEditing" class="flex justify-end ms-auto min-w-max mt-auto">
                    <button
                      class="hover:text-red-400 text-red-500"
                      @click="removeExercise(activeTab, index)"
                    >
                      {{ t('dashboard.tabs.program.planner.removeExercise') }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-else
                class="gradient-bg border border-rafik-sectext dark:border-rafik-darksectext rounded-xl shadow-xl p-6 gap-6 2xl:gap-12 flex items-center"
              >
                <svg
                  v-if="isEditing"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 320 512"
                  fill="currentColor"
                  class="h-12 handle text-rafik-sectext dark:text-rafik-darksectext hover:cursor-move"
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
                      v-if="element.media.endsWith('.mp4') || element.media.includes('video')"
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
                      <p class="text-rafik-pritext dark:text-rafik-darkpritext capitalize">
                        {{ element.type }} {{ t('dashboard.tabs.program.planner.exercise') }}
                      </p>
                    </div>

                    <div class="ms-auto space-y-3">
                      <div v-if="isEditing" class="flex gap-4 justify-between items-end">
                        <label class="text-body">
                          {{ t('dashboard.tabs.program.planner.totalSets') }}:
                        </label>
                        <input
                          type="number"
                          v-model.number="element.sets"
                          class="rafik-text-input w-16 border-0 focus:ring-0 pb-1 border-rafik-sectext dark:border-rafik-darksectext border-b focus:border-rafik-alternate rounded-none"
                          :placeholder="t('dashboard.tabs.program.planner.totalSetsPlaceholder')"
                        />
                      </div>
                      <div
                        v-else
                        class="flex justify-between gap-4 w-full text-rafik-sectext dark:text-rafik-darksectext"
                      >
                        <p>{{ t('dashboard.tabs.program.planner.totalSets') }}:</p>
                        <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                          {{ element.sets }}
                        </p>
                      </div>
                      <div
                        class="flex justify-between gap-4 w-full text-rafik-sectext dark:text-rafik-darksectext text-body"
                      >
                        <p>{{ t('dashboard.tabs.program.planner.averageIntensity') }}</p>
                        <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                          {{ element.intensity }} kg
                        </p>
                      </div>

                      <div
                        class="flex justify-between gap-4 w-full text-rafik-sectext dark:text-rafik-darksectext text-body"
                      >
                        <p>{{ t('dashboard.tabs.program.planner.averageRepetitions') }}</p>
                        <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                          {{ element.reps }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-6">
                    <div class="space-y-2 w-full">
                      <div
                        class="flex w-full justify-between items-end py-2 border-b border-rafik-pritext dark:border-rafik-darkpritext"
                      >
                        <h2 class="header-small text-sm w-12">
                          {{
                            isEditing
                              ? t('dashboard.tabs.program.planner.changeAll')
                              : t('dashboard.tabs.program.planner.sets')
                          }}
                        </h2>
                        <div class="space-y-2">
                          <p
                            class="text-rafik-pritext dark:text-rafik-darkpritext md:w-44 2xl:w-64"
                          >
                            {{
                              element.type === 'cardio'
                                ? t('dashboard.tabs.program.planner.speed')
                                : t('dashboard.tabs.program.planner.loadKg')
                            }}
                          </p>
                          <input
                            v-if="isEditing"
                            :disabled="!isEditing"
                            type="number"
                            @input="changeAll($event, element.true_sets)"
                            name="all-intensities"
                            class="rafik-text-input border-0 focus:ring-0 pb-1 md:w-44 2xl:w-64 focus:border-rafik-alternate"
                            placeholder="-"
                          />
                        </div>
                        <div class="space-y-2">
                          <p
                            class="text-rafik-pritext dark:text-rafik-darkpritext md:w-44 2xl:w-64"
                          >
                            {{
                              element.type === 'cardio' || element.type === 'isome'
                                ? t('dashboard.tabs.program.planner.time')
                                : t('dashboard.tabs.program.planner.reps')
                            }}
                          </p>
                          <input
                            v-if="isEditing"
                            :disabled="!isEditing"
                            type="number"
                            @input="changeAll($event, element.true_sets)"
                            name="all-reps"
                            class="rafik-text-input border-0 focus:ring-0 pb-1 md:w-44 2xl:w-64 focus:border-rafik-alternate"
                            placeholder="-"
                          />
                        </div>
                      </div>
                      <div
                        class="flex w-full justify-between items-end py-2 border-b border-rafik-sectext dark:border-rafik-darksectext"
                        v-for="(set, sindex) in element.true_sets"
                        :key="sindex"
                      >
                        <h2
                          class="header-small text-sm w-12 text-rafik-sectext dark:text-rafik-darksectext"
                        >
                          {{ t('dashboard.tabs.program.planner.set') }} {{ sindex + 1 }}
                        </h2>
                        <div class="space-y-2">
                          <input
                            :disabled="!isEditing"
                            type="number"
                            v-model.number="set.intensity"
                            class="rafik-text-input md:w-44 2xl:w-64 border-0 focus:ring-0 pb-1 focus:border-rafik-alternate"
                            :placeholder="t('dashboard.tabs.program.planner.kgsPlaceholder')"
                          />
                        </div>
                        <div class="space-y-2">
                          <input
                            :disabled="!isEditing"
                            type="number"
                            v-model.number="set.reps"
                            class="rafik-text-input md:w-44 2xl:w-64 border-0 focus:ring-0 pb-1 focus:border-rafik-alternate"
                            :placeholder="t('dashboard.tabs.program.planner.repsPlaceholder')"
                          />
                        </div>
                      </div>
                    </div>

                    <div v-if="isEditing" class="flex justify-between ms-auto min-w-max mt-auto">
                      <button
                        class="hover:text-red-400 text-red-500"
                        @click="removeExercise(activeTab, index)"
                      >
                        {{ t('dashboard.tabs.program.planner.removeExercise') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>

          <div class="text-center flex gap-3 items-center justify-between">
            <ExerciseOffcanvas @addExercises="handleAdd(activeTab, $event)" v-if="isEditing" />
            <button
              @click="handleAddMulti(activeTab)"
              v-if="isEditing"
              class="header-small p-4 border border-rafik-pritext dark:border-rafik-darkpritext rounded hover:opacity-70 text-sm"
            >
              {{ t('dashboard.tabs.program.planner.addMultiSet') }} +
              <br />
              <span class="text-sm text-rafik-sectext dark:text-rafik-darksectext">
                {{ t('dashboard.tabs.program.planner.supersetsCircuits') }}
              </span>
            </button>
          </div>
        </div>
      </div>
      <div v-else class="my-auto text-center text-rafik contentH-medium uppercase p-8">
        {{ t('dashboard.tabs.program.planner.restAndRecover') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, defineProps } from 'vue';
import { useProgramStore } from '@/stores/programstores';
import ExerciseOffcanvas from '../Offcanvas/ExerciseOffcanvas.vue';
import { useUserStore } from '@/stores/user';
import draggable from 'vuedraggable';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
// Success and Error Alerts
const { t , locale } = useI18n();
function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}
type Program = {
  id: string;
  program_name?: string;
  program_description?: string;
  program_focus?: string[]; // Add program_focus here (assumed to be an array of strings)
  status?: string;
  trainer_id?: number;
  difficulty_level?: string;
  avg_session_time?: number;
  avg_days_per_week?: number;
  overall_rating?: number;
  price_one?: number;
  price_three?: number;
  price_six?: number;
  price_year?: number;
  tags?: string[];
  workouts?: Workout[];
  program_photo?: string;
  weekly_cycle?: number;
  promos?: PromoCode[];
  induction?: Question[];
  follow?: Question[];
  referral?: string;
  // Add any other properties your program might have
};

interface Question {
  type: string;
  question?: string;
  answer?: any;
}
// Promo Codes
type PromoCode = {
  code: string;
  value: number;
};
type true_set = {
  intensity: number;
  reps: number;
  weight_done: number;
  reps_done: number;
};
type Exercise = {
  id: string;
  exercise_name?: string;
  type?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
  true_sets?: any[];
};
type Workout = {
  workout_name: string;
  workout_summary?: string;
  time_to_complete?: string;
  sets_per_session?: number;
  rest_day?: boolean;
  exercises: Exercise[];
};
const props = defineProps<{ program: Program; user?: number; admin?: boolean }>();
const programStore = useProgramStore();
const clientStore = useUserStore();
const isEditing = ref(false);
const activeTab = ref(0);
const drag = ref(true);
// Deep copy workouts to avoid mutating props directly
const editedWorkouts = ref(
  props.program.workouts ? JSON.parse(JSON.stringify(props.program.workouts)) : []
);

// Watch for changes in `props.program` and update `editedWorkouts`
watch(
  () => props.program.workouts,
  (newWorkouts) => {
    editedWorkouts.value = newWorkouts ? JSON.parse(JSON.stringify(newWorkouts)) : [];
  },
  { deep: true }
);

const enableEditMode = () => {
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editedWorkouts.value = props.program?.workouts
    ? JSON.parse(JSON.stringify(props.program.workouts))
    : [];
};
function changeAll(event: any, exercise: true_set[]) {
  if (event.target.name === 'all-intensities') {
    exercise.forEach((set: true_set) => (set.intensity = event.target.value));
  } else if (event.target.name === 'all-reps') {
    exercise.forEach((set: true_set) => (set.reps = event.target.value));
  }
}

const recalc = debounce(() => {
  editedWorkouts.value.forEach((workout: Workout) => {
    workout.exercises.forEach((exercise: any) => {
      const setCount = exercise.sets || 0;
      if (exercise.type === 'multi-set') {
        if (exercise.embeds && Array.isArray(exercise.embeds)) {
          // Process each embedded exercise
          exercise.embeds.forEach((embed: any) => {
            if (!Array.isArray(embed.true_sets)) {
              embed.true_sets = [];
            }
            // Ensure embed.true_sets array length matches the set count
            if (embed.true_sets.length !== setCount) {
              embed.true_sets = Array.from(
                { length: setCount },
                (_, i) =>
                  embed.true_sets[i] ?? { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 }
              );
            }
            // Calculate and store the average for this embed (for individual display, if needed)
            if (embed.true_sets.length > 0) {
              const totalReps = embed.true_sets.reduce(
                (sum: number, set: any) => sum + (Number(set.reps) || 0),
                0
              );
              const totalIntensity = embed.true_sets.reduce(
                (sum: number, set: any) => sum + (Number(set.intensity) || 0),
                0
              );
              embed.reps = Math.round(totalReps / embed.true_sets.length);
              embed.intensity = Math.round(totalIntensity / embed.true_sets.length);
            } else {
              embed.reps = 0;
              embed.intensity = 0;
            }
          });
        }
      } else {
        // Standard exercise processin
        if (!Array.isArray(exercise.true_sets)) {
          exercise.true_sets = [];
        }
        if (exercise.true_sets.length !== setCount) {
          exercise.true_sets = Array.from(
            { length: setCount },
            (_, i) =>
              exercise.true_sets[i] ?? { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 }
          );
        }
        if (exercise.true_sets.length > 0) {
          const totalReps = exercise.true_sets.reduce(
            (sum: number, set: any) => sum + (Number(set.reps) || 0),
            0
          );
          const totalIntensity = exercise.true_sets.reduce(
            (sum: number, set: any) => sum + (Number(set.intensity) || 0),
            0
          );
          exercise.reps = Math.round(totalReps / exercise.true_sets.length);
          exercise.intensity = Math.round(totalIntensity / exercise.true_sets.length);
        } else {
          exercise.reps = 0;
          exercise.intensity = 0;
        }
      }
    });
  });
}, 500);

const submitChanges = () => {
  isEditing.value = false;
  const workoutDays = editedWorkouts.value.filter((workout: any) => !workout.rest_day).length;
  // Update avg_session_time
  const completedSessions = editedWorkouts.value
    .filter((workout: any) => workout.time_to_complete)
    .map((workout: any) => parseInt(workout.time_to_complete, 10) || 0);
  let totalTime = 0;
  if (completedSessions.length > 0) {
    totalTime = completedSessions.reduce((sum: any, time: any) => sum + time, 0);
  }
  if (!props.user)
    programStore
      .updateProgram({
        ...props.program,
        workouts: editedWorkouts.value,
        avg_days_per_week: Math.ceil((workoutDays / (props.program.weekly_cycle || 1)) * 7),
        avg_session_time: totalTime / workoutDays
      })
      .then(() => {
        showSuccess('Workout Plan Updated Successfully');
      });
  else {
    updateClientProgram(props.user);
  }
};
// Function to update client workout plan
async function updateClientProgram(user: number) {
  if (!props.program.id) return;

  try {
    await clientStore.updateClientProgram({
      id: props.program.id,
      workouts: editedWorkouts.value,
      weekly_cycle: props.program.weekly_cycle
    });

    await clientStore.getClient(user);
  } catch (error) {
    showError(`Error updating Client program:` + error);
  }
}
const calculateTotalSets = (exercises: any[]) =>
  exercises.reduce((total, ex) => total + (ex.sets || 0), 0);

const removeExercise = (workoutIndex: number, exerciseIndex: number) => {
  editedWorkouts.value[workoutIndex].exercises.splice(exerciseIndex, 1);
};
const removeEmbed = (exercise: any, exerciseIndex: number) => {
  exercise.embeds.splice(exerciseIndex, 1);
};

const handleAdd = (workoutIndex: number, list: any[]) => {
  editedWorkouts.value[workoutIndex].exercises.push(
    ...list.map((e) => ({
      ...e,
      sets: 3,
      reps: 0,
      intensity: 0,
      true_sets: [
        { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 },
        { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 },
        { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 }
      ]
    }))
  );
};
const handleAddEmbed = (exercise: any, list: any[]) => {
  exercise.embeds.push(
    ...list.map((e) => ({
      ...e,
      sets: exercise.sets,
      reps: 0,
      intensity: 0,
      true_sets: [
        { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 },
        { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 },
        { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 }
      ]
    }))
  );
};
const handleAddMulti = (workoutIndex: number) => {
  editedWorkouts.value[workoutIndex].exercises.push({
    exercise_name: 'Multi-Set',
    type: 'multi-set',
    sets: 3,
    embeds: []
  });
};
watch(
  () => editedWorkouts.value,
  () => {
    recalc();
  },
  { deep: true }
);

// Microcycle swap function
// --- Weekly Cycle Change Handler (DO NOT MODIFY ORIGINAL CODE ABOVE) ---

// Debounce timer reference
let weeklyCycleDebounceTimer: ReturnType<typeof setTimeout>;

// Store the previous weekly cycle value
let previousWeeklyCycle = props.program.weekly_cycle;

// Watch for changes to weekly_cycle with a debounce
watch(
  () => props.program.weekly_cycle,
  (newVal, oldVal) => {
    if (weeklyCycleDebounceTimer) clearTimeout(weeklyCycleDebounceTimer);
    weeklyCycleDebounceTimer = setTimeout(async () => {
      // If the new value is 0, null, or empty, revert to the previous value and exit
      if (!newVal || newVal === 0) {
        props.program.weekly_cycle = previousWeeklyCycle;
        return;
      }

      const currentWorkoutCount = editedWorkouts.value.length;

      // If increasing the cycle, add default workouts until the count matches newVal
      if (newVal > currentWorkoutCount) {
        const countToAdd = newVal - currentWorkoutCount;
        for (let i = 0; i < countToAdd; i++) {
          editedWorkouts.value.push({
            workout_name: '',
            workout_summary: '',
            time_to_complete: '',
            rest_day: false,
            exercises: []
          });
        }
        previousWeeklyCycle = newVal;
        submitChanges();
      }
      // If decreasing the cycle, confirm before removing extra workouts
      else if (newVal < currentWorkoutCount) {
        const result = await Swal.fire({
          title: 'Warning!',
          text: 'The new cycle is smaller and workouts that are deleted will be permanently lost. Do you want to continue?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, proceed',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#CB901C',
          cancelButtonColor: '#d33',
          background: '#081411',
          color: '#E8F3ED'
        });
        if (result.isConfirmed) {
          editedWorkouts.value = editedWorkouts.value.slice(0, newVal);
          previousWeeklyCycle = newVal;
          submitChanges();
        } else {
          // If cancelled, revert weekly_cycle to the previous value
          props.program.weekly_cycle = previousWeeklyCycle;
        }
      }
      // If the cycle number remains the same as the workout count
      else {
        previousWeeklyCycle = newVal;
        submitChanges();
      }
    }, 300); // 300ms debounce delay
  }
);
</script>
