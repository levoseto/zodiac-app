<template>
  <div class="status-card">
    <div class="status-indicator" :class="apiStatus === 'online' ? 'status-online' : 'status-offline'">
      <i :class="apiStatus === 'online' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
      <span>API Status: {{ apiStatus === 'online' ? 'Conectado' : 'Desconectado' }}</span>
      <span v-if="lastCheck">(Última verificación: {{ formatDate(lastCheck) }})</span>
    </div>
  </div>
</template>

<script>
import { formatDate } from '@/utils/formatters'

export default {
  name: 'StatusCard',
  props: {
    apiStatus: {
      type: String,
      required: true
    },
    lastCheck: {
      type: Date,
      default: null
    }
  },
  setup() {
    return {
      formatDate
    }
  }
}
</script>