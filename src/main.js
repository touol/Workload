import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import PrimeVue from "primevue/config";
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import localeRu from './ru.json';

const app = createApp(App);

app.use(PrimeVue, { ripple: true, locale: localeRu.ru });
app.use(ToastService);
app.component('Toast', Toast);


app.mount('#workload')
