# Zodiac Admin - Administrador Web de APK

Panel de administración web desarrollado con Vue.js 3 para gestionar las versiones de la aplicación Zodiac mediante la API REST de Node.js. Permite subir, administrar y descargar archivos APK con integración completa a AWS S3.

## 🚀 Características Principales

- **Dashboard Interactivo**: Visualización de estadísticas, última versión y uso del almacenamiento
- **Subida de APK**: Soporte para archivos hasta 200MB con upload directo a AWS S3
- **Gestión de Versiones**: Lista completa con descarga, copia de enlaces y eliminación
- **Upload Inteligente**: Selección automática entre upload tradicional y directo a S3 según el tamaño
- **Interfaz Responsive**: Optimizada para desktop, tablet y móvil
- **Sistema de Alertas**: Notificaciones en tiempo real de todas las operaciones
- **Monitoreo de Estado**: Verificación del estado de la API y AWS S3

## 🛠️ Tecnologías Utilizadas

- **Vue.js 3** (Composition API)
- **Vite** (Build tool y dev server)
- **Axios** (Cliente HTTP)
- **CSS3** (Styling con variables y gradientes)
- **JavaScript ES6+**

## 📋 Prerequisitos

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **API REST** de Zodiac Updater ejecutándose
- **AWS S3** configurado (opcional para desarrollo)

## ⚙️ Instalación

### 1. Clonar o crear el proyecto

```bash
mkdir zodiac-admin
cd zodiac-admin
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones:

```env
# URL de la API del Zodiac Updater
VITE_API_BASE_URL=http://localhost:3000/api

# Configuración de la aplicación
VITE_APP_TITLE=Zodiac Admin
VITE_APP_VERSION=1.0.0

# Configuración de desarrollo
VITE_DEV_MODE=true
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

## 🏗️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo con hot-reload

# Producción
npm run build        # Construye la aplicación para producción
npm run preview      # Previsualiza la build de producción localmente
```

## 📁 Estructura del Proyecto

```
zodiac-admin/
├── public/
│   └── zodiac-icon.svg         # Icono de la aplicación
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css        # Estilos globales y utilidades
│   ├── components/
│   │   ├── AlertMessage.vue    # Sistema de alertas
│   │   ├── AppHeader.vue       # Encabezado de la aplicación
│   │   ├── DashboardTab.vue    # Tab del dashboard principal
│   │   ├── NavTabs.vue         # Navegación por pestañas
│   │   ├── StatusCard.vue      # Tarjeta de estado del sistema
│   │   ├── UploadTab.vue       # Tab de subida de APK
│   │   └── VersionsTab.vue     # Tab de gestión de versiones
│   ├── services/
│   │   └── ApiService.js       # Cliente para la API REST
│   ├── utils/
│   │   └── formatters.js       # Utilidades de formato
│   ├── App.vue                 # Componente raíz
│   └── main.js                 # Punto de entrada de la aplicación
├── .env.example                # Variables de entorno de ejemplo
├── index.html                  # HTML principal
├── package.json               # Dependencias y scripts
├── vite.config.js             # Configuración de Vite
└── README.md                  # Documentación del proyecto
```

## 🎯 Funcionalidades Detalladas

### Dashboard
- **Estadísticas**: Número total de versiones, espacio utilizado, promedio por APK
- **Última Versión**: Información detallada con descarga directa
- **Uso de S3**: Progreso visual del uso del free tier de AWS
- **Estado del Sistema**: Monitoreo en tiempo real de API y S3

### Subida de APK
- **Drag & Drop**: Interfaz intuitiva para seleccionar archivos
- **Validación**: Verificación de formato APK y tamaño máximo
- **Versionado Semántico**: Soporte completo para semver (1.0.0, 2.1.3-beta, etc.)
- **Upload Inteligente**: 
  - Archivos < 50MB: Upload tradicional via API
  - Archivos ≥ 50MB: Upload directo a AWS S3
- **Progreso en Tiempo Real**: Barra de progreso con velocidad y tiempo estimado
- **Configuración Avanzada**: Android mínimo, Target SDK, notas de versión

### Gestión de Versiones
- **Lista Completa**: Todas las versiones ordenadas por fecha
- **Información Detallada**: Tamaño, fecha, compatibilidad Android
- **Acciones Rápidas**: Descarga, copia de enlace, eliminación
- **Confirmación Segura**: Modal de confirmación para eliminaciones
- **Indicador de Última**: Destacado visual de la versión más reciente

## 🔧 Configuración Avanzada

### Personalización de Estilos

Los estilos principales están en `src/assets/styles/main.css` y utilizan:

- **Variables CSS** para colores y espaciado
- **Gradientes** para botones y elementos destacados
- **Responsive Design** con breakpoints mobile-first
- **Animaciones CSS** para transiciones suaves

### Configuración de API

El archivo `src/services/ApiService.js` centraliza todas las llamadas a la API:

```javascript
// Cambiar la URL base de la API
const apiService = new ApiService()
apiService.baseURL = 'https://tu-api.vercel.app/api'
```

### Variables de Entorno

```env
# Requeridas
VITE_API_BASE_URL=http://localhost:3000/api

# Opcionales
VITE_APP_TITLE=Mi Admin Panel
VITE_APP_VERSION=2.0.0
VITE_DEV_MODE=false
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. **Preparar el build**:
```bash
npm run build
```

2. **Conectar con Vercel**:
```bash
npx vercel --prod
```

3. **Configurar variables de entorno** en Vercel Dashboard:
   - `VITE_API_BASE_URL`: URL de tu API en producción
   - `VITE_APP_VERSION`: Versión actual

### Netlify

1. **Build y deploy**:
```bash
npm run build
# Subir la carpeta 'dist' a Netlify
```

### Servidor Web Tradicional

```bash
npm run build
# Copiar contenido de 'dist/' a tu servidor web
```

## 🔍 Troubleshooting

### Problemas Comunes

**Error de CORS**:
```
Access to XMLHttpRequest at 'API_URL' from origin 'localhost:3001' has been blocked
```
*Solución*: Configurar CORS en la API Node.js para permitir el origen del frontend.

**API no disponible**:
```
Network Error / API no disponible
```
*Solución*: Verificar que la API esté ejecutándose en la URL configurada en `VITE_API_BASE_URL`.

**Upload falla en archivos grandes**:
```
Request Entity Too Large
```
*Solución*: El administrador automáticamente usa upload directo a S3 para archivos grandes. Verificar configuración de AWS.

### Debug Mode

Para habilitar logs detallados, abrir DevTools del navegador:

```javascript
// En la consola del navegador
localStorage.setItem('debug', 'true')
location.reload()
```

## 🤝 Contribución

### Agregar Nueva Funcionalidad

1. **Crear componente**:
```bash
# Nuevo componente en src/components/
touch src/components/NuevoComponente.vue
```

2. **Registrar en App.vue**:
```vue
import NuevoComponente from './components/NuevoComponente.vue'
```

3. **Agregar endpoint en ApiService**:
```javascript
// src/services/ApiService.js
async nuevaFuncion() {
  const response = await this.axios.get('/nuevo-endpoint')
  return response.data
}
```

### Estructura de Commits

```
feat: nueva funcionalidad para gestión de usuarios
fix: corregir problema de upload en Safari
docs: actualizar documentación de instalación
style: mejorar responsive design en móviles
```

## 📚 API Endpoints Utilizados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/health` | Estado de la API |
| `GET` | `/api/s3/status` | Estado de AWS S3 |
| `GET` | `/api/stats` | Estadísticas de uso |
| `GET` | `/api/version/latest` | Última versión publicada |
| `GET` | `/api/versions` | Todas las versiones |
| `POST` | `/api/upload` | Upload tradicional |
| `POST` | `/api/upload/presigned` | URL firmada para S3 |
| `POST` | `/api/upload/confirm` | Confirmar upload a S3 |
| `GET` | `/api/download/:version` | Descargar APK |
| `DELETE` | `/api/version/:version` | Eliminar versión |

## 📄 Licencia

Este proyecto es parte del sistema Zodiac App Updater. Desarrollado para la gestión interna de aplicaciones móviles.

## 🆘 Soporte

Para soporte técnico:

1. **Revisar logs** en la consola del navegador
2. **Verificar estado** de la API en `/api/health`
3. **Comprobar configuración** de variables de entorno
4. **Consultar documentación** de la API Node.js

---

**Zodiac Admin v1.0.0** - Panel de administración web para gestión de APK con Vue.js 3 y AWS S3