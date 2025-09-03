<template>
  <header class="app-header">
    <div class="container">
      <div class="header-content">
        <!-- Logo y título -->
        <div class="header-brand">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="url(#gradient1)" stroke="white" stroke-width="2"/>
              <path d="M16 6L18 14H26L20 18L22 26L16 22L10 26L12 18L6 14H14L16 6Z" fill="white"/>
              <defs>
                <linearGradient id="gradient1" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#FFD700"/>
                  <stop offset="1" stop-color="#FFA500"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="brand-text">
            <h1 class="app-title">Zodiac Admin</h1>
            <p class="app-subtitle">Administrador de APK</p>
          </div>
        </div>
        
        <!-- Información de la app -->
        <div class="header-info">
          <div class="info-item">
            <span class="label">Versión:</span>
            <span class="value">{{ appVersion }}</span>
          </div>
          <div class="info-item">
            <span class="label">Ambiente:</span>
            <span class="value environment" :class="environmentClass">{{ environment }}</span>
          </div>
          <div class="info-item">
            <span class="label">Última actualización:</span>
            <span class="value">{{ lastUpdate }}</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  
  data() {
    return {
      lastUpdate: this.formatDate(new Date())
    }
  },
  
  computed: {
    appVersion() {
      return import.meta.env.VITE_APP_VERSION || '1.0.0'
    },
    
    environment() {
      return import.meta.env.MODE === 'development' ? 'Desarrollo' : 'Producción'
    },
    
    environmentClass() {
      return import.meta.env.MODE === 'development' ? 'env-dev' : 'env-prod'
    }
  },
  
  created() {
    // Actualizar la hora cada minuto
    setInterval(() => {
      this.lastUpdate = this.formatDate(new Date())
    }, 60000)
  },
  
  methods: {
    formatDate(date) {
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 16px 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-subtitle {
  font-size: 0.9rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
}

.header-info {
  display: flex;
  gap: 24px;
  align-items: center;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
}

.info-item .label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-item .value {
  font-size: 0.875rem;
  color: white;
  font-weight: 600;
}

.environment {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.environment.env-dev {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.environment.env-prod {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #86efac;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .header-info {
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
  }
  
  .app-title {
    font-size: 1.5rem;
  }
  
  .app-subtitle {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .header-info {
    gap: 12px;
  }
  
  .info-item .label {
    font-size: 0.7rem;
  }
  
  .info-item .value {
    font-size: 0.8rem;
  }
  
  .logo svg {
    width: 28px;
    height: 28px;
  }
  
  .app-title {
    font-size: 1.25rem;
  }
}
</style>