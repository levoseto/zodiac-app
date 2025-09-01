import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/main.css'

const app = createApp(App)

// Configuración global
app.config.globalProperties.$apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

app.mount('#app')