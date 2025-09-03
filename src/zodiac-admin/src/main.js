import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/main.css'

const app = createApp(App)

// Configuración global de propiedades
app.config.globalProperties.$apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
app.config.globalProperties.$appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'

// Manejo global de errores
app.config.errorHandler = (err, vm, info) => {
  console.error('Error global de Vue:', err, info)
}

app.mount('#app')