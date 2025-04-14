import './assets/main.css';

import { createApp, type App as Application } from 'vue';
import { createI18n } from 'vue-i18n';
import * as EN from '@/i18n/en.json';
import * as AR from '@/i18n/ar.json';
import { createPinia } from 'pinia';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import App from './App.vue';
import router from './router';
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core';

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

/* import specific icons */
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';

import VueSweetalert2 from 'vue-sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/* add icons to the library */
library.add(faUserSecret);
type MessageSchema = typeof EN;
const i18n = createI18n<MessageSchema, 'en' | 'ar'>({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      ...EN
    },
    ar: {
      ...AR
    }
  }
});

const app = createApp(App);

const VueTelInputPlugin = {
  install(app: Application) {
    app.component('VueTelInput', VueTelInput);
  }
};

app.use(createPinia());
app.use(VueSweetalert2);
app.use(router);
app.component('font-awesome-icon', FontAwesomeIcon);
app.component('VueDatePicker', VueDatePicker);
app.use(i18n);

app.use(VueTelInputPlugin);
app.mount('#app');
