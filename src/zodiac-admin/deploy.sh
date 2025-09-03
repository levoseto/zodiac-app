#!/bin/bash

# Script de deployment para Vercel
# Zodiac Admin - Panel de administración Vue.js

echo "🚀 Iniciando deployment de Zodiac Admin a Vercel..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar errores
error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Función para mostrar advertencias
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
fi

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado. Instálalo desde https://nodejs.org/"
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    error "npm no está instalado."
fi

info "Verificando versiones..."
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    info "Instalando dependencias..."
    npm install || error "Fallo al instalar dependencias"
    success "Dependencias instaladas"
else
    info "Verificando dependencias actualizadas..."
    npm ci || warning "Algunas dependencias pueden estar desactualizadas"
fi

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    warning "Vercel CLI no está instalado. Instalando..."
    npm install -g vercel || error "No se pudo instalar Vercel CLI"
    success "Vercel CLI instalado"
fi

# Construir el proyecto para verificar que no hay errores
info "Construyendo proyecto para verificación..."
npm run build || error "Fallo en el build del proyecto"
success "Build exitoso"

# Verificar archivos de configuración
info "Verificando configuración de Vercel..."

if [ ! -f "vercel.json" ]; then
    error "No se encontró vercel.json. Este archivo es necesario para el deployment."
fi

if [ ! -f ".env.production" ]; then
    warning ".env.production no encontrado. Recuerda configurar las variables de entorno en Vercel Dashboard."
fi

success "Configuración verificada"

# Preguntar por el tipo de deployment
echo ""
echo "Selecciona el tipo de deployment:"
echo "1) Preview (desarrollo/testing)"
echo "2) Production (sitio final)"
read -p "Ingresa tu opción (1 o 2): " deploy_type

case $deploy_type in
    1)
        info "Iniciando deployment Preview..."
        vercel --confirm || error "Fallo el deployment Preview"
        success "Deployment Preview completado"
        ;;
    2)
        info "Iniciando deployment Production..."
        vercel --prod --confirm || error "Fallo el deployment Production"
        success "Deployment Production completado"
        ;;
    *)
        error "Opción inválida. Selecciona 1 o 2."
        ;;
esac

echo ""
success "🎉 Deployment completado exitosamente!"
echo ""
info "Próximos pasos:"
echo "1. Configura VITE_API_BASE_URL en Vercel Dashboard con la URL de tu API"
echo "2. Verifica que tu API tenga CORS configurado para el dominio de Vercel"
echo "3. Prueba todas las funcionalidades en el entorno de producción"
echo ""
info "Panel de Vercel: https://vercel.com/dashboard"
echo ""
echo -e "${GREEN}¡Zodiac Admin está listo en producción! 🚀${NC}"