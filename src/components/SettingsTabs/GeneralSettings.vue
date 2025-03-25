<template>
  <div class="flex-1 2xl:space-y-16 space-y-6 pb-6 h-full">
    <div class="grid grid-cols-5 gap-6">
      <div class="flex flex-col col-span-3 card p-6 gap-3 pl-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">
          {{ t('dashboard.tabs.settings.general.unitsAndMeasurements') }}
        </h3>
        <p class="text-body">{{ t('dashboard.tabs.settings.general.unitsExplanation') }}</p>
      </div>

      <div class="flex flex-col card col-span-2 p-6 gap-3 pl-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">
          {{ t('dashboard.tabs.settings.general.languages') }}
        </h3>
        <p class="text-body">{{ t('dashboard.tabs.settings.general.languageExplanation') }}</p>
        <div class="w-32 2xl:w-64">
          <select v-model="localSettings.language" name="language-select" class="rafik-text-input">
            <option value="en">{{ t('dashboard.tabs.settings.general.english') }}</option>
            <option value="ar" disabled>{{ t('dashboard.tabs.settings.general.arabic') }}</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col card col-span-5 p-6 gap-3 pl-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">
          {{ t('dashboard.tabs.settings.general.theme') }}
        </h3>
        <p class="text-body">{{ t('dashboard.tabs.settings.general.themeExplanation') }}</p>
        <div class="flex items-center gap-4">
          <p class="capitalize">
            {{
              localSettings.dark_mode
                ? t('dashboard.tabs.settings.general.coolNight')
                : t('dashboard.tabs.settings.general.warmSunshine')
            }}
          </p>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="localSettings.dark_mode" class="hidden" />
            <div
              class="w-16 h-8 flex items-center bg-rafik-secondary dark:bg-rafik-alternate border-rafik-sectext dark:border-rafik-darksectext border-2 rounded-full transition-all"
            >
              <div
                class="w-8 h-8 bg-rafik-sectext dark:bg-rafik-darksectext dark:bg-rafik-darksectext flex items-center justify-center rounded-full shadow-md transform transition-transform"
                :class="{ 'translate-x-8': localSettings.dark_mode }"
              >
                <transition name="fade">
                  <svg
                    v-if="localSettings.dark_mode"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 384 512"
                    fill="currentColor"
                    class="w-3 text-rafik-alternate"
                  >
                    <path
                      d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                    class="w-3 text-rafik-secondary"
                  >
                    <path
                      d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"
                    />
                  </svg>
                </transition>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <div class="card p-8 header-small">
      <a href="https://www.rafikapp.ae/delete-account" class="text-red-500">{{
        t('dashboard.tabs.settings.general.deleteAccount')
      }}</a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, nextTick, computed } from 'vue';
import { useSettingsStore } from '@/stores/settingstores';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const useSettings = useSettingsStore();
const user_id = localStorage.getItem('UserID');

interface Settings {
  units: number;
  language: string;
  dark_mode: boolean;
}

const defaultSettings: Settings = {
  units: 0,
  language: 'en',
  dark_mode: true
};

const localSettings = ref<Settings>({ ...defaultSettings });
const skipInitialUpdate = ref(true);

// Create a computed property that returns a JSON string of localSettings for deep comparison
const localSettingsStr = computed(() => JSON.stringify(localSettings.value));

onMounted(async () => {
  let storeSettings: Partial<Settings> = {};
  if (useSettings.settings) {
    storeSettings = useSettings.settings as Partial<Settings>;
  } else if (user_id) {
    await useSettings.fetchSettings(user_id);
    if (useSettings.settings) {
      storeSettings = useSettings.settings as Partial<Settings>;
    }
  }
  localSettings.value = { ...defaultSettings, ...storeSettings };
  await nextTick();
  // Now allow updates from user changes (skipInitialUpdate prevents update on initial load)
  skipInitialUpdate.value = false;
});

// Watch the computed JSON string of localSettings
watch(localSettingsStr, async (newStr, oldStr) => {
  if (skipInitialUpdate.value) return;
  if (newStr !== oldStr) {
    const newSettings = JSON.parse(newStr);
    await useSettings.updateSettings(newSettings);
  }
});
</script>

<style scoped></style>
