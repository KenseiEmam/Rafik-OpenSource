<template>
  <footer class=" text-white py-4 pb-16">
    <div class="container mx-auto flex flex-col md:flex-row items-center justify-between">
      <!-- Left: Logo -->
      <div class="mb-4 md:mb-0 flex-col items-center ">
        <!-- Replace with your logo image or component -->
        <img src="@/assets/rafik.png" alt="Logo" class="h-16 2xl:h-32" />
        <div class="flex gap-4">
          <h1 class="header-small">RAFIK </h1>
        <p class="subheader-small text-xs w-28">Your Personal Fitness Squire</p>
        </div>

      </div>
      <!-- Center: Navigation Links -->
      <div class="flex text-xs 2xl:text-base space-x-6 mb-4 md:mb-0">
        <a href="/about" class="hover:text-rafik-darkpritext text-rafik-darksectext">Organization</a>
        <a href="/application" class="hover:text-rafik-darkpritext text-rafik-darksectext">Coach</a>
        <a href="/contact" class="hover:text-rafik-darkpritext text-rafik-darksectext">Athlete</a>
        <a href="/contact" class="hover:text-rafik-darkpritext text-rafik-darksectext">Demo</a>
        <a href="/privacy-policy" class="hover:text-rafik-darkpritext text-rafik-darksectext">{{ t('footer.privacyPolicy') }}</a>
        <a href="/delete-account" class="hover:text-rafik-darkpritext text-rafik-darksectext">{{ t('footer.deleteAccount') }}</a>
      </div>
      <!-- Right: Language Selector -->
      <div>
        <select
          v-model="selectedLanguage"
          @change="changeLanguage"
          class="rafik-text-input text-white p-2 rounded"
        >
          <option value="en">🇺🇸 English</option>
          <option value="ar">🇸🇦 العربية</option>
        </select>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, watch , onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

// Initialize selected language from localStorage (default to 'en' if not set)
const selectedLanguage = ref(localStorage.getItem('language') || 'en');

// When selectedLanguage changes, update the i18n locale and localStorage.
watch(selectedLanguage, (newLang) => {
  locale.value = newLang;
  localStorage.setItem('language', newLang);
});

onMounted(()=>{
  selectedLanguage.value = localStorage.getItem('language') || 'en'
  if(selectedLanguage)
  locale.value = selectedLanguage.value
})
// Optionally, you can handle the change event here if needed.
function changeLanguage() {
  // The watch handler will update locale and localStorage.
}
</script>

<style scoped>
/* You can add additional styles here */
</style>
