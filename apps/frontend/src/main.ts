import { createApp } from 'vue'
import '@fontsource-variable/manrope'
import '@fontsource/noto-sans-arabic/arabic-400.css'
import '@fontsource/noto-sans-arabic/arabic-600.css'
import './styles/utilities.css'
import './style.css'
import './styles/workspace.css'
import './styles/dashboard.css'
import './styles/nutrition.css'
import App from './App.vue'
import router from './app/router'
createApp(App).use(router).mount('#app')

import { registerAppUpdates } from './app/updates'
registerAppUpdates()
