<template>
  <div class="alert" :class="alertClass" role="alert">
    <div class="alert-content">
      <!-- Icono -->
      <div class="alert-icon">
        <svg v-if="type === 'success'" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        <svg v-else-if="type === 'error'" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
        <svg v-else-if="type === 'warning'" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <svg v-else width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
      </div>
      
      <!-- Mensaje -->
      <div class="alert-message">
        {{ message }}
      </div>
      
      <!-- Botón cerrar -->
      <button 
        class="alert-close"
        @click="$emit('close')"
        aria-label="Cerrar alerta"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
    
    <!-- Barra de progreso para auto-cierre -->
    <div v-if="showProgress && autoCloseTime > 0" class="alert-progress">
      <div class="alert-progress-bar" :style="{ animationDuration: `${autoCloseTime}ms` }"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AlertMessage',
  
  props: {
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    message: {
      type: String,
      required: true
    },
    autoCloseTime: {
      type: Number,
      default: 5000
    },
    showProgress: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['close'],
  
  computed: {
    alertClass() {
      return `alert-${this.type}`
    }
  }
}
</script>

<style scoped>
.alert {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  border: 1px solid;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  overflow: hidden;
}

.alert-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.alert-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.alert-message {
  flex: 1;
  line-height: 1.5;
  word-break: break-word;
}

.alert-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.alert-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

/* Tipos de alerta */
.alert-success {
  background: #ecfdf5;
  border-color: #bbf7d0;
  color: #166534;
}

.alert-error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.alert-warning {
  background: #fffbeb;
  border-color: #fed7aa;
  color: #92400e;
}

.alert-info {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

/* Barra de progreso */
.alert-progress {
  height: 3px;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.alert-progress-bar {
  height: 100%;
  background: currentColor;
  width: 100%;
  animation: progressBar linear forwards;
  opacity: 0.6;
}

@keyframes progressBar {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Estados hover para cada tipo */
.alert-success .alert-close:hover {
  background: rgba(22, 101, 52, 0.1);
}

.alert-error .alert-close:hover {
  background: rgba(153, 27, 27, 0.1);
}

.alert-warning .alert-close:hover {
  background: rgba(146, 64, 14, 0.1);
}

.alert-info .alert-close:hover {
  background: rgba(30, 64, 175, 0.1);
}

/* Responsive */
@media (max-width: 480px) {
  .alert-content {
    padding: 12px;
    gap: 10px;
  }
  
  .alert-message {
    font-size: 13px;
  }
  
  .alert-icon svg {
    width: 18px;
    height: 18px;
  }
  
  .alert-close svg {
    width: 14px;
    height: 14px;
  }
}
</style>