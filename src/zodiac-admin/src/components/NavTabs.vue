<template>
  <div class="nav-tabs-container">
    <div class="card">
      <nav class="tabs">
        <ul class="tabs-nav">
          <li 
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-item"
          >
            <a 
              href="#"
              class="tab-link"
              :class="{ active: activeTab === tab.id }"
              @click.prevent="$emit('change-tab', tab.id)"
            >
              <span class="tab-icon" v-html="tab.icon"></span>
              <span class="tab-text">{{ tab.label }}</span>
              <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NavTabs',
  
  props: {
    activeTab: {
      type: String,
      required: true
    }
  },
  
  emits: ['change-tab'],
  
  data() {
    return {
      tabs: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: `<svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
                </svg>`,
          badge: null
        },
        {
          id: 'upload',
          label: 'Subir APK',
          icon: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>`,
          badge: null
        },
        {
          id: 'versions',
          label: 'Versiones',
          icon: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>`,
          badge: null
        }
      ]
    }
  }
}
</script>

<style scoped>
.nav-tabs-container {
  margin-bottom: 0;
}

.tabs {
  border-bottom: none;
  margin-bottom: 0;
}

.tabs-nav {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 2px;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
}

.tab-item {
  flex: 1;
}

.tab-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  color: #6b7280;
  border-radius: 6px;
  transition: all 0.2s ease;
  background: transparent;
  border: 1px solid transparent;
  position: relative;
  min-height: 48px;
}

.tab-link:hover {
  color: #374151;
  background: rgba(255, 255, 255, 0.5);
}

.tab-link.active {
  color: #667eea;
  background: white;
  border-color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tab-text {
  font-weight: 500;
}

.tab-badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

.tab-link.active .tab-badge {
  background: #667eea;
}

/* Responsive */
@media (max-width: 768px) {
  .tabs-nav {
    gap: 1px;
    padding: 2px;
  }
  
  .tab-link {
    padding: 10px 12px;
    flex-direction: column;
    gap: 4px;
    min-height: 60px;
  }
  
  .tab-text {
    font-size: 12px;
  }
  
  .tab-icon svg {
    width: 16px;
    height: 16px;
  }
}

@media (max-width: 480px) {
  .tab-link {
    padding: 8px 6px;
    gap: 2px;
  }
  
  .tab-text {
    font-size: 11px;
  }
  
  .tab-icon svg {
    width: 14px;
    height: 14px;
  }
}

/* Animaciones */
.tab-link {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-link:hover {
  transform: translateY(-1px);
}

.tab-link.active {
  animation: activeTab 0.3s ease-out;
}

@keyframes activeTab {
  0% {
    transform: scale(0.95);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Estados de focus para accesibilidad */
.tab-link:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.tab-link:focus:not(:hover) {
  background: rgba(102, 126, 234, 0.05);
}
</style>