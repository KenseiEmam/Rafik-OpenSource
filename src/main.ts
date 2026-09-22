import { createApp } from 'vue'
import '@fontsource-variable/manrope'
import '@fontsource/noto-sans-arabic/arabic-400.css'
import '@fontsource/noto-sans-arabic/arabic-600.css'
import './style.css'
import App from './App.vue'
import router from './app/router'
createApp(App).use(router).mount('#app')

// Cache only the public application shell. Auth and workout responses are never cached.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Local records remain available if shell caching is unsupported. */
    })
  })
}
