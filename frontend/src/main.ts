import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Ripple from 'primevue/ripple'
import Aura from '@primevue/themes/aura'
import './assets/styles/main.scss'
import App from './App.vue'
import { router } from './routers'
import { createPinia } from 'pinia'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
  },
})
app.use(ToastService)
app.directive('ripple', Ripple)

app.mount('#app')

