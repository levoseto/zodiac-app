<template>
  <div class="card status-card">
    <div class="card-header">
      <h2 class="card-title">
        Estado del Sistema
        <span class="status-indicator" :class="statusClass">
          <span class="status-dot"></span>
          {{ statusText }}
        </span>
      </h2>
      <button 
        class="btn btn-secondary btn-sm"
        @click="$emit('refresh')"
        :disabled="apiStatus.loading"
      >
        <svg v-if="apiStatus.loading" class="spinner" width="16" height="16" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Actualizar
      </button>
    </div>
    
    <!-- Status Grid -->
    <div class="status-grid">
      <!-- API Status -->
      <div class="status-item">
        <div class="status-item-header">
          <div class="status-item-icon" :class="apiStatusClass">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="status-item-title">API REST</div>
        </div>
        <div class="status-item-content">
          <div class="status-value" :class="apiStatusClass">
            {{ apiStatus.isOnline ? 'En línea' : 'Desconectada' }}
          </div>
          <div class="status-details">
            <div v-if="apiStatus.apiHealth">
              <div class="detail-item">
                <span class="detail-label">Servidor:</span>
                <span class="detail-value">{{ apiStatus.apiHealth.storage || 'AWS S3' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Versión SDK:</span>
                <span class="detail-value">{{ apiStatus.apiHealth.sdkVersion || 'v3' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Límite upload:</span>
                <span class="detail-value">{{ apiStatus.apiHealth.maxUpload || '200MB' }}</span>
              </div>
            </div>
            <div v-else-if="!apiStatus.loading" class="error-message">
              Sin conexión con la API
            </div>
          </div>
        </div>
      </div>
      
      <!-- S3 Status -->
      <div class="status-item">
        <div class="status-item-header">
          <div class="status-item-icon" :class="s3StatusClass">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
            </svg>
          </div>
          <div class="status-item-title">AWS S3</div>
        </div>
        <div class="status-item-content">
          <div class="status-value" :class="s3StatusClass">
            {{ s3StatusText }}
          </div>
          <div class="status-details">
            <div v-if="apiStatus.s3Status && apiStatus.s3Status.success">
              <div class="detail-item">
                <span class="detail-label">Bucket:</span>
                <span class="detail-value">{{ apiStatus.s3Status.config?.bucket || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Región:</span>
                <span class="detail-value">{{ apiStatus.s3Status.config?.region || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">SDK:</span>
                <span class="detail-value">{{ apiStatus.s3Status.config?.sdkVersion || 'v3' }}</span>
              </div>
            </div>
            <div v-else-if="apiStatus.s3Status && !apiStatus.s3Status.success" class="error-message">
              {{ apiStatus.s3Status.error || 'Error de configuración' }}
            </div>
            <div v-else-if="!apiStatus.loading" class="error-message">
              Estado desconocido
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Last Check -->
    <div v-if="apiStatus.lastCheck" class="status-footer">
      <small class="text-muted">
        Última verificación: {{ formatDate(apiStatus.lastCheck) }}
      </small>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatusCard',
  
  props: {
    apiStatus: {
      type: Object,
      required: true
    }
  },
  
  emits: ['refresh'],
  
  computed: {
    statusClass() {
      if (this.apiStatus.loading) return 'status-loading'
      if (this.apiStatus.isOnline && this.s3IsOnline) return 'status-online'
      if (this.apiStatus.isOnline && !this.s3IsOnline) return 'status-warning'
      return 'status-offline'
    },
    
    statusText() {
      if (this.apiStatus.loading) return 'Verificando...'
      if (this.apiStatus.isOnline && this.s3IsOnline) return 'Operativo'
      if (this.apiStatus.isOnline && !this.s3IsOnline) return 'Parcial'
      return 'Desconectado'
    },
    
    apiStatusClass() {
      return this.apiStatus.isOnline ? 'status-success' : 'status-error'
    },
    
    s3IsOnline() {
      return this.apiStatus.s3Status?.success === true
    },
    
    s3StatusClass() {
      if (!this.apiStatus.s3Status) return 'status-unknown'
      return this.apiStatus.s3Status.success ? 'status-success' : 'status-error'
    },
    
    s3StatusText() {
      if (!this.apiStatus.s3Status) return 'Desconocido'
      return this.apiStatus.s3Status.success ? 'Conectado' : 'Error'
    }
  },
  
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.status-card {
  border-left: 4px solid #667eea;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.status-online {
  color: #059669;
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.status-offline {
  color: #dc2626;
  background: #fef2f2;
  border-color: #fecaca;
}

.status-warning {
  color: #d97706;
  background: #fffbeb;
  border-color: #fed7aa;
}

.status-loading {
  color: #667eea;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 16px;
}

.status-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.status-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.status-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.status-item-icon.status-success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.status-item-icon.status-error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.status-item-icon.status-unknown {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.status-item-title {
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
}

.status-value {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.status-value.status-success {
  color: #059669;
}

.status-value.status-error {
  color: #dc2626;
}

.status-value.status-unknown {
  color: #6b7280;
}

.status-details {
  font-size: 0.875rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.detail-label {
  color: #6b7280;
}

.detail-value {
  color: #1f2937;
  font-weight: 500;
}

.error-message {
  color: #dc2626;
  font-size: 0.85rem;
  font-style: italic;
}

.status-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  text-align: center;
}

.text-muted {
  color: #6b7280;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .card-title {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .status-item {
    padding: 12px;
  }
  
  .status-item-icon {
    width: 36px;
    height: 36px;
  }
  
  .status-item-icon svg {
    width: 18px;
    height: 18px;
  }
}
</style>