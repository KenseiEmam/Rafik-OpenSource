<template>
  <footer class=" text-white py-4 pb-16">
    <div class="container mx-auto flex flex-col md:flex-row items-center justify-between">
      <!-- Left: Logo -->
      <div class="mb-4 md:mb-0 flex-col items-center flex text-center">
        <!-- Replace with your logo image or component -->
        <img src="@/assets/ts-light-text.png" alt="Logo" class="h-24 2xl:h-44 rounded-full" />


      </div>
      <!-- Center: Navigation Links -->
      <div class="flex flex-col md:flex-row items-center text-xs 2xl:text-base gap-2 md:gap-6 mb-4 md:mb-0">
        <a href="/organizations" class="hover:text-topsets-pritext text-topsets-sectext">Organization</a>
        <a href="/coaches" class="hover:text-topsets-pritext text-topsets-sectext">Coach</a>
        <a href="/athletes" class="hover:text-topsets-pritext text-topsets-sectext">Athlete</a>
        <a href="/request-demo" class="hover:text-topsets-pritext text-topsets-sectext">Demo</a>
        <a href="/privacy-policy" class="hover:text-topsets-pritext text-topsets-sectext">{{ t('footer.privacyPolicy') }}</a>
        <a href="/delete-account" class="hover:text-topsets-pritext text-topsets-sectext">{{ t('footer.deleteAccount') }}</a>
      </div>
      <!-- Right: Language Selector -->
      <div>
        <select
          v-model="selectedLanguage"
          @change="changeLanguage"
          class="topsets-text-input text-white p-2 rounded"
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
